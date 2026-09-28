<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  modelValue?: string | number
  placeholder?: string
  type?: string
  disabled?: boolean
  class?: string
  id?: string
  name?: string
  autocomplete?: string
}

const props = withDefaults(defineProps<Props>(), { type: 'text' })
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <input
    :id="id"
    :name="name"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    :value="modelValue"
    :autocomplete="autocomplete"
    :class="cn(
      'flex h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm',
      'text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900',
      'disabled:cursor-not-allowed disabled:opacity-50',
      props.class,
    )"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
