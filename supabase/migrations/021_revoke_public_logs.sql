-- Thu hồi quyền Public READ trên các bảng nhật ký nhạy cảm
DROP POLICY IF EXISTS "Public can view banned ips" ON public.banned_ips;
DROP POLICY IF EXISTS "Public can view alerts" ON public.security_alerts;
