import { videoApi } from '@/api'
import { buildLoadVideoParams, normalizeVideoList } from '@/utils/format'

export async function fetchPublicVideoPages(maxPages = 8) {
  const all = []
  for (let page = 1; page <= maxPages; page++) {
    const res = await videoApi.loadVideo(buildLoadVideoParams({ pageNo: page }))
    const payload = res.data || {}
    const list = normalizeVideoList(payload)
    all.push(...list)
    const pageSize = payload.pageSize || 15
    const totalCount = payload.totalCount ?? all.length
    if (!list.length || page * pageSize >= totalCount) break
  }
  return all
}

export async function fetchRelatedVideos(currentVideoId, limit = 10) {
  const list = await fetchPublicVideoPages(3)
  return list.filter((item) => item.videoId !== currentVideoId).slice(0, limit)
}
