<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  type: 'button',
})

const variantClasses: Record<NonNullable<Props['variant']>, string> = {
  default:     'bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 focus-visible:ring-teal-500',
  outline:     'border border-slate-200 dark:border-slate-700 bg-white dark:bg-transparent text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 focus-visible:ring-slate-400',
  ghost:       'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 focus-visible:ring-slate-400',
  destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
  secondary:   'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 focus-visible:ring-slate-400',
}

const sizeClasses: Record<NonNullable<Props['size']>, string> = {
  sm:   'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md:   'h-9 px-4 py-2 text-sm gap-2 rounded-xl',
  lg:   'h-11 px-6 text-base gap-2 rounded-xl',
  icon: 'h-9 w-9 rounded-xl',
}

const classes = cn(
  'inline-flex items-center justify-center font-medium transition-colors',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  'dark:focus-visible:ring-offset-slate-900',
  'disabled:pointer-events-none disabled:opacity-50',
  variantClasses[props.variant],
  sizeClasses[props.size],
  props.class,
)
</script>

<template>
  <button :type="type" :disabled="disabled" :class="classes">
    <slot />
  </button>
</template>
