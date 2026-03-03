import 'dotenv/config'
import cors from 'cors'
import express, { Request, Response } from 'express'
import Stripe from 'stripe'
import { startInstrumentation, shutdownInstrumentation } from './instrumentation.js'
import {
  chatInstructor,
  generateMetadata,
  getCourseTopicIcons,
  structureSections,
} from './llmService.js'
import { supabaseAdmin } from './supabase.js'
import { generateCourseAudio } from './elevenlabs.js'
import {
  createIntroVideoJob,
  checkVideoStatus,
  getVideoUrl,
} from './colossyan.js'
import { generateCourseStructure } from './generateCourseStructure.js'
import { createCourseFromStructure } from './createCourse.js'
import { updateCourseMetadata } from './updateCourse.js'
import { ingestZip } from './ingestZip.js'
import { buildIntroScript } from './utils/buildIntroScript.js'
import multer from 'multer'

const upload = multer({ storage: multer.memoryStorage() })

startInstrumentation()

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET
const stripe =
  stripeSecretKey && stripeSecretKey.startsWith('sk_')
    ? new Stripe(stripeSecretKey)
    : null

const app = express()

// Webhook must receive raw body for signature verification
app.post(
  '/stripe-webhook',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    if (!stripe || !stripeWebhookSecret) {
      res.status(503).send('Stripe webhook not configured')
      return
    }
    const sig = req.headers['stripe-signature']
    if (!sig || !(req.body instanceof Buffer)) {
      res.status(400).send('Missing signature or body')
      return
    }
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        stripeWebhookSecret
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Webhook signature verification failed'
      console.error(message)
      res.status(400).send(message)
      return
    }
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const courseId = session.metadata?.course_id
      const userId = session.metadata?.user_id
      if (courseId && userId && supabaseAdmin) {
        try {
          const { error } = await supabaseAdmin.from('purchases').insert({
            user_id: userId,
            course_id: courseId,
          })
          if (error) {
            if (error.code === '23505') {
              // unique violation - already purchased, ignore
            } else {
              console.error('Purchase insert error:', error)
            }
          }
        } catch (e) {
          console.error('Purchase insert error:', e)
        }
      }
    }
    res.sendStatus(200)
  }
)

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}))
app.use(express.json())

app.get('/', (_req: Request, res: Response) => {
  res.status(200).send('Backend is running')
})

/** Update course media fields (overview_audio_url, intro_video_url, intro_video_status, intro_video_id). */
async function updateCourseMedia(
  courseId: string,
  updates: {
    overview_audio_url?: string
    intro_video_url?: string
    intro_video_status?: string
    intro_video_id?: string
  }
): Promise<void> {
  if (!supabaseAdmin) return
  const { error } = await supabaseAdmin
    .from('courses')
    .update(updates)
    .eq('id', courseId)
  if (error) console.error('updateCourseMedia error:', error)
}

/** jobId -> courseId for background Colossyan polling */
const pendingVideoJobs = new Map<string, string>()
const POLL_INTERVAL_MS = 12_000

function startVideoPoller(): void {
  if (pendingVideoJobs.size === 0) return
  for (const [jobId, courseId] of pendingVideoJobs) {
    checkVideoStatus(jobId)
      .then(async ({ status, videoId }) => {
        if (status === 'finished' && videoId) {
          try {
            const url = await getVideoUrl(videoId)
            await updateCourseMedia(courseId, {
              intro_video_url: url,
              intro_video_status: 'ready',
            })
          } catch (e) {
            console.error('getVideoUrl or update failed:', e)
            await updateCourseMedia(courseId, { intro_video_status: 'failed' })
          }
          pendingVideoJobs.delete(jobId)
        } else if (status === 'failed') {
          await updateCourseMedia(courseId, { intro_video_status: 'failed' })
          pendingVideoJobs.delete(jobId)
        }
      })
      .catch((e) => {
        console.error('checkVideoStatus failed:', e)
        // keep in map and retry next interval
      })
  }
}

let pollTimer: ReturnType<typeof setInterval> | null = null
function ensurePollerRunning(): void {
  if (pollTimer != null) return
  pollTimer = setInterval(() => {
    startVideoPoller()
    if (pendingVideoJobs.size === 0 && pollTimer != null) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }, POLL_INTERVAL_MS)
}

function getFrontendOrigin(req: Request): string {
  const fromEnv = process.env.FRONTEND_URL
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  const origin = req.get('Origin') || req.get('Referer')
  if (origin) {
    try {
      const u = new URL(origin)
      return `${u.protocol}//${u.host}`
    } catch {
      // ignore
    }
  }
  return process.env.FRONTEND_URL || ''
}

app.post('/create-checkout-session', async (req: Request, res: Response) => {
  if (!stripe) {
    res.status(503).json({ error: 'Stripe not configured' })
    return
  }
  try {
    const { courseId, userId } = req.body as { courseId?: string; userId?: string }
    if (!courseId || !userId) {
      res.status(400).json({ error: 'Missing courseId or userId' })
      return
    }
    const origin = getFrontendOrigin(req)
    if (!origin) {
      res.status(400).json({ error: 'FRONTEND_URL must be set for checkout redirects' })
      return
    }
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Course access',
              description: 'Purchase course access',
            },
            unit_amount: 999,
          },
          quantity: 1,
        },
      ],
      metadata: { course_id: courseId, user_id: userId },
      success_url: `${origin}/library?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/courses/${courseId}`,
    })
    res.json({ url: session.url })
  } catch (err) {
    console.error('create-checkout-session error:', err)
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Checkout session failed',
    })
  }
})

app.post('/generate-metadata', async (req: Request, res: Response) => {
  try {
    const { fileNames } = req.body as { fileNames?: string[] }
    if (!Array.isArray(fileNames)) {
      res.status(400).json({ error: 'Missing or invalid fileNames array' })
      return
    }
    const result = await generateMetadata(fileNames)
    res.json(result)
  } catch (err) {
    console.error('generateMetadata error:', err)
    res.status(500).json({
      error: err instanceof Error ? err.message : 'generateMetadata failed',
    })
  }
})

app.post('/get-course-topic-icons', async (req: Request, res: Response) => {
  try {
    const { courses } = req.body as {
      courses?: Array<{ id: string; title: string; description?: string | null }>
    }
    if (!Array.isArray(courses) || courses.length === 0) {
      res.json({})
      return
    }
    const valid = courses.filter(
      (c): c is { id: string; title: string; description?: string | null } =>
        c && typeof c.id === 'string' && typeof c.title === 'string'
    )
    const result = await getCourseTopicIcons(valid)
    res.json(result)
  } catch (err) {
    console.error('getCourseTopicIcons error:', err)
    res.status(500).json({
      error: err instanceof Error ? err.message : 'getCourseTopicIcons failed',
    })
  }
})

app.post('/generate-course-structure', async (req: Request, res: Response) => {
  if (!supabaseAdmin) {
    res.status(503).json({ error: 'Service not configured' })
    return
  }
  try {
    const { topic, level, duration } = req.body as {
      topic?: string
      level?: string
      duration?: string
    }
    if (!topic || typeof topic !== 'string') {
      res.status(400).json({ error: 'Missing or invalid topic' })
      return
    }
    const result = await generateCourseStructure(
      topic,
      level ?? 'Beginner',
      duration ?? '4 weeks'
    )
    res.json(result)
  } catch (err) {
    console.error('generateCourseStructure error:', err)
    res.status(500).json({
      error: err instanceof Error ? err.message : 'generateCourseStructure failed',
    })
  }
})

app.post('/create-course', async (req: Request, res: Response) => {
  if (!supabaseAdmin) {
    res.status(503).json({ error: 'Service not configured' })
    return
  }
  try {
    const body = req.body as {
      title?: string
      description?: string
      level?: string | null
      sections?: { title: string; lessons: string[] }[]
    }
    if (!body.title || typeof body.title !== 'string') {
      res.status(400).json({ error: 'Missing or invalid title' })
      return
    }
    if (!Array.isArray(body.sections)) {
      res.status(400).json({ error: 'Missing or invalid sections' })
      return
    }
    const { courseId } = await createCourseFromStructure({
      title: body.title,
      description: body.description ?? '',
      level: body.level ?? null,
      sections: body.sections,
    })
    res.json({ courseId })
  } catch (err) {
    console.error('createCourse error:', err)
    res.status(500).json({
      error: err instanceof Error ? err.message : 'createCourse failed',
    })
  }
})

app.post('/ingest-zip', upload.single('file'), async (req: Request, res: Response) => {
  if (!supabaseAdmin) {
    res.status(503).json({ error: 'Service not configured' })
    return
  }
  try {
    const file = (req as express.Request & { file?: Express.Multer.File }).file
    if (!file || !file.buffer) {
      res.status(400).json({ error: 'Missing file; send as multipart form field "file"' })
      return
    }
    if (!file.originalname?.toLowerCase().endsWith('.zip')) {
      res.status(400).json({ error: 'File must be a .zip' })
      return
    }
    const result = await ingestZip(file.buffer)
    res.json(result)
  } catch (err) {
    console.error('ingestZip error:', err)
    res.status(500).json({
      error: err instanceof Error ? err.message : 'ingestZip failed',
    })
  }
})

app.patch('/update-course/:courseId', async (req: Request, res: Response) => {
  if (!supabaseAdmin) {
    res.status(503).json({ error: 'Service not configured' })
    return
  }
  try {
    const courseId = req.params.courseId as string
    const { title, description } = req.body as { title?: string; description?: string }
    await updateCourseMetadata(courseId, { title, description })
    res.json({ ok: true })
  } catch (err) {
    console.error('updateCourse error:', err)
    res.status(500).json({
      error: err instanceof Error ? err.message : 'updateCourse failed',
    })
  }
})

app.post('/generate-audio', async (req: Request, res: Response) => {
  if (!supabaseAdmin) {
    res.status(503).json({ error: 'Media generation not configured' })
    return
  }
  try {
    const { courseId, title, description } = req.body as {
      courseId?: string
      title?: string
      description?: string
    }
    if (!courseId || typeof courseId !== 'string') {
      res.status(400).json({ error: 'Missing or invalid courseId' })
      return
    }
    const script = buildIntroScript(title ?? '', description)
    ;(async () => {
      try {
        const url = await generateCourseAudio(script, courseId)
        await updateCourseMedia(courseId, { overview_audio_url: url })
      } catch (e) {
        console.error('generateCourseAudio failed:', e)
      }
    })()
    res.status(202).json({ ok: true, message: 'Audio generation started' })
  } catch (err) {
    console.error('generate-audio error:', err)
    res.status(500).json({
      error: err instanceof Error ? err.message : 'generate-audio failed',
    })
  }
})

app.post('/generate-avatar-video', async (req: Request, res: Response) => {
  if (!supabaseAdmin) {
    res.status(503).json({ error: 'Media generation not configured' })
    return
  }
  try {
    const { courseId, title, description, introScript } = req.body as {
      courseId?: string
      title?: string
      description?: string
      introScript?: string
    }
    if (!courseId || typeof courseId !== 'string') {
      res.status(400).json({ error: 'Missing or invalid courseId' })
      return
    }
    const script =
      typeof introScript === 'string' && introScript
        ? introScript
        : buildIntroScript(title ?? '', description)
    ;(async () => {
      try {
        const { jobId } = await createIntroVideoJob(script)
        await updateCourseMedia(courseId, {
          intro_video_id: jobId,
          intro_video_status: 'processing',
        })
        pendingVideoJobs.set(jobId, courseId)
        ensurePollerRunning()
      } catch (e) {
        console.error('createIntroVideoJob failed:', e)
        await updateCourseMedia(courseId, { intro_video_status: 'failed' })
      }
    })()
    res.status(202).json({ ok: true, message: 'Avatar video generation started' })
  } catch (err) {
    console.error('generate-avatar-video error:', err)
    res.status(500).json({
      error: err instanceof Error ? err.message : 'generate-avatar-video failed',
    })
  }
})

app.post('/structure-sections', async (req: Request, res: Response) => {
  try {
    const { fileNames } = req.body as { fileNames?: string[] }
    if (!Array.isArray(fileNames)) {
      res.status(400).json({ error: 'Missing or invalid fileNames array' })
      return
    }
    const result = await structureSections(fileNames)
    res.json(result)
  } catch (err) {
    console.error('structureSections error:', err)
    res.status(500).json({
      error: err instanceof Error ? err.message : 'structureSections failed',
    })
  }
})

const PORT = Number(process.env.PORT) || 3001
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

async function shutdown(): Promise<void> {
  server.close()
  await shutdownInstrumentation()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
