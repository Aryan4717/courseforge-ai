-- Storage bucket for course uploads (course-assets). Required for ZIP ingestion.
-- If this migration fails on hosted Supabase, create the bucket manually:
-- Dashboard → Storage → New bucket → Name: course-assets, Public: true.

INSERT INTO storage.buckets (id, name, public)
VALUES ('course-assets', 'course-assets', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public;

-- Allow authenticated and anon users to upload and read (for course ingestion from browser).
CREATE POLICY "Allow public read for course-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-assets');

CREATE POLICY "Allow authenticated upload for course-assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'course-assets');

CREATE POLICY "Allow authenticated update for course-assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'course-assets');

CREATE POLICY "Allow authenticated delete for course-assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'course-assets');
