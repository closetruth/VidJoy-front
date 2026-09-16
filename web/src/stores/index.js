import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { accountApi, categoryApi, messageApi } from '@/api'
import {
  loadUserInfo,
  saveAuthSession,
  saveUserInfo,
  clearAuthSession,
  normalizeUserInfo
} from '@/utils/auth'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref(loadUserInfo())
  const noReadCount = ref(0)
  let authPromise = null

  const isLoggedIn = computed(() => !!normalizeUserInfo(userInfo.value))

  function setUser(info) {
    // 资料局部更新只写 userInfo，避免 saveAuthSession 在失败时清掉 token
    const user = saveUserInfo(info)
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

  function countFromGroup(payload) {
    if (!payload) return 0
    if (Array.isArray(payload)) {
      return payload.reduce((sum, item) => {
        const c = Number(item.messageCount ?? item.count ?? item.noReadCount ?? 0)
        return sum + (Number.isFinite(c) ? c : 0)
      }, 0)
    }
    return Object.values(payload).reduce((sum, v) => sum + (Number(v) || 0), 0)
  }

  function unwrapMessageList(payload) {
    if (Array.isArray(payload)) return payload
    return payload?.list || payload?.records || payload?.data?.list || []
  }

  function isUnreadMessage(item) {
    const flag = item?.readType ?? item?.recvType
    return Number(flag) === 0 || flag == null
  }

  /** 后端未读按 recv_type=0；库里 recv_type 为 null 时接口会返回 0，需按列表回退 */
  async function countUnreadFromLists() {
    const types = [0, 1, 2, 3, 4, 5, 6, 7]
    const lists = await Promise.all(
      types.map(async (type) => {
        try {
          const res = await messageApi.loadMessage(type, 1)
          return unwrapMessageList(res.data)
        } catch {
          return []
        }
      })
    )
    return lists.reduce((sum, list) => sum + list.filter(isUnreadMessage).length, 0)
  }

  async function fetchNoReadCount() {
    try {
      const res = await messageApi.getNoReadCount()
      let n = Number(res.data ?? 0)
      if (!Number.isFinite(n) || n <= 0) {
        try {
          const groupRes = await messageApi.getNoReadCountGroup()
          n = countFromGroup(groupRes.data)
        } catch {
          n = 0
        }
      }
      if (!n) n = await countUnreadFromLists()
      noReadCount.value = Number.isFinite(n) ? n : 0
    } catch {
      try {
        noReadCount.value = await countUnreadFromLists()
      } catch {
        noReadCount.value = 0
      }
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
