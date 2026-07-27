-- 1. Siết chặt cấu hình Bucket (Dung lượng & Định dạng)
UPDATE storage.buckets
SET file_size_limit = 5242880, -- 5MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
WHERE id IN ('avatars', 'progress_photos');

-- 2. Dọn dẹp tàn dư: Xóa bỏ toàn bộ các policy lỏng lẻo cũ
DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar." ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar." ON storage.objects;

DROP POLICY IF EXISTS "Users can upload their own progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own progress photos" ON storage.objects;

-- 3. Thiết lập Vùng An Toàn (Strict RLS) cho avatars
DO $$ 
BEGIN
  -- INSERT: Bắt buộc đăng nhập, chỉ up ảnh vào thư mục mang tên user_id
  BEGIN
    CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT 
    WITH CHECK (
      bucket_id = 'avatars' 
      AND auth.role() = 'authenticated'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- UPDATE: Chỉ sửa ảnh của chính mình
  BEGIN
    CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE 
    USING (
      bucket_id = 'avatars' 
      AND auth.role() = 'authenticated'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- DELETE: Chỉ xóa ảnh của chính mình
  BEGIN
    CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE 
    USING (
      bucket_id = 'avatars' 
      AND auth.role() = 'authenticated'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- 4. Thiết lập Vùng An Toàn (Strict RLS) cho progress_photos
DO $$ 
BEGIN
  -- INSERT
  BEGIN
    CREATE POLICY "Users can upload own progress photos" ON storage.objects FOR INSERT 
    WITH CHECK (
      bucket_id = 'progress_photos' 
      AND auth.role() = 'authenticated'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- UPDATE
  BEGIN
    CREATE POLICY "Users can update own progress photos" ON storage.objects FOR UPDATE 
    USING (
      bucket_id = 'progress_photos' 
      AND auth.role() = 'authenticated'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- DELETE
  BEGIN
    CREATE POLICY "Users can delete own progress photos" ON storage.objects FOR DELETE 
    USING (
      bucket_id = 'progress_photos' 
      AND auth.role() = 'authenticated'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
