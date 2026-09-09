const TOKEN_KEY = 'vidjoy_token'

export function saveToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, String(token))
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function loadToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function clearAuthSession() {
  clearUserInfo()
  clearToken()
}

function pickNonEmpty(...values) {
  for (const v of values) {
    if (v == null) continue
    const s = String(v).trim()
    if (s && s !== 'null' && s !== 'undefined') return s
  }
  return ''
}

/** 保存 login / autoLogin 返回的 TokenUserInfoDto */
export function saveAuthSession(data) {
  if (!data || typeof data !== 'object') {
    clearAuthSession()
    return null
  }
  if (data.token) saveToken(data.token)
  const user = normalizeUserInfo(data)
  if (user) {
    saveUserInfo(user)
    return user
  }
  clearAuthSession()
  return null
}

/**
 * 兼容 TokenUserInfoDto：顶层 nickName/avatar + 嵌套 userInfo
 * 改头像后 Redis 常只更新顶层字段，必须合并两边
 */
export function normalizeUserInfo(data) {
  if (!data || typeof data !== 'object') return null

  const nested =
    data.userInfo && typeof data.userInfo === 'object' && !Array.isArray(data.userInfo)
      ? data.userInfo
      : null

  const source = nested ? { ...nested, ...data } : data
  const userId = pickNonEmpty(
    source.userId,
    source.user_id,
    source.id,
    nested?.userId,
    nested?.user_id,
    data.userId,
    data.user_id
  )
  if (!userId) return null

  const nickName = pickNonEmpty(
    data.nickName,
    data.nick_name,
    data.nickname,
    nested?.nickName,
    nested?.nick_name,
    nested?.nickname,
    source.nickName
  )
  const avatar = pickNonEmpty(
    data.avatar,
    data.userAvatar,
    data.avatarUrl,
    nested?.avatar,
    nested?.userAvatar,
    source.avatar
  )

  const { userInfo: _ignoreNested, token: _ignoreToken, ...rest } = source
  return {
    ...rest,
    userId: String(userId),
    nickName,
    avatar,
    email: pickNonEmpty(source.email, nested?.email, data.email),
    currentCoin: Number(source.currentCoin ?? source.current_coin ?? nested?.currentCoin ?? 0) || 0
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

export { TOKEN_KEY }
