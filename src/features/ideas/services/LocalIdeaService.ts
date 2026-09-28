import type { IIdeaService } from './IdeaService'
import type { Idea, CreateIdeaPayload, UpdateIdeaPayload } from '@/features/ideas/types/idea.types'
import { MOCK_IDEAS } from './mockData'

const STORAGE_KEY = 'ideadeck_demo_ideas'

function load(): Idea[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      return (JSON.parse(raw) as Idea[]).map((i) => ({
        ...i,
        deleted_at: i.deleted_at ?? null,
      }))
    } catch { /* fall through to seed */ }
  }
  const seeded = structuredClone(MOCK_IDEAS)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
  return seeded
}

function save(ideas: Idea[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas))
}

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000

export class LocalIdeaService implements IIdeaService {
  async fetchAll(): Promise<Idea[]> {
    return load().filter((i) => i.deleted_at === null)
  }

  async fetchDeleted(): Promise<Idea[]> {
    const cutoff = new Date(Date.now() - NINETY_DAYS_MS)
    return load()
      .filter((i) => i.deleted_at !== null)
      .filter((i) => new Date(i.deleted_at as string) > cutoff)
      .sort((a, b) => new Date(b.deleted_at as string).getTime() - new Date(a.deleted_at as string).getTime())
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

  async update(id: string, payload: UpdateIdeaPayload): Promise<Idea> {
    const all = load()
    const idx = all.findIndex((i) => i.id === id)
    if (idx === -1) throw new Error(`Idea ${id} not found`)
    const updated: Idea = { ...(all[idx] as Idea), ...payload, updated_at: new Date().toISOString() }
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
}
