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

export function Home() {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Welcome to CourseForge AI"
        description="Project structure and design system are ready. Use the components and tokens below across the app."
      />
      <div className="space-y-4">
        <h2 className="text-subheading font-medium text-foreground">
          Design system demo
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>Getting started</CardTitle>
            <CardDescription>
              Add features in src/features, pages in src/pages, and shared
              components in src/components.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-body text-muted-foreground">
              This card uses the Maven-inspired design system: white
              background, minimal color, and consistent typography and spacing.
            </p>
          </CardContent>
          <CardFooter className="gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
