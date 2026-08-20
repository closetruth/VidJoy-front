<template>
  <div class="account-collection">
    <div v-if="loading" class="loading-spinner">加载中</div>
    <div v-else-if="videoList.length" class="video-grid">
      <VideoCard v-for="video in videoList" :key="video.videoId" :video="video" />
    </div>
    <div v-else class="empty-tip">暂无收藏视频，去视频页点收藏吧</div>

    <div v-if="hasMore && !loading" class="load-more">
      <button class="btn-outline" @click="loadMore">加载更多</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import VideoCard from '@/components/video/VideoCard.vue'
import { uhomeApi } from '@/api'
import { normalizeVideoList } from '@/utils/format'
import { getCollections } from '@/utils/localInteract'

const videoList = ref([])
const loading = ref(false)
const pageNo = ref(1)
const hasMore = ref(false)

async function loadList(reset = false) {
  if (loading.value) return
  loading.value = true
  if (reset) pageNo.value = 1

  try {
    const data = new FormData()
    data.append('pageNo', String(pageNo.value))
    const res = await uhomeApi.loadUserCollection(data)
    const list = normalizeVideoList(res.data)
    videoList.value = reset ? list : [...videoList.value, ...list]
    hasMore.value = list.length >= 20
    if (reset && !list.length) videoList.value = getCollections()
  } catch {
    if (reset) videoList.value = getCollections()
    hasMore.value = false
  } finally {
    loading.value = false
  }
}

function loadMore() {
  pageNo.value++
  loadList()
}

onMounted(() => loadList(true))
</script>

<style scoped lang="scss">
.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.empty-tip {
  text-align: center;
  padding: 60px;
  color: var(--bili-text-tertiary);
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
