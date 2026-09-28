import { computed } from 'vue'
import { useIdeaStore } from '@/features/ideas/store/useIdeaStore'
import type { Idea } from '@/features/ideas/types/idea.types'

export interface MatrixQuadrants {
  quickWins: Idea[]    // High impact, low effort  (Q1)
  majorProjects: Idea[] // High impact, high effort (Q2)
  fillIns: Idea[]      // Low impact, low effort   (Q3)
  thanklessTasks: Idea[] // Low impact, high effort  (Q4)
}

export interface DotPosition {
  idea: Idea
  /** 0–100% from left: effort 1 → 0%, effort 5 → 100% */
  x: number
  /** 0–100% from top: impact 5 → 0%, impact 1 → 100% (inverted) */
  y: number
}

export function useImpactMatrix() {
  const store = useIdeaStore()

  const quadrants = computed<MatrixQuadrants>(() => ({
    quickWins: store.ideas.filter((i) => i.impact >= 4 && i.effort <= 2),
    majorProjects: store.ideas.filter((i) => i.impact >= 4 && i.effort >= 3),
    fillIns: store.ideas.filter((i) => i.impact <= 3 && i.effort <= 2),
    thanklessTasks: store.ideas.filter((i) => i.impact <= 3 && i.effort >= 3),
  }))

  // Dot positions as percentages for CSS `left` / `top` positioning
  const dotPositions = computed<DotPosition[]>(() =>
    store.ideas.map((idea) => ({
      idea,
      x: ((idea.effort - 1) / 4) * 100,
      // Y-axis inverted: high impact at the top
      y: ((5 - idea.impact) / 4) * 100,
    })),
  )

  return { quadrants, dotPositions }
}
