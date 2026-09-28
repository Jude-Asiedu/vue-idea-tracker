<script setup lang="ts">
import Skeleton from '@/components/ui/skeleton.vue'
// Renders 4 ghost columns with randomised card heights to mimic a real board
const COLUMNS = [
  { cards: [80, 60, 96] },
  { cards: [72, 88] },
  { cards: [64, 80, 72, 60] },
  { cards: [88] },
]
</script>

<template>
  <div class="flex gap-4 overflow-x-auto pb-4" aria-hidden="true" aria-label="Loading board">
    <div
      v-for="(col, ci) in COLUMNS"
      :key="ci"
      class="flex flex-col w-72 shrink-0 rounded-xl bg-slate-50 border border-slate-200"
    >
      <!-- Column header -->
      <div class="flex items-center gap-2 p-3 border-b border-slate-200">
        <Skeleton class="w-2.5 h-2.5 rounded-full" />
        <Skeleton class="h-4 w-24" />
        <Skeleton class="ml-auto h-5 w-6 rounded-full" />
      </div>

      <!-- Cards -->
      <div class="flex flex-col gap-2 p-2">
        <div
          v-for="(height, ki) in col.cards"
          :key="ki"
          class="rounded-lg border border-slate-100 bg-white p-3 space-y-2"
        >
          <Skeleton class="h-3 w-16 rounded-full" />
          <Skeleton :class="`h-4 w-full`" :style="{ height: `${height * 0.045}rem` }" />
          <Skeleton class="h-3 w-3/4" />
          <div class="flex gap-1 pt-1">
            <Skeleton class="h-4 w-12 rounded-full" />
            <Skeleton class="h-4 w-10 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
