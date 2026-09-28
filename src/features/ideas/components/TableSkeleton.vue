<script setup lang="ts">
import Skeleton from '@/components/ui/skeleton.vue'
const ROWS = 8
const COL_WIDTHS = ['w-48', 'w-24', 'w-12', 'w-12', 'w-24', 'w-28']
</script>

<template>
  <div class="rounded-xl border border-slate-200 overflow-hidden" aria-hidden="true">
    <!-- Header -->
    <div class="bg-slate-50 border-b border-slate-200 px-4 py-3 flex gap-6">
      <Skeleton v-for="(w, i) in COL_WIDTHS" :key="i" :class="`h-4 ${w}`" />
    </div>
    <!-- Rows -->
    <div
      v-for="row in ROWS"
      :key="row"
      class="px-4 py-3.5 border-b border-slate-100 last:border-0 flex gap-6 items-center"
    >
      <Skeleton :class="`h-4 ${COL_WIDTHS[0]} ${row % 3 === 0 ? 'w-36' : ''}`" />
      <Skeleton class="h-5 w-24 rounded-full" />
      <Skeleton class="h-4 w-12" />
      <Skeleton class="h-4 w-12" />
      <Skeleton class="h-4 w-24" />
      <div class="flex gap-1">
        <Skeleton class="h-4 w-14 rounded-full" />
        <Skeleton class="h-4 w-10 rounded-full" />
      </div>
    </div>
  </div>
</template>
