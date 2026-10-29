import type { SupabaseClient } from '@supabase/supabase-js'
import type { IIdeaService } from './IdeaService'
import type { Idea, CreateIdeaPayload, UpdateIdeaPayload } from '@/features/ideas/types/idea.types'
import { ConflictError } from './errors'
import { NINETY_DAYS_MS, normalizeDeletedAt } from './ideaServiceUtils'
import { withRetry } from '@/lib/withRetry'

interface IdeaRow {
  id: string; user_id: string; title: string; description: string
  status: string; impact: number; effort: number; tags: string[]
  created_at: string; updated_at: string; deleted_at: string | null
}

function rowToIdea(row: IdeaRow): Idea {
  return { ...row, deleted_at: normalizeDeletedAt(row.deleted_at) }
}

export class SupabaseIdeaService implements IIdeaService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly client: SupabaseClient<any>) {}

  private async requireUserId(): Promise<string> {
    const { data: { user } } = await this.client.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    return user.id as string
  }

  async fetchAll(): Promise<Idea[]> {
    return withRetry(async () => {
      const { data, error } = await this.client
        .from('ideas').select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return ((data ?? []) as IdeaRow[]).map(rowToIdea)
    })
  }

  async fetchDeleted(): Promise<Idea[]> {
    return withRetry(async () => {
      const cutoff = new Date(Date.now() - NINETY_DAYS_MS).toISOString()
      const { data, error } = await this.client
        .from('ideas').select('*')
        .not('deleted_at', 'is', null)
        .gte('deleted_at', cutoff)
        .order('deleted_at', { ascending: false })
      if (error) throw new Error(error.message)
      return ((data ?? []) as IdeaRow[]).map(rowToIdea)
    })
  }

  async create(payload: CreateIdeaPayload): Promise<Idea> {
    const userId = await this.requireUserId()
    const { data, error } = await this.client
      .from('ideas')
      .insert({ user_id: userId, ...payload, deleted_at: null })
      .select().single()
    if (error) throw new Error(error.message)
    return rowToIdea(data as IdeaRow)
  }

  async update(id: string, payload: UpdateIdeaPayload, expectedUpdatedAt?: string): Promise<Idea> {
    const userId = await this.requireUserId()
    const patch: Partial<IdeaRow> = { updated_at: new Date().toISOString() }
    if (payload.title !== undefined)       patch.title = payload.title
    if (payload.description !== undefined) patch.description = payload.description
    if (payload.status !== undefined)      patch.status = payload.status
    if (payload.impact !== undefined)      patch.impact = payload.impact
    if (payload.effort !== undefined)      patch.effort = payload.effort
    if (payload.tags !== undefined)        patch.tags = payload.tags

    let query = this.client
      .from('ideas').update(patch)
      .eq('id', id).eq('user_id', userId)
    if (expectedUpdatedAt !== undefined) query = query.eq('updated_at', expectedUpdatedAt)

    const { data, error } = await query.select().single()
    if (error) {
      if (expectedUpdatedAt !== undefined && error.code === 'PGRST116') {
        throw new ConflictError(`Idea ${id} was changed elsewhere`)
      }
      throw new Error(error.message)
    }
    return rowToIdea(data as IdeaRow)
  }

  async remove(id: string): Promise<void> {
    const userId = await this.requireUserId()
    const { error } = await this.client
      .from('ideas').update({ deleted_at: new Date().toISOString() })
      .eq('id', id).eq('user_id', userId)
    if (error) throw new Error(error.message)
  }

  async restore(id: string): Promise<Idea> {
    const userId = await this.requireUserId()
    const { data, error } = await this.client
      .from('ideas').update({ deleted_at: null })
      .eq('id', id).eq('user_id', userId)
      .select().single()
    if (error) throw new Error(error.message)
    return rowToIdea(data as IdeaRow)
  }

  async permanentlyDelete(id: string): Promise<void> {
    const userId = await this.requireUserId()
    const { error } = await this.client
      .from('ideas').delete()
      .eq('id', id).eq('user_id', userId)
    if (error) throw new Error(error.message)
  }

  async bulkUpdateStatus(ids: string[], status: string): Promise<Idea[]> {
    if (ids.length === 0) return []
    const userId = await this.requireUserId()
    const { data, error } = await this.client
      .from('ideas')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', ids).eq('user_id', userId)
      .select()
    if (error) throw new Error(error.message)
    return ((data ?? []) as IdeaRow[]).map(rowToIdea)
  }

  async bulkRemove(ids: string[]): Promise<void> {
    if (ids.length === 0) return
    const userId = await this.requireUserId()
    const { error } = await this.client
      .from('ideas')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', ids).eq('user_id', userId)
    if (error) throw new Error(error.message)
  }
}
