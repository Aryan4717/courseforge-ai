import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function HeroSection() {
  return (
    <div className="rounded-xl border border-border bg-card px-6 py-8 sm:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Welcome to CourseForge
          </h1>
          <p className="text-body text-muted-foreground">
            Your AI-powered course platform
          </p>
        </div>
        <Button asChild size="sm" className="w-fit">
          <Link to="/create">Create course</Link>
        </Button>
      </div>
    </div>
  )
}
