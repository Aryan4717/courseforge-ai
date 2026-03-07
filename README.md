# CourseForge AI

An AI-powered course publishing platform that transforms raw instructor content into structured, ready-to-sell courses. Instructors upload their material — the system automatically organizes it, generates metadata, and lists it on a built-in marketplace. Learners browse courses, purchase access, and consume content (video, PDF, audio, text) in a clean, professional player.

## Features

- **Public marketplace** — Browse all courses without logging in
- **AI course generation** — Create courses from a topic, level, and duration
- **ZIP upload** — Upload a folder of materials; AI organizes into sections and generates title/description
- **Rich content support** — Video, PDF (embedded), audio, images, text (.txt), markdown
- **AI enhancements** — Overview audio (ElevenLabs), intro avatar video (Colossyan), topic emoji icons
- **Stripe checkout** — Purchase courses ($9.99); purchases appear in My Library
- **Course player** — Sidebar navigation, inline PDF/TXT, video/audio playback

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, React Router 7, Vite 5, TypeScript |
| **Styling** | Tailwind CSS, Radix UI, class-variance-authority, clsx |
| **State** | Zustand |
| **Backend** | Node.js, Express 4 |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (email/password) |
| **AI/LLM** | OpenAI GPT-4o-mini, Langfuse (tracing) |
| **Media** | ElevenLabs (TTS), Colossyan (avatar video) |
| **Payments** | Stripe |
| **File handling** | JSZip, Multer |

## Project Structure

```
courseforge-ai/
├── src/                    # Frontend
│   ├── components/         # UI, auth, dashboard, layout
│   ├── pages/              # Route components
│   ├── services/           # API clients, auth, courses, checkout
│   ├── store/              # Zustand auth store
│   ├── lib/                # Types, utils
│   └── config.ts           # API base URL
├── server/                 # Express backend
│   ├── index.ts            # Routes, Stripe webhook
│   ├── ingestZip.ts        # ZIP parsing, course creation
│   ├── createCourse.ts     # Course/section/asset creation
│   ├── llmService.ts       # OpenAI, topic icons
│   ├── elevenlabs.ts       # Overview audio
│   ├── colossyan.ts        # Intro avatar video
│   └── ...
├── supabase/
│   └── migrations/         # Schema (courses, sections, assets, purchases)
├── vercel.json             # SPA rewrites
├── render.yaml              # Render backend config
└── railway.json             # Railway backend config
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase project
- Stripe account (for payments)
- OpenAI API key

### 1. Clone and install

```bash
git clone https://github.com/Aryan4717/courseforge-ai.git
cd courseforge-ai
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in values:

**Frontend (VITE_ prefix):**

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `VITE_API_URL` | Backend URL (omit in dev to use `/api` proxy) |

**Backend:**

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default 3001) |
| `OPENAI_API_KEY` | OpenAI API key |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `FRONTEND_URL` | Frontend URL (for Stripe redirects) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `ELEVENLABS_API_KEY` | (Optional) ElevenLabs TTS |
| `ELEVENLABS_VOICE_ID` | (Optional) ElevenLabs voice |
| `COLOSSYAN_API_KEY` | (Optional) Colossyan avatar video |
| `LANGFUSE_*` | (Optional) Langfuse tracing |

### 3. Database setup

Run Supabase migrations:

```bash
npx supabase db push
```

Or apply `supabase/migrations/*.sql` manually in the Supabase SQL Editor.

### 4. Run locally

**Terminal 1 — Backend:**

```bash
npm run server
```

Backend runs at `http://127.0.0.1:3001`.

**Terminal 2 — Frontend:**

```bash
npm run dev
```

Frontend runs at `http://localhost:5173`. Vite proxies `/api` to the backend.

## Routes

| Path | Page | Auth |
|------|------|------|
| `/` | Home (marketplace) | Public |
| `/login` | Login | Public |
| `/signup` | Sign up | Public |
| `/library` | My Library (purchased courses) | Protected |
| `/create` | Create course (choose flow) | Protected |
| `/create/ai` | AI-generated course | Protected |
| `/create/upload` | ZIP upload | Protected |
| `/courses/:id` | Course share page (buy, overview) | Public |
| `/course/:id` | Course player | Public |

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/create-checkout-session` | Stripe Checkout session |
| POST | `/stripe-webhook` | Stripe webhook (records purchase) |
| POST | `/generate-course-structure` | AI course structure from topic |
| POST | `/create-course` | Create course from structure |
| POST | `/ingest-zip` | Upload ZIP, create course + assets |
| POST | `/generate-metadata` | AI title/description from file names |
| PATCH | `/update-course/:courseId` | Update course metadata |
| POST | `/generate-audio` | ElevenLabs overview audio |
| POST | `/generate-avatar-video` | Colossyan intro video |
| POST | `/get-course-topic-icons` | AI emoji icons for courses |
| POST | `/structure-sections` | AI section structure from file names |

## Database Schema

- **courses** — id, title, description, level, overview_audio_url, intro_video_url, intro_video_status
- **course_sections** — id, course_id, title, order
- **course_assets** — id, section_id, name, type, url, content (markdown)
- **purchases** — id, user_id, course_id, created_at

**Storage:** `course-assets` bucket (public read, authenticated write).

## ZIP Upload Structure

Organize your ZIP like this:

```
CourseName/
├── Section1/
│   ├── lesson1.mp4
│   ├── handout.pdf
│   └── notes.txt
├── Section2/
│   └── ...
└── Resources/          # Root-level files
    └── glossary.pdf
```

Supported file types: mp4, webm, mov, pdf, doc, docx, mp3, wav, m4a, png, jpg, jpeg, gif, webp.  
`.DS_Store` and `__MACOSX` are filtered out automatically.

## Build & Deploy

**Frontend (Vercel):**

```bash
npm run build
```

Output in `dist/`. Vercel rewrites all routes to `/` for SPA routing.

**Backend (Railway / Render):**

```bash
npm run build:server
npm start
```

Set `FRONTEND_URL` and configure Stripe webhook to point at your backend.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run server` | Start Express backend (tsx) |
| `npm run build` | Build frontend (tsc + vite) |
| `npm run build:server` | Build backend only |
| `npm start` | Run production server |
| `npm run preview` | Preview production build |
| `npm run supabase:push` | Push migrations to Supabase |

## License

Private. See repository for details.
