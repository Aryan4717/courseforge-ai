import 'dotenv/config'
import express from 'express'
import { startInstrumentation, shutdownInstrumentation } from './instrumentation.js'
import {
  generateMetadata,
  structureSections,
  chatInstructor,
  type ChatMessage,
} from './llmService.js'

startInstrumentation()

const app = express()
app.use(express.json())

app.post('/generate-metadata', async (req, res) => {
  try {
    const { fileNames } = req.body as { fileNames?: string[] }
    if (!Array.isArray(fileNames)) {
      res.status(400).json({ error: 'Missing or invalid fileNames array' })
      return
    }
    const result = await generateMetadata(fileNames)
    res.json(result)
  } catch (err) {
    console.error('generateMetadata error:', err)
    res.status(500).json({
      error: err instanceof Error ? err.message : 'generateMetadata failed',
    })
  }
})

app.post('/structure-sections', async (req, res) => {
  try {
    const { fileNames } = req.body as { fileNames?: string[] }
    if (!Array.isArray(fileNames)) {
      res.status(400).json({ error: 'Missing or invalid fileNames array' })
      return
    }
    const result = await structureSections(fileNames)
    res.json(result)
  } catch (err) {
    console.error('structureSections error:', err)
    res.status(500).json({
      error: err instanceof Error ? err.message : 'structureSections failed',
    })
  }
})

app.post('/chat-instructor', async (req, res) => {
  try {
    const { messages } = req.body as { messages?: ChatMessage[] }
    if (!Array.isArray(messages)) {
      res.status(400).json({ error: 'Missing or invalid messages array' })
      return
    }
    const result = await chatInstructor(messages)
    res.json(result)
  } catch (err) {
    console.error('chatInstructor error:', err)
    res.status(500).json({
      error: err instanceof Error ? err.message : 'chatInstructor failed',
    })
  }
})

const PORT = Number(process.env.PORT) || 3001
const server = app.listen(PORT, () => {
  console.log(`LLM server listening on http://localhost:${PORT}`)
})

async function shutdown(): Promise<void> {
  server.close()
  await shutdownInstrumentation()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
