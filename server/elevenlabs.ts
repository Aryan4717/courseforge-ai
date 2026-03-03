import { supabaseAdmin } from './supabase.js'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const ELEVENLABS_VOICE_ID =
  process.env.ELEVENLABS_VOICE_ID ?? 'JBFqnCBsd6RMkjVDRZzb'
const BUCKET = 'course-assets'

/**
 * Generate speech from text via ElevenLabs, upload to Supabase Storage, return public URL.
 * Requires ELEVENLABS_API_KEY and supabaseAdmin. Uses ELEVENLABS_VOICE_ID or a default voice.
 */
export async function generateCourseAudio(
  text: string,
  courseId: string
): Promise<string> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY is not set')
  }
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client is not configured')
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
      }),
    }
  )

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`ElevenLabs TTS failed: ${response.status} ${errText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const path = `${courseId}/overview.mp3`

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, {
      contentType: 'audio/mpeg',
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`Supabase upload failed: ${uploadError.message}`)
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
  return publicUrl
}
