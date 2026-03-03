-- Add media columns for AI-generated overview audio and intro video
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS overview_audio_url TEXT,
  ADD COLUMN IF NOT EXISTS intro_video_url TEXT,
  ADD COLUMN IF NOT EXISTS intro_video_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS intro_video_id TEXT;
