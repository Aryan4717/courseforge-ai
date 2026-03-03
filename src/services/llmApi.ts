import { API_BASE_URL } from '@/config'

export type GenerateMetadataResult = { title: string; description: string }
export type StructureSectionsResult = {
  sections: { title: string; fileNames: string[] }[]
}
export type ChatInstructorResult = { content: string }

export async function generateMetadata(
  fileNames: string[]
): Promise<GenerateMetadataResult> {
  const res = await fetch(`${API_BASE_URL}/generate-metadata`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileNames }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? 'generateMetadata failed')
  }
  return res.json()
}

export async function structureSections(
  fileNames: string[]
): Promise<StructureSectionsResult> {
  const res = await fetch(`${API_BASE_URL}/structure-sections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileNames }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? 'structureSections failed')
  }
  return res.json()
}

export async function chatInstructor(messages: { role: string; content: string }[]): Promise<ChatInstructorResult> {
  const res = await fetch(`${API_BASE_URL}/chat-instructor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? 'chatInstructor failed')
  }
  return res.json()
}
