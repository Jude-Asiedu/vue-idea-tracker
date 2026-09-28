<script setup lang="ts">
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string | number
  label: string
}

interface Props {
  modelValue?: string | number
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  class?: string
  id?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <select
    :id="id"
    :disabled="disabled"
    :value="modelValue"
    :class="cn(
      'flex h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm',
      'text-slate-900 dark:text-slate-100',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
      'disabled:cursor-not-allowed disabled:opacity-50',
      props.class,
    )"
    @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
  >
    <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
    <option
      v-for="opt in options"
      :key="opt.value"
      :value="opt.value"
    >{{ opt.label }}</option>
  </select>
</template>
