<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { useIdeaStore } from '@/features/ideas/store/useIdeaStore'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { useIdeaCreator } from '@/features/ideas/composables/useIdeaCreator'
import { useStagesStore } from '@/features/ideas/store/useStagesStore'
import { useDarkMode } from '@/composables/useDarkMode'
import Button from '@/components/ui/button.vue'
import Input from '@/components/ui/input.vue'
import Textarea from '@/components/ui/textarea.vue'
import Select from '@/components/ui/select.vue'
import Label from '@/components/ui/label.vue'
import Sheet from '@/components/ui/sheet.vue'
import UserProfile from '@/features/auth/components/UserProfile.vue'
import {
  LayoutDashboard, ScatterChart, Table2,
  AlertCircle, X, Check, Trash2, Moon, Sun, Plus, ChevronRight,
} from 'lucide-vue-next'

const route = useRoute()
const ideaStore = useIdeaStore()
const authStore = useAuthStore()
const stagesStore = useStagesStore()
const { isDark, toggle: toggleDark } = useDarkMode()
const { isOpen: creatorOpen, defaultStatus, openCreator, closeCreator } = useIdeaCreator()

const isDemo = computed(() => route.path.startsWith('/demo'))

function routeBase(path: string) {
  return isDemo.value ? `/demo/${path}` : `/${path}`
}

const primaryNav = [
  { label: 'Board',  path: 'board',  icon: LayoutDashboard },
  { label: 'Matrix', path: 'matrix', icon: ScatterChart },
  { label: 'Table',  path: 'table',  icon: Table2 },
]

// ---- Toasts (error + success) ----
const toastMsg  = ref('')
const toastType = ref<'error' | 'success'>('error')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(msg: string, type: 'error' | 'success', duration: number) {
  toastMsg.value = msg
  toastType.value = type
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMsg.value = ''
    toastTimer = null
  }, duration)
}

watch(() => ideaStore.error, (err) => {
  if (!err) return
  showToast(err, 'error', 4000)
  ideaStore.clearError()
})

watch(() => ideaStore.successMsg, (msg) => {
  if (!msg) return
  showToast(msg, 'success', 3000)
  ideaStore.clearSuccess()
})

// ---- User profile dialog ----
const profileOpen = ref(false)

const userInitials = computed(() => {
  const name = authStore.user?.user_metadata?.['username'] as string | undefined
  if (name) return name.slice(0, 2).toUpperCase()
  const e = authStore.user?.email ?? ''
  return e ? e.slice(0, 2).toUpperCase() : '?'
})

// ---- Create idea form ----
const newTitle = ref('')
const newDescription = ref('')
const newStatus = ref<string>('backlog')
const newImpact = ref(3)
const newEffort = ref(3)
const newTagsInput = ref('')
const creating = ref(false)

watch(creatorOpen, (open) => {
  if (open) {
    newTitle.value = ''
    newDescription.value = ''
    newStatus.value = defaultStatus.value
    newImpact.value = 3
    newEffort.value = 3
    newTagsInput.value = ''
  }
})

const statusOptions = computed(() =>
  stagesStore.orderedStages.map((s) => ({ value: s.id, label: s.label })),
)
const scaleOptions = [1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))

async function submitNewIdea() {
  if (!newTitle.value.trim()) return
  creating.value = true
  try {
    await ideaStore.createIdea({
      title: newTitle.value.trim(),
      description: newDescription.value,
      status: newStatus.value,
      impact: Number(newImpact.value),
      effort: Number(newEffort.value),
      tags: newTagsInput.value.split(',').map((t) => t.trim()).filter(Boolean),
    })
    closeCreator()
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <div class="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">

    <!-- ─── Sidebar ─── -->
    <nav
      class="w-64 shrink-0 flex flex-col bg-white dark:bg-slate-900
             border-r border-slate-100 dark:border-slate-800"
      aria-label="Main navigation"
    >

      <!-- Logo row -->
      <div class="flex items-center justify-between px-4 h-14 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div class="flex items-center gap-2.5">
          <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true" class="shrink-0">
            <rect width="32" height="32" rx="7" fill="#0f172a"/>
            <defs>
              <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#2dd4bf"/>
                <stop offset="100%" stop-color="#34d399"/>
              </linearGradient>
            </defs>
            <text x="16" y="22" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-weight="800" font-size="15" fill="url(#logo-g)" letter-spacing="-0.5">ID</text>
          </svg>
          <span class="font-semibold text-[14px] text-slate-900 dark:text-slate-100 tracking-tight">
            Idea Deck
          </span>
        </div>
        <!-- Dark mode toggle — icon only -->
        <button
          class="w-7 h-7 rounded-lg flex items-center justify-center
                 text-slate-400 dark:text-slate-500
                 hover:bg-slate-100 dark:hover:bg-slate-800
                 hover:text-slate-700 dark:hover:text-slate-300
                 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="toggleDark"
        >
          <component :is="isDark ? Sun : Moon" :size="15" />
        </button>
      </div>

      <!-- Scrollable body -->
      <div class="flex flex-col flex-1 overflow-y-auto py-3">

        <!-- Demo badge -->
        <div
          v-if="isDemo"
          class="mx-3 mb-3 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/40
                 border border-amber-200 dark:border-amber-800/50
                 text-xs text-amber-700 dark:text-amber-400 font-medium"
          role="status"
        >
          Demo Mode — data saved locally
        </div>

        <!-- New Idea CTA -->
        <div class="px-3 mb-4">
          <button
            class="flex items-center gap-2 w-full h-8 px-3 rounded-lg text-[13px] font-medium
                   bg-teal-600 hover:bg-teal-700 text-white
                   transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                   dark:focus-visible:ring-offset-slate-900"
            aria-label="Create new idea"
            @click="openCreator('backlog')"
          >
            <Plus :size="14" aria-hidden="true" />
            New Idea
          </button>
        </div>

        <!-- Primary nav -->
        <div class="px-2 mb-1">
          <p class="px-2 mb-1 text-[10px] font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
            Views
          </p>
          <ul class="space-y-0.5" role="list">
            <li v-for="item in primaryNav" :key="item.path">
              <RouterLink
                :to="routeBase(item.path)"
                class="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium
                       text-slate-600 dark:text-slate-400
                       hover:bg-slate-100 dark:hover:bg-slate-800
                       hover:text-slate-900 dark:hover:text-slate-100
                       transition-colors duration-100
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                :active-class="'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50'"
              >
                <component :is="item.icon" :size="15" aria-hidden="true" class="shrink-0" />
                {{ item.label }}
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- Divider -->
        <div class="mx-3 my-3 border-t border-slate-100 dark:border-slate-800" />

        <!-- Secondary nav (Trash) -->
        <div class="px-2">
          <ul role="list">
            <li>
              <RouterLink
                :to="routeBase('trash')"
                class="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium
                       text-slate-500 dark:text-slate-500
                       hover:bg-slate-100 dark:hover:bg-slate-800
                       hover:text-slate-900 dark:hover:text-slate-100
                       transition-colors duration-100
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                :active-class="'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'"
              >
                <Trash2 :size="15" aria-hidden="true" class="shrink-0" />
                Trash
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>

      <!-- ─── User section ─── -->
      <div class="border-t border-slate-100 dark:border-slate-800 p-3 shrink-0">

        <!-- Auth: Sign in link -->
        <RouterLink
          v-if="isDemo"
          to="/auth"
          class="flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium
                 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800
                 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
        >
          <span>Sign in to save</span>
          <ChevronRight :size="14" class="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </RouterLink>

        <!-- Authenticated: User card -->
        <button
          v-else
          class="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left
                 bg-slate-50 dark:bg-slate-800
                 hover:bg-slate-100 dark:hover:bg-slate-700/80
                 transition-colors duration-150 group
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Open account settings"
          @click="profileOpen = true"
        >
          <!-- Avatar -->
          <div
            class="w-7 h-7 rounded-full bg-linear-to-br from-blue-500 to-indigo-600
                   flex items-center justify-center text-white text-[10px] font-bold shrink-0"
            aria-hidden="true"
          >
            {{ userInitials }}
          </div>
          <!-- Name + email -->
          <div class="flex-1 min-w-0">
            <p class="text-[12px] font-semibold text-slate-800 dark:text-slate-200 truncate leading-tight">
              {{ authStore.displayName }}
            </p>
            <p class="text-[11px] text-slate-400 dark:text-slate-600 truncate leading-tight">
              {{ authStore.user?.email }}
            </p>
          </div>
          <!-- Expand hint -->
          <ChevronRight
            :size="13"
            class="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400
                   group-hover:translate-x-0.5 transition-all shrink-0"
          />
        </button>
      </div>
    </nav>

    <!-- ─── Main content ─── -->
    <main
      class="flex-1 overflow-auto p-8 bg-slate-50 dark:bg-slate-950"
      id="main-content"
      tabindex="-1"
    >
      <RouterView />
    </main>

    <!-- User Profile dialog -->
    <UserProfile v-model:open="profileOpen" />

    <!-- Create Idea sheet -->
    <Sheet
      :open="creatorOpen"
      title="New Idea"
      description="Add a new idea to your deck"
      @update:open="(v) => !v && closeCreator()"
    >
      <form @submit.prevent="submitNewIdea" class="space-y-4" aria-label="Create idea form">
        <div>
          <Label for="new-title" class="mb-1.5 block">Title <span aria-hidden="true">*</span></Label>
          <Input
            id="new-title"
            v-model="newTitle"
            placeholder="What's the idea?"
            required
            :disabled="creating"
          />
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <Label for="new-status" class="mb-1.5 block">Status</Label>
            <Select id="new-status" v-model="newStatus" :options="statusOptions" />
          </div>
          <div>
            <Label for="new-impact" class="mb-1.5 block">Impact (1–5)</Label>
            <Select id="new-impact" v-model="newImpact" :options="scaleOptions" />
          </div>
          <div>
            <Label for="new-effort" class="mb-1.5 block">Effort (1–5)</Label>
            <Select id="new-effort" v-model="newEffort" :options="scaleOptions" />
          </div>
        </div>

        <div>
          <Label for="new-tags" class="mb-1.5 block">Tags (comma separated)</Label>
          <Input
            id="new-tags"
            v-model="newTagsInput"
            placeholder="ai, ux, mobile"
            :disabled="creating"
          />
        </div>

        <div>
          <Label for="new-desc" class="mb-1.5 block">Description (Markdown)</Label>
          <Textarea
            id="new-desc"
            v-model="newDescription"
            :rows="8"
            placeholder="## Overview&#10;What problem does this solve?"
            :disabled="creating"
            class="font-mono text-xs"
          />
        </div>
      </form>

      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" :disabled="creating" @click="closeCreator">
            <X :size="14" />
            Cancel
          </Button>
          <Button
            size="sm"
            :disabled="creating || !newTitle.trim()"
            @click="submitNewIdea"
          >
            <Check :size="14" />
            Create idea
          </Button>
        </div>
      </template>
    </Sheet>

    <!-- Global error toast -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-if="toastMsg"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-100 flex items-center gap-3
               bg-slate-900 dark:bg-slate-700 text-white text-sm rounded-2xl px-5 py-3
               shadow-lg shadow-black/20"
        role="alert"
        aria-live="assertive"
      >
        <Check v-if="toastType === 'success'" :size="15" class="text-emerald-400 shrink-0" aria-hidden="true" />
        <AlertCircle v-else :size="15" class="text-red-400 shrink-0" aria-hidden="true" />
        {{ toastMsg }}
      </div>
    </Transition>

    <div aria-live="polite" aria-atomic="true" class="sr-only" id="announcer" />
  </div>
</template>
