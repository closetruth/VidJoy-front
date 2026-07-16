export function formatCount(num) {
  if (num == null || num === '') return '0'
  const n = Number(num)
  if (Number.isNaN(n)) return String(num)
  if (n >= 10000) {
    return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万'
  }
  return String(n)
}

export function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '00:00'
  const s = Math.floor(Number(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function formatTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`
  if (diff < day) return `${Math.floor(diff / hour)}小时前`
  if (diff < 7 * day) return `${Math.floor(diff / day)}天前`
  return date.toLocaleDateString('zh-CN')
}

export function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

export function getResourceUrl(sourceName) {
  if (!sourceName) return ''
  if (sourceName.startsWith('http')) return sourceName
  return `/api/file/getResource?sourceName=${encodeURIComponent(sourceName)}`
}
