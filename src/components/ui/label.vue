<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  for?: string
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <label
    :for="props.for"
    :class="cn('text-sm font-medium text-slate-700 dark:text-slate-300 leading-none', props.class)"
  >
    <slot />
  </label>
</template>
