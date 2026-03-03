import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { getCourseById } from '@/services/courses'
import { createCheckoutSession } from '@/services/checkout'
import { getCourseShareUrl } from '@/utils/url'
import type { Course } from '@/lib/database.types'

export function CourseShare() {
  const { id } = useParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)
  const [course, setCourse] = useState<Course | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [buyLoading, setBuyLoading] = useState(false)
  const [buyError, setBuyError] = useState<string | null>(null)

  const shareableLink = id ? getCourseShareUrl(id) : ''

  useEffect(() => {
    if (!id) {
      setNotFound(true)
      setLoading(false)
      return
    }
    getCourseById(id)
      .then((c) => {
        if (c) setCourse(c)
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

  const handleBuy = async () => {
    if (!id || !user) return
    setBuyError(null)
    setBuyLoading(true)
    try {
      const { url } = await createCheckoutSession(id, user.id)
      if (url) window.location.href = url
      else setBuyError('Checkout unavailable')
    } catch (err) {
      setBuyError(err instanceof Error ? err.message : 'Checkout failed')
    } finally {
      setBuyLoading(false)
    }
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
        title={course?.title ?? 'Course'}
        description="Share this link with others to give them access."
      />
      {course?.overview_audio_url && (
        <div>
          <p className="mb-1 text-body-sm font-medium text-foreground">
            Course overview
          </p>
          <audio
            src={course.overview_audio_url}
            controls
            className="w-full max-w-md"
          />
        </div>
      )}
      {course?.intro_video_status === 'processing' && (
        <p className="text-body-sm text-muted-foreground">
          Generating AI intro video...
        </p>
      )}
      {course?.intro_video_status === 'ready' && course?.intro_video_url && (
        <div>
          <p className="mb-1 text-body-sm font-medium text-foreground">
            Intro video
          </p>
          <video
            src={course.intro_video_url}
            controls
            className="w-full max-w-2xl rounded-lg border border-border bg-card"
          />
        </div>
      )}
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
            {id && user && (
              <div className="space-y-2">
                <Button size="sm" onClick={handleBuy} disabled={buyLoading}>
                  {buyLoading ? 'Loading…' : 'Buy'}
                </Button>
                {buyError && (
                  <p className="text-body-sm text-muted-foreground">
                    {buyError}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
