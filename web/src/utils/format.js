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

/** 后端 getResource 拼 projectFolder + file/ + sourceName，需保留 cover/ 等前缀 */
export function normalizeResourcePath(sourceName) {
  let path = String(sourceName || '').replace(/\\/g, '/').replace(/^\/+/, '')
  if (!path) return ''
  if (path.startsWith('file/')) path = path.slice(5)
  if (
    !path.startsWith('cover/') &&
    !path.startsWith('temp/') &&
    !path.startsWith('video/') &&
    !path.startsWith('avatar/') &&
    (/^\d{8}\//.test(path) || /^\d{4}-\d{2}\//.test(path))
  ) {
    path = `cover/${path}`
  }
  return path
}

export function getResourceUrl(sourceName) {
  if (sourceName == null || sourceName === '') return ''
  const raw = String(sourceName).trim()
  if (!raw || raw === 'null' || raw === 'undefined') return ''
  if (raw.startsWith('http')) return raw
  const path = normalizeResourcePath(raw)
  if (!path) return ''
  return `/api/file/getResource?sourceName=${encodeURIComponent(path)}`
}

/** 头像 URL，无图时用占位 */
export function getAvatarUrl(sourceName) {
  return (
    getResourceUrl(sourceName) ||
    'https://i0.hdslb.com/bfs/face/member/face/placeholder.jpg'
  )
}

export function pickField(obj, ...keys) {
  if (!obj) return ''
  for (const key of keys) {
    const val = obj[key]
    if (val == null) continue
    const s = String(val).trim()
    if (!s || s === 'null' || s === 'undefined') continue
    return s
  }
  return ''
}

/** 列表接口返回的单条视频归一化 */
export function normalizeVideoItem(item) {
  if (!item || typeof item !== 'object') return item
  const userAvatar =
    pickField(item, 'userAvatar', 'user_avatar', 'avatar') ||
    pickField(item.userInfo, 'avatar', 'userAvatar') ||
    pickField(item.user_info, 'avatar', 'userAvatar')
  return {
    ...item,
    videoId: pickField(item, 'videoId', 'video_id') || item.videoId,
    videoName: pickField(item, 'videoName', 'video_name') || item.videoName,
    videoCover: pickField(item, 'videoCover', 'video_cover') || item.videoCover,
    nickName: pickField(item, 'nickName', 'nick_name') || item.nickName,
    userId: pickField(item, 'userId', 'user_id') || item.userId,
    userAvatar,
    avatar: userAvatar || pickField(item, 'avatar') || item.avatar,
    pCategoryId: pickField(item, 'pCategoryId', 'pcategoryId', 'p_category_id') || item.pCategoryId,
    playCount: pickField(item, 'playCount', 'play_count') || item.playCount || 0,
    danmuCount: pickField(item, 'danmuCount', 'danmu_count') || item.danmuCount || 0,
    duration: pickField(item, 'duration') || item.duration || 0
  }
}

export function normalizeVideoList(payload) {
  if (Array.isArray(payload)) return payload.map(normalizeVideoItem)
  const list = payload?.list || payload?.records || []
  return list.map(normalizeVideoItem)
}

/** 去掉 HTML 标签（搜索高亮标题的纯文本） */
export function stripHtml(html) {
  return String(html ?? '').replace(/<[^>]*>/g, '')
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeRegExp(text) {
  return String(text ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 按关键词高亮标题（不依赖 ES 是否返回 span）
 * 先去标签再 escape，再包裹匹配片段。
 */
export function highlightKeyword(text, keyword) {
  const plain = stripHtml(text)
  const kw = String(keyword ?? '').trim()
  if (!kw) return escapeHtml(plain)
  const re = new RegExp(escapeRegExp(kw), 'gi')
  let result = ''
  let last = 0
  let match
  while ((match = re.exec(plain)) !== null) {
    result += escapeHtml(plain.slice(last, match.index))
    result += `<span class="highlight">${escapeHtml(match[0])}</span>`
    last = match.index + match[0].length
    if (match[0].length === 0) re.lastIndex++
  }
  result += escapeHtml(plain.slice(last))
  return result
}

/**
 * ES 搜索高亮：先整体转义，再只还原后端的 &lt;span class='highlight'&gt;
 * 搜索页优先用 highlightKeyword；此函数保留兼容。
 */
export function formatHighlightTitle(html) {
  const escaped = escapeHtml(html)
  return escaped
    .replace(/&lt;span class=['"]highlight['"]&gt;/g, '<span class="highlight">')
    .replace(/&lt;\/span&gt;/g, '</span>')
}

/** 分页结果拆包 */
export function unwrapPagination(payload) {
  if (Array.isArray(payload)) {
    const list = payload.map(normalizeVideoItem)
    return { list, pageNo: 1, pageTotal: 1, totalCount: list.length, pageSize: list.length }
  }
  if (!payload || typeof payload !== 'object') {
    return { list: [], pageNo: 1, pageTotal: 1, totalCount: 0, pageSize: 15 }
  }
  const list = normalizeVideoList(payload)
  return {
    list,
    pageNo: Number(payload.pageNo ?? 1) || 1,
    pageTotal: Number(payload.pageTotal ?? 1) || 1,
    totalCount: Number(payload.totalCount ?? list.length) || 0,
    pageSize: Number(payload.pageSize ?? 15) || 15
  }
}

/** getVideoInfo 返回 VideoInfoResultVO { videoInfo, userActionList } */
export function unwrapVideoInfo(payload) {
  if (!payload || typeof payload !== 'object') return null
  const info = payload.videoInfo || payload
  return normalizeVideoItem(info)
}

/** 与后端 UserActionTypeEnum 一致 */
export const USER_ACTION_TYPE = {
  COMMENT_LIKE: 0,
  COMMENT_HATE: 1,
  VIDEO_LIKE: 2,
  VIDEO_COLLECT: 3,
  VIDEO_COIN: 4
}

/** 空间主题 1–10，对应后端 UserInfo.theme */
export const USER_THEME_PRESETS = [
  { id: 1, name: '樱花粉', gradient: 'linear-gradient(135deg, #fb7299 0%, #ff9db5 100%)' },
  { id: 2, name: '天空蓝', gradient: 'linear-gradient(135deg, #00a1d6 0%, #6dd5fa 100%)' },
  { id: 3, name: '薄荷绿', gradient: 'linear-gradient(135deg, #2ecc71 0%, #82e0aa 100%)' },
  { id: 4, name: '暮光紫', gradient: 'linear-gradient(135deg, #8e44ad 0%, #c39bd3 100%)' },
  { id: 5, name: '暖阳橙', gradient: 'linear-gradient(135deg, #e67e22 0%, #f5b041 100%)' },
  { id: 6, name: '深夜灰', gradient: 'linear-gradient(135deg, #2c3e50 0%, #5d6d7e 100%)' },
  { id: 7, name: '珊瑚红', gradient: 'linear-gradient(135deg, #e74c3c 0%, #f1948a 100%)' },
  { id: 8, name: '青玉', gradient: 'linear-gradient(135deg, #16a085 0%, #48c9b0 100%)' },
  { id: 9, name: '靛金', gradient: 'linear-gradient(135deg, #1a5276 0%, #f4d03f 100%)' },
  { id: 10, name: '樱夜', gradient: 'linear-gradient(135deg, #4a235a 0%, #fb7299 100%)' }
]

export function getUserThemeGradient(theme) {
  const id = Number(theme) || 1
  const preset = USER_THEME_PRESETS.find((item) => item.id === id) || USER_THEME_PRESETS[0]
  return preset.gradient
}

export function applyUserActionList(list) {
  const actions = { liked: false, coined: false, collected: false }
  if (!Array.isArray(list)) return actions
  for (const item of list) {
    const type = Number(item?.actionType ?? item?.action_type)
    if (type === USER_ACTION_TYPE.VIDEO_LIKE) actions.liked = true
    if (type === USER_ACTION_TYPE.VIDEO_COLLECT) actions.collected = true
    if (type === USER_ACTION_TYPE.VIDEO_COIN) actions.coined = true
  }
  return actions
}

const DEVICE_ID_KEY = 'vidjoy_device_id'

export function getDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY)
    if (!id) {
      id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
      localStorage.setItem(DEVICE_ID_KEY, id)
    }
    return id
  } catch {
    return `tmp-${Date.now()}`
  }
}

/** loadVideo 查询参数：0 不能传给后端，否则会被当成有效分类 ID 过滤 */
export function buildLoadVideoParams({ pCategoryId, categoryId, pageNo } = {}) {
  const params = {}
  if (pageNo != null) params.pageNo = pageNo

  const pId = Number(pCategoryId)
  const cId = Number(categoryId)
  if (Number.isFinite(pId) && pId > 0) params.pCategoryId = pId
  if (Number.isFinite(cId) && cId > 0) params.categoryId = cId

  return params
}
