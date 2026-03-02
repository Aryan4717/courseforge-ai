export interface Course {
  id: string
  title: string
  description: string | null
  level: string | null
  created_at: string
}

export interface CourseSection {
  id: string
  course_id: string
  title: string
  order: number
}

export interface CourseAsset {
  id: string
  section_id: string
  name: string
  type: string
  url: string
}

export interface Purchase {
  id: string
  user_id: string
  course_id: string
  created_at: string
}

/** Payload for creating a course (id and created_at from DB) */
export type CourseInsert = Pick<Course, 'title' | 'description' | 'level'>
