<script setup lang="ts">
import { computed } from 'vue'
import type { Idea } from '@/features/ideas/types/idea.types'
import { useStagesStore } from '@/features/ideas/store/useStagesStore'
import { Zap, Dumbbell } from 'lucide-vue-next'

interface Props {
  idea: Idea
}

const props = defineProps<Props>()
const emit = defineEmits<{ click: [idea: Idea] }>()
const stagesStore = useStagesStore()

const dotClass = computed(() => stagesStore.stageDot(props.idea.status))
const stageTextClass = computed(() =>
  stagesStore.stageBadge(props.idea.status)
    .split(' ')
    .filter((c) => c.includes('text-'))
    .join(' '),
)
const stageLbl = computed(() => stagesStore.stageLabel(props.idea.status))

function handleClick() {
  emit('click', props.idea)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    emit('click', props.idea)
  }
}
</script>

<template>
  <article
    :data-idea-id="idea.id"
    :data-status="idea.status"
    tabindex="0"
    :aria-label="`Idea: ${idea.title}. Impact ${idea.impact}, Effort ${idea.effort}. Press Enter to open.`"
    class="group relative rounded-xl border border-slate-200 dark:border-slate-800
           bg-white dark:bg-slate-900 p-3.5 cursor-pointer select-none
           transition-all duration-150
           hover:border-slate-300 dark:hover:border-slate-700
           hover:shadow-sm
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1
           dark:focus-visible:ring-offset-slate-900"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <!-- Title -->
    <h3 class="text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug mb-2.5 line-clamp-2 pr-1">
      {{ idea.title }}
    </h3>

    <!-- Status + metrics row -->
    <div class="flex items-center gap-2 mb-2.5">
      <span class="flex items-center gap-1.5">
        <span :class="['w-1.5 h-1.5 rounded-full shrink-0', dotClass]" aria-hidden="true" />
        <span :class="['text-[11px] font-medium', stageTextClass]">
          {{ stageLbl }}
        </span>
      </span>
      <span class="text-slate-300 dark:text-slate-700 text-xs">·</span>
      <span class="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500" :aria-label="`Impact ${idea.impact} out of 5`">
        <Zap :size="11" class="text-amber-400" aria-hidden="true" />
        {{ idea.impact }}
      </span>
      <span class="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500" :aria-label="`Effort ${idea.effort} out of 5`">
        <Dumbbell :size="11" class="text-blue-400" aria-hidden="true" />
        {{ idea.effort }}
      </span>
    </div>

    <!-- Tags -->
    <div v-if="idea.tags.length" class="flex flex-wrap gap-1" aria-label="Tags">
      <span
        v-for="tag in idea.tags.slice(0, 3)"
        :key="tag"
        class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium
               bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
      >
        {{ tag }}
      </span>
      <span
        v-if="idea.tags.length > 3"
        class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium
               bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
      >
        +{{ idea.tags.length - 3 }}
      </span>
    </div>
  </article>
</template>
