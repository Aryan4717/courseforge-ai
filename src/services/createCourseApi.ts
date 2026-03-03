import { API_BASE_URL } from '@/config'

export type CourseStructureSection = { title: string; lessons: string[] }
export type CourseStructure = {
  title: string
  description: string
  sections: CourseStructureSection[]
}

export type CreateCoursePayload = {
  title: string
  description: string
  level?: string | null
  sections: CourseStructureSection[]
}

export async function generateCourseStructure(
  topic: string,
  level: string,
  duration: string
): Promise<CourseStructure> {
  const res = await fetch(`${API_BASE_URL}/generate-course-structure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, level, duration }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? 'generateCourseStructure failed')
  }
  return res.json()
}

export async function createCourse(
  payload: CreateCoursePayload
): Promise<{ courseId: string }> {
  const res = await fetch(`${API_BASE_URL}/create-course`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? 'createCourse failed')
  }
  return res.json()
}

export async function ingestZip(file: File): Promise<{
  courseId: string
  fileNames: string[]
}> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE_URL}/ingest-zip`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? 'ingestZip failed')
  }
  return res.json()
}

export async function generateMetadata(
  fileNames: string[]
): Promise<{ title: string; description: string }> {
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

export async function updateCourse(
  courseId: string,
  updates: { title: string; description: string }
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/update-course/${courseId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? 'updateCourse failed')
  }
}

export function triggerGenerateAudio(
  courseId: string,
  payload: { title: string; description?: string }
): void {
  fetch(`${API_BASE_URL}/generate-audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      courseId,
      title: payload.title,
      description: payload.description ?? '',
    }),
  }).catch(() => {})
}

export function triggerGenerateAvatarVideo(
  courseId: string,
  payload: { title: string; description?: string }
): void {
  fetch(`${API_BASE_URL}/generate-avatar-video`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      courseId,
      title: payload.title,
      description: payload.description ?? '',
    }),
  }).catch(() => {})
}
