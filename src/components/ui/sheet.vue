<script setup lang="ts">
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { X } from 'lucide-vue-next'

interface Props {
  open: boolean
  title?: string
  description?: string
  side?: 'right' | 'left'
}

const props = withDefaults(defineProps<Props>(), { side: 'right' })
const emit = defineEmits<{ 'update:open': [val: boolean] }>()

const sideClasses: Record<'right' | 'left', string> = {
  right: 'right-0 inset-y-0 w-full sm:max-w-xl',
  left: 'left-0 inset-y-0 w-full sm:max-w-xl',
}

const contentClass = computed(() =>
  cn(
    'fixed z-50 flex flex-col bg-white dark:bg-slate-900 shadow-xl outline-none',
    'duration-300 transition ease-in-out',
    sideClasses[props.side],
  )
)
</script>

<template>
  <DialogRoot :open="props.open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm
               data-[state=open]:animate-in data-[state=open]:fade-in-0
               data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
      />
      <DialogContent
        :class="contentClass"
        @escape-key-down="emit('update:open', false)"
        @interact-outside="emit('update:open', false)"
      >
        <!-- Header -->
        <div class="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div class="flex-1 min-w-0">
            <DialogTitle v-if="props.title" class="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
              {{ props.title }}
            </DialogTitle>
            <DialogDescription v-if="props.description" class="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {{ props.description }}
            </DialogDescription>
          </div>
          <DialogClose
            class="ml-4 shrink-0 rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300
                   hover:bg-slate-100 dark:hover:bg-slate-800
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Close panel"
          >
            <X :size="18" />
          </DialogClose>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto p-6">
          <slot />
        </div>

        <!-- Footer slot (optional) -->
        <div v-if="$slots['footer']" class="border-t border-slate-100 dark:border-slate-800 p-6">
          <slot name="footer" />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
