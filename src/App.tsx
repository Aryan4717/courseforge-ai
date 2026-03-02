import { Layout } from '@/components/layout/Layout'

function App() {
  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Welcome to CourseForge AI</h1>
        <p className="text-muted-foreground">
          Project structure and tooling are ready. Add features in <code className="rounded bg-muted px-1.5 py-0.5">src/features</code>, pages in <code className="rounded bg-muted px-1.5 py-0.5">src/pages</code>, and shared components in <code className="rounded bg-muted px-1.5 py-0.5">src/components</code>.
        </p>
      </div>
    </Layout>
  )
}

export default App
