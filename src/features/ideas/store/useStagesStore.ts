import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Stage, StageColor } from '@/features/ideas/types/stage.types'
import { DEFAULT_STAGES, STAGE_COLOR_PALETTE } from '@/features/ideas/types/stage.types'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { supabase } from '@/lib/supabase'

const STORAGE_KEY = 'ideadeck_stages'

function fromStorage(): Stage[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as Stage[]) : null
  } catch {
    return null
  }
}

export const useStagesStore = defineStore('stages', () => {
  const authStore = useAuthStore()

  const stages = ref<Stage[]>([...DEFAULT_STAGES])

  function reload() {
    const fromMeta = authStore.user?.user_metadata?.['stages'] as Stage[] | undefined
    if (fromMeta && Array.isArray(fromMeta) && fromMeta.length > 0) {
      stages.value = fromMeta
      return
    }
    stages.value = fromStorage() ?? [...DEFAULT_STAGES]
  }

  // When a user signs in, reload stages from their user_metadata
  watch(() => authStore.user, (user) => {
    if (user) reload()
  })

  const orderedStages = computed(() => [...stages.value].sort((a, b) => a.order - b.order))

  const stageMap = computed(() => {
    const m = new Map<string, Stage>()
    for (const s of stages.value) m.set(s.id, s)
    return m
  })

  function colorConfig(colorId: string): StageColor {
    return STAGE_COLOR_PALETTE.find((c) => c.id === colorId) ?? STAGE_COLOR_PALETTE[0]!
  }

  function stageDot(stageId: string): string {
    return colorConfig(stageMap.value.get(stageId)?.color ?? 'slate').dot
  }

  function stageHeader(stageId: string): string {
    return colorConfig(stageMap.value.get(stageId)?.color ?? 'slate').header
  }

  function stageBadge(stageId: string): string {
    return colorConfig(stageMap.value.get(stageId)?.color ?? 'slate').badge
  }

  function stageLabel(stageId: string): string {
    return stageMap.value.get(stageId)?.label ?? stageId.replace(/_/g, ' ')
  }

  async function _persist() {
    const data = stages.value
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    if (supabase && authStore.isAuthenticated) {
      try {
        await supabase.auth.updateUser({ data: { stages: data } })
      } catch {
        // Non-critical — localStorage is the fallback
      }
    }
  }

  async function addStage(label: string, color: string) {
    const newStage: Stage = {
      id: `stage_${Date.now()}`,
      label: label.trim(),
      color,
      order: stages.value.length,
    }
    stages.value = [...stages.value, newStage]
    await _persist()
  }

  async function updateStage(id: string, patch: Partial<Pick<Stage, 'label' | 'color'>>) {
    stages.value = stages.value.map((s) => (s.id === id ? { ...s, ...patch } : s))
    await _persist()
  }

  async function removeStage(id: string) {
    if (id === 'backlog') return
    stages.value = stages.value
      .filter((s) => s.id !== id)
      .map((s, i) => ({ ...s, order: i }))
    await _persist()
  }

  async function reorderStages(ordered: Stage[]) {
    stages.value = ordered.map((s, i) => ({ ...s, order: i }))
    await _persist()
  }

  return {
    stages, orderedStages, stageMap,
    reload, colorConfig, stageDot, stageHeader, stageBadge, stageLabel,
    addStage, updateStage, removeStage, reorderStages,
  }
})
