import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/button'
import { getCourseById } from '@/services/courses'

export function CourseShare() {
  const { id } = useParams<{ id: string }>()
  const [courseTitle, setCourseTitle] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const shareableLink =
    typeof window !== 'undefined' && id
      ? `${window.location.origin}/courses/${id}`
      : ''

  useEffect(() => {
    if (!id) {
      setNotFound(true)
      setLoading(false)
      return
    }
    getCourseById(id)
      .then((course) => {
        if (course) setCourseTitle(course.title)
        else setNotFound(true)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  const handleCopy = () => {
    if (!shareableLink) return
    navigator.clipboard.writeText(shareableLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (notFound) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Course not found" description="This course does not exist or was removed." />
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

  return (
    <div className="space-y-6">
      <SectionHeader
        title={courseTitle ?? 'Course'}
        description="Share this link with others to give them access."
      />
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <p className="text-body-sm text-muted-foreground">Share link</p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareableLink}
                className="min-w-0 flex-1 rounded-md border border-input bg-muted px-3 py-2 text-sm text-foreground"
              />
              <Button variant="outline" onClick={handleCopy}>
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            {id && (
              <p className="text-body-sm text-muted-foreground">
                <Button variant="secondary" size="sm" asChild>
                  <Link to={`/course/${id}`}>Open course</Link>
                </Button>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
