import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { hasSupabaseConfig } from '@/lib/env'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/auth', component: () => import('@/features/auth/views/AuthView.vue') },

    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/board' },
        { path: 'board',  component: () => import('@/features/ideas/views/BoardView.vue') },
        { path: 'matrix', component: () => import('@/features/ideas/views/MatrixView.vue') },
        { path: 'table',  component: () => import('@/features/ideas/views/TableView.vue') },
        { path: 'trash',  component: () => import('@/features/ideas/views/TrashView.vue') },
      ],
    },

    {
      path: '/demo',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { isDemo: true },
      children: [
        { path: '', redirect: '/demo/board' },
        { path: 'board',  component: () => import('@/features/ideas/views/BoardView.vue') },
        { path: 'matrix', component: () => import('@/features/ideas/views/MatrixView.vue') },
        { path: 'table',  component: () => import('@/features/ideas/views/TableView.vue') },
        { path: 'trash',  component: () => import('@/features/ideas/views/TrashView.vue') },
      ],
    },

    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!hasSupabaseConfig && !to.meta['isDemo'] && to.path !== '/demo') return '/demo/board'
  if (to.meta['requiresAuth'] && !auth.isAuthenticated) return '/auth'
  if (to.path === '/auth' && auth.isAuthenticated) return '/board'
})

export default router
