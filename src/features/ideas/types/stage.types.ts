export interface StageColor {
  id: string
  dot: string
  header: string
  badge: string
  swatch: string
}

export const STAGE_COLOR_PALETTE: StageColor[] = [
  { id: 'slate',   dot: 'bg-slate-400',   header: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',       swatch: 'bg-slate-400'   },
  { id: 'red',     dot: 'bg-red-500',     header: 'bg-red-500',     badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',             swatch: 'bg-red-500'     },
  { id: 'orange',  dot: 'bg-orange-400',  header: 'bg-orange-400',  badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', swatch: 'bg-orange-400'  },
  { id: 'amber',   dot: 'bg-amber-400',   header: 'bg-amber-400',   badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',     swatch: 'bg-amber-400'   },
  { id: 'yellow',  dot: 'bg-yellow-400',  header: 'bg-yellow-400',  badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300', swatch: 'bg-yellow-400'  },
  { id: 'lime',    dot: 'bg-lime-500',    header: 'bg-lime-500',    badge: 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300',         swatch: 'bg-lime-500'    },
  { id: 'green',   dot: 'bg-green-500',   header: 'bg-green-500',   badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',     swatch: 'bg-green-500'   },
  { id: 'emerald', dot: 'bg-emerald-500', header: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', swatch: 'bg-emerald-500' },
  { id: 'teal',    dot: 'bg-teal-500',    header: 'bg-teal-500',    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',         swatch: 'bg-teal-500'    },
  { id: 'cyan',    dot: 'bg-cyan-500',    header: 'bg-cyan-500',    badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',         swatch: 'bg-cyan-500'    },
  { id: 'sky',     dot: 'bg-sky-500',     header: 'bg-sky-500',     badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',             swatch: 'bg-sky-500'     },
  { id: 'blue',    dot: 'bg-blue-500',    header: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',         swatch: 'bg-blue-500'    },
  { id: 'indigo',  dot: 'bg-indigo-500',  header: 'bg-indigo-500',  badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300', swatch: 'bg-indigo-500'  },
  { id: 'violet',  dot: 'bg-violet-500',  header: 'bg-violet-500',  badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', swatch: 'bg-violet-500'  },
  { id: 'purple',  dot: 'bg-purple-500',  header: 'bg-purple-500',  badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', swatch: 'bg-purple-500'  },
  { id: 'pink',    dot: 'bg-pink-500',    header: 'bg-pink-500',    badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',         swatch: 'bg-pink-500'    },
  { id: 'rose',    dot: 'bg-rose-500',    header: 'bg-rose-500',    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',         swatch: 'bg-rose-500'    },
]

export interface Stage {
  id: string
  label: string
  color: string
  order: number
}

export const DEFAULT_STAGES: Stage[] = [
  { id: 'backlog',     label: 'Backlog',     color: 'slate',   order: 0 },
  { id: 'in_research', label: 'In Research', color: 'amber',   order: 1 },
  { id: 'in_progress', label: 'In Progress', color: 'blue',    order: 2 },
  { id: 'shipped',     label: 'Shipped',     color: 'emerald', order: 3 },
]
