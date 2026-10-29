import type { IIdeaService } from './IdeaService'
import type { Idea, CreateIdeaPayload, UpdateIdeaPayload } from '@/features/ideas/types/idea.types'

// Routes each call to the cloud service only when Supabase is configured AND
// the current session is authenticated — otherwise falls back to the local
// (guest/demo) service. This lets /demo work without an account even on a
// Supabase-backed deploy, while authenticated routes sync to the cloud.
export class DynamicIdeaService implements IIdeaService {
  constructor(
    private readonly local: IIdeaService,
    private readonly cloud: IIdeaService | null,
    private readonly isAuthenticated: () => boolean,
  ) {}

  private get active(): IIdeaService {
    return this.cloud && this.isAuthenticated() ? this.cloud : this.local
  }

  fetchAll(): Promise<Idea[]> { return this.active.fetchAll() }
  fetchDeleted(): Promise<Idea[]> { return this.active.fetchDeleted() }
  create(payload: CreateIdeaPayload): Promise<Idea> { return this.active.create(payload) }
  update(id: string, payload: UpdateIdeaPayload, expectedUpdatedAt?: string): Promise<Idea> {
    return this.active.update(id, payload, expectedUpdatedAt)
  }
  remove(id: string): Promise<void> { return this.active.remove(id) }
  restore(id: string): Promise<Idea> { return this.active.restore(id) }
  permanentlyDelete(id: string): Promise<void> { return this.active.permanentlyDelete(id) }
  bulkUpdateStatus(ids: string[], status: string): Promise<Idea[]> { return this.active.bulkUpdateStatus(ids, status) }
  bulkRemove(ids: string[]): Promise<void> { return this.active.bulkRemove(ids) }
}
