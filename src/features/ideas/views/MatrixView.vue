<script setup lang="ts">
import { onMounted } from 'vue'
import { useImpactMatrix } from '@/features/ideas/composables/useImpactMatrix'
import IdeaDetailDrawer from '@/features/ideas/components/IdeaDetailDrawer.vue'
import MatrixSkeleton from '@/features/ideas/components/MatrixSkeleton.vue'
import { useIdeaStore } from '@/features/ideas/store/useIdeaStore'
import { useIdeaCreator } from '@/features/ideas/composables/useIdeaCreator'
import { cn } from '@/lib/utils'
import { Plus, Lightbulb } from 'lucide-vue-next'

const store = useIdeaStore()
const { dotPositions } = useImpactMatrix()
const { openCreator } = useIdeaCreator()

onMounted(() => store.fetchAll())

const QUADRANT_LABELS = [
  { label: 'Quick Wins',      sublabel: 'High impact, low effort',   class: 'border-r border-b border-slate-200 dark:border-slate-700' },
  { label: 'Major Projects',  sublabel: 'High impact, high effort',  class: 'border-b border-slate-200 dark:border-slate-700' },
  { label: 'Fill-Ins',        sublabel: 'Low impact, low effort',    class: 'border-r border-slate-200 dark:border-slate-700' },
  { label: 'Thankless Tasks', sublabel: 'Low impact, high effort',   class: '' },
]
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="mb-6">
      <h1 class="text-xl font-semibold text-slate-900 dark:text-slate-100">Priority Matrix</h1>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Impact vs. Effort — where should you focus?</p>
    </div>

    <MatrixSkeleton v-if="store.loading" role="status" aria-label="Loading matrix" />

    <!-- Empty state -->
    <div
      v-else-if="store.ideas.length === 0"
      class="flex-1 flex flex-col items-center justify-center text-center py-16"
    >
      <div class="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <Lightbulb :size="24" class="text-slate-400 dark:text-slate-500" />
      </div>
      <h2 class="text-base font-semibold text-slate-700 dark:text-slate-300">Nothing to plot yet</h2>
      <p class="text-sm text-slate-400 dark:text-slate-500 mt-1 mb-5">Add ideas with impact and effort scores to see them here.</p>
      <button
        class="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium text-white
               bg-teal-600 hover:bg-teal-700 transition-colors
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
        @click="openCreator('backlog')"
      >
        <Plus :size="14" />
        Create your first idea
      </button>
    </div>

    <div v-else class="flex gap-6 flex-1 min-h-0">
      <!-- Matrix -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Y-axis label -->
        <div class="flex items-stretch gap-3 flex-1">
          <div class="flex items-center">
            <span
              class="text-xs font-medium text-slate-500 tracking-wide -rotate-90 whitespace-nowrap select-none"
              aria-hidden="true"
            >
              ← Low Impact · High Impact →
            </span>
          </div>

          <div class="flex-1 flex flex-col">
            <!-- Matrix grid -->
            <div
              class="relative flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 grid grid-cols-2 grid-rows-2 overflow-hidden"
              role="region"
              aria-label="2x2 priority matrix"
            >
              <!-- Quadrant backgrounds + labels -->
              <div
                v-for="(q, i) in QUADRANT_LABELS"
                :key="i"
                :class="cn('relative p-3', q.class)"
              >
                <p class="text-xs font-semibold text-slate-600 dark:text-slate-400">{{ q.label }}</p>
                <p class="text-[10px] text-slate-400 dark:text-slate-600">{{ q.sublabel }}</p>
              </div>

              <!-- Idea dots positioned absolutely over the grid -->
              <button
                v-for="{ idea, x, y } in dotPositions"
                :key="idea.id"
                :style="{ left: `${x}%`, top: `${y}%` }"
                :aria-label="`Open idea: ${idea.title} (impact ${idea.impact}, effort ${idea.effort})`"
                class="absolute -translate-x-1/2 -translate-y-1/2 group z-10"
                @click="store.selectIdea(idea.id)"
              >
                <span
                  class="block w-3.5 h-3.5 rounded-full bg-slate-600 dark:bg-slate-400 border-2 border-white dark:border-slate-900 shadow
                         group-hover:bg-blue-600 dark:group-hover:bg-blue-400
                         group-focus-visible:ring-2 group-focus-visible:ring-blue-500
                         transition-colors duration-150"
                />
                <!-- Tooltip on hover -->
                <span
                  class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1
                         bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg whitespace-nowrap
                         opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"
                >
                  {{ idea.title }}
                </span>
              </button>
            </div>

            <!-- X-axis label -->
            <p class="text-center text-xs text-slate-500 mt-2 select-none" aria-hidden="true">
              ← Low Effort · High Effort →
            </p>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <aside class="w-52 shrink-0 space-y-3" aria-label="Matrix legend">
        <p class="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider">Quadrants</p>
        <div
          v-for="q in QUADRANT_LABELS"
          :key="q.label"
          class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3"
        >
          <p class="text-sm font-semibold text-slate-800 dark:text-slate-200">{{ q.label }}</p>
          <p class="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{{ q.sublabel }}</p>
        </div>
      </aside>
    </div>

    <IdeaDetailDrawer />
  </div>
</template>
