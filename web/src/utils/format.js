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
  if (!sourceName) return ''
  if (sourceName.startsWith('http')) return sourceName
  const path = normalizeResourcePath(sourceName)
  if (!path) return ''
  return `/api/file/getResource?sourceName=${encodeURIComponent(path)}`
}

export function pickField(obj, ...keys) {
  if (!obj) return ''
  for (const key of keys) {
    const val = obj[key]
    if (val != null && val !== '') return val
  }
  return ''
}

/** 列表接口返回的单条视频归一化 */
export function normalizeVideoItem(item) {
  if (!item || typeof item !== 'object') return item
  return {
    ...item,
    videoId: pickField(item, 'videoId', 'video_id') || item.videoId,
    videoName: pickField(item, 'videoName', 'video_name') || item.videoName,
    videoCover: pickField(item, 'videoCover', 'video_cover') || item.videoCover,
    nickName: pickField(item, 'nickName', 'nick_name') || item.nickName,
    userId: pickField(item, 'userId', 'user_id') || item.userId,
    userAvatar: pickField(item, 'userAvatar', 'user_avatar', 'avatar') || item.userAvatar,
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
