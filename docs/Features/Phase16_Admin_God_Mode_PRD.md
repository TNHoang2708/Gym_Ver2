# Phase 16 PRD: Admin God Mode & Telemetry Dashboard

## 1. Document Info
- **Status:** Completed
- **Author:** Forge AI Team (Acting PM)
- **Date:** June 2026
- **Target Release:** Immediately available.

## 2. Objective
Nâng cấp trang quản trị (Admin Portal) từ một bản nháp tĩnh (Phase 1) thành một **Command Center (Trung tâm điều khiển)** toàn diện. Cung cấp cho Admin toàn quyền kiểm soát hệ thống, quản lý người dùng thực tế, điều khiển trạng thái ứng dụng theo thời gian thực và cấu hình AI động.

## 3. Scope (Phạm vi)

### 3.1. In Scope
- **Real User Management:** Hiển thị danh sách user từ `auth.users` của Supabase.
- **Action Controls:** Cung cấp quyền Suspend (khoá tài khoản) và Delete (xoá vĩnh viễn) cho Admin.
- **Maintenance Mode:** Chế độ bảo trì chặn toàn bộ user thường truy cập ứng dụng (chỉ cho phép Admin bypass).
- **Secure Server APIs:** Các tác vụ quản trị phải được thực hiện thông qua `SUPABASE_SERVICE_ROLE_KEY` ở backend để bảo mật tuyệt đối.
- **Dynamic AI Prompt Management (Quản lý não bộ AI):** 
  - Giao diện cho phép Admin sửa đổi "Core System Prompt" (Chỉ thị cốt lõi) của AI Coach.
  - Thay vì hardcode trong `src/lib/system-prompt.ts`, AI sẽ lấy prompt từ database `global_settings`.
  - Admin có thể tuỳ biến AI thành "Khắc nghiệt như David Goggins" hoặc "Nhẹ nhàng như bác sĩ tâm lý" chỉ bằng vài dòng text.
- **Global Announcements (Thông báo toàn máy chủ):**
  - Chức năng tạo một thông báo khẩn cấp (vd: "Bảo trì lúc 12h đêm nay" hoặc "Có update mới").
  - Giao diện User sẽ hiện Toast Alert hoặc Banner cho tất cả những ai đang online.

### 3.2. Out of Scope
- Chỉnh sửa thông tin chi tiết (Tên, Profile) của User (sẽ cập nhật ở Phase sau).
- Gửi thông báo Push Notifications qua Email hoặc Device Token (Sẽ làm ở mảng Marketing App sau này).
- Custom AI Prompt cho từng user riêng biệt (Hiện tại áp dụng Global cho toàn hệ thống).

## 4. Technical Architecture
- **Frontend:** Cập nhật `src/app/admin/page.tsx` sử dụng React state để quản lý loading và kết quả search. Giữ nguyên giao diện UI Dark Theme + Red Glow.
- **Backend APIs:**
  - `src/app/api/admin/users/route.ts`: Xử lý GET (list users), PUT (suspend/unsuspend), DELETE (xoá user).
  - `src/app/api/admin/stats/route.ts`: Xử lý logic tính DAU và API Telemetry, trả về array cho Frontend vẽ biểu đồ Recharts.
  - `src/app/api/admin/settings/route.ts`: Dùng để Get/Update các settings nâng cao (Prompt, Announcement) chỉ dành cho Admin.
- **Supabase Integration:** Khởi tạo `src/lib/supabase/admin.ts` chứa client vượt rào RLS (Row Level Security).
- **Database (`global_settings` table):**
  - Thêm key `custom_ai_prompt` (lưu chuỗi text).
  - Thêm key `global_announcement` (lưu chuỗi text).
  - Thêm key `show_announcement` (boolean).
- **Middleware/Layout:** Cập nhật `src/app/(app)/layout.tsx` kiểm tra flag `maintenance_mode` từ bảng `global_settings` để chặn render App nếu đang bảo trì. Đồng thời dùng để phát thông báo (`GlobalAnnouncement`) nếu có `global_announcement`.
- **AI Core (`src/lib/system-prompt.ts`):**
  - Refactor lại hàm `buildSystemPrompt` thành async để fetch `custom_ai_prompt` từ DB và append vào sau core instruction.

## 5. Security & Authorization
- Mọi API route (`/api/admin/*`) bắt buộc kiểm tra Session Token.
- Email của người gọi API bắt buộc phải là `admin@gymplanner.ai` hoặc chứa chuỗi `admin`.
- Nếu Authorization thất bại, trả về mã lỗi `403 Forbidden` hoặc `401 Unauthorized`.

## 6. Success Metrics (KPIs)
- Admin có thể xem được tổng số Users hiện tại chính xác tuyệt đối.
- Admin có thể Suspend thành công 1 user, user đó ngay lập tức mất quyền truy cập.
- Tính năng Maintenance Mode kích hoạt dưới 1s, toàn hệ thống hiển thị màn hình bảo trì.
- Admin đổi Prompt thành "Hãy luôn chửi thề", AI lập tức chửi thề ở tin nhắn tiếp theo của User mà không cần restart server.
- Admin bật Announcement, User chuyển trang sẽ thấy thông báo hiện lên.
