import type { IIdeaService } from './IdeaService'
import type { Idea } from '@/features/ideas/types/idea.types'
import { GUEST_STORAGE_KEY } from './LocalIdeaService'

const MIGRATED_FLAG = 'ideadeck_demo_migrated'

// Seeded demo ideas (see mockData.ts) use fixed `demo-N` ids — never import
// those into a real account, only ideas the guest actually created or edited.
function isSeedIdea(idea: Idea): boolean {
  return /^demo-\d+$/.test(idea.id)
}

// Imports a guest's local ideas into their new Supabase account the first
// time they sign in, then clears local storage. Safe to call on every
// authenticated load — it no-ops once the flag is set.
export async function migrateGuestIdeas(service: IIdeaService): Promise<number> {
  if (localStorage.getItem(MIGRATED_FLAG)) return 0

  const raw = localStorage.getItem(GUEST_STORAGE_KEY)
  if (!raw) {
    localStorage.setItem(MIGRATED_FLAG, '1')
    return 0
  }

  let guestIdeas: Idea[]
  try {
    guestIdeas = (JSON.parse(raw) as Idea[]).filter((i) => i.deleted_at === null && !isSeedIdea(i))
  } catch {
    localStorage.setItem(MIGRATED_FLAG, '1')
    return 0
  }

  if (guestIdeas.length === 0) {
    localStorage.setItem(MIGRATED_FLAG, '1')
    return 0
  }

  let migrated = 0
  for (const idea of guestIdeas) {
    try {
      await service.create({
        title: idea.title,
        description: idea.description,
        status: idea.status,
        impact: idea.impact,
        effort: idea.effort,
        tags: idea.tags,
      })
      migrated++
    } catch {
      break // stop on first failure — avoid re-creating already-migrated ideas on retry
    }
  }

  // Mark done even on partial failure: retrying would re-create the ideas
  // that already succeeded, since we don't track per-item migration state.
  localStorage.setItem(MIGRATED_FLAG, '1')
  if (migrated === guestIdeas.length) localStorage.removeItem(GUEST_STORAGE_KEY)
  return migrated
}
