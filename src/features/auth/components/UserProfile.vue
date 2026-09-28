<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { useRouter } from 'vue-router'
import {
  DialogRoot, DialogPortal, DialogOverlay, DialogContent,
  DialogTitle, DialogClose,
} from 'reka-ui'
import { LogOut, X, Check, Pencil, AlertCircle } from 'lucide-vue-next'

interface Props { open: boolean }
const props = defineProps<Props>()
const emit = defineEmits<{ 'update:open': [val: boolean] }>()

const auth = useAuthStore()
const router = useRouter()

const email = computed(() => auth.user?.email ?? '')
const initials = computed(() => {
  const name = auth.user?.user_metadata?.['username'] as string | undefined
  if (name) return name.slice(0, 2).toUpperCase()
  const e = email.value
  return e ? e.slice(0, 2).toUpperCase() : '?'
})
const joinedDate = computed(() => {
  const ts = auth.user?.created_at
  if (!ts) return ''
  return new Date(ts).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
})

// Username editing
const editingName = ref(false)
const nameInput = ref('')
const nameSaving = ref(false)
const nameError = ref('')
const nameSuccess = ref(false)

watch(() => props.open, (open) => {
  if (open) {
    nameInput.value = (auth.user?.user_metadata?.['username'] as string | undefined) ?? ''
    editingName.value = false
    nameError.value = ''
    nameSuccess.value = false
  }
})

function startEdit() {
  nameInput.value = (auth.user?.user_metadata?.['username'] as string | undefined) ?? ''
  nameError.value = ''
  nameSuccess.value = false
  editingName.value = true
}

function cancelEdit() {
  editingName.value = false
  nameError.value = ''
}

async function saveName() {
  const trimmed = nameInput.value.trim()
  if (!trimmed) { nameError.value = 'Name cannot be empty'; return }
  if (trimmed.length > 32) { nameError.value = 'Name must be 32 characters or fewer'; return }
  nameSaving.value = true
  nameError.value = ''
  try {
    await auth.updateUsername(trimmed)
    editingName.value = false
    nameSuccess.value = true
    setTimeout(() => { nameSuccess.value = false }, 2500)
  } catch (e) {
    nameError.value = e instanceof Error ? e.message : 'Failed to save'
  } finally {
    nameSaving.value = false
  }
}

async function signOut() {
  emit('update:open', false)
  await auth.signOut()
  await router.push('/auth')
}
</script>

<template>
  <DialogRoot :open="props.open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-black/20 dark:bg-black/40 backdrop-blur-[2px]" />
      <DialogContent
        class="fixed z-50 left-4 bottom-4 w-80 rounded-2xl outline-none
               bg-white dark:bg-slate-900
               border border-slate-200 dark:border-slate-700
               shadow-2xl shadow-black/10 dark:shadow-black/40
               data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-2
               data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-2"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle class="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Account
          </DialogTitle>
          <DialogClose
            class="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300
                   hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Close"
          >
            <X :size="14" />
          </DialogClose>
        </div>

        <div class="p-5 space-y-5">

          <!-- Avatar + email -->
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-indigo-600
                     flex items-center justify-center text-white text-sm font-bold shrink-0"
              aria-hidden="true"
            >
              {{ initials }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {{ auth.displayName || email }}
              </p>
              <p class="text-xs text-slate-500 dark:text-slate-500 truncate">{{ email }}</p>
              <p v-if="joinedDate" class="text-[11px] text-slate-400 dark:text-slate-600 mt-0.5">
                Member since {{ joinedDate }}
              </p>
            </div>
          </div>

          <!-- Display name section -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Display name
              </p>
              <button
                v-if="!editingName"
                class="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium
                       focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded"
                @click="startEdit"
              >
                <span class="flex items-center gap-1"><Pencil :size="11" /> Edit</span>
              </button>
            </div>

            <!-- View mode -->
            <div v-if="!editingName">
              <p
                class="text-sm text-slate-900 dark:text-slate-100 px-3 py-2 rounded-xl
                       bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                {{ (auth.user?.user_metadata?.['username'] as string | undefined) || 'Not set' }}
              </p>
              <p
                v-if="nameSuccess"
                class="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mt-1.5"
              >
                <Check :size="12" /> Saved successfully
              </p>
            </div>

            <!-- Edit mode -->
            <div v-else class="space-y-2">
              <input
                v-model="nameInput"
                type="text"
                placeholder="Your display name"
                maxlength="32"
                :disabled="nameSaving"
                class="flex h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700
                       bg-white dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-slate-100
                       placeholder:text-slate-400 dark:placeholder:text-slate-600
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                       disabled:opacity-50 transition-all"
                @keydown.enter="saveName"
                @keydown.escape="cancelEdit"
              />
              <p v-if="nameError" class="flex items-center gap-1.5 text-xs text-red-500">
                <AlertCircle :size="11" /> {{ nameError }}
              </p>
              <div class="flex items-center gap-2">
                <button
                  class="flex-1 h-8 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400
                         bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700
                         transition-colors disabled:opacity-50"
                  :disabled="nameSaving"
                  @click="cancelEdit"
                >
                  Cancel
                </button>
                <button
                  class="flex-1 h-8 rounded-lg text-xs font-medium text-white
                         bg-teal-600 hover:bg-teal-700 disabled:opacity-50
                         transition-colors flex items-center justify-center gap-1"
                  :disabled="nameSaving || !nameInput.trim()"
                  @click="saveName"
                >
                  <Check :size="12" />
                  {{ nameSaving ? 'Saving…' : 'Save' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Divider -->
          <hr class="border-slate-100 dark:border-slate-800" />

          <!-- Sign out -->
          <button
            class="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium
                   text-slate-500 dark:text-slate-400
                   hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400
                   transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            @click="signOut"
          >
            <LogOut :size="15" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
