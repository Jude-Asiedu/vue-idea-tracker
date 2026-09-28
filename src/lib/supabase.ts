import { createClient } from '@supabase/supabase-js'
import { env, hasSupabaseConfig } from '@/lib/env'

// Untyped client — the SupabaseIdeaService uses explicit row types via
// database.types.ts casts rather than the Database generic, avoiding the
// complex Supabase schema generic structure requirements.
export const supabase = hasSupabaseConfig
  ? createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
  : null
