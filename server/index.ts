import 'dotenv/config'
import express from 'express'
import Stripe from 'stripe'
import { startInstrumentation, shutdownInstrumentation } from './instrumentation.js'
import {
  generateMetadata,
  structureSections,
  chatInstructor,
  type ChatMessage,
} from './llmService.js'
import { supabaseAdmin } from './supabase.js'

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
  async (req, res) => {
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

app.use(express.json())

function getFrontendOrigin(req: express.Request): string {
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
  return 'http://localhost:5173'
}

app.post('/create-checkout-session', async (req, res) => {
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

app.post('/generate-metadata', async (req, res) => {
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

app.post('/structure-sections', async (req, res) => {
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

app.post('/chat-instructor', async (req, res) => {
  try {
    const { messages } = req.body as { messages?: ChatMessage[] }
    if (!Array.isArray(messages)) {
      res.status(400).json({ error: 'Missing or invalid messages array' })
      return
    }
    const result = await chatInstructor(messages)
    res.json(result)
  } catch (err) {
    console.error('chatInstructor error:', err)
    res.status(500).json({
      error: err instanceof Error ? err.message : 'chatInstructor failed',
    })
  }
})

const PORT = Number(process.env.PORT) || 3001
const server = app.listen(PORT, () => {
  console.log(`LLM server listening on http://localhost:${PORT}`)
})

async function shutdown(): Promise<void> {
  server.close()
  await shutdownInstrumentation()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
