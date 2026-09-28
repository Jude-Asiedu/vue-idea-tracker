// vuedraggable@next ships no TypeScript declarations.
// This shim provides the minimum typing needed for our Kanban board.
declare module 'vuedraggable' {
  import type { DefineComponent } from 'vue'

  export interface DragEvent<T> {
    item: HTMLElement
    newIndex: number
    oldIndex: number
    element: T
    clone: HTMLElement
    from: HTMLElement
    to: HTMLElement
  }

  export interface AddEvent<T> {
    item: HTMLElement
    newIndex: number
    element: T
    from: HTMLElement
    to: HTMLElement
  }

  const draggable: DefineComponent<{
    modelValue: unknown[]
    itemKey: string | ((item: unknown) => string | number)
    group?: string | { name: string; pull?: boolean | 'clone'; put?: boolean }
    tag?: string
    animation?: number
    ghostClass?: string
    chosenClass?: string
    dragClass?: string
    handle?: string
    disabled?: boolean
  }>

  export default draggable
}
