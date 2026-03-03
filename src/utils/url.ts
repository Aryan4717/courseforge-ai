/**
 * Returns the full share URL for a course using the current environment origin.
 * Use in browser context only (relies on window.location.origin).
 * - Local dev: origin from Vite dev server
 * - Production: https://your-app.vercel.app/courses/:id
 */
export function getCourseShareUrl(courseId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/courses/${courseId}`
}
