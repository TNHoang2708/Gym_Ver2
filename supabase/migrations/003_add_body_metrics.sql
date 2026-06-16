-- =====================================================
-- Migration 003: Add Body Metrics & Progress Photos
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Add new columns to weight_logs table
ALTER TABLE public.weight_logs
ADD COLUMN IF NOT EXISTS body_fat_percent numeric(4,1),
ADD COLUMN IF NOT EXISTS waist_cm numeric(5,1),
ADD COLUMN IF NOT EXISTS chest_cm numeric(5,1),
ADD COLUMN IF NOT EXISTS arms_cm numeric(5,1),
ADD COLUMN IF NOT EXISTS neck_cm numeric(5,1),
ADD COLUMN IF NOT EXISTS hips_cm numeric(5,1),
ADD COLUMN IF NOT EXISTS photo_url text;

-- 2. Create Storage Bucket for Progress Photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('progress_photos', 'progress_photos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up Storage Policies for progress_photos
-- Note: Assuming you want authenticated users to upload and view their own photos.
-- But since it's a public bucket, the URLs will be accessible. We restrict uploads/deletions.

-- Allow public read access to all photos
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'progress_photos' );

-- Allow authenticated users to upload photos
CREATE POLICY "Users can upload their own progress photos" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'progress_photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own progress photos" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'progress_photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own progress photos" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'progress_photos' 
  AND auth.role() = 'authenticated'
);

-- Done!
SELECT 'Migration 003 complete ✅' as status;
