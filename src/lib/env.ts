import { z } from 'zod'

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'VITE_SUPABASE_ANON_KEY is required'),
})

const parsed = envSchema.safeParse({
  VITE_SUPABASE_URL: import.meta.env['VITE_SUPABASE_URL'],
  VITE_SUPABASE_ANON_KEY: import.meta.env['VITE_SUPABASE_ANON_KEY'],
})

// Allow guest/demo mode without Supabase config — store defaults so the
// Supabase client never gets constructed with undefined values.
export const env = parsed.success
  ? parsed.data
  : { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' }

export const hasSupabaseConfig = parsed.success
