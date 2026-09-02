import axios from 'axios'
import { loadToken, clearAuthSession } from '@/utils/auth'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
  withCredentials: true
})

function getWebTokenFromCookie() {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}

request.interceptors.request.use((config) => {
  const token = loadToken() || getWebTokenFromCookie()
  if (token) {
    config.headers.token = token
  }
  return config
})

function isSuccess(res) {
  if (!res || typeof res !== 'object') return false
  if (res.code === 200 || res.code === 0) return true
  if (res.status === 'success' || res.info === 'success') return true
  return false
}

function getErrorMessage(error) {
  const status = error.response?.status
  const data = error.response?.data
  if (status === 404) {
    return data?.info || '用户行为接口未就绪(404)，请在 IDEA 中重新编译并启动 easylive-web'
  }
  return data?.info || data?.msg || data?.message || error.message || '网络错误'
}

function createRequestError(error) {
  const reqError = new Error(getErrorMessage(error))
  reqError.status = error.response?.status
  reqError.isNotFound = error.response?.status === 404
  return reqError
}

export function isApiNotFoundError(error) {
  return Boolean(
    error?.isNotFound ||
    error?.status === 404 ||
    /404|接口未就绪|Not Found/i.test(error?.message || '')
  )
}

request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res?.code === 901) {
      clearAuthSession()
    }
    if (isSuccess(res)) return res
    const bizError = new Error(res.info || res.msg || res.message || '请求失败')
    bizError.code = res.code
    bizError.isNotFound = res.code === 404
    return Promise.reject(bizError)
  },
  (error) => Promise.reject(createRequestError(error))
)

export default request
