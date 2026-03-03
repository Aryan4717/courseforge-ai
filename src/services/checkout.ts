import { API_BASE_URL } from '@/config'

export type CreateCheckoutSessionResult = { url: string | null }

export async function createCheckoutSession(
  courseId: string,
  userId: string
): Promise<CreateCheckoutSessionResult> {
  const res = await fetch(`${API_BASE_URL}/create-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courseId, userId }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? 'Checkout session failed')
  }
  return res.json()
}
