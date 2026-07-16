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

    <div v-if="loading" class="loading-spinner">加载中</div>
    <div v-else-if="videoList.length" class="video-list">
      <div v-for="video in videoList" :key="video.videoId" class="video-item">
        <router-link :to="`/video/${video.videoId}`" class="cover-link">
          <img :src="getResourceUrl(video.videoCover)" alt="" />
          <span class="status-tag" :class="statusClass(video.status)">{{ statusLabel(video.status) }}</span>
        </router-link>
        <div class="video-info">
          <router-link :to="`/video/${video.videoId}`" class="title">{{ video.videoName }}</router-link>
          <p class="meta">
            {{ formatCount(video.playCount) }} 播放 · {{ formatDate(video.createTime) }}
          </p>
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
import { ucenterApi } from '@/api'
import { formatCount, formatDate, getResourceUrl } from '@/utils/format'

const videoList = ref([])
const loading = ref(false)
const pageNo = ref(1)
const hasMore = ref(true)
const status = ref('')
const keyword = ref('')
const counts = reactive({})

const statusTabs = [
  { value: '', label: '全部', countKey: 'allCount' },
  { value: '1', label: '审核中', countKey: 'auditCount' },
  { value: '2', label: '已通过', countKey: 'passCount' },
  { value: '3', label: '未通过', countKey: 'failCount' }
]

const STATUS_MAP = {
  0: { label: '转码中', class: 'info' },
  1: { label: '待审核', class: 'warning' },
  2: { label: '已通过', class: 'success' },
  3: { label: '未通过', class: 'danger' }
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
    Object.assign(counts, res.data || {})
  } catch {
    // ignore
  }
}

async function loadList(reset = false) {
  if (loading.value) return
  loading.value = true
  if (reset) pageNo.value = 1

  try {
    const data = new FormData()
    data.append('status', status.value)
    data.append('pageNo', String(pageNo.value))
    data.append('videoNameFuzzy', keyword.value)

    const res = await ucenterApi.loadVideoList(data)
    const list = res.data?.list || res.data || []
    videoList.value = reset ? list : [...videoList.value, ...list]
    hasMore.value = list.length >= 20
  } catch {
    if (reset) videoList.value = []
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

.empty-tip {
  text-align: center;
  padding: 60px;
  color: var(--bili-text-tertiary);

  a { color: var(--bili-pink); }
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
