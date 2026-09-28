<script setup lang="ts">
import { ref, watch } from 'vue'
import draggable from 'vuedraggable'
import {
  DialogRoot, DialogPortal, DialogOverlay, DialogContent,
  DialogTitle, DialogClose,
} from 'reka-ui'
import { X, GripVertical, Trash2, Plus, Check, Pencil } from 'lucide-vue-next'
import { useStagesStore } from '@/features/ideas/store/useStagesStore'
import { useIdeaStore } from '@/features/ideas/store/useIdeaStore'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import { STAGE_COLOR_PALETTE } from '@/features/ideas/types/stage.types'
import type { Stage } from '@/features/ideas/types/stage.types'

interface Props { open: boolean }
const props = defineProps<Props>()
const emit = defineEmits<{ 'update:open': [val: boolean] }>()

const stagesStore = useStagesStore()
const ideaStore = useIdeaStore()

const localStages = ref<Stage[]>([])

watch(() => props.open, (open) => {
  if (open) localStages.value = [...stagesStore.orderedStages]
})

// ── Reorder ────────────────────────────────────────────────
async function onDragEnd() {
  await stagesStore.reorderStages(localStages.value)
}

// ── Rename ─────────────────────────────────────────────────
const editingId = ref<string | null>(null)
const editLabel = ref('')

function startRename(stage: Stage) {
  editingId.value = stage.id
  editLabel.value = stage.label
}

async function saveRename(id: string) {
  const label = editLabel.value.trim()
  if (label) await stagesStore.updateStage(id, { label })
  localStages.value = [...stagesStore.orderedStages]
  editingId.value = null
}

function cancelRename() { editingId.value = null }

// ── Color ──────────────────────────────────────────────────
async function changeColor(id: string, color: string) {
  await stagesStore.updateStage(id, { color })
  localStages.value = [...stagesStore.orderedStages]
}

// ── Delete ─────────────────────────────────────────────────
const stageDeleteOpen    = ref(false)
const pendingDeleteId    = ref('')
const pendingDeleteLabel = ref('')
const pendingDeleteCount = ref(0)

async function deleteStage(id: string, label: string) {
  if (stagesStore.orderedStages.length <= 1) return
  const count = ideaStore.ideas.filter((i) => i.status === id).length
  if (count > 0) {
    pendingDeleteId.value    = id
    pendingDeleteLabel.value = label
    pendingDeleteCount.value = count
    stageDeleteOpen.value    = true
    return
  }
  await stagesStore.removeStage(id)
  localStages.value = [...stagesStore.orderedStages]
}

async function confirmDeleteStage() {
  await stagesStore.removeStage(pendingDeleteId.value)
  localStages.value = [...stagesStore.orderedStages]
}

// ── Add new stage ──────────────────────────────────────────
const newLabel = ref('')
const newColor = ref('teal')
const addError = ref('')
const adding = ref(false)

async function addStage() {
  const label = newLabel.value.trim()
  if (!label) { addError.value = 'Stage name is required'; return }
  if (label.length > 32) { addError.value = 'Max 32 characters'; return }
  adding.value = true
  addError.value = ''
  try {
    await stagesStore.addStage(label, newColor.value)
    localStages.value = [...stagesStore.orderedStages]
    newLabel.value = ''
    newColor.value = 'teal'
  } finally {
    adding.value = false
  }
}
</script>

<template>
  <DialogRoot :open="props.open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-black/20 dark:bg-black/40 backdrop-blur-[2px]" />
      <DialogContent
        class="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
               w-full max-w-lg rounded-2xl outline-none
               bg-white dark:bg-slate-900
               border border-slate-200 dark:border-slate-700
               shadow-2xl shadow-black/10 dark:shadow-black/40
               data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
               data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
      >
        <!-- Header -->
        <div class="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <DialogTitle class="text-base font-semibold text-slate-900 dark:text-slate-100">
              Manage Stages
            </DialogTitle>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Drag to reorder · click the dot to change color · rename with the pencil
            </p>
          </div>
          <DialogClose
            class="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300
                   hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 mt-0.5"
            aria-label="Close"
          >
            <X :size="15" />
          </DialogClose>
        </div>

        <!-- Stage list -->
        <div class="px-6 py-4 max-h-80 overflow-y-auto">
          <draggable
            v-model="localStages"
            item-key="id"
            handle=".drag-handle"
            :animation="150"
            ghost-class="opacity-40"
            tag="div"
            class="space-y-2"
            @end="onDragEnd"
          >
            <template #item="{ element: stage }">
              <div class="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 overflow-hidden">

                <!-- Main row -->
                <div class="flex items-center gap-2.5 px-3 py-2.5">
                  <!-- Drag handle -->
                  <button
                    class="drag-handle text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400
                           cursor-grab active:cursor-grabbing shrink-0 focus:outline-none"
                    tabindex="-1"
                    aria-label="Drag to reorder"
                  >
                    <GripVertical :size="15" />
                  </button>

                  <!-- Colored dot — click to cycle colors; hold for full picker below -->
                  <button
                    :class="['w-3 h-3 rounded-full shrink-0 transition-transform hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500', stagesStore.stageHeader(stage.id)]"
                    :title="`Color: ${stage.color} — click to change`"
                    @click="() => {
                      const idx = STAGE_COLOR_PALETTE.findIndex(c => c.id === stage.color)
                      const next = STAGE_COLOR_PALETTE[(idx + 1) % STAGE_COLOR_PALETTE.length]!
                      changeColor(stage.id, next.id)
                    }"
                  />

                  <!-- Name (view or edit) -->
                  <div class="flex-1 min-w-0">
                    <input
                      v-if="editingId === stage.id"
                      v-model="editLabel"
                      class="w-full h-7 rounded-lg border border-teal-300 dark:border-teal-600
                             bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100
                             px-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      maxlength="32"
                      @keydown.enter="saveRename(stage.id)"
                      @keydown.escape="cancelRename"
                    />
                    <span v-else class="text-sm font-medium text-slate-800 dark:text-slate-200 truncate block">
                      {{ stage.label }}
                    </span>
                  </div>

                  <!-- Actions -->
                  <div class="flex items-center gap-0.5 shrink-0">
                    <template v-if="editingId === stage.id">
                      <button
                        class="w-7 h-7 rounded-lg flex items-center justify-center text-teal-600 dark:text-teal-400
                               hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors"
                        @click="saveRename(stage.id)"
                      >
                        <Check :size="13" />
                      </button>
                      <button
                        class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400
                               hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        @click="cancelRename"
                      >
                        <X :size="13" />
                      </button>
                    </template>
                    <template v-else>
                      <button
                        class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400
                               hover:text-slate-600 dark:hover:text-slate-300
                               hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        :aria-label="`Rename ${stage.label}`"
                        @click="startRename(stage)"
                      >
                        <Pencil :size="12" />
                      </button>
                      <button
                        :disabled="stagesStore.orderedStages.length <= 1"
                        class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400
                               hover:text-red-500 dark:hover:text-red-400
                               hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors
                               disabled:opacity-30 disabled:pointer-events-none"
                        :aria-label="`Delete ${stage.label} stage`"
                        @click="deleteStage(stage.id, stage.label)"
                      >
                        <Trash2 :size="12" />
                      </button>
                    </template>
                  </div>
                </div>

                <!-- Color picker row (always visible in edit mode) -->
                <div v-if="editingId === stage.id" class="flex flex-wrap gap-1.5 px-3 pb-3">
                  <button
                    v-for="c in STAGE_COLOR_PALETTE"
                    :key="c.id"
                    :class="[
                      'w-5 h-5 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-teal-500',
                      c.swatch,
                      stage.color === c.id
                        ? 'ring-2 ring-offset-1 ring-slate-500 dark:ring-offset-slate-800 scale-110'
                        : 'opacity-60 hover:opacity-100 hover:scale-110',
                    ]"
                    :title="c.id"
                    @click="changeColor(stage.id, c.id)"
                  />
                </div>
              </div>
            </template>
          </draggable>
        </div>

        <!-- Add new stage -->
        <div class="px-6 pb-6 pt-3 border-t border-slate-100 dark:border-slate-800">
          <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            Add stage
          </p>
          <div class="flex items-start gap-2">
            <div class="flex-1 space-y-2">
              <input
                v-model="newLabel"
                type="text"
                placeholder="Stage name"
                maxlength="32"
                :disabled="adding"
                class="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700
                       bg-white dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-slate-100
                       placeholder:text-slate-400 dark:placeholder:text-slate-600
                       focus:outline-none focus:ring-2 focus:ring-teal-500
                       disabled:opacity-50 transition-all"
                @keydown.enter="addStage"
              />
              <!-- Color picker for new stage -->
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="c in STAGE_COLOR_PALETTE"
                  :key="c.id"
                  :class="[
                    'w-5 h-5 rounded-full transition-all focus:outline-none',
                    c.swatch,
                    newColor === c.id
                      ? 'ring-2 ring-offset-1 ring-slate-400 dark:ring-offset-slate-900 scale-110'
                      : 'opacity-60 hover:opacity-100 hover:scale-110',
                  ]"
                  :title="c.id"
                  @click="newColor = c.id"
                />
              </div>
              <p v-if="addError" class="text-xs text-red-500">{{ addError }}</p>
            </div>
            <button
              :disabled="adding || !newLabel.trim()"
              class="h-9 px-4 rounded-xl text-sm font-medium text-white shrink-0
                     bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:pointer-events-none
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500
                     transition-colors flex items-center gap-1.5"
              @click="addStage"
            >
              <Plus :size="14" />
              Add
            </button>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>

  <ConfirmDialog
    v-model:open="stageDeleteOpen"
    :title="`Delete &quot;${pendingDeleteLabel}&quot;?`"
    :message="`${pendingDeleteCount} idea${pendingDeleteCount === 1 ? '' : 's'} in this stage won\'t appear on the board until reassigned.`"
    confirm-label="Delete stage"
    :danger="true"
    @confirm="confirmDeleteStage"
  />
</template>
