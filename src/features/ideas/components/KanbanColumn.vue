<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import draggable from 'vuedraggable'
import IdeaCard from './IdeaCard.vue'
import type { Idea } from '@/features/ideas/types/idea.types'
import { useIdeaStore } from '@/features/ideas/store/useIdeaStore'
import { useStagesStore } from '@/features/ideas/store/useStagesStore'

interface Props {
  columnId: string
  label: string
  ideas: Idea[]
}

const props = defineProps<Props>()
const emit = defineEmits<{ announce: [msg: string] }>()
const store = useIdeaStore()
const stagesStore = useStagesStore()

const headerColor = computed(() => stagesStore.stageHeader(props.columnId))

// vuedraggable v4 must own a mutable list — it can't work with a readonly prop.
// We keep a local copy and sync it whenever the store's derived array changes.
const localIdeas = ref<Idea[]>([...props.ideas])

watch(
  () => props.ideas,
  (incoming) => { localIdeas.value = [...incoming] },
)

function onChange(event: { added?: { element: Idea; newIndex: number } }) {
  if (!event.added) return
  const idea = event.added.element
  if (!idea) return
  void store.updateIdea(idea.id, { status: props.columnId })
  emit('announce', `Moved "${idea.title}" to ${props.label}`)
}

function openCard(idea: Idea) {
  store.selectIdea(idea.id)
}
</script>

<template>
  <section
    class="flex flex-col w-72 shrink-0 rounded-2xl
           bg-slate-100/60 dark:bg-slate-900/60
           border border-slate-200 dark:border-slate-800"
    :aria-label="`${label} column, ${localIdeas.length} idea${localIdeas.length === 1 ? '' : 's'}`"
  >
    <!-- Column header -->
    <div class="flex items-center gap-2 px-4 py-3">
      <span :class="['w-2 h-2 rounded-full shrink-0', headerColor]" aria-hidden="true" />
      <h2 class="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex-1">
        {{ label }}
      </h2>
      <span
        class="text-xs font-medium text-slate-500 dark:text-slate-500
               bg-slate-200 dark:bg-slate-800 rounded-full px-2 py-0.5"
        :aria-label="`${localIdeas.length} ideas`"
      >
        {{ localIdeas.length }}
      </span>
    </div>

    <!-- Draggable list — v-model gives vuedraggable full ownership of the list -->
    <draggable
      v-model="localIdeas"
      :group="{ name: 'ideas' }"
      item-key="id"
      :animation="150"
      ghost-class="opacity-40"
      chosen-class="shadow-lg"
      drag-class="rotate-1"
      tag="div"
      class="flex flex-col gap-2 p-2 min-h-30 flex-1"
      @change="onChange"
    >
      <template #item="{ element }">
        <IdeaCard :idea="element" @click="openCard" />
      </template>
    </draggable>
  </section>
</template>
