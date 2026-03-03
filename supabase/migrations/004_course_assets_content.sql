-- Add content column for text lessons (markdown body).
-- url remains for video/pdf/assets; allow NULL for text-only lessons.
ALTER TABLE course_assets
  ADD COLUMN IF NOT EXISTS content TEXT;

ALTER TABLE course_assets
  ALTER COLUMN url DROP NOT NULL;
