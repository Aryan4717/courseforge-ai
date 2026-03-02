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
import { getCourses } from '@/services/courses'
import type { Course } from '@/lib/database.types'

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
    <div className="space-y-8">
      <SectionHeader
        title="Courses"
        description="Browse courses. Create or upload your own from the header."
      />

      {loading && (
        <p className="text-body text-muted-foreground">Loading courses…</p>
      )}

      {error && (
        <div className="space-y-2">
          <p className="text-body text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={loadCourses}>
            Retry
          </Button>
        </div>
      )}

      {!loading && !error && courses.length === 0 && (
        <p className="text-body text-muted-foreground">No courses yet.</p>
      )}

      {!loading && !error && courses.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link
              key={course.id}
              to={`/courses/${course.id}`}
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
