import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { accountApi, categoryApi, messageApi } from '@/api'
import {
  loadUserInfo,
  saveAuthSession,
  clearAuthSession,
  normalizeUserInfo
} from '@/utils/auth'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref(loadUserInfo())
  const noReadCount = ref(0)
  let authPromise = null

  const isLoggedIn = computed(() => !!normalizeUserInfo(userInfo.value))

  function setUser(info) {
    const user = saveAuthSession(info)
    userInfo.value = user
    return user
  }

  async function autoLogin() {
    try {
      const res = await accountApi.autoLogin()
      const user = saveAuthSession(res.data ?? res)
      if (user) {
        fetchNoReadCount()
        return true
      }
      userInfo.value = null
      return false
    } catch {
      userInfo.value = null
      clearAuthSession()
      return false
    }
  }

  /** 向服务端校验 cookie/token，不能只看 localStorage */
  async function ensureAuth() {
    if (!authPromise) {
      authPromise = autoLogin().finally(() => {
        authPromise = null
      })
    }
    await authPromise
    return isLoggedIn.value
  }

  async function login(formData) {
    const res = await accountApi.login(formData)
    const user = saveAuthSession(res.data ?? res)
    if (!user) {
      throw new Error('登录成功但未返回用户信息')
    }
    userInfo.value = user
    fetchNoReadCount()
    return res
  }

  async function logout() {
    try {
      await accountApi.logout()
    } finally {
      userInfo.value = null
      clearAuthSession()
      noReadCount.value = 0
      authPromise = null
    }
  }

  async function fetchNoReadCount() {
    try {
      const res = await messageApi.getNoReadCount()
      const n = Number(res.data?.count ?? res.data ?? 0)
      noReadCount.value = Number.isFinite(n) ? n : 0
    } catch {
      noReadCount.value = 0
    }
  }

  return {
    userInfo,
    isLoggedIn,
    noReadCount,
    autoLogin,
    ensureAuth,
    login,
    logout,
    fetchNoReadCount,
    setUser
  }
})

export const useCategoryStore = defineStore('category', () => {
  const categories = ref([])
  const loaded = ref(false)

  async function loadCategories() {
    if (loaded.value) return categories.value
    const res = await categoryApi.loadAllCategory()
    categories.value = res.data || []
    loaded.value = true
    return categories.value
  }

  return { categories, loaded, loadCategories }
})
