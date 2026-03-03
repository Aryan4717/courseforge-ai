export function buildIntroScript(
  title: string,
  description?: string | null
): string {
  return `Welcome to ${title}. ${(description ?? '').trim() || "Let's get started."}`
}
