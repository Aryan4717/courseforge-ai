import { useState, useEffect, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { SectionHeader } from '@/components/ui/SectionHeader'
import {
  getCourseById,
  getSectionsByCourseId,
  getAssetsBySectionId,
  getLessonById,
} from '@/services/courses'
import type { Course } from '@/lib/database.types'
import type { CourseSection } from '@/lib/database.types'
import type { CourseAsset } from '@/lib/database.types'

type SectionWithAssets = { section: CourseSection; assets: CourseAsset[] }

export function CoursePlayer() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const lessonParam = searchParams.get('lesson')

  const [course, setCourse] = useState<Course | null>(null)
  const [sectionsWithAssets, setSectionsWithAssets] = useState<
    SectionWithAssets[]
  >([])
  const [lesson, setLesson] = useState<CourseAsset | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingLesson, setLoadingLesson] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) {
      setNotFound(true)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setNotFound(false)
    getCourseById(id)
      .then((c) => {
        if (cancelled) return
        if (!c) {
          setNotFound(true)
          setLoading(false)
          return
        }
        setCourse(c)
        return getSectionsByCourseId(id!)
      })
      .then((sections) => {
        if (cancelled || !sections) return
        return Promise.all(
          sections.map((section) =>
            getAssetsBySectionId(section.id).then((assets) => ({
              section,
              assets,
            }))
          )
        )
      })
      .then((result) => {
        if (cancelled || !result) return
        setSectionsWithAssets(result)
      })
      .catch(() => {
        if (!cancelled) setNotFound(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const flatAssets = useMemo(() => {
    const list: CourseAsset[] = []
    for (const { assets } of sectionsWithAssets) {
      list.push(...assets)
    }
    return list
  }, [sectionsWithAssets])

  const selectedAsset = useMemo(() => {
    if (lessonParam) {
      const found = flatAssets.find((a) => a.id === lessonParam)
      if (found) return found
    }
    return flatAssets[0] ?? null
  }, [flatAssets, lessonParam])

  // When URL has no ?lesson=, show first asset from list
  useEffect(() => {
    if (!lessonParam && flatAssets.length > 0) {
      setLesson(flatAssets[0] ?? null)
    }
    if (!lessonParam && flatAssets.length === 0) {
      setLesson(null)
    }
  }, [lessonParam, flatAssets])

  // When URL has ?lesson=, fetch lesson by ID and refetch when param changes
  useEffect(() => {
    if (!lessonParam) return
    let cancelled = false
    setLoadingLesson(true)
    getLessonById(lessonParam)
      .then((fetched) => {
        if (cancelled) return
        setLesson(fetched)
      })
      .catch(() => {
        if (!cancelled) setLesson(null)
      })
      .finally(() => {
        if (!cancelled) setLoadingLesson(false)
      })
    return () => {
      cancelled = true
    }
  }, [lessonParam])

  const selectLesson = (assetId: string) => {
    setSearchParams({ lesson: assetId })
  }

  if (notFound) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Course not found"
          description="This course does not exist or was removed."
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Loading…" description="" />
      </div>
    )
  }

  if (!course) return null

  const hasContent = sectionsWithAssets.some((s) => s.assets.length > 0)
  if (!hasContent) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title={course.title}
          description="This course has no lessons yet."
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <SectionHeader
        title={course.title}
        description={course.description || 'No description available'}
      />
      {course.overview_audio_url && (
        <div>
          <p className="text-body-sm font-medium text-foreground mb-1">
            Course overview
          </p>
          <audio
            src={course.overview_audio_url}
            controls
            className="w-full max-w-md"
          />
        </div>
      )}
      {course.intro_video_status === 'processing' && (
        <p className="text-body-sm text-muted-foreground">
          AI intro video is being generated...
        </p>
      )}
      {course.intro_video_status === 'ready' &&
        course.intro_video_url && (
          <div>
            <p className="text-body-sm font-medium text-foreground mb-1">
              Intro video
            </p>
            <video
              src={course.intro_video_url}
              controls
              className="rounded-lg border border-border bg-card max-w-2xl"
            />
          </div>
        )}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
          <nav
            className="flex-1 overflow-y-auto p-4"
            aria-label="Course sections and lessons"
          >
            <ul className="space-y-4">
              {sectionsWithAssets.map(({ section, assets }) => (
                <li key={section.id}>
                  <h3 className="text-body-sm font-medium text-foreground">
                    {section.title}
                  </h3>
                  <ul className="mt-2 space-y-1">
                    {assets.map((asset) => (
                      <li key={asset.id}>
                        <button
                          type="button"
                          onClick={() => selectLesson(asset.id)}
                          className={`w-full rounded-md px-3 py-2 text-left text-body-sm transition-colors ${
                            selectedAsset?.id === asset.id
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          {asset.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <main className="flex min-h-0 flex-col gap-4">
          {loadingLesson && (
            <div className="text-body-sm text-muted-foreground">
              Loading lesson...
            </div>
          )}
          {!loadingLesson && !lesson && (
            <div className="text-body-sm text-muted-foreground">
              Lesson not found
            </div>
          )}
          {!loadingLesson && lesson && (
            <>
              <div>
                <h2 className="text-heading font-semibold text-foreground">
                  {lesson.name}
                </h2>
              </div>
              <div className="min-h-0 flex-1 rounded-lg border border-border bg-card overflow-hidden">
                {lesson.type === 'text' && (
                  <div className="prose max-w-none p-6">
                    <ReactMarkdown>{lesson.content ?? ''}</ReactMarkdown>
                  </div>
                )}
                {lesson.type === 'video' && lesson.url && (
                  <video
                    key={lesson.id}
                    src={lesson.url}
                    controls
                    className="h-full w-full"
                    title={lesson.name}
                  />
                )}
                {(lesson.type === 'document' || lesson.type === 'pdf') && lesson.url && (
                  <div className="flex flex-col items-center justify-center gap-4 p-8">
                    <p className="text-body-sm text-muted-foreground">{lesson.name}</p>
                    <a
                      href={lesson.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-body text-primary underline"
                    >
                      Open PDF
                    </a>
                  </div>
                )}
                {lesson.type === 'audio' && lesson.url && (
                  <div className="flex flex-col items-center justify-center gap-4 p-8">
                    <p className="text-body-sm text-muted-foreground">
                      {lesson.name}
                    </p>
                    <audio
                      key={lesson.id}
                      src={lesson.url}
                      controls
                      className="w-full max-w-md"
                    />
                  </div>
                )}
                {(lesson.type === 'image' || lesson.type === 'file') && lesson.url && (
                  <div className="flex flex-col items-center justify-center gap-4 p-8">
                    {lesson.type === 'image' ? (
                      <img
                        key={lesson.id}
                        src={lesson.url}
                        alt={lesson.name}
                        className="max-h-[70vh] w-auto max-w-full object-contain"
                      />
                    ) : (
                      <a
                        href={lesson.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-body text-primary underline"
                      >
                        Open {lesson.name}
                      </a>
                    )}
                  </div>
                )}
                {!['text', 'video', 'document', 'pdf', 'audio', 'image', 'file'].includes(lesson.type) && (
                  <div className="p-6 text-body-sm text-muted-foreground">
                    Unsupported lesson type: {lesson.type}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
