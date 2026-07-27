import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10),
  GEMINI_API_KEY: z.string().min(10),
})

// Parse and validate environment variables
// If any of these are missing, the app will crash at startup, preventing a vulnerable deployment.
export const validateEnv = () => {
  const env = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY,
  })

  if (!env.success) {
    console.error('❌ FATAL: Bắt được lỗi biến môi trường bị thiếu hoặc sai định dạng (Zod Env Validation):', env.error.format())
    throw new Error('❌ Giao thức Tận Thế kích hoạt: Thiếu biến môi trường! Server tự hủy để bảo vệ an toàn.')
  }

  return env.data
}
