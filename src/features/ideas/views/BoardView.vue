<script setup lang="ts">
import { onMounted, ref } from 'vue'
import KanbanColumn from '@/features/ideas/components/KanbanColumn.vue'
import KanbanSkeleton from '@/features/ideas/components/KanbanSkeleton.vue'
import IdeaDetailDrawer from '@/features/ideas/components/IdeaDetailDrawer.vue'
import ManageStages from '@/features/ideas/components/ManageStages.vue'
import Button from '@/components/ui/button.vue'
import { useIdeaStore } from '@/features/ideas/store/useIdeaStore'
import { useKanbanKeyboard } from '@/features/ideas/composables/useKanbanKeyboard'
import { Plus, Settings2, Lightbulb } from 'lucide-vue-next'
import { useIdeaCreator } from '@/features/ideas/composables/useIdeaCreator'

const store = useIdeaStore()
const announcement = ref('')
const stagesOpen = ref(false)
const { openCreator } = useIdeaCreator()

useKanbanKeyboard((msg) => {
  announcement.value = msg
  setTimeout(() => { announcement.value = '' }, 3000)
})

onMounted(() => store.fetchAll())
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-semibold text-slate-900 dark:text-slate-100">Kanban Board</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          {{ store.loading ? 'Loading…' : `${store.ideas.length} idea${store.ideas.length === 1 ? '' : 's'} total` }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" aria-label="Manage stages" @click="stagesOpen = true">
          <Settings2 :size="14" />
          Stages
        </Button>
        <Button @click="openCreator('backlog')" aria-label="Create new idea">
          <Plus :size="16" />
          New Idea
        </Button>
      </div>
    </div>

    <KanbanSkeleton v-if="store.loading" role="status" aria-label="Loading board" />

    <!-- Empty state -->
    <div
      v-else-if="store.ideas.length === 0"
      class="flex-1 flex flex-col items-center justify-center text-center py-16"
    >
      <div class="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <Lightbulb :size="24" class="text-slate-400 dark:text-slate-500" />
      </div>
      <h2 class="text-base font-semibold text-slate-700 dark:text-slate-300">No ideas yet</h2>
      <p class="text-sm text-slate-400 dark:text-slate-500 mt-1 mb-5">Capture your first idea and start building.</p>
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

    <div
      v-else
      class="flex gap-4 overflow-x-auto pb-4 flex-1"
      role="region"
      aria-label="Kanban board"
    >
      <KanbanColumn
        v-for="col in store.kanbanColumns"
        :key="col.id"
        :column-id="col.id"
        :label="col.label"
        :ideas="col.ideas"
        @announce="announcement = $event"
      />
    </div>

    <div aria-live="polite" aria-atomic="true" class="sr-only">{{ announcement }}</div>

    <IdeaDetailDrawer />
    <ManageStages v-model:open="stagesOpen" />
  </div>
</template>
