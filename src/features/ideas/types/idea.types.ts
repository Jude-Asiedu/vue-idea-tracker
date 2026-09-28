export interface Idea {
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
  deleted_at: string | null
}

export type CreateIdeaPayload = Pick<
  Idea,
  'title' | 'description' | 'status' | 'impact' | 'effort' | 'tags'
>

export type UpdateIdeaPayload = Partial<CreateIdeaPayload>

export interface KanbanColumn {
  id: string
  label: string
  ideas: Idea[]
}
