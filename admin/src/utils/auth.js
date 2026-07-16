export function isAdminLoggedIn() {
  try {
    const raw = localStorage.getItem('adminInfo')
    if (!raw || raw === 'null' || raw === 'undefined') return false
    const info = JSON.parse(raw)
    return !!(info && (info.account || info.accountName || info.userId || info.token))
  } catch {
    return false
  }
}

export function getAdminDisplayName(info) {
  if (!info) return '管理员'
  return info.accountName || info.account || info.nickName || info.userName || '管理员'
}
