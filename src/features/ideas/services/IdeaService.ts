import type { Idea, CreateIdeaPayload, UpdateIdeaPayload } from '@/features/ideas/types/idea.types'

export interface IIdeaService {
  fetchAll(): Promise<Idea[]>
  fetchDeleted(): Promise<Idea[]>
  create(payload: CreateIdeaPayload): Promise<Idea>
  // expectedUpdatedAt, when passed, makes the update fail with ConflictError
  // if the row has changed since the caller last read it.
  update(id: string, payload: UpdateIdeaPayload, expectedUpdatedAt?: string): Promise<Idea>
  remove(id: string): Promise<void>          // soft-delete
  restore(id: string): Promise<Idea>
  permanentlyDelete(id: string): Promise<void>
  bulkUpdateStatus(ids: string[], status: string): Promise<Idea[]>
  bulkRemove(ids: string[]): Promise<void>    // soft-delete
}
