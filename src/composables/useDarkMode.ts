import { ref } from 'vue'

const isDark = ref(false)

function apply(dark: boolean) {
  isDark.value = dark
  document.documentElement.classList.toggle('dark', dark)
  localStorage.setItem('ideadeck_theme', dark ? 'dark' : 'light')
}

export function useDarkMode() {
  function toggle() { apply(!isDark.value) }

  function init() {
    const stored = localStorage.getItem('ideadeck_theme')
    apply(stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches)
  }

  return { isDark, toggle, init }
}
