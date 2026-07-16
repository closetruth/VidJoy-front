export function normalizeUserInfo(data) {
  if (!data) return null

  // 兼容 { userInfo: {...} } 嵌套结构
  if (data.userInfo && typeof data.userInfo === 'object') {
    return normalizeUserInfo(data.userInfo)
  }

  const userId = data.userId ?? data.user_id ?? data.id
  if (userId == null || userId === '') return null

  return {
    ...data,
    userId: String(userId),
    nickName: data.nickName ?? data.nick_name ?? data.nickname ?? '',
    avatar: data.avatar ?? data.userAvatar ?? data.avatarUrl ?? '',
    email: data.email ?? ''
  }
}

export function isUserLoggedIn() {
  return !!normalizeUserInfo(loadUserInfo())
}

export function loadUserInfo() {
  try {
    const raw = localStorage.getItem('userInfo')
    if (!raw || raw === 'null' || raw === 'undefined') return null
    return normalizeUserInfo(JSON.parse(raw))
  } catch {
    return null
  }
}

export function saveUserInfo(info) {
  const normalized = normalizeUserInfo(info)
  if (normalized) {
    localStorage.setItem('userInfo', JSON.stringify(normalized))
    return normalized
  }
  localStorage.removeItem('userInfo')
  return null
}

export function clearUserInfo() {
  localStorage.removeItem('userInfo')
}
