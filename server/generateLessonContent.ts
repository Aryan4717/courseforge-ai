import { startActiveObservation } from '@langfuse/tracing'
import { openai } from './llmClient.js'

const TEMPERATURE = 0.2
const DEFAULT_MODEL = 'gpt-4o-mini'

export async function generateLessonContent(
  courseTitle: string,
  sectionTitle: string,
  lessonTitle: string,
  level: string
): Promise<string> {
  return startActiveObservation('generateLessonContent', async (span) => {
    const levelLabel = level && level !== 'null' ? level : 'beginner'
    span.update({
      input: { courseTitle, sectionTitle, lessonTitle, level: levelLabel },
    })
    try {
      const userPrompt = `Write a detailed ${levelLabel} lesson.

Course: ${courseTitle}
Section: ${sectionTitle}
Lesson: ${lessonTitle}

Include:
- Clear explanation
- Code examples (if technical topic)
- Practical example
- Summary

Return markdown formatted content.`

      const res = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [{ role: 'user', content: userPrompt }],
        temperature: TEMPERATURE,
      })

      const raw = res.choices[0]?.message?.content
      if (raw == null || typeof raw !== 'string') {
        throw new Error('Empty or invalid lesson content')
      }
      span.update({ output: { length: raw.length } })
      return raw.trim()
    } catch (err) {
      span.update({ output: undefined, metadata: { error: String(err) } })
      throw err
    }
  })
}
