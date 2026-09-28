<script setup lang="ts">
import { onMounted } from 'vue'
import { useIdeaStore } from '@/features/ideas/store/useIdeaStore'
import Skeleton from '@/components/ui/skeleton.vue'
import Button from '@/components/ui/button.vue'
import { RotateCcw, Trash2, Info } from 'lucide-vue-next'

const store = useIdeaStore()
onMounted(() => store.fetchTrashed())

function daysLeft(deletedAt: string): number {
  const diff = 90 - Math.floor((Date.now() - new Date(deletedAt).getTime()) / 86_400_000)
  return Math.max(0, diff)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="flex flex-col h-full max-w-3xl mx-auto w-full">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-xl font-semibold text-slate-900 dark:text-slate-100">Trash</h1>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
        Ideas are permanently deleted after 90 days.
      </p>
    </div>

    <!-- Info banner -->
    <div class="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-950/30 px-4 py-3 mb-6">
      <Info :size="15" class="text-blue-500 mt-0.5 shrink-0" />
      <p class="text-sm text-blue-700 dark:text-blue-300">
        Deleted ideas are kept for up to <strong>90 days</strong>. After that they are permanently removed and cannot be recovered.
      </p>
    </div>

    <!-- Skeleton -->
    <div v-if="store.trashLoading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-4">
        <div class="flex-1 space-y-2">
          <Skeleton class="h-4 w-48 dark:bg-slate-700" />
          <Skeleton class="h-3 w-32 dark:bg-slate-700" />
        </div>
        <Skeleton class="h-8 w-20 rounded-lg dark:bg-slate-700" />
        <Skeleton class="h-8 w-8 rounded-lg dark:bg-slate-700" />
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="store.trashedIdeas.length === 0"
      class="flex flex-col items-center justify-center py-24 text-center"
    >
      <div class="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <Trash2 :size="24" class="text-slate-400" />
      </div>
      <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Trash is empty</p>
      <p class="text-xs text-slate-400 dark:text-slate-600 mt-1">Deleted ideas will appear here</p>
    </div>

    <!-- Trashed ideas list -->
    <ul v-else class="space-y-2" role="list">
      <li
        v-for="idea in store.trashedIdeas"
        :key="idea.id"
        class="group flex items-center gap-4 rounded-xl border border-slate-100 dark:border-slate-800
               bg-white dark:bg-slate-900 px-4 py-3.5
               hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
      >
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{{ idea.title }}</p>
          <div class="flex items-center gap-3 mt-0.5">
            <span class="text-xs text-slate-400 dark:text-slate-500">
              Deleted {{ formatDate(idea.deleted_at as string) }}
            </span>
            <span
              :class="[
                'text-xs font-medium',
                daysLeft(idea.deleted_at as string) <= 7
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-slate-400 dark:text-slate-500',
              ]"
            >
              {{ daysLeft(idea.deleted_at as string) }}d left
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            :aria-label="`Restore idea: ${idea.title}`"
            @click="store.restoreIdea(idea.id)"
          >
            <RotateCcw :size="13" />
            Restore
          </Button>
          <Button
            size="icon"
            variant="ghost"
            class="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
            :aria-label="`Permanently delete: ${idea.title}`"
            @click="store.permanentlyDeleteIdea(idea.id)"
          >
            <Trash2 :size="14" />
          </Button>
        </div>
      </li>
    </ul>
  </div>
</template>
