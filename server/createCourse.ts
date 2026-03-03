import { supabaseAdmin } from './supabase.js'
import { generateLessonContent } from './generateLessonContent.js'

export type CreateCoursePayload = {
  title: string
  description: string
  level?: string | null
  sections: { title: string; lessons: string[] }[]
}

/** Validates asset insert: text requires content; other types require url. */
export function validateCourseAssetForInsert(
  type: string,
  content: string | null | undefined,
  url: string | null | undefined
): void {
  if (type === 'text') {
    if (content == null || content.trim() === '') {
      throw new Error('Lesson type "text" requires non-empty content')
    }
  } else {
    if (url == null || url.trim() === '') {
      throw new Error(`Lesson type "${type}" requires a non-empty url`)
    }
  }
}

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
    const courseTitle = payload.title
    const sectionTitle = section.title
    const level = payload.level ?? 'beginner'

    for (const lessonTitle of lessons) {
      const content = await generateLessonContent(
        courseTitle,
        sectionTitle,
        lessonTitle,
        level
      )
      validateCourseAssetForInsert('text', content, null)

      const { error: assetError } = await supabaseAdmin
        .from('course_assets')
        .insert({
          section_id: sectionId,
          name: lessonTitle,
          type: 'text',
          content,
          url: null,
        })

      if (assetError) {
        console.error('createCourseFromStructure asset insert:', assetError)
        throw new Error(assetError.message)
      }
    }
  }

  return { courseId }
}
