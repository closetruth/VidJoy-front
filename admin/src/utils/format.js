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
  return `/api/admin/file/getResource?sourceName=${encodeURIComponent(sourceName)}`
}

export const VIDEO_STATUS = {
  0: { label: '转码中', type: 'info' },
  1: { label: '待审核', type: 'warning' },
  2: { label: '已通过', type: 'success' },
  3: { label: '未通过', type: 'danger' },
  4: { label: '已删除', type: 'info' }
}

export const USER_STATUS = {
  0: { label: '禁用', type: 'danger' },
  1: { label: '正常', type: 'success' }
}
