import type { IIdeaService } from './IdeaService'
import type { Idea, CreateIdeaPayload, UpdateIdeaPayload } from '@/features/ideas/types/idea.types'
import { MOCK_IDEAS } from './mockData'
import { ConflictError } from './errors'
import { normalizeDeletedAt, withinRetention, sortByDeletedAtDesc } from './ideaServiceUtils'

export const GUEST_STORAGE_KEY = 'ideadeck_demo_ideas'

function load(): Idea[] {
  const raw = localStorage.getItem(GUEST_STORAGE_KEY)
  if (raw) {
    try {
      return (JSON.parse(raw) as Idea[]).map((i) => ({
        ...i,
        deleted_at: normalizeDeletedAt(i.deleted_at),
      }))
    } catch { /* fall through to seed */ }
  }
  const seeded = structuredClone(MOCK_IDEAS)
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(seeded))
  return seeded
}

function save(ideas: Idea[]) {
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(ideas))
}

export class LocalIdeaService implements IIdeaService {
  async fetchAll(): Promise<Idea[]> {
    return load().filter((i) => i.deleted_at === null)
  }

  async fetchDeleted(): Promise<Idea[]> {
    return sortByDeletedAtDesc(
      load()
        .filter((i) => i.deleted_at !== null)
        .filter((i) => withinRetention(i.deleted_at as string)),
    )
  }

  async create(payload: CreateIdeaPayload): Promise<Idea> {
    const all = load()
    const idea: Idea = {
      id: crypto.randomUUID(),
      user_id: 'demo-user',
      deleted_at: null,
      ...payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    save([idea, ...all])
    return idea
  }

  async update(id: string, payload: UpdateIdeaPayload, expectedUpdatedAt?: string): Promise<Idea> {
    const all = load()
    const idx = all.findIndex((i) => i.id === id)
    if (idx === -1) throw new Error(`Idea ${id} not found`)
    const current = all[idx] as Idea
    if (expectedUpdatedAt !== undefined && current.updated_at !== expectedUpdatedAt) {
      throw new ConflictError(`Idea ${id} was changed elsewhere`)
    }
    const updated: Idea = { ...current, ...payload, updated_at: new Date().toISOString() }
    all[idx] = updated
    save(all)
    return updated
  }

  async remove(id: string): Promise<void> {
    const all = load()
    const idx = all.findIndex((i) => i.id === id)
    if (idx === -1) return
    ;(all[idx] as Idea).deleted_at = new Date().toISOString()
    save(all)
  }

  async restore(id: string): Promise<Idea> {
    const all = load()
    const idx = all.findIndex((i) => i.id === id)
    if (idx === -1) throw new Error(`Idea ${id} not found`)
    ;(all[idx] as Idea).deleted_at = null
    ;(all[idx] as Idea).updated_at = new Date().toISOString()
    save(all)
    return all[idx] as Idea
  }

  async permanentlyDelete(id: string): Promise<void> {
    save(load().filter((i) => i.id !== id))
  }

  async bulkUpdateStatus(ids: string[], status: string): Promise<Idea[]> {
    const idSet = new Set(ids)
    const now = new Date().toISOString()
    const updated: Idea[] = []
    const next = load().map((i) => {
      if (!idSet.has(i.id)) return i
      const u = { ...i, status, updated_at: now }
      updated.push(u)
      return u
    })
    save(next)
    return updated
  }

  async bulkRemove(ids: string[]): Promise<void> {
    const idSet = new Set(ids)
    const now = new Date().toISOString()
    save(load().map((i) => (idSet.has(i.id) ? { ...i, deleted_at: now } : i)))
  }
}
