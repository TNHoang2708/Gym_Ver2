# Phase 23 PRD: App Stabilization & UX Polish

## 1. Document Info
- **Status:** Completed
- **Author:** Forge AI Team
- **Date:** June 2026

## 2. Objective
Giải quyết toàn bộ các vấn đề về UX friction, data integrity, performance, và security tìm được trong quá trình audit toàn diện ứng dụng sau 22 phases development.

## 3. Scope

### 3.1. 🔴 Critical Fixes

#### Bottom Nav Reduction (5 tabs)
- Giảm từ 7 tabs xuống còn 5: **Home, Workout, AI Coach, Nutrition, Profile**.
- Loại bỏ: Diary và Community (vẫn accessible nhưng không chiếm slot nav).
- Thêm tab **Workout** thay thế, trỏ đến `/workout` index page mới.

#### Dashboard Mock Data Removal
- Xóa hoàn toàn biến `mockData` cứng trong chart component.
- Khi không có workout data thật → hiển thị **empty state** với icon và message hướng dẫn.
- Tooltip màu #8CE0FF (Ice Blue) nhất quán với theme.

#### Water Log Persistence
- Nút Water trên Dashboard giờ gọi `handleLogWater()` → insert vào `food_logs` với calories = 0.
- Hiển thị loading spinner khi đang save.
- Không mất data khi reload trang.

#### Weight Log Modal
- Nút Weight mở modal nhập kg với input number + nút Save.
- Gọi `supabase.from('weight_logs').upsert(...)` để lưu thật.
- Toast success sau khi save, trigger mutate để refresh dashboard.

### 3.2. 🟡 Important Fixes

#### Workout Index Page (`/workout/page.tsx`)
- Tạo mới trang tổng quan Workout.
- Hiển thị workout schedule hôm nay với exercise list preview (tối đa 4 items).
- Nút "Start Workout" nổi bật → `/workout/active`.
- Week overview highlight ngày hôm nay.
- Link đến `/workout/history`.
- Nếu chưa có schedule → CTA "Build My Plan" → `/ai-coach`.

#### AI Insight Caching
- Cache insight text vào `localStorage` với key `dashboard_insight`.
- TTL: 6 tiếng.
- Chỉ gọi `/api/insight` khi cache expired — tiết kiệm AI API calls.
- Dependency array thay bằng `[data?.streak]` thay vì `[data]`.

#### Admin Security Fix
- Thay `user?.email?.includes('admin')` bằng `supabase.rpc('is_admin')`.
- Dùng function `is_admin()` PostgreSQL đã có sẵn từ migration 015.

#### Workout Logs Query Optimization
- Thêm `.limit(90)` vào `workout_logs` query trong `use-data.ts`.
- 90 ngày đủ để tính streak và hiển thị chart 7 ngày.

### 3.3. 🟢 Optimization

#### SWR Strategy Consistency
- Tất cả hooks trong `use-data.ts`: `revalidateOnFocus: false`.
- Thêm `refreshInterval: 300000` (5 phút) thay cho revalidate on focus.
- Tránh fetch không cần thiết khi user switch tab/app.

#### Dead Code Removal
- Xóa `metrics` array không dùng trong Dashboard.
- Remove `useRef` import thừa.

## 4. Files Modified
- `src/components/layout/BottomNav.tsx`
- `src/app/(app)/dashboard/page.tsx`
- `src/app/(app)/layout.tsx`
- `src/lib/hooks/use-data.ts`
- `src/app/(app)/workout/page.tsx` ← **[NEW]**
