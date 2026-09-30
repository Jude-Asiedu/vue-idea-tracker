import { defineStore } from 'pinia'
import { shallowRef, computed, ref, inject } from 'vue'
import type { Idea, CreateIdeaPayload, UpdateIdeaPayload } from '@/features/ideas/types/idea.types'
import type { IIdeaService } from '@/features/ideas/services/IdeaService'
import { useStagesStore } from '@/features/ideas/store/useStagesStore'

export const useIdeaStore = defineStore('ideas', () => {
  const stagesStore = useStagesStore()

  const ideas        = shallowRef<Idea[]>([])
  const trashedIdeas = shallowRef<Idea[]>([])
  const loading      = ref(false)
  const trashLoading = ref(false)
  const error        = ref<string | null>(null)
  const successMsg   = ref<string | null>(null)
  const selectedIdeaId = ref<string | null>(null)

  const service = inject<IIdeaService>('ideaService')

  // ── Computed ──────────────────────────────────────────────

  const byStatus = computed(() => {
    const result: Record<string, Idea[]> = {}
    for (const stage of stagesStore.orderedStages) result[stage.id] = []
    for (const idea of ideas.value) {
      if (result[idea.status] !== undefined) {
        result[idea.status]!.push(idea)
      }
      // Orphaned ideas (status doesn't match any stage) are excluded from the board
      // but remain accessible via the Table view
    }
    return result
  })

  const allTags = computed(() =>
    [...new Set(ideas.value.flatMap((i) => i.tags))].sort(),
  )

  const kanbanColumns = computed(() =>
    stagesStore.orderedStages.map((s) => ({
      id: s.id,
      label: s.label,
      ideas: byStatus.value[s.id] ?? [],
    })),
  )

  const selectedIdea = computed(() =>
    selectedIdeaId.value ? (ideas.value.find((i) => i.id === selectedIdeaId.value) ?? null) : null,
  )

  // ── Actions ───────────────────────────────────────────────

  async function fetchAll() {
    if (!service) return
    loading.value = true; error.value = null
    try { ideas.value = await service.fetchAll() }
    catch (e) { error.value = e instanceof Error ? e.message : 'Failed to load' }
    finally { loading.value = false }
  }

  async function fetchTrashed() {
    if (!service) return
    trashLoading.value = true
    try { trashedIdeas.value = await service.fetchDeleted() }
    catch (e) { error.value = e instanceof Error ? e.message : 'Failed to load trash' }
    finally { trashLoading.value = false }
  }

  async function createIdea(payload: CreateIdeaPayload) {
    if (!service) return
    const tempId = crypto.randomUUID()
    const optimistic: Idea = {
      id: tempId, user_id: 'pending', deleted_at: null, ...payload,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }
    ideas.value = [optimistic, ...ideas.value]
    try {
      const created = await service.create(payload)
      ideas.value = ideas.value.map((i) => (i.id === tempId ? created : i))
      successMsg.value = 'Idea created'
    } catch (e) {
      ideas.value = ideas.value.filter((i) => i.id !== tempId)
      error.value = e instanceof Error ? e.message : 'Create failed'
    }
  }

  async function updateIdea(id: string, payload: UpdateIdeaPayload) {
    if (!service) return
    const previous = ideas.value.find((i) => i.id === id)
    if (!previous) return
    ideas.value = ideas.value.map((i) =>
      i.id === id ? { ...i, ...payload, updated_at: new Date().toISOString() } : i,
    )
    try {
      const updated = await service.update(id, payload)
      ideas.value = ideas.value.map((i) => (i.id === id ? updated : i))
      successMsg.value = 'Changes saved'
    } catch (e) {
      ideas.value = ideas.value.map((i) => (i.id === id ? previous : i))
      error.value = e instanceof Error ? e.message : 'Update failed'
    }
  }

  async function deleteIdea(id: string) {
    if (!service) return
    const snapshot = [...ideas.value]
    const deleted = ideas.value.find((i) => i.id === id)
    ideas.value = ideas.value.filter((i) => i.id !== id)
    if (deleted) {
      trashedIdeas.value = [
        { ...deleted, deleted_at: new Date().toISOString() },
        ...trashedIdeas.value,
      ]
    }
    try { await service.remove(id) }
    catch (e) {
      ideas.value = snapshot
      trashedIdeas.value = trashedIdeas.value.filter((i) => i.id !== id)
      error.value = e instanceof Error ? e.message : 'Delete failed'
    }
  }

  async function restoreIdea(id: string) {
    if (!service) return
    const snapshot = [...trashedIdeas.value]
    const item = trashedIdeas.value.find((i) => i.id === id)
    const stageExists = item
      ? stagesStore.orderedStages.some((s) => s.id === item.status)
      : true
    trashedIdeas.value = trashedIdeas.value.filter((i) => i.id !== id)
    if (item) ideas.value = [{ ...item, deleted_at: null }, ...ideas.value]
    try {
      const restored = await service.restore(id)
      ideas.value = ideas.value.map((i) => (i.id === id ? restored : i))
      if (!stageExists) {
        await updateIdea(id, { status: 'backlog' })
      }
    } catch (e) {
      trashedIdeas.value = snapshot
      ideas.value = ideas.value.filter((i) => i.id !== id)
      error.value = e instanceof Error ? e.message : 'Restore failed'
    }
  }

  async function permanentlyDeleteIdea(id: string) {
    if (!service) return
    const snapshot = [...trashedIdeas.value]
    trashedIdeas.value = trashedIdeas.value.filter((i) => i.id !== id)
    try { await service.permanentlyDelete(id) }
    catch (e) {
      trashedIdeas.value = snapshot
      error.value = e instanceof Error ? e.message : 'Delete failed'
    }
  }

  async function bulkMoveStatus(fromStatus: string, toStatus: string) {
    const toMove = ideas.value.filter((i) => i.status === fromStatus)
    for (const idea of toMove) {
      await updateIdea(idea.id, { status: toStatus })
    }
  }

  async function bulkDeleteByStatus(status: string) {
    const toDelete = ideas.value.filter((i) => i.status === status)
    for (const idea of toDelete) {
      await deleteIdea(idea.id)
    }
  }

  function selectIdea(id: string | null) { selectedIdeaId.value = id }
  function clearError() { error.value = null }
  function clearSuccess() { successMsg.value = null }

  return {
    ideas, trashedIdeas, loading, trashLoading, error, successMsg,
    selectedIdeaId, selectedIdea, byStatus, allTags, kanbanColumns,
    fetchAll, fetchTrashed, createIdea, updateIdea,
    deleteIdea, restoreIdea, permanentlyDeleteIdea,
    bulkMoveStatus, bulkDeleteByStatus,
    selectIdea, clearError, clearSuccess,
  }
})
