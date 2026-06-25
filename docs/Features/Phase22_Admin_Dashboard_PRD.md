# Phase 22 PRD: Admin Dashboard & Real-time Tracking

## 1. Document Info
- **Status:** Completed
- **Author:** Forge AI Team
- **Date:** June 2026

## 2. Objective
Tạo trang quản trị (Admin Dashboard) để cho phép Admin (sếp) theo dõi số lượng người dùng và đặc biệt là xem ai đang hoạt động trên App (Real-time tracking) để dễ dàng quản lý.

## 3. Scope
### 3.1. Phân quyền Admin (Role-based Access Control)
- Tạo bảng `user_roles` để lưu trữ quyền của User (gồm `user` hoặc `admin`).
- Xây dựng function `is_admin()` trong PostgreSQL (dạng `security definer`) để tránh lỗi lặp đệ quy (infinite recursion) khi RLS tự gọi chính nó.
- Admin được cấp quyền `SELECT` bypass RLS để có thể xem toàn bộ dữ liệu của người dùng khác trong bảng `user_memory`.

### 3.2. Real-time Presence Tracking
- Tái sử dụng component `OnlineTracker` (đã gắn ở `layout.tsx`). Component này tự động kết nối với Supabase Channels (tên channel: `online-users`) mỗi khi có người mở app.
- Khi user tắt app, ngắt kết nối mạng, WebSockets tự động phát tín hiệu `leave` để loại user ra khỏi danh sách Online.

### 3.3. Admin UI (`/admin`)
- Hiển thị 2 thống kê chính: 
  - **Total Users:** Đếm tổng số người dùng trong `user_memory`.
  - **Online Now:** Số lượng người đang có mặt trên App.
- **Live Activity Feed:** Cập nhật ngay lập tức danh sách người đang truy cập với thời gian Join (cập nhật bằng Framer Motion để tạo hiệu ứng mượt mà).
- **All Registered Users:** Bảng hiển thị thông tin toàn bộ người dùng, kèm trạng thái xanh/đỏ báo hiệu họ có đang Online hay không.

## 4. Technical Details
- URL Route: `/admin`
- Các route được bảo vệ chặt chẽ: `admin/page.tsx` sẽ tự động chuyển hướng (`router.push`) và báo lỗi nếu user vào trang không có quyền `admin` trong bảng `user_roles`.
- Trang Profile (`/profile`) sẽ tự động hiển thị thêm một mục "Administration" dẫn tới Admin Dashboard nếu User đó có quyền admin.

## 5. Deployment Notes
- Cần phải chạy file migration `015_admin_dashboard.sql` trên Supabase SQL Editor.
- Sau đó, thao tác thủ công INSERT id của user cần cấp quyền vào bảng `user_roles` với role là `admin` để tài khoản đó trở thành Admin.

## 6. Hotfixes
- **Patch 1.0.1:** Sửa lỗi thiếu thẻ đóng `</div>` trong component `PullToRefresh` ở màn hình Dashboard và Community. (Đã xử lý dứt điểm).
