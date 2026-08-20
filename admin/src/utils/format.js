export function formatCount(num) {
  if (num == null) return '0'
  const n = Number(num)
  if (Number.isNaN(n)) return String(num)
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万'
  return String(n)
}

export function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

export function getResourceUrl(sourceName) {
  if (!sourceName) return ''
  if (sourceName.startsWith('http')) return sourceName
  let path = String(sourceName).replace(/\\/g, '/').replace(/^\/+/, '')
  if (!path) return ''
  if (path.startsWith('file/')) path = path.slice(5)
  // admin 后端: projectFolder + file/ + sourceName（需保留 cover/ 前缀）
  if (!path.startsWith('cover/') && !path.startsWith('temp/') && !path.startsWith('video/')) {
    if (/^\d{4}-\d{2}\//.test(path) || /^\d{8}\//.test(path)) {
      path = `cover/${path}`
    }
  }
  return `/api/admin/file/getResource?sourceName=${encodeURIComponent(path)}`
}

/** 兼容 camelCase / snake_case 字段 */
export function pickField(obj, ...keys) {
  if (!obj) return ''
  for (const key of keys) {
    const val = obj[key]
    if (val != null && val !== '') return val
  }
  return ''
}

export const VIDEO_STATUS = {
  0: { label: '转码中', type: 'info' },
  1: { label: '转码失败', type: 'danger' },
  2: { label: '待审核', type: 'warning' },
  3: { label: '已通过', type: 'success' },
  4: { label: '未通过', type: 'danger' }
}

export const USER_STATUS = {
  0: { label: '禁用', type: 'danger' },
  1: { label: '正常', type: 'success' }
}
