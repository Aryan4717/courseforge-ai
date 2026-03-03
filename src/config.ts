const API_BASE = import.meta.env.VITE_API_URL

if (!API_BASE && import.meta.env.PROD) {
  console.error('VITE_API_URL is not set. API calls will fail.')
}

export const API_BASE_URL = API_BASE?.replace(/\/$/, '') ?? (import.meta.env.DEV ? '/api' : '')
