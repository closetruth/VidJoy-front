<template>
  <div class="search-page container">
    <div class="search-header">
      <h1>搜索结果: {{ keyword }}</h1>
      <span class="result-count" v-if="!loading">共 {{ totalCount }} 个结果</span>
    </div>

    <div v-if="loading" class="loading-spinner">搜索中</div>
    <div v-else-if="videoList.length" class="video-grid">
      <VideoCard v-for="video in videoList" :key="video.videoId" :video="video" />
    </div>
    <div v-else class="empty-state">
      <p>没有找到相关视频</p>
      <p class="hint">换个关键词试试吧</p>
    </div>

    <div v-if="hasMore && !loading" class="load-more">
      <button class="btn-outline" @click="loadMore">加载更多</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import VideoCard from '@/components/video/VideoCard.vue'
import { videoApi } from '@/api'
import { normalizeVideoList } from '@/utils/format'
import { fetchPublicVideoPages } from '@/utils/videoList'

const route = useRoute()
const keyword = computed(() => String(route.query.keyword || '').trim())
const videoList = ref([])
const loading = ref(false)
const pageNo = ref(1)
const totalCount = ref(0)
const hasMore = ref(false)

function matchKeyword(video, kw) {
  const text = [video.videoName, video.nickName, video.tags, video.introduction]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return text.includes(kw.toLowerCase())
}

async function searchByLocal() {
  const all = await fetchPublicVideoPages(8)
  const matched = all.filter((item) => matchKeyword(item, keyword.value))
  videoList.value = matched
  totalCount.value = matched.length
  hasMore.value = false
}

async function search(reset = false) {
  if (!keyword.value) {
    videoList.value = []
    totalCount.value = 0
    hasMore.value = false
    return
  }
  if (loading.value) return
  loading.value = true
  if (reset) pageNo.value = 1

  try {
    const data = new FormData()
    data.append('keyword', keyword.value)
    data.append('pageNo', String(pageNo.value))
    const res = await videoApi.search(data)
    const payload = res.data || {}
    const list = normalizeVideoList(payload)
    totalCount.value = payload.totalCount ?? list.length
    videoList.value = reset ? list : [...videoList.value, ...list]
    hasMore.value = list.length >= 20
    if (reset && !list.length) await searchByLocal()
  } catch {
    if (reset) await searchByLocal()
  } finally {
    loading.value = false
  }
}

function loadMore() {
  pageNo.value++
  search()
}

watch(keyword, () => search(true))
onMounted(() => search(true))
</script>

<style scoped lang="scss">
.search-page {
  padding: 20px 0 40px;
}

.search-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 24px;

  h1 {
    font-size: 20px;
    font-weight: 600;
  }

  .result-count {
    font-size: 14px;
    color: var(--bili-text-tertiary);
  }
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px 16px;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: var(--bili-text-tertiary);

  .hint {
    margin-top: 8px;
    font-size: 13px;
  }
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}
</style>
