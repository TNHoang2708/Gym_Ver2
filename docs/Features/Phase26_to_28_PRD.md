# Phase 26-28: Performance Overhaul, QA Testing & Mobile Setup PRD

## 1. Overview
Giai đoạn này tập trung vào 3 yếu tố sống còn của một dự án Production: Tốc độ mượt mà, Độ ổn định (không lỗi vặt), và Mở rộng đa nền tảng (iOS/Android Native).

## 2. Phase 26: Performance Overhaul (Độ Mượt)
### Vấn đề (Problem)
- App render bị giật, lag trên các thiết bị cũ, đặc biệt ở các trang chứa nhiều dữ liệu hoặc biểu đồ.
- Quá trình chuyển trang (Page Transition) sử dụng CSS Filter (blur) khiến GPU quá tải.
- Tải trang chậm do ôm đồm load các thư viện khổng lồ (`html5-qrcode`, `recharts`) ngay cả khi không dùng.

### Giải pháp (Solution)
- **Dynamic Imports:** Tách hoàn toàn `BarcodeScanner` và các thành phần `Recharts` ra thành Chunk riêng, chỉ tải khi user gọi tới. Tiết kiệm ~1MB Bundle size ban đầu.
- **Animation Tối Ưu:** Gỡ bỏ CSS Filter (`blur`), thay bằng CSS Grid Transitions cho Dashboard accordion (từ `height: auto` sang `grid-template-rows`), và `scaleX` cho progress bar để chống Layout Thrashing.
- **Memoization:** Trang bị `useMemo` cho toàn bộ các hàm tính toán derived data (Macro totals, lọc ngày) và `React.memo` cho các component tĩnh (`AIQuickLogger`, `NutritionOverview`).
- **Skeleton Loaders:** Triển khai khung xương tải trang chớp nháy (Skeleton) cho trang AI Coach và Progress thay vì spinner xoay tròn để tạo cảm giác phản hồi tức thì.

## 3. Phase 27: Automated Subagent QA (Kiểm Thử E2E)
### Vấn đề (Problem)
- Hệ thống thiếu quy trình kiểm thử tự động toàn diện. Mỗi lần update có nguy cơ vỡ layout hoặc hỏng routing mà không biết.

### Giải pháp (Solution)
- Triển khai **Playwright E2E Testing**.
- Viết 4 bộ script Test (Gatekeeper, Iron Lifter, Chef, Oracle) bao phủ toàn bộ 100% các route quan trọng.
- **Auth & Routing Tests:** Đảm bảo toàn bộ các route bảo mật (`/dashboard`, `/nutrition`, `/ai-coach`, v.v.) tự động redirect user chưa đăng nhập về `/login`.
- **Honeypot Tests:** Đảm bảo Proxy chặn đứng và trả về 403 khi bots xâm nhập vào `/api/admin/hidden-login`.

## 4. Phase 28: Mobile Native Setup (Capacitor)
### Vấn đề (Problem)
- Web PWA tuy tốt nhưng thiếu trải nghiệm Native (ví dụ: Push Notification, Haptic Feedback, truy cập Camera sâu).

### Giải pháp (Solution)
- Tích hợp **Capacitor** (`@capacitor/core`, `@capacitor/ios`, `@capacitor/android`).
- Cấu hình Live Reload thông qua `capacitor.config.ts`, trỏ `server.url` về IP của máy tính để lập trình viên có thể code và xem kết quả tức thì trên điện thoại thật.
- Đồng bộ mã nguồn (Sync) ra 2 nền tảng Xcode (iOS) và Android Studio (Android).

## 5. Success Metrics
- [x] Lighthouse Performance Score đạt ngưỡng cao.
- [x] 100% Playwright Tests Pass (28/28 tests passed).
- [x] iOS/Android platforms synced thành công qua Capacitor.
