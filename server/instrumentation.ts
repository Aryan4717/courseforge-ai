import { NodeSDK } from '@opentelemetry/sdk-node'
import { LangfuseSpanProcessor } from '@langfuse/otel'

const publicKey = process.env.LANGFUSE_PUBLIC_KEY
const secretKey = process.env.LANGFUSE_SECRET_KEY
const baseUrl = process.env.LANGFUSE_BASE_URL ?? 'https://cloud.langfuse.com'

// LangfuseSpanProcessor targets OTEL sdk-trace-base v2; NodeSDK uses v1 trace types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sdk =
  publicKey && secretKey
    ? new NodeSDK({
        spanProcessors: [
          new LangfuseSpanProcessor({ publicKey, secretKey, baseUrl }),
        ] as any,
      })
    : null

export function startInstrumentation(): void {
  if (sdk) sdk.start()
}

export function shutdownInstrumentation(): Promise<void> {
  if (sdk) return sdk.shutdown()
  return Promise.resolve()
}
