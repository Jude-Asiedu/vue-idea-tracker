<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { z } from 'zod'
import {
  getCountries, getCountryCallingCode,
  parsePhoneNumber, isValidPhoneNumber, AsYouType,
} from 'libphonenumber-js'
import type { CountryCode } from 'libphonenumber-js'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { Loader2, ArrowRight, ArrowLeft, Mail, Phone, Check } from 'lucide-vue-next'

const router = useRouter()
const auth = useAuthStore()

// ── Navigation state ──────────────────────────────────────────
type View = 'methods' | 'email' | 'phone-number' | 'phone-otp' | 'forgot'
const view = ref<View>('methods')
const mode = ref<'signin' | 'signup'>('signin')

function go(v: View) {
  view.value = v
  errorMsg.value = ''
  successMsg.value = ''
  phoneError.value = ''
}

function toggleMode() {
  mode.value = mode.value === 'signin' ? 'signup' : 'signin'
  errorMsg.value = ''
  successMsg.value = ''
  password.value = ''
}

// ── Email flow ────────────────────────────────────────────────
const email       = ref('')
const password    = ref('')
const submitting  = ref(false)
const errorMsg    = ref('')
const successMsg  = ref('')

const signinSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

const signupSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'One uppercase letter required')
    .regex(/[0-9]/, 'One number required'),
})

const isEmailValid = computed(() => {
  const schema = mode.value === 'signup' ? signupSchema : signinSchema
  return schema.safeParse({ email: email.value, password: password.value }).success
})

const pwChecks = computed(() => ({
  length: password.value.length >= 8,
  upper:  /[A-Z]/.test(password.value),
  number: /[0-9]/.test(password.value),
}))
const pwStrength = computed(() =>
  [pwChecks.value.length, pwChecks.value.upper, pwChecks.value.number].filter(Boolean).length,
)
const pwStrengthColor = computed(() => ['', 'bg-red-400', 'bg-amber-400', 'bg-emerald-500'][pwStrength.value] ?? '')

async function handleEmailSubmit() {
  const schema = mode.value === 'signup' ? signupSchema : signinSchema
  const result = schema.safeParse({ email: email.value, password: password.value })
  if (!result.success) {
    errorMsg.value = result.error.issues[0]?.message ?? 'Invalid input'
    return
  }
  submitting.value = true
  errorMsg.value = ''
  try {
    if (mode.value === 'signin') {
      await auth.signInWithEmail(email.value, password.value)
      await router.push('/board')
    } else {
      await auth.signUpWithEmail(email.value, password.value)
      successMsg.value = 'Account created! Check your email to confirm, then sign in.'
      mode.value = 'signin'
      password.value = ''
    }
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : 'Authentication failed'
  } finally {
    submitting.value = false
  }
}

// ── Forgot password flow ──────────────────────────────────────
const forgotEmail      = ref('')
const forgotSubmitting = ref(false)
const forgotMsg        = ref('')
const forgotError      = ref('')

async function handleForgotPassword() {
  if (!forgotEmail.value.trim()) return
  forgotSubmitting.value = true
  forgotError.value = ''
  forgotMsg.value = ''
  try {
    await auth.resetPassword(forgotEmail.value.trim())
    forgotMsg.value = 'Check your email for a reset link.'
  } catch (e) {
    forgotError.value = e instanceof Error ? e.message : 'Could not send reset email'
  } finally {
    forgotSubmitting.value = false
  }
}

// ── Phone / OTP flow — international ─────────────────────────

// Build country list with flag emoji + calling code, sorted A–Z
function countryFlag(code: string): string {
  return code.toUpperCase().replace(/./g, (c) =>
    String.fromCodePoint(c.charCodeAt(0) + 127397),
  )
}

const countryOptions = getCountries()
  .map((code) => ({
    code,
    calling: getCountryCallingCode(code as CountryCode),
    flag: countryFlag(code),
  }))
  .sort((a, b) => a.code.localeCompare(b.code))

const selectedCountry = ref<CountryCode>('US')
const phoneDisplay    = ref('')   // formatted national number shown in input
const rawPhone        = ref('')   // raw digits typed by user
const phoneSubmitting = ref(false)
const phoneError      = ref('')
const otpInput        = ref('')

// Re-format when country changes; keep existing digits
watch(selectedCountry, () => {
  const digits = rawPhone.value.replace(/\D/g, '')
  const formatter = new AsYouType(selectedCountry.value)
  phoneDisplay.value = digits ? formatter.input(digits) : ''
})

function onPhoneInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  rawPhone.value = val
  const digits = val.replace(/\D/g, '')
  const formatter = new AsYouType(selectedCountry.value)
  phoneDisplay.value = formatter.input(digits)
}

const isPhoneValid = computed(() => {
  if (!rawPhone.value.trim()) return false
  try {
    return isValidPhoneNumber(rawPhone.value, selectedCountry.value)
  } catch {
    return false
  }
})

const isOtpValid = computed(() => /^\d{6}$/.test(otpInput.value.trim()))

function getE164(): string {
  const p = parsePhoneNumber(rawPhone.value, selectedCountry.value)
  return p.number
}

async function sendOtp() {
  if (!isPhoneValid.value) {
    phoneError.value = 'Invalid phone number for the selected country'
    return
  }
  phoneSubmitting.value = true
  phoneError.value = ''
  try {
    await auth.signInWithPhone(getE164())
    view.value = 'phone-otp'
  } catch (e) {
    phoneError.value = e instanceof Error ? e.message : 'Could not send code'
  } finally {
    phoneSubmitting.value = false
  }
}

async function verifyOtp() {
  phoneSubmitting.value = true
  phoneError.value = ''
  try {
    await auth.verifyOtp(getE164(), otpInput.value.trim())
    await router.push('/board')
  } catch (e) {
    phoneError.value = e instanceof Error ? e.message : 'Incorrect code — please try again'
  } finally {
    phoneSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen grid lg:grid-cols-[1fr_580px]">

    <!-- ── Left panel — branding ── -->
    <div class="hidden lg:flex flex-col justify-between p-14 relative overflow-hidden
                bg-[radial-gradient(ellipse_at_top_left,#1e2d4d_0%,#0f172a_55%,#020617_100%)]">

      <div class="absolute inset-0 pointer-events-none"
           style="background-image: radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 28px 28px;" />
      <div class="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
      <div class="absolute bottom-10 right-0 w-96 h-96 rounded-full bg-indigo-600/8 blur-3xl pointer-events-none" />

      <!-- Logo -->
      <div class="relative flex items-center gap-3">
        <svg width="36" height="36" viewBox="0 0 32 32" aria-hidden="true" class="shrink-0">
          <rect width="32" height="32" rx="7" fill="#0f172a"/>
          <defs>
            <linearGradient id="auth-logo-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#2dd4bf"/>
              <stop offset="100%" stop-color="#34d399"/>
            </linearGradient>
          </defs>
          <text x="16" y="22" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-weight="800" font-size="15" fill="url(#auth-logo-g)" letter-spacing="-0.5">ID</text>
        </svg>
        <span class="text-lg font-semibold text-white tracking-tight">Idea Deck</span>
      </div>

      <!-- Copy -->
      <div class="relative space-y-8">
        <div class="space-y-4">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full
                      bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium">
            <span class="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
            Idea management, simplified
          </div>
          <h1 class="text-4xl font-bold leading-[1.15] tracking-tight text-white">
            From scattered<br />thoughts to<br />
            <span class="text-blue-400">shipped ideas.</span>
          </h1>
          <p class="text-slate-400 text-base leading-relaxed max-w-xs">
            Capture, prioritise, and track every idea — from backlog to shipped.
          </p>
        </div>

        <!-- Mini kanban -->
        <div class="select-none" aria-hidden="true">
          <div class="flex gap-3">
            <div class="flex-1 space-y-2">
              <div class="flex items-center gap-1.5 mb-2.5">
                <span class="w-2 h-2 rounded-full bg-slate-500" />
                <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Backlog</span>
                <span class="text-[10px] text-slate-600 ml-auto">3</span>
              </div>
              <div class="bg-white/5 border border-white/8 rounded-lg p-2.5 space-y-1.5">
                <div class="h-2 w-24 bg-slate-600 rounded-full" />
                <div class="h-1.5 w-16 bg-slate-700 rounded-full" />
                <div class="flex gap-1 mt-1.5">
                  <div class="h-3.5 w-10 bg-slate-700/60 rounded-full" />
                  <div class="h-3.5 w-8 bg-slate-700/60 rounded-full" />
                </div>
              </div>
              <div class="bg-white/4 border border-white/6 rounded-lg p-2.5 space-y-1.5 opacity-50">
                <div class="h-2 w-20 bg-slate-600 rounded-full" />
                <div class="h-1.5 w-12 bg-slate-700 rounded-full" />
              </div>
            </div>
            <div class="flex-1 space-y-2">
              <div class="flex items-center gap-1.5 mb-2.5">
                <span class="w-2 h-2 rounded-full bg-blue-500" />
                <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">In Progress</span>
                <span class="text-[10px] text-slate-600 ml-auto">1</span>
              </div>
              <div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2.5 space-y-1.5">
                <div class="h-2 w-20 bg-blue-400/40 rounded-full" />
                <div class="h-1.5 w-14 bg-blue-500/20 rounded-full" />
                <div class="flex gap-1 mt-1.5">
                  <div class="h-3.5 w-12 bg-blue-500/20 rounded-full" />
                </div>
              </div>
            </div>
            <div class="flex-1 space-y-2">
              <div class="flex items-center gap-1.5 mb-2.5">
                <span class="w-2 h-2 rounded-full bg-emerald-500" />
                <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Shipped</span>
                <span class="text-[10px] text-slate-600 ml-auto">4</span>
              </div>
              <div class="bg-emerald-500/8 border border-emerald-500/15 rounded-lg p-2.5 space-y-1.5 opacity-80">
                <div class="h-2 w-16 bg-emerald-500/30 rounded-full" />
                <div class="h-1.5 w-10 bg-emerald-500/20 rounded-full" />
              </div>
              <div class="bg-white/4 border border-white/6 rounded-lg p-2.5 space-y-1.5 opacity-40">
                <div class="h-2 w-14 bg-slate-600 rounded-full" />
                <div class="h-1.5 w-9 bg-slate-700 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Demo link -->
      <div class="relative">
        <router-link
          to="/demo/board"
          class="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors group"
        >
          Try the demo without an account
          <ArrowRight :size="13" class="group-hover:translate-x-0.5 transition-transform" />
        </router-link>
      </div>
    </div>

    <!-- ── Right panel — auth (always white) ── -->
    <div class="flex flex-col items-center justify-center min-h-screen bg-white px-8 py-12">
      <div class="w-full max-w-md">

        <!-- ── Hero logo — always visible ── -->
        <div class="flex flex-col items-center mb-10">
          <svg width="64" height="64" viewBox="0 0 32 32" aria-hidden="true" class="mb-4 drop-shadow-lg">
            <rect width="32" height="32" rx="7" fill="#0f172a"/>
            <defs>
              <linearGradient id="auth-hero-g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#2dd4bf"/>
                <stop offset="100%" stop-color="#34d399"/>
              </linearGradient>
            </defs>
            <text x="16" y="22" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-weight="800" font-size="18" fill="url(#auth-hero-g)" letter-spacing="-0.5">ID</text>
          </svg>
          <!-- <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Idea Deck</h1>
          <p class="text-sm text-slate-500 mt-1">Capture, prioritise, and ship your best ideas</p> -->
        </div>

        <!-- ════════════════════════════
             VIEW: METHOD PICKER
        ════════════════════════════ -->
        <Transition name="fade" mode="out-in">
        <div v-if="view === 'methods'" key="methods">
          <div class="mb-7 text-center">
            <h2 class="text-xl font-bold text-slate-900 tracking-tight">
              {{ mode === 'signin' ? 'Welcome back' : 'Create your account' }}
            </h2>
            <p class="text-slate-500 mt-1 text-sm">
              {{ mode === 'signin' ? 'Sign in to your workspace.' : 'Start tracking ideas today.' }}
            </p>
          </div>

          <div class="space-y-3">
            <button
              class="w-full flex items-center gap-4 px-5 h-12 rounded-xl border border-slate-200
                     bg-white text-slate-700 text-sm font-medium
                     hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400
                     transition-all group"
              @click="go('email')"
            >
              <span class="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-slate-200
                           flex items-center justify-center shrink-0 transition-colors">
                <Mail :size="15" class="text-slate-500" />
              </span>
              Continue with Email
              <ArrowRight :size="14" class="ml-auto text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              class="w-full flex items-center gap-4 px-5 h-12 rounded-xl border border-slate-200
                     bg-white text-slate-700 text-sm font-medium
                     hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400
                     transition-all group"
              @click="go('phone-number')"
            >
              <span class="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-slate-200
                           flex items-center justify-center shrink-0 transition-colors">
                <Phone :size="15" class="text-slate-500" />
              </span>
              Continue with Phone
              <ArrowRight :size="14" class="ml-auto text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>

          <p class="mt-7 text-center text-sm text-slate-500">
            {{ mode === 'signin' ? "Don't have an account?" : 'Already have an account?' }}
            <button
              class="ml-1 font-semibold text-slate-800 hover:text-teal-600 underline underline-offset-2 transition-colors"
              @click="toggleMode"
            >
              {{ mode === 'signin' ? 'Sign up' : 'Sign in' }}
            </button>
          </p>

          <!-- Mobile demo link -->
          <div class="mt-8 text-center lg:hidden">
            <router-link
              to="/demo/board"
              class="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Try demo without an account <ArrowRight :size="11" />
            </router-link>
          </div>
        </div>

        <!-- ════════════════════════════
             VIEW: EMAIL FORM
        ════════════════════════════ -->
        <div v-else-if="view === 'email'" key="email">
          <button
            class="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 mb-7 transition-colors group"
            @click="go('methods')"
          >
            <ArrowLeft :size="14" class="group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>

          <div class="mb-7">
            <h2 class="text-xl font-bold text-slate-900 tracking-tight">
              {{ mode === 'signin' ? 'Sign in' : 'Create account' }}
            </h2>
            <p class="text-slate-500 mt-1 text-sm">
              {{ mode === 'signin' ? 'Enter your email and password.' : 'Fill in the details below to get started.' }}
            </p>
          </div>

          <form @submit.prevent="handleEmailSubmit" novalidate class="space-y-4">

            <div class="space-y-1.5">
              <label for="auth-email" class="block text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Email
              </label>
              <input
                id="auth-email"
                v-model="email"
                type="email"
                placeholder="you@example.com"
                autocomplete="email"
                :disabled="submitting"
                class="w-full h-11 rounded-xl border border-slate-200
                       bg-white px-4 text-sm text-slate-900
                       placeholder:text-slate-300
                       focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                       disabled:opacity-50 transition-all shadow-sm"
              />
            </div>

            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label for="auth-password" class="block text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  Password
                </label>
                <button
                  v-if="mode === 'signin'"
                  type="button"
                  class="text-xs text-slate-400 hover:text-teal-600 transition-colors"
                  @click="go('forgot')"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="auth-password"
                v-model="password"
                type="password"
                placeholder="••••••••"
                :autocomplete="mode === 'signin' ? 'current-password' : 'new-password'"
                :disabled="submitting"
                class="w-full h-11 rounded-xl border border-slate-200
                       bg-white px-4 text-sm text-slate-900
                       placeholder:text-slate-300
                       focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                       disabled:opacity-50 transition-all shadow-sm"
              />

              <!-- Password strength — signup only -->
              <div v-if="mode === 'signup' && password.length > 0" class="space-y-2 pt-1">
                <div class="flex gap-1">
                  <div
                    v-for="i in 3" :key="i"
                    :class="[
                      'h-1 flex-1 rounded-full transition-all duration-300',
                      i <= pwStrength ? pwStrengthColor : 'bg-slate-200',
                    ]"
                  />
                </div>
                <div class="grid grid-cols-3 gap-1">
                  <span
                    v-for="{ met, label } in [
                      { met: pwChecks.length, label: '8+ chars' },
                      { met: pwChecks.upper,  label: 'Uppercase' },
                      { met: pwChecks.number, label: 'Number' },
                    ]"
                    :key="label"
                    :class="[
                      'flex items-center gap-1 text-[11px] transition-colors',
                      met ? 'text-emerald-600' : 'text-slate-400',
                    ]"
                  >
                    <Check v-if="met" :size="10" class="shrink-0" />
                    <span v-else class="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0" />
                    {{ label }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Feedback -->
            <div v-if="errorMsg"
                 class="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3"
                 role="alert">
              <span class="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              {{ errorMsg }}
            </div>
            <div v-if="successMsg"
                 class="flex items-start gap-2.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl px-4 py-3"
                 role="status">
              <span class="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              {{ successMsg }}
            </div>

            <button
              type="submit"
              :disabled="submitting || !isEmailValid"
              class="w-full h-11 flex items-center justify-center gap-2 rounded-xl mt-2
                     bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2
                     disabled:opacity-40 disabled:pointer-events-none
                     active:scale-[0.99] transition-all shadow-sm"
            >
              <Loader2 v-if="submitting" :size="15" class="animate-spin" />
              {{ mode === 'signin' ? 'Sign in' : 'Create account' }}
            </button>
          </form>

          <p class="mt-6 text-center text-sm text-slate-500">
            {{ mode === 'signin' ? "Don't have an account?" : 'Already have an account?' }}
            <button
              class="ml-1 font-semibold text-slate-800 hover:text-teal-600 underline underline-offset-2 transition-colors"
              @click="toggleMode"
            >
              {{ mode === 'signin' ? 'Sign up' : 'Sign in' }}
            </button>
          </p>
        </div>

        <!-- ════════════════════════════
             VIEW: PHONE — ENTER NUMBER
        ════════════════════════════ -->
        <div v-else-if="view === 'phone-number'" key="phone-number">
          <button
            class="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 mb-7 transition-colors group"
            @click="go('methods')"
          >
            <ArrowLeft :size="14" class="group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>

          <div class="mb-7">
            <h2 class="text-xl font-bold text-slate-900 tracking-tight">Enter your number</h2>
            <p class="text-slate-500 mt-1 text-sm">We'll send a one-time code via SMS.</p>
          </div>

          <div class="space-y-4">
            <div class="space-y-1.5">
              <label for="auth-phone" class="block text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Mobile number
              </label>

              <!-- Compound input: country select + phone number -->
              <div class="flex gap-2">
                <!-- Country selector -->
                <select
                  v-model="selectedCountry"
                  :disabled="phoneSubmitting"
                  class="h-11 rounded-xl border border-slate-200
                         bg-white px-3 text-sm text-slate-900
                         focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                         disabled:opacity-50 transition-all shadow-sm cursor-pointer shrink-0"
                  aria-label="Select country"
                >
                  <option
                    v-for="c in countryOptions"
                    :key="c.code"
                    :value="c.code"
                  >
                    {{ c.flag }} +{{ c.calling }}
                  </option>
                </select>

                <!-- National number input -->
                <input
                  id="auth-phone"
                  :value="phoneDisplay"
                  type="tel"
                  placeholder="Phone number"
                  autocomplete="tel-national"
                  :disabled="phoneSubmitting"
                  class="flex-1 h-11 rounded-xl border border-slate-200
                         bg-white px-4 text-sm text-slate-900
                         placeholder:text-slate-300
                         focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                         disabled:opacity-50 transition-all shadow-sm"
                  @input="onPhoneInput"
                  @keydown.enter.prevent="sendOtp"
                />
              </div>

              <p class="text-[11px] text-slate-400 px-1">
                Select your country, then enter your number without the country code.
              </p>
            </div>

            <div v-if="phoneError"
                 class="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3"
                 role="alert">
              <span class="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              {{ phoneError }}
            </div>

            <button
              :disabled="phoneSubmitting || !isPhoneValid"
              class="w-full h-11 flex items-center justify-center gap-2 rounded-xl
                     bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2
                     disabled:opacity-40 disabled:pointer-events-none
                     active:scale-[0.99] transition-all shadow-sm"
              @click="sendOtp"
            >
              <Loader2 v-if="phoneSubmitting" :size="15" class="animate-spin" />
              Send code
            </button>
          </div>
        </div>

        <!-- ════════════════════════════
             VIEW: PHONE — OTP
        ════════════════════════════ -->
        <div v-else-if="view === 'phone-otp'" key="phone-otp">
          <button
            class="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 mb-7 transition-colors group"
            @click="go('phone-number')"
          >
            <ArrowLeft :size="14" class="group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>

          <div class="mb-7">
            <h2 class="text-xl font-bold text-slate-900 tracking-tight">Check your phone</h2>
            <p class="text-slate-500 mt-1 text-sm">
              We sent a 6-digit code to
              <span class="font-medium text-slate-700">
                +{{ countryOptions.find(c => c.code === selectedCountry)?.calling }} {{ phoneDisplay }}
              </span>
            </p>
          </div>

          <div class="space-y-4">
            <div class="space-y-1.5">
              <label for="auth-otp" class="block text-xs font-semibold text-slate-500 uppercase tracking-widest">
                One-time code
              </label>
              <input
                id="auth-otp"
                v-model="otpInput"
                type="text"
                inputmode="numeric"
                pattern="\d{6}"
                maxlength="6"
                placeholder="000000"
                autocomplete="one-time-code"
                :disabled="phoneSubmitting"
                class="w-full h-11 rounded-xl border border-slate-200
                       bg-white px-4 text-sm text-slate-900
                       placeholder:text-slate-300
                       tracking-[0.4em] font-mono text-center
                       focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                       disabled:opacity-50 transition-all shadow-sm"
                @keydown.enter.prevent="verifyOtp"
              />
              <p class="text-[11px] text-slate-400 px-1">
                Didn't receive it?
                <button class="text-teal-600 font-medium hover:underline" @click="sendOtp">Resend code</button>
              </p>
            </div>

            <div v-if="phoneError"
                 class="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3"
                 role="alert">
              <span class="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              {{ phoneError }}
            </div>

            <button
              :disabled="phoneSubmitting || !isOtpValid"
              class="w-full h-11 flex items-center justify-center gap-2 rounded-xl
                     bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2
                     disabled:opacity-40 disabled:pointer-events-none
                     active:scale-[0.99] transition-all shadow-sm"
              @click="verifyOtp"
            >
              <Loader2 v-if="phoneSubmitting" :size="15" class="animate-spin" />
              Verify & sign in
            </button>
          </div>
        </div>
        <!-- ════════════════════════════
             VIEW: FORGOT PASSWORD
        ════════════════════════════ -->
        <div v-else-if="view === 'forgot'" key="forgot">
          <button
            class="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 mb-7 transition-colors group"
            @click="go('email')"
          >
            <ArrowLeft :size="14" class="group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>

          <div class="mb-7">
            <h2 class="text-xl font-bold text-slate-900 tracking-tight">Reset your password</h2>
            <p class="text-slate-500 mt-1 text-sm">Enter your email and we'll send you a reset link.</p>
          </div>

          <div class="space-y-4">
            <div class="space-y-1.5">
              <label for="forgot-email" class="block text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Email
              </label>
              <input
                id="forgot-email"
                v-model="forgotEmail"
                type="email"
                placeholder="you@example.com"
                autocomplete="email"
                :disabled="forgotSubmitting || !!forgotMsg"
                class="w-full h-11 rounded-xl border border-slate-200
                       bg-white px-4 text-sm text-slate-900
                       placeholder:text-slate-300
                       focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                       disabled:opacity-50 transition-all shadow-sm"
                @keydown.enter.prevent="handleForgotPassword"
              />
            </div>

            <div v-if="forgotError"
                 class="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3"
                 role="alert">
              <span class="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              {{ forgotError }}
            </div>
            <div v-if="forgotMsg"
                 class="flex items-start gap-2.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl px-4 py-3"
                 role="status">
              <span class="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              {{ forgotMsg }}
            </div>

            <button
              :disabled="forgotSubmitting || !forgotEmail.trim() || !!forgotMsg"
              class="w-full h-11 flex items-center justify-center gap-2 rounded-xl
                     bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2
                     disabled:opacity-40 disabled:pointer-events-none
                     active:scale-[0.99] transition-all shadow-sm"
              @click="handleForgotPassword"
            >
              <Loader2 v-if="forgotSubmitting" :size="15" class="animate-spin" />
              Send reset link
            </button>

            <p v-if="forgotMsg" class="text-center text-sm text-slate-500">
              <button
                class="font-semibold text-slate-800 hover:text-teal-600 underline underline-offset-2 transition-colors"
                @click="go('email')"
              >
                Back to sign in
              </button>
            </p>
          </div>
        </div>
        </Transition>

      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.fade-enter-from   { opacity: 0; transform: translateY(6px); }
.fade-leave-to     { opacity: 0; transform: translateY(-6px); }
</style>
