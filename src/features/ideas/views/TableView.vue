<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useIdeaStore } from '@/features/ideas/store/useIdeaStore'
import IdeaDetailDrawer from '@/features/ideas/components/IdeaDetailDrawer.vue'
import TableSkeleton from '@/features/ideas/components/TableSkeleton.vue'
import Input from '@/components/ui/input.vue'
import Badge from '@/components/ui/badge.vue'
import Button from '@/components/ui/button.vue'
import type { Idea } from '@/features/ideas/types/idea.types'
import { useStagesStore } from '@/features/ideas/store/useStagesStore'
import { ChevronUp, ChevronDown, ChevronsUpDown, Plus } from 'lucide-vue-next'
import { useIdeaCreator } from '@/features/ideas/composables/useIdeaCreator'

const store = useIdeaStore()
const stagesStore = useStagesStore()
const { openCreator } = useIdeaCreator()

// ---- Search ----
const rawSearch = ref('')
const searchQuery = ref('')

const updateSearch = useDebounceFn((val: string) => {
  searchQuery.value = val
}, 300)

watch(rawSearch, updateSearch)

// ---- Tag filter ----
const selectedTags = ref<string[]>([])

function toggleTag(tag: string) {
  const idx = selectedTags.value.indexOf(tag)
  if (idx === -1) selectedTags.value = [...selectedTags.value, tag]
  else selectedTags.value = selectedTags.value.filter((t) => t !== tag)
}

// ---- Sorting ----
type SortKey = 'title' | 'status' | 'impact' | 'effort' | 'created_at'
const sortKey = ref<SortKey>('created_at')
const sortDir = ref<'asc' | 'desc'>('desc')

function setSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

function sortIcon(key: SortKey) {
  if (sortKey.value !== key) return ChevronsUpDown
  return sortDir.value === 'asc' ? ChevronUp : ChevronDown
}

// ---- Filtered + sorted result ----
const rows = computed<Idea[]>(() => {
  const q = searchQuery.value.toLowerCase()
  const tags = selectedTags.value

  return [...store.ideas]
    .filter((idea) => {
      const matchesSearch =
        !q ||
        idea.title.toLowerCase().includes(q) ||
        idea.description.toLowerCase().includes(q) ||
        idea.tags.some((t) => t.toLowerCase().includes(q))

      const matchesTags =
        tags.length === 0 || tags.every((t) => idea.tags.includes(t))

      return matchesSearch && matchesTags
    })
    .sort((a, b) => {
      const av = a[sortKey.value] as string | number
      const bv = b[sortKey.value] as string | number
      const cmp =
        typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number)
      return sortDir.value === 'asc' ? cmp : -cmp
    })
})

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status' },
  { key: 'impact', label: 'Impact' },
  { key: 'effort', label: 'Effort' },
  { key: 'created_at', label: 'Created' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

onMounted(() => store.fetchAll())
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-semibold text-slate-900 dark:text-slate-100">All Ideas</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{{ rows.length }} of {{ store.ideas.length }} ideas</p>
      </div>
      <Button @click="openCreator('backlog')">
        <Plus :size="16" />
        New Idea
      </Button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-4">
      <Input
        v-model="rawSearch"
        placeholder="Search ideas..."
        class="w-64"
        aria-label="Search ideas"
      />
      <div v-if="store.allTags.length" class="flex flex-wrap gap-1.5 items-center" role="group" aria-label="Filter by tag">
        <button
          v-for="tag in store.allTags"
          :key="tag"
          :class="[
            'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
            selectedTags.includes(tag)
              ? 'bg-blue-600 dark:bg-blue-500 text-white border-transparent'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800',
          ]"
          :aria-pressed="selectedTags.includes(tag)"
          @click="toggleTag(tag)"
        >
          {{ tag }}
        </button>
      </div>
    </div>

    <TableSkeleton v-if="store.loading" role="status" aria-label="Loading ideas" />

    <div v-else class="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <table class="w-full text-sm" role="grid" aria-label="Ideas table">
        <thead class="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th
              v-for="col in COLUMNS"
              :key="col.key"
              scope="col"
              class="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400"
            >
              <button
                class="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                :aria-label="`Sort by ${col.label}`"
                :aria-sort="sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'"
                @click="setSort(col.key)"
              >
                {{ col.label }}
                <component :is="sortIcon(col.key)" :size="12" aria-hidden="true" />
              </button>
            </th>
            <th scope="col" class="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Tags</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-slate-900">
          <tr
            v-for="idea in rows"
            :key="idea.id"
            class="border-b border-slate-100 dark:border-slate-800 last:border-0
                   hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
            tabindex="0"
            :aria-label="`Open idea: ${idea.title}`"
            @click="store.selectIdea(idea.id)"
            @keydown.enter="store.selectIdea(idea.id)"
          >
            <td class="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 max-w-xs">
              <span class="line-clamp-1">{{ idea.title }}</span>
            </td>
            <td class="px-4 py-3">
              <span
                :class="['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', stagesStore.stageBadge(idea.status)]"
              >
                {{ stagesStore.stageLabel(idea.status) }}
              </span>
            </td>
            <td class="px-4 py-3 text-slate-700 dark:text-slate-300">{{ idea.impact }}/5</td>
            <td class="px-4 py-3 text-slate-700 dark:text-slate-300">{{ idea.effort }}/5</td>
            <td class="px-4 py-3 text-slate-500 dark:text-slate-500 text-xs">{{ formatDate(idea.created_at) }}</td>
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-1">
                <Badge
                  v-for="tag in idea.tags.slice(0, 2)"
                  :key="tag"
                  variant="secondary"
                  class="text-[10px]"
                >
                  {{ tag }}
                </Badge>
                <Badge v-if="idea.tags.length > 2" variant="secondary" class="text-[10px]">
                  +{{ idea.tags.length - 2 }}
                </Badge>
              </div>
            </td>
          </tr>

          <tr v-if="rows.length === 0">
            <td colspan="6" class="px-4 py-12 text-center text-slate-400 dark:text-slate-600 text-sm">
              No ideas match your search.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <IdeaDetailDrawer />
  </div>
</template>
