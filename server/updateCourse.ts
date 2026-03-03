import { supabaseAdmin } from './supabase.js'

export async function updateCourseMetadata(
  courseId: string,
  updates: { title?: string; description?: string }
): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client is not configured')
  }

  const payload: { title?: string; description?: string } = {}
  if (updates.title !== undefined) payload.title = updates.title
  if (updates.description !== undefined) payload.description = updates.description

  if (Object.keys(payload).length === 0) return

  const { error } = await supabaseAdmin
    .from('courses')
    .update(payload)
    .eq('id', courseId)

  if (error) {
    console.error('updateCourseMetadata error:', error)
    throw new Error(error.message)
  }
}
