import { startActiveObservation } from '@langfuse/tracing'
import { openai } from './llmClient.js'

const TEMPERATURE = 0.2
const DEFAULT_MODEL = 'gpt-4o-mini'

export type GenerateMetadataResult = { title: string; description: string }
export type SectionStructure = { title: string; fileNames: string[] }
export type StructureSectionsResult = { sections: SectionStructure[] }
export type ChatMessage = { role: string; content: string }
export type ChatInstructorResult = { content: string }

async function completion(
  systemPrompt: string,
  userContent: string,
  responseFormat: 'json_object' | 'text' = 'json_object'
): Promise<string> {
  const res = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature: TEMPERATURE,
    response_format: responseFormat === 'json_object' ? { type: 'json_object' } : undefined,
  })
  const content = res.choices[0]?.message?.content
  if (content == null) throw new Error('Empty completion')
  return content
}

export async function generateMetadata(
  fileNames: string[]
): Promise<GenerateMetadataResult> {
  return startActiveObservation('generateMetadata', async (span) => {
    span.update({ input: { fileNames } })
    try {
      const systemPrompt = `You are a course metadata assistant. Given a list of file names from a course package, return a JSON object with exactly: "title" (string, concise course title) and "description" (string, 1-2 sentences). Use only the file names to infer topic; no other keys.`
      const userContent = `File names:\n${fileNames.join('\n')}`
      const raw = await completion(systemPrompt, userContent)
      const parsed = JSON.parse(raw) as GenerateMetadataResult
      if (typeof parsed.title !== 'string' || typeof parsed.description !== 'string') {
        throw new Error('Invalid shape: expected title and description strings')
      }
      span.update({ output: parsed })
      return parsed
    } catch (err) {
      span.update({ output: undefined, metadata: { error: String(err) } })
      throw err
    }
  })
}

export async function structureSections(
  fileNames: string[]
): Promise<StructureSectionsResult> {
  return startActiveObservation('structureSections', async (span) => {
    span.update({ input: { fileNames } })
    try {
      const systemPrompt = `You are a course structure assistant. Given a list of file names, return a JSON object with a single key "sections": an array of objects, each with "title" (string, section name) and "fileNames" (array of strings, subset of the given file names). Every file must appear in exactly one section. Group logically by topic. No other keys.`
      const userContent = `File names:\n${fileNames.join('\n')}`
      const raw = await completion(systemPrompt, userContent)
      const parsed = JSON.parse(raw) as StructureSectionsResult
      if (!Array.isArray(parsed.sections)) throw new Error('Invalid shape: expected sections array')
      span.update({ output: parsed })
      return parsed
    } catch (err) {
      span.update({ output: undefined, metadata: { error: String(err) } })
      throw err
    }
  })
}

export type CourseTopicIconInput = { id: string; title: string; description?: string | null }
export type CourseTopicIconsResult = Record<string, string>

export async function getCourseTopicIcons(
  courses: CourseTopicIconInput[]
): Promise<CourseTopicIconsResult> {
  if (courses.length === 0) return {}
  return startActiveObservation('getCourseTopicIcons', async (span) => {
    span.update({ input: { count: courses.length } })
    try {
      const list = courses
        .map((c, i) => `${i + 1}. id="${c.id}" title="${c.title}"${c.description ? ` description="${c.description.slice(0, 100)}"` : ''}`)
        .join('\n')
      const systemPrompt = `You are a course icon assistant. Given a list of courses, return a JSON object mapping each course id to exactly ONE emoji that best represents that course topic. Use only standard Unicode emojis. Keys must be the exact course ids. Example: {"uuid-1":"🧠","uuid-2":"🗄️"}. No other keys or text.`
      const userContent = `Courses:\n${list}`
      const raw = await completion(systemPrompt, userContent)
      const parsed = JSON.parse(raw) as Record<string, string>
      const result: CourseTopicIconsResult = {}
      for (const c of courses) {
        const emoji = parsed[c.id]
        result[c.id] = typeof emoji === 'string' && emoji.length > 0 ? emoji.trim() : '📚'
      }
      span.update({ output: { count: Object.keys(result).length } })
      return result
    } catch (err) {
      span.update({ output: undefined, metadata: { error: String(err) } })
      throw err
    }
  })
}

export async function chatInstructor(
  messages: ChatMessage[]
): Promise<ChatInstructorResult> {
  return startActiveObservation('chatInstructor', async (span) => {
    span.update({ input: { messages } })
    try {
      const formatted = messages.map((m) => ({ role: m.role as 'system' | 'user' | 'assistant', content: m.content }))
      const res = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: formatted,
        temperature: TEMPERATURE,
      })
      const content = res.choices[0]?.message?.content ?? ''
      const result: ChatInstructorResult = { content }
      span.update({ output: result })
      return result
    } catch (err) {
      span.update({ output: undefined, metadata: { error: String(err) } })
      throw err
    }
  })
}
