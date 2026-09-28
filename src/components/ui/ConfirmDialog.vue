<script setup lang="ts">
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle } from 'reka-ui'
import { AlertTriangle } from 'lucide-vue-next'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  confirmLabel: 'Confirm',
  danger: false,
})
const emit = defineEmits<{
  'update:open': [val: boolean]
  confirm: []
}>()

function handleConfirm() {
  emit('confirm')
  emit('update:open', false)
}
</script>

<template>
  <DialogRoot :open="props.open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-black/20 dark:bg-black/40 backdrop-blur-[2px]" />
      <DialogContent
        class="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
               w-full max-w-sm rounded-2xl outline-none
               bg-white dark:bg-slate-900
               border border-slate-200 dark:border-slate-700
               shadow-2xl shadow-black/10 dark:shadow-black/40 p-6
               data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
               data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
      >
        <div class="flex items-start gap-3 mb-5">
          <div
            :class="[
              'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
              props.danger ? 'bg-red-50 dark:bg-red-950/40' : 'bg-amber-50 dark:bg-amber-950/40',
            ]"
          >
            <AlertTriangle
              :size="16"
              :class="props.danger ? 'text-red-500' : 'text-amber-500'"
            />
          </div>
          <div>
            <DialogTitle class="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {{ props.title }}
            </DialogTitle>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ props.message }}</p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2">
          <button
            class="h-8 px-4 rounded-lg text-sm font-medium
                   text-slate-600 dark:text-slate-400
                   hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            @click="emit('update:open', false)"
          >
            Cancel
          </button>
          <button
            :class="[
              'h-8 px-4 rounded-lg text-sm font-medium text-white transition-colors',
              props.danger
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-teal-600 hover:bg-teal-700',
            ]"
            @click="handleConfirm"
          >
            {{ props.confirmLabel }}
          </button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
