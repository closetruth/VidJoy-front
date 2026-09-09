<template>
  <div class="account-collection">
    <div v-if="loading && !videoList.length" class="loading-spinner">加载中</div>
    <div v-else-if="videoList.length" class="video-grid">
      <VideoCard v-for="video in videoList" :key="video.videoId" :video="video" />
    </div>
    <div v-else class="empty-tip">暂无收藏视频，去视频页点收藏吧</div>

    <div v-if="hasMore" class="load-more">
      <button class="btn-outline" :disabled="loading" @click="loadMore">
        {{ loading ? '加载中...' : '加载更多' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import VideoCard from '@/components/video/VideoCard.vue'
import { useUserStore } from '@/stores'
import { uhomeApi } from '@/api'
import { unwrapPagination } from '@/utils/format'
import { getCollections } from '@/utils/localInteract'

const userStore = useUserStore()
const videoList = ref([])
const loading = ref(false)
const pageNo = ref(1)
const pageTotal = ref(1)
const hasMore = ref(false)

async function loadList(reset = false) {
  if (loading.value) return
  loading.value = true
  if (reset) {
    pageNo.value = 1
    videoList.value = []
  }

  const userId = userStore.userInfo?.userId
  if (!userId) {
    videoList.value = getCollections()
    hasMore.value = false
    loading.value = false
    return
  }

  try {
    const res = await uhomeApi.loadVideoCollection({
      userId,
      pageNo: pageNo.value
    })
    const page = unwrapPagination(res.data)
    videoList.value = reset ? page.list : [...videoList.value, ...page.list]
    pageNo.value = page.pageNo
    pageTotal.value = page.pageTotal
    hasMore.value = page.pageNo < page.pageTotal
    if (reset && !page.list.length) videoList.value = getCollections()
  } catch {
    if (reset) videoList.value = getCollections()
    hasMore.value = false
  } finally {
    loading.value = false
  }
}

function loadMore() {
  if (!hasMore.value || loading.value) return
  pageNo.value += 1
  loadList(false)
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
