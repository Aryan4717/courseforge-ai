import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/button'
import {
  ingestZip,
  generateMetadata,
  updateCourse,
  triggerGenerateAudio,
  triggerGenerateAvatarVideo,
} from '@/services/createCourseApi'

export function UploadCourse() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((f: File | null) => {
    setError(null)
    if (!f) {
      setFile(null)
      return
    }
    if (!f.name.toLowerCase().endsWith('.zip')) {
      setError('Please select a .zip file')
      setFile(null)
      return
    }
    setFile(f)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const f = e.dataTransfer.files?.[0]
      handleFile(f ?? null)
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || loading) return
    setError(null)
    setLoading(true)
    try {
      const { courseId, fileNames } = await ingestZip(file)
      const { title, description } = await generateMetadata(fileNames)
      await updateCourse(courseId, { title, description })
      triggerGenerateAudio(courseId, { title, description })
      triggerGenerateAvatarVideo(courseId, { title, description })
      navigate(`/courses/${courseId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Upload course files"
        description="Upload a ZIP file with your lessons and materials. We'll infer structure and metadata."
      />
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`rounded-md border-2 border-dashed p-8 text-center transition-colors ${
                dragOver ? 'border-primary bg-muted/50' : 'border-border bg-muted/30'
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-body-sm text-muted-foreground">
                {file
                  ? file.name
                  : 'Drag and drop a .zip file here, or click to browse'}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => inputRef.current?.click()}
                disabled={loading}
              >
                Choose file
              </Button>
            </div>
            {error && (
              <p className="text-body-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={!file || loading} className="w-full">
              {loading ? 'Creating course…' : 'Create Course'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
