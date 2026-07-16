import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { accountApi, categoryApi, messageApi } from '@/api'
import { loadUserInfo, saveUserInfo, clearUserInfo, normalizeUserInfo } from '@/utils/auth'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref(loadUserInfo())
  const noReadCount = ref(0)
  let authPromise = null

  const isLoggedIn = computed(() => !!normalizeUserInfo(userInfo.value))

  function setUser(info) {
    const normalized = saveUserInfo(info)
    userInfo.value = normalized
    return normalized
  }

  async function autoLogin() {
    try {
      const res = await accountApi.autoLogin()
      const user = normalizeUserInfo(res.data ?? res)
      if (user) {
        userInfo.value = saveUserInfo(user)
        fetchNoReadCount()
        return true
      }
      userInfo.value = null
      clearUserInfo()
      return false
    } catch {
      userInfo.value = null
      clearUserInfo()
      return false
    }
  }

  /** 进入需登录页面前先尝试 cookie 自动登录 */
  async function ensureAuth() {
    if (isLoggedIn.value) return true
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
    const user = normalizeUserInfo(res.data ?? res)
    if (!user) {
      throw new Error('登录成功但未返回用户信息')
    }
    setUser(user)
    fetchNoReadCount()
    return res
  }

  async function logout() {
    try {
      await accountApi.logout()
    } finally {
      userInfo.value = null
      clearUserInfo()
      noReadCount.value = 0
      authPromise = null
    }
  }

  async function fetchNoReadCount() {
    if (!isLoggedIn.value) return
    try {
      const res = await messageApi.getNoReadCount()
      noReadCount.value = res.data || 0
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
