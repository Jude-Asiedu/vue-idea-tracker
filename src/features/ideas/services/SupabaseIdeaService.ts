import type { SupabaseClient } from '@supabase/supabase-js'
import type { IIdeaService } from './IdeaService'
import type { Idea, CreateIdeaPayload, UpdateIdeaPayload } from '@/features/ideas/types/idea.types'

interface IdeaRow {
  id: string; user_id: string; title: string; description: string
  status: string; impact: number; effort: number; tags: string[]
  created_at: string; updated_at: string; deleted_at: string | null
}

function rowToIdea(row: IdeaRow): Idea {
  return { ...row, deleted_at: row.deleted_at ?? null }
}

export class SupabaseIdeaService implements IIdeaService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly client: SupabaseClient<any>) {}

  async fetchAll(): Promise<Idea[]> {
    const { data, error } = await this.client
      .from('ideas').select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return ((data ?? []) as IdeaRow[]).map(rowToIdea)
  }

  async fetchDeleted(): Promise<Idea[]> {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await this.client
      .from('ideas').select('*')
      .not('deleted_at', 'is', null)
      .gte('deleted_at', cutoff)
      .order('deleted_at', { ascending: false })
    if (error) throw new Error(error.message)
    return ((data ?? []) as IdeaRow[]).map(rowToIdea)
  }

  async create(payload: CreateIdeaPayload): Promise<Idea> {
    const { data: { user } } = await this.client.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { data, error } = await this.client
      .from('ideas')
      .insert({ user_id: user.id as string, ...payload, deleted_at: null })
      .select().single()
    if (error) throw new Error(error.message)
    return rowToIdea(data as IdeaRow)
  }

  async update(id: string, payload: UpdateIdeaPayload): Promise<Idea> {
    const patch: Partial<IdeaRow> = {}
    if (payload.title !== undefined)       patch.title = payload.title
    if (payload.description !== undefined) patch.description = payload.description
    if (payload.status !== undefined)      patch.status = payload.status
    if (payload.impact !== undefined)      patch.impact = payload.impact
    if (payload.effort !== undefined)      patch.effort = payload.effort
    if (payload.tags !== undefined)        patch.tags = payload.tags
    const { data, error } = await this.client
      .from('ideas').update(patch).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return rowToIdea(data as IdeaRow)
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client
      .from('ideas').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) throw new Error(error.message)
  }

  async restore(id: string): Promise<Idea> {
    const { data, error } = await this.client
      .from('ideas').update({ deleted_at: null }).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return rowToIdea(data as IdeaRow)
  }

  async permanentlyDelete(id: string): Promise<void> {
    const { error } = await this.client.from('ideas').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }
}
