import { supabase } from '@/services/supabase'
import type {
  Course,
  CourseInsert,
  CourseSection,
  CourseSectionInsert,
  CourseAsset,
  CourseAssetInsert,
} from '@/lib/database.types'

const COURSE_ASSETS_BUCKET = 'course-assets'

export async function createCourse(data: CourseInsert): Promise<Course | null> {
  const { data: course, error } = await supabase
    .from('courses')
    .insert({
      title: data.title,
      description: data.description ?? null,
      level: data.level ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error('createCourse error:', error)
    throw error
  }

  return course as Course
}

export async function getCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getCourses error:', error)
    throw error
  }

  return (data ?? []) as Course[]
}

export async function getCourseById(id: string): Promise<Course | null> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('getCourseById error:', error)
    throw error
  }

  return data as Course | null
}

export async function getSectionsByCourseId(
  courseId: string
): Promise<CourseSection[]> {
  const { data, error } = await supabase
    .from('course_sections')
    .select('*')
    .eq('course_id', courseId)
    .order('order', { ascending: true })

  if (error) {
    console.error('getSectionsByCourseId error:', error)
    throw error
  }

  return (data ?? []) as CourseSection[]
}

export async function getAssetsBySectionId(
  sectionId: string
): Promise<CourseAsset[]> {
  const { data, error } = await supabase
    .from('course_assets')
    .select('*')
    .eq('section_id', sectionId)

  if (error) {
    console.error('getAssetsBySectionId error:', error)
    throw error
  }

  return ((data ?? []) as CourseAsset[]).sort((a, b) =>
    a.id.localeCompare(b.id)
  )
}

export async function createSection(
  data: CourseSectionInsert
): Promise<CourseSection | null> {
  const { data: section, error } = await supabase
    .from('course_sections')
    .insert({
      course_id: data.course_id,
      title: data.title,
      order: data.order,
    })
    .select()
    .single()

  if (error) {
    console.error('createSection error:', error)
    throw error
  }

  return section as CourseSection
}

export async function createAsset(
  data: CourseAssetInsert
): Promise<CourseAsset | null> {
  const { data: asset, error } = await supabase
    .from('course_assets')
    .insert({
      section_id: data.section_id,
      name: data.name,
      type: data.type,
      url: data.url,
    })
    .select()
    .single()

  if (error) {
    console.error('createAsset error:', error)
    throw error
  }

  return asset as CourseAsset
}

export async function uploadAssetFile(
  courseId: string,
  sectionId: string,
  fileName: string,
  blob: Blob
): Promise<string> {
  const path = `${courseId}/${sectionId}/${fileName}`
  const { error } = await supabase.storage
    .from(COURSE_ASSETS_BUCKET)
    .upload(path, blob, { upsert: true })

  if (error) {
    console.error('uploadAssetFile error:', error)
    throw error
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(COURSE_ASSETS_BUCKET).getPublicUrl(path)
  return publicUrl
}
