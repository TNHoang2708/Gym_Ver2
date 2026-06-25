# Phase 19 PRD: Active Workout V2 (Swap & History)

## 1. Document Info
- **Status:** Completed
- **Author:** Forge AI Team (Acting PM)
- **Date:** June 2026

## 2. Objective
Mài giũa màn hình `Active Workout` (trong quá trình tập) để cung cấp trải nghiệm chuyên nghiệp và tiện dụng nhất cho người dùng khi ở phòng gym. Hai vấn đề được giải quyết:
- Đổi bài tập (Swap Exercise) khi máy bận hoặc đau khớp.
- Xem lịch sử tạ (Weight History) của bài tập để lắp tạ nhanh chóng, không phải nhớ.

## 3. Scope

### 3.1. In Scope
- **Swap Exercise:**
  - Nút `Repeat` (Swap) màu Gold bên cạnh tên bài tập.
  - Gọi Supabase lấy 10 bài tập cùng `target_muscles` với bài hiện tại (ngoại trừ bài hiện tại).
  - Modal chọn bài thay thế với tên và nhóm dụng cụ.
  - Cập nhật state bài tập hiện tại (`exercises` mảng) ngay lập tức và tự động đồng bộ xuống LocalStorage.
- **Weight History:**
  - Nút `History` ở phía trên ô nhập Reps/Weight.
  - Gọi Supabase `workout_session_logs` lọc theo `user_id` và `exercise_name`.
  - Hiển thị danh sách tạ, số lần lặp và ngày tập.
  - Nút `Copy` điền tự động dữ liệu cũ vào input field hiện tại.

### 3.2. Out of Scope
- Tự động thay đổi bài tập của toàn bộ Lịch tập (Routine) trong Database (Tính năng Swap hiện tại chỉ áp dụng Local cho Session này).
- Đồ thị (Chart) lịch sử tạ (Đã có bên Progress page).

## 4. Technical Architecture
- **State Updates:** 
  - `showSwapModal`, `swapOptions`, `loadingSwap`
  - `showHistoryModal`, `historyLogs`, `loadingHistory`
- **Queries:**
  - `loadSwapOptions`: `.from('exercises').contains('target_muscles', [primaryMuscle]).limit(10)`
  - `loadHistory`: `.from('workout_session_logs').ilike('exercise_name', exerciseName).order('created_at').limit(5)`
- **UI:** Sử dụng `AnimatePresence` và `motion.div` từ `framer-motion` cho các Modals để giữ giao diện mượt mà và bóng bẩy. Dùng Glass-card effect.
