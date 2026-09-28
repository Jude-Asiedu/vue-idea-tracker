import { ref } from 'vue'

// Shared state for the "create idea" modal — lifted here so any view can trigger it.
const isOpen = ref(false)
const defaultStatus = ref<string>('backlog')

export function useIdeaCreator() {
  function openCreator(status: string = 'backlog') {
    defaultStatus.value = status
    isOpen.value = true
  }

  function closeCreator() {
    isOpen.value = false
  }

  return { isOpen, defaultStatus, openCreator, closeCreator }
}
