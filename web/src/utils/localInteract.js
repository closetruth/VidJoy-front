function readList(key) {
  try {
    const raw = localStorage.getItem(key)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function writeList(key, list) {
  localStorage.setItem(key, JSON.stringify(list))
}

function snapshot(video) {
  return {
    videoId: video.videoId,
    videoName: video.videoName,
    videoCover: video.videoCover,
    nickName: video.nickName,
    userId: video.userId,
    playCount: video.playCount,
    duration: video.duration,
    lastPlayTime: Date.now()
  }
}

const HISTORY_KEY = 'vidjoy_watch_history'
const COLLECT_KEY = 'vidjoy_collections'
const LIKE_KEY = 'vidjoy_likes'
const COIN_KEY = 'vidjoy_coins'

export function addWatchHistory(video) {
  if (!video?.videoId) return
  const list = readList(HISTORY_KEY).filter((item) => item.videoId !== video.videoId)
  list.unshift(snapshot(video))
  writeList(HISTORY_KEY, list.slice(0, 100))
}

export function getWatchHistory() {
  return readList(HISTORY_KEY)
}

export function removeWatchHistory(videoId) {
  writeList(
    HISTORY_KEY,
    readList(HISTORY_KEY).filter((item) => item.videoId !== videoId)
  )
}

export function clearWatchHistory() {
  writeList(HISTORY_KEY, [])
}

export function getCollections() {
  return readList(COLLECT_KEY)
}

export function isCollected(videoId) {
  return readList(COLLECT_KEY).some((item) => item.videoId === videoId)
}

export function toggleCollect(video) {
  if (!video?.videoId) return false
  const list = readList(COLLECT_KEY)
  const exists = list.some((item) => item.videoId === video.videoId)
  writeList(
    COLLECT_KEY,
    exists ? list.filter((item) => item.videoId !== video.videoId) : [snapshot(video), ...list]
  )
  return !exists
}

/** 与后端收藏状态同步到本地（个人中心收藏页暂无独立接口时使用） */
export function setCollected(video, collected) {
  if (!video?.videoId) return
  const list = readList(COLLECT_KEY)
  const exists = list.some((item) => item.videoId === video.videoId)
  if (collected && !exists) {
    writeList(COLLECT_KEY, [snapshot(video), ...list])
  } else if (!collected && exists) {
    writeList(COLLECT_KEY, list.filter((item) => item.videoId !== video.videoId))
  }
}

export function isLiked(videoId) {
  return readList(LIKE_KEY).includes(videoId)
}

export function toggleLike(videoId) {
  const list = readList(LIKE_KEY)
  const exists = list.includes(videoId)
  writeList(LIKE_KEY, exists ? list.filter((id) => id !== videoId) : [videoId, ...list])
  return !exists
}

export function isCoined(videoId) {
  return readList(COIN_KEY).includes(videoId)
}

export function addCoin(videoId) {
  if (!videoId || isCoined(videoId)) return false
  writeList(COIN_KEY, [videoId, ...readList(COIN_KEY)])
  return true
}
