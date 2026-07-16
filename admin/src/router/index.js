import { createRouter, createWebHistory } from 'vue-router'
import { isAdminLoggedIn } from '@/utils/auth'

const authMeta = { requiresAuth: true }

const routes = [
  {
    path: '/admin/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { guest: true }
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/admin/dashboard',
    meta: authMeta,
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/Dashboard.vue'), meta: { ...authMeta, title: '数据概览' } },
      { path: 'category', name: 'Category', component: () => import('@/views/CategoryManage.vue'), meta: { ...authMeta, title: '分类管理' } },
      { path: 'video', name: 'Video', component: () => import('@/views/VideoManage.vue'), meta: { ...authMeta, title: '视频管理' } },
      { path: 'user', name: 'User', component: () => import('@/views/UserManage.vue'), meta: { ...authMeta, title: '用户管理' } },
      { path: 'danmu', name: 'Danmu', component: () => import('@/views/DanmuManage.vue'), meta: { ...authMeta, title: '弹幕管理' } },
      { path: 'comment', name: 'Comment', component: () => import('@/views/CommentManage.vue'), meta: { ...authMeta, title: '评论管理' } },
      { path: 'setting', name: 'Setting', component: () => import('@/views/Setting.vue'), meta: { ...authMeta, title: '系统设置' } }
    ]
  },
  { path: '/login', redirect: '/admin/login' },
  { path: '/dashboard', redirect: '/admin/dashboard' },
  { path: '/category', redirect: '/admin/category' },
  { path: '/video', redirect: '/admin/video' },
  { path: '/user', redirect: '/admin/user' },
  { path: '/danmu', redirect: '/admin/danmu' },
  { path: '/comment', redirect: '/admin/comment' },
  { path: '/setting', redirect: '/admin/setting' },
  { path: '/', redirect: '/admin/dashboard' },
  { path: '/:pathMatch(.*)*', redirect: '/admin/dashboard' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const loggedIn = isAdminLoggedIn()
  if (to.meta.requiresAuth && !loggedIn) {
    next({ path: '/admin/login', query: { redirect: to.fullPath } })
  } else if (to.meta.guest && loggedIn) {
    next('/admin/dashboard')
  } else {
    next()
  }
})

export default router
