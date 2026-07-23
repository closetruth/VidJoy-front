import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores'

const authMeta = { requiresAuth: true }

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/category/:categoryId',
    name: 'Category',
    component: () => import('@/views/CategoryPage.vue')
  },
  {
    path: '/video/:videoId',
    name: 'Video',
    component: () => import('@/views/VideoDetail.vue')
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/Search.vue')
  },
  {
    path: '/user/:userId',
    name: 'UserHome',
    component: () => import('@/views/UserHome.vue')
  },
  {
    path: '/account',
    component: () => import('@/layouts/AccountLayout.vue'),
    redirect: '/account/home',
    meta: authMeta,
    children: [
      { path: 'home', name: 'AccountHome', component: () => import('@/views/account/AccountHome.vue'), meta: { ...authMeta, title: '个人中心' } },
      { path: 'videos', name: 'AccountVideos', component: () => import('@/views/account/AccountVideos.vue'), meta: { ...authMeta, title: '我的投稿' } },
      { path: 'collection', name: 'AccountCollection', component: () => import('@/views/account/AccountCollection.vue'), meta: { ...authMeta, title: '我的收藏' } },
      { path: 'history', name: 'AccountHistory', component: () => import('@/views/History.vue'), meta: { ...authMeta, title: '历史记录' } },
      { path: 'message', name: 'AccountMessage', component: () => import('@/views/Message.vue'), meta: { ...authMeta, title: '我的消息' } },
      { path: 'settings', name: 'AccountSettings', component: () => import('@/views/account/AccountSettings.vue'), meta: { ...authMeta, title: '账号设置' } }
    ]
  },
  {
    path: '/history',
    redirect: '/account/history'
  },
  {
    path: '/message',
    redirect: '/account/message'
  },
  {
    path: '/upload/:videoId?',
    name: 'Upload',
    component: () => import('@/views/Upload.vue'),
    meta: authMeta
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true

  const userStore = useUserStore()
  const authed = await userStore.ensureAuth()

  if (!authed) {
    return { path: '/', query: { login: '1', redirect: to.fullPath } }
  }
  return true
})

export default router
