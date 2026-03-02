import OpenAI from 'openai'
import { observeOpenAI } from '@langfuse/openai'

const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) {
  console.warn('OPENAI_API_KEY is not set; LLM endpoints will fail.')
}

const baseClient = new OpenAI({ apiKey: apiKey ?? '' })

export const openai = observeOpenAI(baseClient)
