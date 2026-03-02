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

/** Payload for creating a section (id from DB) */
export type CourseSectionInsert = Pick<CourseSection, 'course_id' | 'title' | 'order'>

export type CourseAssetInsert = Pick<CourseAsset, 'section_id' | 'name' | 'type' | 'url'>

/** Payload for recording a purchase (id and created_at from DB) */
export type PurchaseInsert = Pick<Purchase, 'user_id' | 'course_id'>
