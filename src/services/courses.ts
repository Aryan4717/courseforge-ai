import { supabase } from '@/services/supabase'
import type { Course, CourseInsert } from '@/lib/database.types'

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
