import axios from 'axios'

const request = axios.create({
  baseURL: '/api/admin',
  timeout: 30000,
  withCredentials: true
})

function isSuccess(res) {
  if (!res || typeof res !== 'object') return false
  if (res.code === 200 || res.code === 0) return true
  if (res.status === 'success' || res.info === 'success') return true
  return false
}

function handleAuthError() {
  localStorage.removeItem('adminInfo')
  if (!window.location.pathname.includes('/admin/login')) {
    window.location.href = '/admin/login'
  }
}

request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (isSuccess(res)) return res
    // 登录超时 / 未登录
    if (res.code === 901 || res.code === 403 || String(res.info || '').includes('登录')) {
      handleAuthError()
    }
    return Promise.reject(new Error(res.info || res.msg || res.message || '请求失败'))
  },
  (error) => {
    if (error.response?.status === 401) {
      handleAuthError()
    }
    const msg = error.response?.data?.info || error.response?.data?.msg || error.message || '网络错误'
    return Promise.reject(new Error(msg))
  }
)

export default request
