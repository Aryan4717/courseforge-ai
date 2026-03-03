const COLOSSYAN_API_KEY = process.env.COLOSSYAN_API_KEY
const BASE_URL = 'https://app.colossyan.com/api/v1'

function getAuthHeaders(): Record<string, string> {
  if (!COLOSSYAN_API_KEY) {
    throw new Error('COLOSSYAN_API_KEY is not set')
  }
  return {
    Authorization: `Bearer ${COLOSSYAN_API_KEY}`,
    'Content-Type': 'application/json',
  }
}

/**
 * Create an intro video generation job. Returns jobId and videoId (videoId may be present in response).
 */
export async function createIntroVideoJob(
  script: string
): Promise<{ jobId: string; videoId?: string }> {
  const res = await fetch(`${BASE_URL}/video-generation-jobs`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      videoCreative: {
        settings: {
          name: 'Course intro',
          videoSize: { width: 1920, height: 1080 },
        },
        scenes: [
          {
            tracks: [
              {
                type: 'actor',
                position: { x: 420, y: 0 },
                size: { width: 1080, height: 1080 },
                actor: 'karen',
                text: script,
                speakerId: 'aquXcfLbkxpW4BBI5qKm',
              },
            ],
          },
        ],
      },
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Colossyan create job failed: ${res.status} ${errText}`)
  }

  const data = (await res.json()) as { id?: string; videoId?: string }
  const jobId = data.id
  if (!jobId) throw new Error('Colossyan response missing id')
  return { jobId, videoId: data.videoId }
}

/**
 * Poll job status. Returns status and videoId when available.
 */
export async function checkVideoStatus(
  jobId: string
): Promise<{ status: string; videoId?: string }> {
  const res = await fetch(
    `${BASE_URL}/video-generation-jobs/${encodeURIComponent(jobId)}`,
    { method: 'GET', headers: getAuthHeaders() }
  )

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Colossyan job status failed: ${res.status} ${errText}`)
  }

  const data = (await res.json()) as { status?: string; videoId?: string }
  return {
    status: data.status ?? 'unknown',
    videoId: data.videoId,
  }
}

/**
 * Get public URL for a generated video (call when status is 'finished').
 */
export async function getVideoUrl(videoId: string): Promise<string> {
  const res = await fetch(
    `${BASE_URL}/generated-videos/${encodeURIComponent(videoId)}`,
    { method: 'GET', headers: getAuthHeaders() }
  )

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Colossyan get video failed: ${res.status} ${errText}`)
  }

  const data = (await res.json()) as { publicUrl?: string }
  if (!data.publicUrl) throw new Error('Colossyan response missing publicUrl')
  return data.publicUrl
}
