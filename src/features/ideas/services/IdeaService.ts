import type { Idea, CreateIdeaPayload, UpdateIdeaPayload } from '@/features/ideas/types/idea.types'

export interface IIdeaService {
  fetchAll(): Promise<Idea[]>
  fetchDeleted(): Promise<Idea[]>
  create(payload: CreateIdeaPayload): Promise<Idea>
  update(id: string, payload: UpdateIdeaPayload): Promise<Idea>
  remove(id: string): Promise<void>          // soft-delete
  restore(id: string): Promise<Idea>
  permanentlyDelete(id: string): Promise<void>
}
