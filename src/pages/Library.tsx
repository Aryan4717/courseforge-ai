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
import { useAuthStore } from '@/store/authStore'
import { getPurchasesWithCourses } from '@/services/courses'
import type { Course } from '@/lib/database.types'

export function Library() {
  const user = useAuthStore((s) => s.user)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      setCourses([])
      return
    }
    getPurchasesWithCourses(user.id)
      .then(setCourses)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load library')
      })
      .finally(() => setLoading(false))
  }, [user?.id])

  return (
    <div className="space-y-8">
      <SectionHeader
        title="My Library"
        description="Courses you have purchased."
      />

      {loading && (
        <p className="text-body text-muted-foreground">Loading…</p>
      )}

      {error && (
        <p className="text-body text-muted-foreground">{error}</p>
      )}

      {!loading && !error && courses.length === 0 && (
        <p className="text-body text-muted-foreground">No purchases yet.</p>
      )}

      {!loading && !error && courses.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link
              key={course.id}
              to={`/course/${course.id}`}
              className="block transition-opacity hover:opacity-90"
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
                  <span className="text-body-sm text-primary font-medium">
                    View course
                  </span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
