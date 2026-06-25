# Phase 18 PRD: AI Vision (Photo Food Logging)

## 1. Document Info
- **Status:** Completed
- **Author:** Forge AI Team (Acting PM)
- **Date:** June 2026

## 2. Objective
Triển khai tính năng "Mắt Thần" (AI Vision) cho phép người dùng chụp ảnh món ăn và để AI tự động phân tích lượng calo cũng như macronutrients (đạm, đường, béo). Mục tiêu là tạo ra trải nghiệm "Zero-friction" (không rào cản) khi tracking dinh dưỡng, đúng với tiêu chí đơn giản, dễ xài của ứng dụng.

## 3. Scope

### 3.1. In Scope
- **UI/UX:**
  - Nút Camera tích hợp thẳng vào `AIQuickLogger` (Dashboard).
  - Khởi chạy camera hệ thống trên mobile (sử dụng thuộc tính `capture="environment"`).
  - Preview ảnh kèm kết quả phân tích JSON trong 1 thẻ Modal Pop-up hiện đại.
- **AI Processing:**
  - Chuyển đổi ảnh sang Base64 Data URL.
  - Sử dụng mô hình `gemini-2.5-flash` qua Vercel AI SDK (đã setup trong `/api/vision`).
  - Ép kiểu JSON Output (Zod Schema) bao gồm: `foodName`, `calories`, `protein_g`, `carbs_g`, `fat_g`.
- **Database Integration:**
  - Bấm "Save" từ Modal sẽ tự động insert bản ghi vào bảng `food_logs` thông qua Supabase Client.
  - Tự động SWR mutate để cập nhật vòng tròn Macro trên Dashboard tức thì.

### 3.2. Out of Scope
- Scan mã vạch (Barcode Scanning) của thực phẩm đóng gói.
- Nhận diện dụng cụ tập gym (Dumbbell/Barbell) để tracking khối lượng tạ (sẽ triển khai ở Phase sau cho workout).
- Lịch sử ảnh đã chụp (hiện tại chỉ lưu kết quả text và macro, không lưu trữ file ảnh lên storage để tiết kiệm dung lượng cloud).

## 4. Technical Architecture
- **Frontend Component:** `src/components/AIQuickLogger.tsx` được đập đi xây lại để hỗ trợ xử lý file upload qua `useRef` và `FileReader`.
- **Backend Route:** `src/app/api/vision/route.ts` hỗ trợ nhận chuỗi Base64 dài (sử dụng `maxDuration = 30`).
- **Data Flow:** 
  1. User -> File -> FileReader (Base64)
  2. Client -> POST `/api/vision` -> Gemini 2.5 Flash
  3. API -> JSON -> Client (Preview)
  4. Client -> Supabase `insert` -> Database
  5. SWR -> Mutate Dashboard UI.
