import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/button'
import {
  generateCourseStructure,
  createCourse,
  triggerGenerateAudio,
  triggerGenerateAvatarVideo,
} from '@/services/createCourseApi'

const STEPS = [
  { label: 'Generating course structure', progress: 25 },
  { label: 'Creating course and lessons', progress: 75 },
  { label: 'Preparing your course', progress: 100 },
] as const

const LEVELS = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
]

const DURATIONS = [
  { value: '4 weeks', label: '4 weeks' },
  { value: '6 weeks', label: '6 weeks' },
  { value: '8 weeks', label: '8 weeks' },
]

export function CreateWithAI() {
  const navigate = useNavigate()
  const [topic, setTopic] = useState('')
  const [level, setLevel] = useState('Beginner')
  const [duration, setDuration] = useState('4 weeks')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = topic.trim()
    if (!trimmed || loading) return
    setError(null)
    setLoading(true)
    setStep(0)
    try {
      setStep(0)
      const structure = await generateCourseStructure(trimmed, level, duration)
      setStep(1)
      const { courseId } = await createCourse({
        title: structure.title,
        description: structure.description,
        level,
        sections: structure.sections,
      })
      setStep(2)
      triggerGenerateAudio(courseId, {
        title: structure.title,
        description: structure.description,
      })
      triggerGenerateAvatarVideo(courseId, {
        title: structure.title,
        description: structure.description,
      })
      navigate(`/courses/${courseId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-[640px] space-y-8">
      <SectionHeader
        title="Generate with AI"
        description="Enter your topic and preferences to create a course structure."
      />
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="topic"
                className="mb-2 block text-body-sm font-medium text-foreground"
              >
                What topic is your course about?
              </label>
              <textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Introduction to TypeScript"
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={loading}
              />
            </div>
            <div>
              <label
                htmlFor="level"
                className="mb-2 block text-body-sm font-medium text-foreground"
              >
                Level
              </label>
              <select
                id="level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-body text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={loading}
              >
                {LEVELS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="duration"
                className="mb-2 block text-body-sm font-medium text-foreground"
              >
                Estimated duration
              </label>
              <select
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-body text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={loading}
              >
                {DURATIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            {error && (
              <p className="text-body-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            {loading && (
              <div className="space-y-2">
                <div className="flex justify-between text-body-sm">
                  <span className="text-muted-foreground">
                    {STEPS[step].label}…
                  </span>
                  <span className="font-medium text-foreground">
                    {STEPS[step].progress}%
                  </span>
                </div>
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={STEPS[step].progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={STEPS[step].label}
                >
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${STEPS[step].progress}%` }}
                  />
                </div>
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Generating…' : 'Generate Course'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
