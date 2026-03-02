import { useState, useRef } from 'react'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/button'
import { chatInstructor } from '@/services/llmApi'
import { processZipWithAI } from '@/services/onboardingIngestion'
import { type ProcessProgress } from '@/services/zipIngestion'

type Message = { role: 'user' | 'assistant'; content: string }

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content:
    'Share your course ZIP to get started, or tell me about your course.',
}

export function InstructorOnboarding() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<ProcessProgress | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const userMessage: Message = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMessage])
    setLoading(true)
    try {
      const history = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }))
      const { content } = await chatInstructor(history)
      setMessages((prev) => [...prev, { role: 'assistant', content }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: err instanceof Error ? err.message : 'Something went wrong.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || loading) return
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: `Uploaded ${file.name}` },
        {
          role: 'assistant',
          content: 'Please upload a .zip file.',
        },
      ])
      e.target.value = ''
      return
    }
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: `Uploaded ${file.name}` },
    ])
    setLoading(true)
    setProgress(null)
    try {
      const blob = await file.arrayBuffer().then((b) => new Blob([b]))
      const { shareableLink } = await processZipWithAI(blob, (p) =>
        setProgress(p)
      )
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Course created. Share: ${shareableLink}`,
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: err instanceof Error ? err.message : 'Upload failed.',
        },
      ])
    } finally {
      setLoading(false)
      setProgress(null)
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Create course"
        description="Chat with the assistant or upload a course ZIP to create a shareable course."
      />
      <Card>
        <CardContent className="p-0">
          <div
            className="flex max-h-[400px] flex-col overflow-y-auto p-4"
            role="log"
            aria-live="polite"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === 'user'
                    ? 'mb-2 text-right text-foreground'
                    : 'mb-2 text-left text-muted-foreground'
                }
              >
                <span className="text-body-sm font-medium">
                  {m.role === 'user' ? 'You' : 'Assistant'}:
                </span>{' '}
                <span className="text-body">{m.content}</span>
              </div>
            ))}
            {loading && progress && (
              <p className="text-body-sm text-muted-foreground">
                {progress.phase === 'assets'
                  ? `Processing file ${progress.current} of ${progress.total}`
                  : 'Creating course…'}
              </p>
            )}
            {loading && !progress && (
              <p className="text-body-sm text-muted-foreground">…</p>
            )}
          </div>
          <form
            onSubmit={handleSend}
            className="flex flex-col gap-2 border-t border-border p-4"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message…"
                className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={loading}
              />
              <Button type="submit" disabled={loading}>
                Send
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={handleZipUpload}
                className="hidden"
                id="onboarding-zip"
              />
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => fileInputRef.current?.click()}
              >
                Attach ZIP
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
