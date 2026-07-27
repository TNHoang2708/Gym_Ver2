-- 1. Xóa chính sách Public READ cũ (Lỗ hổng làm lộ Token)
DROP POLICY IF EXISTS "Public can view global_settings" ON public.global_settings;

-- 2. Tạo chính sách Public READ mới an toàn hơn
-- Chỉ cho phép người dùng đọc các khóa cấu hình vô hại (VD: ai_kill_switch)
-- Tất cả các khóa nhạy cảm (token, webhook) sẽ bị tàng hình với Public.
DO $$ 
BEGIN
  BEGIN
    CREATE POLICY "Public can view safe global_settings" ON public.global_settings 
    FOR SELECT USING (key IN ('ai_kill_switch'));
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
