import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
  withCredentials: true
})

function isSuccess(res) {
  if (!res || typeof res !== 'object') return false
  if (res.code === 200 || res.code === 0) return true
  if (res.status === 'success' || res.info === 'success') return true
  return false
}

request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (isSuccess(res)) return res
    return Promise.reject(new Error(res.info || res.msg || res.message || '请求失败'))
  },
  (error) => {
    const msg = error.response?.data?.info || error.response?.data?.msg || error.message || '网络错误'
    return Promise.reject(new Error(msg))
  }
)

export default request
