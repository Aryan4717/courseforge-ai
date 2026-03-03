import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'

export type CourseCardCourse = {
  id: string
  title: string
  description?: string | null
  thumbnail_url?: string | null
  intro_video_url?: string | null
  intro_video_status?: string | null
}

type ActiveVideoContextValue = {
  activeVideoId: string | null
  setActiveVideoId: (id: string | null) => void
}

const ActiveVideoContext = createContext<ActiveVideoContextValue | null>(null)

function useActiveVideo() {
  const ctx = useContext(ActiveVideoContext)
  if (!ctx) {
    return { activeVideoId: null, setActiveVideoId: () => {} }
  }
  return ctx
}

export function ActiveVideoProvider({ children }: { children: React.ReactNode }) {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)
  return (
    <ActiveVideoContext.Provider value={{ activeVideoId, setActiveVideoId }}>
      {children}
    </ActiveVideoContext.Provider>
  )
}

type CourseCardProps = {
  course: CourseCardCourse
  to: string
  /** AI-generated emoji for courses without thumbnail; from getCourseTopicIcons */
  topicEmoji?: string | null
}

function SpinnerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-spin"
      aria-hidden
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

export function CourseCard({ course, to, topicEmoji }: CourseCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { activeVideoId, setActiveVideoId } = useActiveVideo()

  const canPlayVideo =
    course.intro_video_status === 'ready' &&
    course.intro_video_url &&
    !videoError

  const thumbnailSrc = course.thumbnail_url || null

  const pauseAndReset = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }, [])

  useEffect(() => {
    if (activeVideoId !== course.id) {
      pauseAndReset()
    }
  }, [activeVideoId, course.id, pauseAndReset])

  const handleMouseEnter = () => {
    setIsHovered(true)
    if (canPlayVideo) {
      setActiveVideoId(course.id)
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setActiveVideoId(null)
    pauseAndReset()
  }

  useEffect(() => {
    if (!isHovered || !canPlayVideo || activeVideoId !== course.id) return
    videoRef.current?.play().catch(() => setVideoError(true))
  }, [isHovered, canPlayVideo, activeVideoId, course.id])

  const showVideo = isHovered && canPlayVideo

  return (
    <Link
      to={to}
      className="group block transition-opacity hover:opacity-95"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Card className="h-full overflow-hidden transition-transform duration-200 hover:scale-[1.02]">
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {thumbnailSrc && !showVideo && (
            <img
              src={thumbnailSrc}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          )}
          {!thumbnailSrc && !showVideo && (
            <div
              className="flex h-full w-full items-center justify-center bg-muted"
              aria-hidden
            >
              {topicEmoji ? (
                <span className="text-4xl" role="img" aria-hidden>
                  {topicEmoji}
                </span>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground/50"
                  aria-hidden
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  <path d="M8 7h8M8 11h8" />
                </svg>
              )}
            </div>
          )}
          {showVideo && course.intro_video_url && (
            <video
              ref={videoRef}
              src={course.intro_video_url}
              muted
              playsInline
              preload="metadata"
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setVideoError(true)}
            />
          )}
          {course.intro_video_status === 'ready' && course.intro_video_url && (
            <span
              className="absolute left-2 top-2 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground"
              aria-hidden
            >
              AI Intro
            </span>
          )}
          {course.intro_video_status === 'processing' && (
            <span
              className="absolute left-2 top-2 flex items-center gap-1.5 rounded-md bg-accent px-2 py-1 text-[10px] font-medium text-accent-foreground"
              aria-hidden
            >
              <SpinnerIcon />
              Generating intro...
            </span>
          )}
        </div>
        <CardHeader>
          <CardTitle className="text-heading font-semibold">
            {course.title}
          </CardTitle>
          {course.description && (
            <CardDescription className="line-clamp-2">
              {course.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardFooter className="pt-0">
          <span className="flex items-center gap-1.5 text-body-sm font-medium text-primary transition-transform group-hover:underline group-hover:translate-x-0.5">
            View course
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </span>
        </CardFooter>
      </Card>
    </Link>
  )
}
