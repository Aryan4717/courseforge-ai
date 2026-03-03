import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { CourseCard } from '@/components/dashboard/CourseCard'
import { CourseCardSkeleton } from '@/components/dashboard/CourseCardSkeleton'
import { ActiveVideoProvider } from '@/components/dashboard/CourseCard'
import { useAuthStore } from '@/store/authStore'
import { getPurchasesWithCourses } from '@/services/courses'
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

export function Library() {
  const user = useAuthStore((s) => s.user)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadCourses() {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    try {
      const data = await getPurchasesWithCourses(user.id)
      setCourses(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load library')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      setCourses([])
      return
    }
    loadCourses()
  }, [user?.id])

  return (
    <div className="space-y-10">
      <section className="space-y-2">
        <SectionHeader
          title="My Library"
          description="Courses you have purchased."
        />

        {loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        )}

        {error && (
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-card px-4 py-6 sm:px-6">
            <div className="flex items-center gap-3">
              <ErrorIcon />
              <p className="text-body text-foreground">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadCourses}
              className="w-fit"
            >
              Retry
            </Button>
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <EmptyState
            icon="library"
            title="No purchases yet"
            description="Browse courses to find something to learn."
            action={
              <Button variant="outline" size="sm" asChild>
                <Link to="/">Browse courses</Link>
              </Button>
            }
          />
        )}

        {!loading && !error && courses.length > 0 && (
          <ActiveVideoProvider>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  to={`/course/${course.id}`}
                />
              ))}
            </div>
          </ActiveVideoProvider>
        )}
      </section>
    </div>
  )
}
