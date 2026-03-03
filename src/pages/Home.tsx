import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SectionHeader } from '@/components/ui/SectionHeader'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import { Button } from '@/components/ui/button'
import { HeroSection } from '@/components/dashboard/HeroSection'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { CourseCardSkeleton } from '@/components/dashboard/CourseCardSkeleton'
import { getCourses } from '@/services/courses'
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadCourses() {
    setLoading(true)
    setError(null)
    try {
      const data = await getCourses()
      setCourses(data)
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
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/30 px-6 py-6">
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="group block transition-opacity hover:opacity-95"
              >
                <Card className="h-full">
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
                    <span className="flex items-center gap-1.5 text-body-sm text-primary font-medium transition-transform group-hover:translate-x-0.5">
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
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
