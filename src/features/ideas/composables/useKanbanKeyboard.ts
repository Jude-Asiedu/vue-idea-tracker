import { onMounted, onUnmounted } from 'vue'
import { useIdeaStore } from '@/features/ideas/store/useIdeaStore'
import { useStagesStore } from '@/features/ideas/store/useStagesStore'

// Enables arrow-key navigation across Kanban cards.
// Cards must have: data-idea-id, data-status attributes and tabindex="0".
export function useKanbanKeyboard(
  announce: (msg: string) => void,
) {
  const store = useIdeaStore()
  const stagesStore = useStagesStore()

  function getFocusedCard(): HTMLElement | null {
    const el = document.activeElement
    if (el instanceof HTMLElement && el.dataset['ideaId']) return el
    return null
  }

  function focusCard(id: string) {
    const el = document.querySelector<HTMLElement>(`[data-idea-id="${id}"]`)
    el?.focus()
  }

  function handleKeydown(e: KeyboardEvent) {
    const card = getFocusedCard()
    if (!card) return

    const ideaId = card.dataset['ideaId']
    const status = card.dataset['status']
    if (!ideaId || !status) return

    const stageIds = stagesStore.orderedStages.map((s) => s.id)
    const column = store.byStatus[status] ?? []
    const idx = column.findIndex((i) => i.id === ideaId)
    const statusIdx = stageIds.indexOf(status)

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        const next = column[idx + 1]
        if (next) focusCard(next.id)
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        const prev = column[idx - 1]
        if (prev) focusCard(prev.id)
        break
      }
      case 'ArrowRight': {
        e.preventDefault()
        const nextStatus = stageIds[statusIdx + 1]
        if (!nextStatus) break
        void store.updateIdea(ideaId, { status: nextStatus })
        const idea = store.ideas.find((i) => i.id === ideaId)
        const nextLabel = stagesStore.stageLabel(nextStatus)
        if (idea) announce(`Moved "${idea.title}" to ${nextLabel}`)
        break
      }
      case 'ArrowLeft': {
        e.preventDefault()
        const prevStatus = stageIds[statusIdx - 1]
        if (!prevStatus) break
        void store.updateIdea(ideaId, { status: prevStatus })
        const idea = store.ideas.find((i) => i.id === ideaId)
        const prevLabel = stagesStore.stageLabel(prevStatus)
        if (idea) announce(`Moved "${idea.title}" to ${prevLabel}`)
        break
      }
      case 'Enter': {
        if (!e.shiftKey) {
          store.selectIdea(ideaId)
        }
        break
      }
    }
  }

  onMounted(() => document.addEventListener('keydown', handleKeydown))
  onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
}
