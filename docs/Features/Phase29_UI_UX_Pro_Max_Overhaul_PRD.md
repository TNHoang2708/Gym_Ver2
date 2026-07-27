# Phase 29: UI/UX Pro Max System Architecture & Design Overhaul PRD

## 1. Overview
Nâng cấp toàn bộ trải nghiệm người dùng (UX) và giao diện trực quan (UI) của hệ thống **Gym Planner AI** dựa trên bộ trí tuệ thiết kế **`ui-ux-pro-max`** (trích xuất từ `claudekit-engineer-2.15.0`). 

Mục tiêu: Đạt chuẩn thiết kế thể thao cao cấp (Athletic Minimalism), tối ưu phản hồi cảm ứng, đảm bảo độ tương phản màu chuẩn WCAG AA và mượt mà 60fps trên mọi thiết bị.

---

## 2. Key Objectives & Design Standards

### 🎯 Nguyên Tắc Thiết Kế Cốt Lõi (UI/UX Pro Max Principles)
1. **KISS & Focus:** Không bổ sung tính năng rườm rà. Tối ưu hóa tính năng cốt lõi (Tập luyện, Dinh dưỡng, AI Coach) trở nên tinh tế, trực quan và tốc độ phản hồi chớp nháy.
2. **Ergonomic Touch Targets:** Toàn bộ nút bấm, thẻ và icon tương tác có kích thước vùng chạm tối thiểu `44x44px`, khoảng cách giữa các phần tử `≥8px`.
3. **Tabular Telemetry:** Toàn bộ các con số theo dõi (Weight, Reps, Calo, Timer, Volume) sử dụng phông monospaced dạng `tabular-nums` để chống giật/nhảy layout khi đếm số.
4. **Performance & Motion:** Đèn nền glassmorphism tối ưu hóa bằng GPU (`transform-gpu`), loại bỏ các bộ lọc nặng (`blur`), giữ thời gian chuyển cảnh từ `150ms - 250ms`.

---

## 3. Architecture & Color System (`globals.css`)

```css
:root, .dark {
  /* Surface Tokens */
  --background: #090A0F;        /* Dark Charcoal Base */
  --card: #12141F;              /* Elevated Iron Slate */
  --border: rgba(255, 255, 255, 0.08);

  /* Brand & Accent Tokens */
  --primary: #FF3333;           /* Crimson Flame CTA */
  --secondary: #10B981;         /* Emerald Telemetry (Success) */
  --accent-ai: #8B5CF6;         /* Electric Violet (AI Engine) */

  /* Typography Tokens */
  --foreground: #FFFFFF;
  --muted-foreground: #94A3B8;  /* Slate-400 (Contrast 4.5:1 compliant) */
}
```

---

## 4. Component Scope & Implementation Details

1. **Global Tokens & Typography (`globals.css`):**
   - Định nghĩa bộ màu chuẩn, typography hierarchy, và utilities cho bento-grid.
2. **Top Navigation (`TopNavbar.tsx`):**
   - Header dạng Glass sticky, hiển thị trạng thái AI Coach, shortcut `Cmd + K` và logo Forge phát sáng nhẹ.
3. **Mobile Bottom Navigation (`BottomNav.tsx`):**
   - Dock điều hướng 5 mục chuẩn Ergonomic, tích hợp thanh hiệu ứng trượt lò xo (Spring Active Pill), rung phản hồi nhẹ (`haptic.light()`) và label rõ ràng.
4. **Landing Page (`page.tsx`):**
   - Hero section với ảnh vận động viên tương phản cao, bảng số liệu active athletes thời gian thực, bento feature grid và nút tải ứng dụng PWA.
5. **Dashboard (`dashboard/page.tsx`):**
   - Bento Grid thống kê: Hero CTA bắt đầu bài tập, thẻ Telemetry (Streak, Mood, XP, Steps) và vòng tròn tiến độ dinh dưỡng.
6. **AI Coach (`ai-coach/page.tsx`):**
   - Khung chat hiện đại với gợi ý prompt thông minh, hiệu ứng gõ phím AI real-time.

---

## 5. Success Metrics & Verification Status
- [x] 100% các phần tử tương tác đáp ứng chuẩn Touch Target ≥ 44x44px.
- [x] Đạt chuẩn tương phản chữ WCAG AA (>= 4.5:1).
- [x] 100% TypeScript type check clean (`npx tsc --noEmit` passed).
- [x] Dashboard Minimalist Athletic Hero Launchpad & 7-Day Activity Calendar Strip (`WeeklyStrip.tsx`) hoàn thành.
- [x] ForgeEmbers background particle canvas & ambient glow active.
- [x] AI Coach Pro Terminal với logo Forge không viền & Metallic Gradient button hoàn thành.
