import { supabaseAdmin } from './supabase.js'

export type CreateCoursePayload = {
  title: string
  description: string
  level?: string | null
  sections: { title: string; lessons: string[] }[]
}

const PLACEHOLDER_URL = '#'

export async function createCourseFromStructure(
  payload: CreateCoursePayload
): Promise<{ courseId: string }> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client is not configured')
  }

  const { data: course, error: courseError } = await supabaseAdmin
    .from('courses')
    .insert({
      title: payload.title,
      description: payload.description ?? null,
      level: payload.level ?? null,
    })
    .select('id')
    .single()

  if (courseError || !course) {
    console.error('createCourseFromStructure course insert:', courseError)
    throw new Error(courseError?.message ?? 'Failed to create course')
  }

  const courseId = course.id as string

  for (let i = 0; i < payload.sections.length; i++) {
    const section = payload.sections[i]
    const { data: sectionRow, error: sectionError } = await supabaseAdmin
      .from('course_sections')
      .insert({
        course_id: courseId,
        title: section.title,
        order: i,
      })
      .select('id')
      .single()

    if (sectionError || !sectionRow) {
      console.error('createCourseFromStructure section insert:', sectionError)
      throw new Error(sectionError?.message ?? 'Failed to create section')
    }

    const sectionId = sectionRow.id as string
    const lessons = section.lessons ?? []

    for (const lessonTitle of lessons) {
      const { error: assetError } = await supabaseAdmin
        .from('course_assets')
        .insert({
          section_id: sectionId,
          name: lessonTitle,
          type: 'text',
          url: PLACEHOLDER_URL,
        })

      if (assetError) {
        console.error('createCourseFromStructure asset insert:', assetError)
        throw new Error(assetError.message)
      }
    }
  }

  return { courseId }
}
