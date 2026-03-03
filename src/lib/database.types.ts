export interface Course {
  id: string
  title: string
  description: string | null
  level: string | null
  created_at: string
  thumbnail_url?: string | null
  overview_audio_url?: string | null
  intro_video_url?: string | null
  intro_video_status?: string | null
  intro_video_id?: string | null
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
  /** URL for video/pdf/audio/image/file; null for text-only lessons */
  url: string | null
  /** Markdown body for type === 'text' */
  content: string | null
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

export type CourseAssetInsert = Pick<
  CourseAsset,
  'section_id' | 'name' | 'type' | 'url' | 'content'
>

/** Payload for recording a purchase (id and created_at from DB) */
export type PurchaseInsert = Pick<Purchase, 'user_id' | 'course_id'>
