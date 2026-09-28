<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { marked } from 'marked'
import Sheet from '@/components/ui/sheet.vue'
import Button from '@/components/ui/button.vue'
import Textarea from '@/components/ui/textarea.vue'
import Select from '@/components/ui/select.vue'
import Label from '@/components/ui/label.vue'
import Badge from '@/components/ui/badge.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import { sanitize } from '@/lib/purify'
import { useIdeaStore } from '@/features/ideas/store/useIdeaStore'
import { useStagesStore } from '@/features/ideas/store/useStagesStore'
import { Pencil, Trash2, Check, X, AlertTriangle } from 'lucide-vue-next'

const store = useIdeaStore()
const stagesStore = useStagesStore()

const isEditing      = ref(false)
const showDirtyBanner = ref(false)
const editTitle       = ref('')
const editDescription = ref('')
const editStatus      = ref('')
const editImpact      = ref(3)
const editEffort      = ref(3)
const editTagsInput   = ref('')

type Snapshot = { title: string; description: string; status: string; impact: number; effort: number; tagsInput: string }
const editSnapshot = ref<Snapshot | null>(null)

const isDirty = computed(() => {
  if (!editSnapshot.value || !isEditing.value) return false
  const s = editSnapshot.value
  return (
    editTitle.value       !== s.title       ||
    editDescription.value !== s.description ||
    editStatus.value      !== s.status      ||
    Number(editImpact.value) !== s.impact   ||
    Number(editEffort.value) !== s.effort   ||
    editTagsInput.value   !== s.tagsInput
  )
})

const idea = computed(() => store.selectedIdea)
const open = computed(() => idea.value !== null)

// Sync edit buffer when selected idea changes
watch(idea, (val) => {
  if (val && !isEditing.value) {
    editTitle.value = val.title
    editDescription.value = val.description
    editStatus.value = val.status
    editImpact.value = val.impact
    editEffort.value = val.effort
    editTagsInput.value = val.tags.join(', ')
  }
})

// Render markdown → sanitize via DOMPurify before binding to v-html
const renderedHtml = computed(() => {
  if (!idea.value?.description) return '<p class="text-slate-400 italic">No description yet.</p>'
  // marked.parse with async: false returns a string synchronously
  const raw = marked.parse(idea.value.description, { async: false }) as string
  return sanitize(raw)
})

const statusOptions = computed(() =>
  stagesStore.orderedStages.map((s) => ({ value: s.id, label: s.label })),
)
const scaleOptions = [1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))

function doClose() {
  store.selectIdea(null)
  isEditing.value = false
  editSnapshot.value = null
  showDirtyBanner.value = false
}

function close() {
  if (isDirty.value) { showDirtyBanner.value = true; return }
  doClose()
}

function startEdit() {
  if (!idea.value) return
  editTitle.value       = idea.value.title
  editDescription.value = idea.value.description
  editStatus.value      = idea.value.status
  editImpact.value      = idea.value.impact
  editEffort.value      = idea.value.effort
  editTagsInput.value   = idea.value.tags.join(', ')
  editSnapshot.value = {
    title: idea.value.title,
    description: idea.value.description,
    status: idea.value.status,
    impact: idea.value.impact,
    effort: idea.value.effort,
    tagsInput: idea.value.tags.join(', '),
  }
  isEditing.value = true
  showDirtyBanner.value = false
}

function cancelEdit() {
  if (isDirty.value) { showDirtyBanner.value = true; return }
  isEditing.value = false
  editSnapshot.value = null
}

async function saveEdit() {
  if (!idea.value) return
  const tags = editTagsInput.value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  await store.updateIdea(idea.value.id, {
    title: editTitle.value,
    description: editDescription.value,
    status: editStatus.value,
    impact: Number(editImpact.value),
    effort: Number(editEffort.value),
    tags,
  })
  isEditing.value = false
  editSnapshot.value = null
  showDirtyBanner.value = false
}

const deleteConfirmOpen = ref(false)

function handleDelete() {
  if (!idea.value) return
  deleteConfirmOpen.value = true
}

async function confirmDelete() {
  if (!idea.value) return
  await store.deleteIdea(idea.value.id)
  close()
}
</script>

<template>
  <Sheet
    :open="open"
    :title="isEditing ? 'Edit Idea' : (idea?.title ?? '')"
    description="Project Idea Details"
    side="right"
    @update:open="(v) => !v && close()"
  >
    <div v-if="idea" class="space-y-6">
      <!-- View mode -->
      <template v-if="!isEditing">
        <!-- Actions toolbar -->
        <div class="flex items-center gap-2">
          <Button size="sm" variant="outline" @click="startEdit" aria-label="Edit idea">
            <Pencil :size="14" />
            Edit
          </Button>
          <Button size="sm" variant="destructive" @click="handleDelete" aria-label="Delete idea">
            <Trash2 :size="14" />
            Delete
          </Button>
        </div>

        <!-- Meta row -->
        <dl class="grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt class="text-xs text-slate-500 dark:text-slate-500 mb-1">Status</dt>
            <dd>
              <Badge variant="secondary">{{ stagesStore.stageLabel(idea.status) }}</Badge>
            </dd>
          </div>
          <div>
            <dt class="text-xs text-slate-500 dark:text-slate-500 mb-1">Impact</dt>
            <dd class="font-semibold text-slate-900 dark:text-slate-100">{{ idea.impact }}/5</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-500 dark:text-slate-500 mb-1">Effort</dt>
            <dd class="font-semibold text-slate-900 dark:text-slate-100">{{ idea.effort }}/5</dd>
          </div>
        </dl>

        <!-- Tags -->
        <div v-if="idea.tags.length">
          <p class="text-xs text-slate-500 dark:text-slate-500 mb-2">Tags</p>
          <div class="flex flex-wrap gap-1.5">
            <Badge v-for="tag in idea.tags" :key="tag" variant="outline">{{ tag }}</Badge>
          </div>
        </div>

        <!-- Markdown description — sanitized before v-html binding -->
        <div>
          <p class="text-xs text-slate-500 dark:text-slate-500 mb-2">Description</p>
          <div
            class="prose prose-sm prose-slate dark:prose-invert max-w-none
                   prose-headings:font-semibold prose-a:text-blue-600 dark:prose-a:text-blue-400
                   prose-code:text-pink-600 dark:prose-code:text-pink-400
                   prose-pre:bg-slate-900 dark:prose-pre:bg-slate-800 prose-pre:text-slate-100"
            v-html="renderedHtml"
          />
        </div>
      </template>

      <!-- Edit mode -->
      <template v-else>
        <div class="space-y-4">
          <div>
            <Label for="edit-title" class="mb-1.5 block">Title</Label>
            <input
              id="edit-title"
              v-model="editTitle"
              type="text"
              class="flex h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700
                     bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100
                     px-3 py-1 text-sm
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <Label for="edit-status" class="mb-1.5 block">Status</Label>
              <Select
                id="edit-status"
                v-model="editStatus"
                :options="statusOptions"
              />
            </div>
            <div>
              <Label for="edit-impact" class="mb-1.5 block">Impact</Label>
              <Select
                id="edit-impact"
                v-model="editImpact"
                :options="scaleOptions"
              />
            </div>
            <div>
              <Label for="edit-effort" class="mb-1.5 block">Effort</Label>
              <Select
                id="edit-effort"
                v-model="editEffort"
                :options="scaleOptions"
              />
            </div>
          </div>

          <div>
            <Label for="edit-tags" class="mb-1.5 block">Tags (comma separated)</Label>
            <input
              id="edit-tags"
              v-model="editTagsInput"
              type="text"
              placeholder="ai, tooling, devex"
              class="flex h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700
                     bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100
                     px-3 py-1 text-sm
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>

          <div>
            <Label for="edit-desc" class="mb-1.5 block">Description (Markdown)</Label>
            <Textarea
              id="edit-desc"
              v-model="editDescription"
              :rows="14"
              placeholder="## Overview&#10;Describe the idea..."
              class="font-mono text-xs"
            />
          </div>
        </div>
      </template>
    </div>

    <ConfirmDialog
      v-model:open="deleteConfirmOpen"
      title="Delete idea?"
      :message="`&quot;${idea?.title}&quot; will be moved to trash.`"
      confirm-label="Delete"
      :danger="true"
      @confirm="confirmDelete"
    />

    <template v-if="isEditing || showDirtyBanner" #footer>
      <!-- Unsaved changes banner -->
      <div
        v-if="showDirtyBanner"
        class="flex items-center gap-2.5 rounded-xl
               bg-amber-50 dark:bg-amber-950/30
               border border-amber-200 dark:border-amber-800
               px-3 py-2.5"
      >
        <AlertTriangle :size="13" class="text-amber-500 shrink-0" />
        <p class="text-sm text-amber-700 dark:text-amber-400 font-medium flex-1">Unsaved changes</p>
        <div class="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" @click="doClose">Discard</Button>
          <Button size="sm" @click="saveEdit">Save</Button>
        </div>
      </div>
      <!-- Normal edit footer -->
      <div v-else class="flex items-center gap-2 justify-end">
        <Button variant="ghost" size="sm" @click="cancelEdit">
          <X :size="14" />
          Cancel
        </Button>
        <Button size="sm" @click="saveEdit">
          <Check :size="14" />
          Save changes
        </Button>
      </div>
    </template>
  </Sheet>
</template>
