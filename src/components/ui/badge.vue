<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive'
  class?: string
}

const props = withDefaults(defineProps<Props>(), { variant: 'default' })

const variantClasses: Record<NonNullable<Props['variant']>, string> = {
  default: 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900',
  secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
  outline: 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300',
  destructive: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400',
}

const classes = cn(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  variantClasses[props.variant],
  props.class,
)
</script>

<template>
  <span :class="classes"><slot /></span>
</template>
