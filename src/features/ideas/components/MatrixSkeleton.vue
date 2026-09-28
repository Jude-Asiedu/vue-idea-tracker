<script setup lang="ts">
import Skeleton from '@/components/ui/skeleton.vue'
// Fake dot positions so the skeleton looks like a populated matrix
const DOTS = [
  { x: 18, y: 22 }, { x: 12, y: 35 }, { x: 28, y: 15 },
  { x: 70, y: 25 }, { x: 82, y: 18 }, { x: 75, y: 40 },
  { x: 20, y: 68 }, { x: 35, y: 75 }, { x: 65, y: 72 }, { x: 78, y: 80 },
]
</script>

<template>
  <div class="flex gap-6 flex-1 min-h-0" aria-hidden="true">
    <div class="flex-1 flex flex-col">
      <div class="flex items-stretch gap-3 flex-1">
        <div class="flex items-center">
          <Skeleton class="w-3 h-32" />
        </div>
        <div class="flex-1 flex flex-col">
          <div class="relative flex-1 rounded-xl border border-slate-200 bg-slate-50 grid grid-cols-2 grid-rows-2 overflow-hidden">
            <div v-for="i in 4" :key="i" class="p-3 border-r border-b border-slate-200 last:border-r-0 last:border-b-0 space-y-1.5">
              <Skeleton class="h-3.5 w-24" />
              <Skeleton class="h-3 w-32" />
            </div>
            <!-- Ghost dots -->
            <div
              v-for="(dot, i) in DOTS"
              :key="i"
              :style="{ left: `${dot.x}%`, top: `${dot.y}%` }"
              class="absolute -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-slate-300 skeleton-pulse"
            />
          </div>
          <Skeleton class="h-3 w-48 mx-auto mt-2" />
        </div>
      </div>
    </div>
    <div class="w-52 shrink-0 space-y-3">
      <Skeleton class="h-4 w-24" />
      <div v-for="i in 4" :key="i" class="rounded-lg border border-slate-200 bg-white p-3 space-y-1.5">
        <Skeleton class="h-4 w-28" />
        <Skeleton class="h-3 w-36" />
      </div>
    </div>
  </div>
</template>
