<template>
  <div class="account-videos">
    <div class="filter-bar">
      <button
        v-for="tab in statusTabs"
        :key="tab.value"
        class="filter-tab"
        :class="{ active: status === tab.value }"
        @click="changeStatus(tab.value)"
      >
        {{ tab.label }}
        <span v-if="counts[tab.countKey] != null" class="count">({{ counts[tab.countKey] }})</span>
      </button>
      <input
        v-model="keyword"
        class="search-input"
        placeholder="搜索我的视频"
        @keyup.enter="loadList(true)"
      />
    </div>

    <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

    <div v-if="loading" class="loading-spinner">加载中</div>
    <div v-else-if="videoList.length" class="video-list">
      <div v-for="video in videoList" :key="video.videoId" class="video-item">
        <router-link :to="`/video/${video.videoId}`" class="cover-link">
          <img :src="coverUrl(pickField(video, 'videoCover', 'video_cover'))" alt="" @error="onCoverError" />
          <span class="status-tag" :class="statusClass(video.status)">{{ statusLabel(video.status) }}</span>
        </router-link>
        <div class="video-info">
          <router-link :to="`/video/${video.videoId}`" class="title">{{ videoTitle(video) }}</router-link>
          <p class="meta">
            {{ formatCount(video.playCount) }} 播放 · {{ formatDate(video.createTime) }}
          </p>
          <div class="actions">
            <button
              v-if="canEditVideo(video.status)"
              type="button"
              class="action-btn edit-btn"
              @click="goEdit(video.videoId)"
            >
              编辑
            </button>
            <button
              type="button"
              class="action-btn delete-btn"
              @click="deleteVideo(video)"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="empty-tip">
      暂无视频，<router-link to="/upload">去投稿</router-link>
    </div>

    <div v-if="hasMore && !loading" class="load-more">
      <button class="btn-outline" @click="loadMore">加载更多</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ucenterApi } from '@/api'
import { formatCount, formatDate, getResourceUrl, pickField, normalizeVideoItem } from '@/utils/format'

const router = useRouter()

const videoList = ref([])
const loading = ref(false)
const errorMsg = ref('')
const pageNo = ref(1)
const hasMore = ref(true)
const status = ref('')
const keyword = ref('')
const counts = reactive({})

const statusTabs = [
  { value: '', label: '全部', countKey: 'allCount' },
  { value: '-1', label: '转码中', countKey: 'processingCount' },
  { value: '2', label: '审核中', countKey: 'auditCount' },
  { value: '3', label: '已通过', countKey: 'passCount' },
  { value: '4', label: '未通过', countKey: 'failCount' }
]

const STATUS_MAP = {
  0: { label: '转码中', class: 'info' },
  1: { label: '转码失败', class: 'danger' },
  2: { label: '待审核', class: 'warning' },
  3: { label: '已通过', class: 'success' },
  4: { label: '未通过', class: 'danger' }
}

const EDITABLE_STATUS = new Set([1, 3, 4])

function canEditVideo(status) {
  return EDITABLE_STATUS.has(Number(status))
}

const COVER_PLACEHOLDER = 'https://i0.hdslb.com/bfs/archive/placeholder.jpg'

function coverUrl(sourceName) {
  return getResourceUrl(sourceName) || COVER_PLACEHOLDER
}

function videoTitle(video) {
  return pickField(video, 'videoName', 'video_name') || '未命名视频'
}

function onCoverError(e) {
  e.target.src = COVER_PLACEHOLDER
}

function goEdit(videoId) {
  router.push(`/upload/${videoId}`)
}

async function deleteVideo(video) {
  if (!confirm(`确定删除「${videoTitle(video)}」？删除后无法恢复。`)) return
  try {
    await ucenterApi.deleteVideo(video.videoId)
    videoList.value = videoList.value.filter((item) => item.videoId !== video.videoId)
    loadCounts()
  } catch (e) {
    errorMsg.value = e?.message || '删除失败'
  }
}

function statusLabel(s) {
  return STATUS_MAP[s]?.label || '未知'
}

function statusClass(s) {
  return STATUS_MAP[s]?.class || 'info'
}

function changeStatus(val) {
  status.value = val
  loadList(true)
}

async function loadCounts() {
  try {
    const res = await ucenterApi.getVideoCountInfo()
    const data = res.data || {}
    Object.assign(counts, data)
    const { allCount = 0, auditCount = 0, passCount = 0, failCount = 0 } = data
    counts.processingCount = Math.max(0, allCount - auditCount - passCount - failCount)
  } catch {
    // ignore
  }
}

function buildListParams() {
  const params = {
    pageNo: pageNo.value
  }
  if (status.value !== '') {
    params.status = Number(status.value)
  }
  const kw = keyword.value.trim()
  if (kw) {
    params.videoNameFuzzy = kw
  }
  return params
}

async function loadList(reset = false) {
  if (loading.value) return
  loading.value = true
  if (reset) pageNo.value = 1

  try {
    const res = await ucenterApi.loadVideoList(buildListParams())
    const payload = res.data || {}
    const list = (payload.list || payload.records || []).map(normalizeVideoItem)
    const pageSize = payload.pageSize || 15
    const totalCount = payload.totalCount ?? 0
    const currentPage = payload.pageNo || pageNo.value

    videoList.value = reset ? list : [...videoList.value, ...list]
    hasMore.value = currentPage * pageSize < totalCount
    errorMsg.value = ''
  } catch (e) {
    if (reset) videoList.value = []
    errorMsg.value = e?.message || '加载视频列表失败'
  } finally {
    loading.value = false
  }
}

function loadMore() {
  pageNo.value++
  loadList()
}

onMounted(() => {
  loadCounts()
  loadList(true)
})
</script>

<style scoped lang="scss">
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.filter-tab {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--bili-text-secondary);
  background: #f6f7f8;

  &.active {
    background: rgba(251, 114, 153, 0.1);
    color: var(--bili-pink);
    font-weight: 500;
  }

  .count {
    font-size: 12px;
    opacity: 0.8;
  }
}

.search-input {
  margin-left: auto;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--bili-border);
  border-radius: 6px;
  font-size: 13px;
  min-width: 180px;
}

.video-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.video-item {
  display: flex;
  gap: 16px;
  padding: 12px;
  background: #fff;
  border-radius: var(--bili-radius);
  box-shadow: var(--bili-shadow);
}

.cover-link {
  position: relative;
  flex-shrink: 0;

  img {
    width: 160px;
    height: 90px;
    border-radius: 6px;
    object-fit: cover;
    background: #e3e5e7;
  }
}

.status-tag {
  position: absolute;
  top: 6px;
  left: 6px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  color: #fff;

  &.success { background: #00b42a; }
  &.warning { background: #ff7d00; }
  &.danger { background: #f53f3f; }
  &.info { background: #86909c; }
}

.video-info {
  flex: 1;

  .title {
    font-size: 15px;
    font-weight: 500;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 8px;

    &:hover {
      color: var(--bili-pink);
    }
  }

  .meta {
    font-size: 13px;
    color: var(--bili-text-tertiary);
  }
}

.actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.edit-btn {
  color: var(--bili-pink);
  background: rgba(251, 114, 153, 0.08);
  border: 1px solid rgba(251, 114, 153, 0.25);

  &:hover:not(:disabled) {
    background: rgba(251, 114, 153, 0.14);
  }
}

.delete-btn {
  color: #f53f3f;
  background: rgba(245, 63, 63, 0.08);
  border: 1px solid rgba(245, 63, 63, 0.22);

  &:hover:not(:disabled) {
    background: rgba(245, 63, 63, 0.14);
  }
}

.empty-tip {
  text-align: center;
  padding: 60px;
  color: var(--bili-text-tertiary);

  a { color: var(--bili-pink); }
}

.error-msg {
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(245, 63, 63, 0.08);
  border: 1px solid rgba(245, 63, 63, 0.22);
  color: #f53f3f;
  font-size: 13px;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
