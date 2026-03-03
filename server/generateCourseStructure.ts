import { startActiveObservation } from '@langfuse/tracing'
import { openai } from './llmClient.js'

const TEMPERATURE = 0.2
const DEFAULT_MODEL = 'gpt-4o-mini'

export type CourseStructureSection = { title: string; lessons: string[] }
export type CourseStructure = {
  title: string
  description: string
  sections: CourseStructureSection[]
}

export async function generateCourseStructure(
  topic: string,
  level: string,
  duration: string
): Promise<CourseStructure> {
  return startActiveObservation('generateCourseStructure', async (span) => {
    span.update({ input: { topic, level, duration } })
    try {
      const systemPrompt = `You are a course design assistant. Given a topic, level, and duration, return a JSON object with exactly:
- "title" (string): concise course title
- "description" (string): 1-2 sentences describing the course
- "sections" (array): each object has "title" (string, section name) and "lessons" (array of strings, lesson titles within that section). Create a logical structure with 3-6 sections and 2-5 lessons per section. No other keys.`
      const userContent = `Topic: ${topic}\nLevel: ${level}\nDuration: ${duration}`
      const res = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: TEMPERATURE,
        response_format: { type: 'json_object' },
      })
      const raw = res.choices[0]?.message?.content
      if (raw == null) throw new Error('Empty completion')
      const parsed = JSON.parse(raw) as CourseStructure
      if (
        typeof parsed.title !== 'string' ||
        typeof parsed.description !== 'string' ||
        !Array.isArray(parsed.sections)
      ) {
        throw new Error('Invalid shape: expected title, description, sections')
      }
      for (const sec of parsed.sections) {
        if (typeof sec.title !== 'string' || !Array.isArray(sec.lessons)) {
          throw new Error('Invalid section: expected title and lessons array')
        }
      }
      span.update({ output: parsed })
      return parsed
    } catch (err) {
      span.update({ output: undefined, metadata: { error: String(err) } })
      throw err
    }
  })
}
