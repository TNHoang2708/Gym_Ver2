-- =====================================================
-- Migration 005: Add Diary Photos
-- Run this in your Supabase SQL Editor
-- =====================================================

alter table public.diary_entries
add column if not exists photo_url text;

-- Done!
SELECT 'Migration 005 complete ✅' as status;
