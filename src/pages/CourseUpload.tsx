import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { SectionHeader } from '@/components/ui/SectionHeader'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import { Button } from '@/components/ui/button'
import { processZipIntoCourse, type ProcessProgress } from '@/services/zipIngestion'

export function CourseUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [courseTitle, setCourseTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<ProcessProgress | null>(null)
  const [result, setResult] = useState<{ courseId: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0]
    if (chosen) {
      if (!chosen.name.toLowerCase().endsWith('.zip')) {
        setError('Please select a .zip file')
        setFile(null)
        return
      }
      setError(null)
      setResult(null)
      setFile(chosen)
    } else {
      setFile(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    setProgress(null)
    try {
      const blob = await file.arrayBuffer().then((b) => new Blob([b]))
      const title = courseTitle.trim() || undefined
      const { courseId } = await processZipIntoCourse(
        blob,
        title,
        (p) => setProgress(p)
      )
      setResult({ courseId })
      setFile(null)
      setCourseTitle('')
      if (inputRef.current) inputRef.current.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Upload course"
        description="Upload a ZIP file. Use one root folder as the course name; each subfolder is a section; files inside sections are assets. Optional: set a custom course title below."
      />
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>ZIP file</CardTitle>
            <CardDescription>
              Choose a .zip containing your course structure (sections as
              subfolders, assets as files). Large folders (50+ files) are
              processed in batches.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="zip-file"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Course ZIP
              </label>
              <input
                id="zip-file"
                ref={inputRef}
                type="file"
                accept=".zip"
                onChange={handleFileChange}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
              />
            </div>
            <div>
              <label
                htmlFor="course-title"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Course title (optional)
              </label>
              <input
                id="course-title"
                type="text"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="Overrides title inferred from ZIP"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {progress && (
              <p className="text-sm text-muted-foreground">
                {progress.phase === 'sections'
                  ? 'Creating sections…'
                  : `Processing file ${progress.current} of ${progress.total}`}
              </p>
            )}
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            {result && (
              <p className="text-sm text-foreground" role="status">
                Course created.{' '}
                <Link to="/" className="font-medium text-primary underline">
                  Back to home
                </Link>
                .
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              disabled={!file || loading}
            >
              {loading ? 'Processing…' : 'Upload and ingest'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
