import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { LangfuseSpanProcessor } from '@langfuse/otel'

const publicKey = process.env.LANGFUSE_PUBLIC_KEY
const secretKey = process.env.LANGFUSE_SECRET_KEY
const baseUrl = process.env.LANGFUSE_BASE_URL ?? 'https://cloud.langfuse.com'

export const tracerProvider =
  publicKey && secretKey
    ? new NodeTracerProvider({
        spanProcessors: [
          new LangfuseSpanProcessor({ publicKey, secretKey, baseUrl }),
        ],
      })
    : null

export function startInstrumentation(): void {
  if (!tracerProvider) return
  try {
    tracerProvider.register()
  } catch (err) {
    console.warn(
      'Langfuse/OTEL instrumentation failed to start:',
      err instanceof Error ? err.message : err
    )
  }
}

export async function shutdownInstrumentation(): Promise<void> {
  if (!tracerProvider) return
  try {
    await tracerProvider.shutdown()
  } catch (err) {
    console.warn(
      'Langfuse/OTEL shutdown error:',
      err instanceof Error ? err.message : err
    )
  }
}
