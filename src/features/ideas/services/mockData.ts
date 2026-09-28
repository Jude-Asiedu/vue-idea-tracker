import type { Idea } from '@/features/ideas/types/idea.types'

const now = new Date().toISOString()

export const MOCK_IDEAS: Idea[] = [
  {
    id: 'demo-1', user_id: 'demo-user', deleted_at: null,
    title: 'AI-Powered Code Review Bot',
    description: '## Overview\nBuild a GitHub bot that uses Claude API to review PRs automatically.\n\n## User Stories\n- As a developer, I want automated code review so I can catch issues before human review\n- As a team lead, I want configurable severity thresholds\n\n## Scope\n- GitHub App integration\n- Configurable rule sets\n- PR comment threading',
    status: 'in_progress', impact: 5, effort: 4,
    tags: ['ai', 'tooling', 'devex'], created_at: now, updated_at: now,
  },
  {
    id: 'demo-2', user_id: 'demo-user', deleted_at: null,
    title: 'Dark Mode Toggle',
    description: '## Overview\nAdd a system-aware dark mode to the app.\n\n## Notes\nUse CSS custom properties + `prefers-color-scheme` media query. Store override in localStorage.',
    status: 'backlog', impact: 2, effort: 1,
    tags: ['ui', 'accessibility'], created_at: now, updated_at: now,
  },
  {
    id: 'demo-3', user_id: 'demo-user', deleted_at: null,
    title: 'Real-time Collaboration',
    description: '## Overview\nAllow multiple users to see each other\'s cursor and edits live.\n\n## Tech Options\n- Supabase Realtime\n- Y.js CRDT\n- Liveblocks',
    status: 'in_research', impact: 5, effort: 5,
    tags: ['realtime', 'collaboration', 'infrastructure'], created_at: now, updated_at: now,
  },
  {
    id: 'demo-4', user_id: 'demo-user', deleted_at: null,
    title: 'Keyboard Shortcut System',
    description: '## Overview\nAdd a global shortcut palette (⌘K) for power users.',
    status: 'backlog', impact: 3, effort: 2,
    tags: ['ux', 'accessibility', 'productivity'], created_at: now, updated_at: now,
  },
  {
    id: 'demo-5', user_id: 'demo-user', deleted_at: null,
    title: 'CSV Export',
    description: '## Overview\nExport all ideas to a CSV file for reporting.',
    status: 'shipped', impact: 3, effort: 1,
    tags: ['export', 'data'], created_at: now, updated_at: now,
  },
  {
    id: 'demo-6', user_id: 'demo-user', deleted_at: null,
    title: 'Mobile Native App',
    description: '## Overview\nBuild iOS + Android apps using Capacitor wrapping this web app.',
    status: 'backlog', impact: 4, effort: 5,
    tags: ['mobile', 'native', 'infrastructure'], created_at: now, updated_at: now,
  },
  {
    id: 'demo-7', user_id: 'demo-user', deleted_at: null,
    title: 'Onboarding Flow',
    description: '## Overview\nStep-by-step guided tour for new users.',
    status: 'in_research', impact: 4, effort: 2,
    tags: ['onboarding', 'ux'], created_at: now, updated_at: now,
  },
  {
    id: 'demo-8', user_id: 'demo-user', deleted_at: null,
    title: 'Slack Integration',
    description: '## Overview\nPost a digest of weekly idea activity to a Slack channel.',
    status: 'backlog', impact: 2, effort: 3,
    tags: ['integrations', 'notifications'], created_at: now, updated_at: now,
  },
  {
    id: 'demo-9', user_id: 'demo-user', deleted_at: null,
    title: 'Analytics Dashboard',
    description: '## Overview\nTrack velocity: ideas shipped per week, avg time in each status.',
    status: 'backlog', impact: 3, effort: 4,
    tags: ['analytics', 'dashboard'], created_at: now, updated_at: now,
  },
  {
    id: 'demo-10', user_id: 'demo-user', deleted_at: null,
    title: 'Public Roadmap Page',
    description: '## Overview\nRead-only public view of shipped and in-progress ideas.',
    status: 'shipped', impact: 4, effort: 2,
    tags: ['public', 'roadmap', 'marketing'], created_at: now, updated_at: now,
  },
]
