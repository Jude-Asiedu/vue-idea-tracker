import type { Idea } from '@/features/ideas/types/idea.types'

export const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000

export function normalizeDeletedAt(deletedAt: string | null | undefined): string | null {
  return deletedAt ?? null
}

export function withinRetention(deletedAt: string, cutoff = new Date(Date.now() - NINETY_DAYS_MS)): boolean {
  return new Date(deletedAt) > cutoff
}

export function sortByDeletedAtDesc(ideas: Idea[]): Idea[] {
  return [...ideas].sort(
    (a, b) => new Date(b.deleted_at as string).getTime() - new Date(a.deleted_at as string).getTime(),
  )
}
