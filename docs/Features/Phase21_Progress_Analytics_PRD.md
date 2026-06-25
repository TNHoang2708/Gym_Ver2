# Phase 21 PRD: Progress Analytics

## 1. Document Info
- **Status:** Completed
- **Author:** Forge AI Team
- **Date:** June 2026

## 2. Objective
Bổ sung Đồ Thị Thống Kê vào màn hình Progress để cung cấp cái nhìn tổng quan (Analytics) về quá trình luyện tập và thay đổi cân nặng của người dùng. Tạo động lực thông qua dữ liệu trực quan.

## 3. Scope
### 3.1. Tab Navigation
- Chia nhỏ màn hình Progress thành 2 view độc lập: **Gallery** (Giao diện cũ) và **Analytics** (Giao diện mới).
- Sử dụng UI dạng Toggle Buttons với hiệu ứng active (Gold text).

### 3.2. Quick Stats (Thống Kê Nhanh)
- Tính toán và hiển thị:
  - **Workouts:** Tổng số buổi tập (đếm số ngày duy nhất có log).
  - **Max Streak:** Chuỗi ngày tập dài nhất (dựa trên các log liền mạch).
  - **Total Volume:** Tổng khối lượng tạ (Volume) đã nâng từ trước đến nay (kg).

### 3.3. Volume Chart
- **Loại biểu đồ:** BarChart (recharts).
- **Dữ liệu:** Fetch từ `workout_session_logs`, nhóm (group) theo `log_date`.
- **Hiển thị:** Mỗi cột thể hiện tổng volume (kg) trong ngày đó.
- Tooltip với viền vàng Gold và nền đen.

### 3.4. Weight Chart
- **Loại biểu đồ:** LineChart (recharts).
- **Dữ liệu:** Fetch từ `weight_logs` (tái sử dụng data từ phần Gallery).
- **Hiển thị:** Đường thẳng nối các mốc cân nặng theo từng thời điểm ghi chú. Thang Y-axis tự động canh theo `dataMin` và `dataMax` để thấy rõ sự dao động nhỏ của cân nặng.

## 4. Technical Implementation
- Cập nhật **`src/app/(app)/progress/page.tsx`**.
- Thư viện sử dụng: `framer-motion` cho animation khi đổi Tab, `recharts` cho biểu đồ siêu mượt.
- Tối ưu hiệu năng: Dữ liệu Analytics (session logs) chỉ fetch khi User bấm sang tab Analytics lần đầu tiên. Không fetch lặp lại.

## 5. Security & Privacy
- Row Level Security (RLS) đã tự bảo vệ dữ liệu, user chỉ có thể xem log của chính mình. No sensitive data exposed.
