// Manual type mirror of the Supabase `ideas` table.
// Replace with `supabase gen types typescript --linked > src/lib/database.types.ts`
// once the Supabase CLI is configured.

export type Database = {
  public: {
    Tables: {
      ideas: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          status: string
          impact: number
          effort: number
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          title: string
          description?: string
          status?: string
          impact?: number
          effort?: number
          tags?: string[]
        }
        Update: {
          title?: string
          description?: string
          status?: string
          impact?: number
          effort?: number
          tags?: string[]
        }
      }
    }
  }
}
