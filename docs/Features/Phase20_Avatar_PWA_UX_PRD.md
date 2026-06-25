# Phase 20 PRD: Avatar Upload & PWA Mobile UX

## 1. Document Info
- **Status:** Completed
- **Author:** Forge AI Team (Acting PM)
- **Date:** June 2026

## 2. Objective
Nâng cấp trải nghiệm người dùng (UX) và cá nhân hóa tài khoản để ứng dụng mang lại cảm giác xịn xò như Native App (ứng dụng gốc tải từ App Store/Google Play).

## 3. Scope

### 3.1. Profile Avatar Upload
- Tạo Storage Bucket `avatars` trên Supabase với các Policies (Public read, Authenticated insert/update/delete).
- Màn hình Profile thay thế modal URL cũ bằng UI cho phép mở Picker chọn ảnh từ điện thoại.
- Giới hạn ảnh tải lên tối đa 2MB để tiết kiệm dung lượng.
- Upload thành công sẽ lưu URL vào `user_memory.hard_memory.avatar_url`.

### 3.2. PWA Mobile UX
- **Pull To Refresh:** Component `src/components/PullToRefresh.tsx` bắt sự kiện chạm (`touchstart`, `touchmove`, `touchend`). Khi vuốt xuống vượt quá giới hạn (60px) sẽ rung phản hồi (Haptic) và gọi hàm load lại dữ liệu (mutate của SWR hoặc fetch).
- **Haptic Feedback:** Tích hợp `haptic.light()`, `haptic.medium()` vào Pull To Refresh và các luồng chạm thông thường.
- **Trang áp dụng Pull to Refresh:** Dashboard và Community Feed.

## 4. Technical Architecture
- **Supabase Storage:** Dùng `supabase.storage.from('avatars').upload(...)`.
- **Framer Motion:** Component `PullToRefresh` sử dụng `AnimatePresence` để hiển thị spinner và `motion.div` để đẩy toàn bộ trang xuống (tạo hiệu ứng giãn lò xo - Spring).
- **Web API:** Hàm `navigator.vibrate` được tái sử dụng qua wrapper `src/lib/haptics.ts`.
