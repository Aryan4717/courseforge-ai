import { useNavigate } from 'react-router-dom'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'

function IconAI() {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground" aria-hidden>
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3a6 6 0 0 0 4.5 9.5c0 1.5-.5 3-1.5 4L12 21l-3-4.5c-1-1-1.5-2.5-1.5-4A6 6 0 0 1 12 3Z" />
      </svg>
    </span>
  )
}

function IconUpload() {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground" aria-hidden>
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" x2="12" y1="3" y2="15" />
      </svg>
    </span>
  )
}

export function CreateCourse() {
  const navigate = useNavigate()

  return (
    <div className="space-y-10">
      <SectionHeader
        title="Create your course"
        description="Choose how you'd like to get started."
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card
          className="cursor-pointer transition-colors hover:bg-muted"
          onClick={() => navigate('/create/ai')}
        >
          <CardHeader className="space-y-2">
            <IconAI />
            <CardTitle>Generate with AI</CardTitle>
            <CardDescription>
              Describe your topic and let AI build the structure.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card
          className="cursor-pointer transition-colors hover:bg-muted"
          onClick={() => navigate('/create/upload')}
        >
          <CardHeader className="space-y-2">
            <IconUpload />
            <CardTitle>Upload Course Files</CardTitle>
            <CardDescription>
              Upload a ZIP file with your lessons and materials.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
