import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(true)

  const isAuthenticated = computed(() => user.value !== null)

  async function initialize() {
    if (!supabase) {
      loading.value = false
      return
    }
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    user.value = data.session?.user ?? null
    loading.value = false

    supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession
      user.value = newSession?.user ?? null
    })
  }

  async function signInWithEmail(email: string, password: string) {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUpWithEmail(email: string, password: string) {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  async function signInWithPhone(phone: string) {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.signInWithOtp({ phone })
    if (error) throw error
  }

  async function verifyOtp(phone: string, token: string) {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' })
    if (error) throw error
  }

  async function resetPassword(email: string) {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut()
    user.value = null
    session.value = null
  }

  async function updateUsername(username: string) {
    if (!supabase) throw new Error('Supabase not configured')
    const { data, error } = await supabase.auth.updateUser({ data: { username: username.trim() } })
    if (error) throw error
    if (data.user) user.value = data.user
  }

  const displayName = computed(() =>
    (user.value?.user_metadata?.['username'] as string | undefined) || user.value?.email?.split('@')[0] || '',
  )

  return {
    user,
    session,
    loading,
    isAuthenticated,
    displayName,
    initialize,
    signInWithEmail,
    signUpWithEmail,
    signInWithPhone,
    verifyOtp,
    resetPassword,
    signOut,
    updateUsername,
  }
})
