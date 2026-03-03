import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/button'
import { HeroSection } from '@/components/dashboard/HeroSection'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { CourseCard } from '@/components/dashboard/CourseCard'
import { CourseCardSkeleton } from '@/components/dashboard/CourseCardSkeleton'
import { ActiveVideoProvider } from '@/components/dashboard/CourseCard'
import { getCourses } from '@/services/courses'
import { getCourseTopicIcons } from '@/services/createCourseApi'
import type { Course } from '@/lib/database.types'

function ErrorIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-destructive"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  )
}

export function Home() {
  const [courses, setCourses] = useState<Course[]>([])
  const [topicIcons, setTopicIcons] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadCourses() {
    setLoading(true)
    setError(null)
    try {
      const data = await getCourses()
      setCourses(data)
      const needIcons = data.filter((c) => !c.thumbnail_url)
      if (needIcons.length > 0) {
        try {
          const icons = await getCourseTopicIcons(
            needIcons.map((c) => ({ id: c.id, title: c.title, description: c.description }))
          )
          setTopicIcons(icons)
        } catch {
          // Icons are optional; fallback to generic placeholder
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCourses()
  }, [])

  return (
    <div className="space-y-10">
      <HeroSection />

      <section className="space-y-2">
        <SectionHeader
          title="Courses"
          description="Browse courses. Create or upload your own from the header."
        />

        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        )}

        {error && (
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-card px-6 py-6">
            <div className="flex items-center gap-3">
              <ErrorIcon />
              <p className="text-body text-foreground">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={loadCourses} className="w-fit">
              Retry
            </Button>
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <EmptyState
            icon="book"
            title="No courses yet"
            description="Create your first course to get started."
            action={
              <Button asChild size="sm">
                <Link to="/create">Create your first course</Link>
              </Button>
            }
          />
        )}

        {!loading && !error && courses.length > 0 && (
          <ActiveVideoProvider>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  to={`/courses/${course.id}`}
                  topicEmoji={topicIcons[course.id]}
                />
              ))}
            </div>
          </ActiveVideoProvider>
        )}
      </section>
    </div>
  )
}
