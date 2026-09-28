import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './assets/main.css'
import App from './App.vue'
import router from '@/router'
import { hasSupabaseConfig } from '@/lib/env'
import { LocalIdeaService } from '@/features/ideas/services/LocalIdeaService'
import { SupabaseIdeaService } from '@/features/ideas/services/SupabaseIdeaService'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { useStagesStore } from '@/features/ideas/store/useStagesStore'
import { useDarkMode } from '@/composables/useDarkMode'

// Apply dark mode before first paint to prevent flash
useDarkMode().init()

;(async () => {
  const app = createApp(App)
  const pinia = createPinia()

  // Pinia first — useAuthStore() below requires it.
  app.use(pinia)

  const ideaService =
    hasSupabaseConfig && supabase
      ? new SupabaseIdeaService(supabase)
      : new LocalIdeaService()

  app.provide('ideaService', ideaService)

  // Resolve auth BEFORE installing the router.
  // app.use(router) triggers the initial navigation immediately, which fires
  // beforeEach guards. If the router is installed before auth is known the
  // guard sees loading=true, skips the redirect, and the user lands on a
  // protected route without being authenticated.
  const authStore = useAuthStore()
  await authStore.initialize()

  // After auth is resolved, sync stages from user_metadata (auth) or localStorage (demo)
  const stagesStore = useStagesStore()
  stagesStore.reload()

  app.use(router)
  app.mount('#app')
})()
