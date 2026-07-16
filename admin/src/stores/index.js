import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { accountApi } from '@/api'
import { isAdminLoggedIn, getAdminDisplayName } from '@/utils/auth'

function loadAdminInfo() {
  try {
    const raw = localStorage.getItem('adminInfo')
    if (!raw || raw === 'null') return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const useAdminStore = defineStore('admin', () => {
  const adminInfo = ref(loadAdminInfo())
  const isLoggedIn = computed(() => isAdminLoggedIn())
  const displayName = computed(() => getAdminDisplayName(adminInfo.value))

  async function login(formData) {
    const res = await accountApi.login(formData)
    const data = res.data ?? res
    if (!data || (typeof data === 'object' && !Object.keys(data).length)) {
      throw new Error('登录成功但未返回用户信息')
    }
    adminInfo.value = data
    localStorage.setItem('adminInfo', JSON.stringify(data))
    return res
  }

  async function logout() {
    try {
      await accountApi.logout()
    } finally {
      adminInfo.value = null
      localStorage.removeItem('adminInfo')
    }
  }

  return { adminInfo, isLoggedIn, displayName, login, logout }
})
