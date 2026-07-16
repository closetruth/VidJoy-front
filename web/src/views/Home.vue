<template>
  <div class="home-page">
    <!-- 轮播推荐区 -->
    <section v-if="recommendList.length" class="banner-section container">
      <div class="banner-main">
        <router-link
          v-if="recommendList[0]"
          :to="`/video/${recommendList[0].videoId}`"
          class="banner-item main"
        >
          <img :src="getResourceUrl(recommendList[0].videoCover)" :alt="recommendList[0].videoName" />
          <div class="banner-info">
            <h2>{{ recommendList[0].videoName }}</h2>
          </div>
        </router-link>
      </div>
      <div class="banner-side">
        <router-link
          v-for="item in recommendList.slice(1, 5)"
          :key="item.videoId"
          :to="`/video/${item.videoId}`"
          class="banner-item side"
        >
          <img :src="getResourceUrl(item.videoCover)" :alt="item.videoName" />
          <div class="banner-info">
            <p>{{ item.videoName }}</p>
          </div>
        </router-link>
      </div>
    </section>

    <!-- 视频列表 -->
    <section class="video-section container">
      <div class="section-header">
        <h2 class="section-title">推荐视频</h2>
        <button v-if="loading" class="refresh-btn" disabled>加载中...</button>
        <button v-else class="refresh-btn" @click="loadVideos(true)">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
          换一换
        </button>
      </div>

      <div v-if="loading && !videoList.length" class="loading-spinner">加载中</div>
      <div v-else-if="videoList.length" class="video-grid">
        <VideoCard v-for="video in videoList" :key="video.videoId" :video="video" />
      </div>
      <div v-else class="empty-state">
        <p>暂无视频</p>
      </div>

      <div v-if="hasMore && !loading" class="load-more">
        <button class="btn-outline" @click="loadMore">加载更多</button>
      </div>
      <div v-if="loading && videoList.length" class="loading-more">加载中...</div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import VideoCard from '@/components/video/VideoCard.vue'
import { videoApi } from '@/api'
import { getResourceUrl } from '@/utils/format'

const recommendList = ref([])
const videoList = ref([])
const loading = ref(false)
const pageNo = ref(1)
const hasMore = ref(true)

async function loadRecommend() {
  try {
    const res = await videoApi.loadRecommendVideo()
    recommendList.value = res.data || []
  } catch {
    recommendList.value = []
  }
}

async function loadVideos(reset = false) {
  if (loading.value) return
  loading.value = true
  if (reset) {
    pageNo.value = 1
    hasMore.value = true
  }

  try {
    const data = new FormData()
    data.append('pCategoryId', '0')
    data.append('categoryId', '0')
    data.append('pageNo', String(pageNo.value))

    const res = await videoApi.loadVideo(data)
    const list = res.data?.list || res.data || []

    if (reset) {
      videoList.value = list
    } else {
      videoList.value.push(...list)
    }

    hasMore.value = list.length >= 20
  } catch {
    if (reset) videoList.value = []
    hasMore.value = false
  } finally {
    loading.value = false
  }
}

function loadMore() {
  pageNo.value++
  loadVideos()
}

onMounted(() => {
  loadRecommend()
  loadVideos(true)
})
</script>

<style scoped lang="scss">
.banner-section {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  height: 280px;
}

.banner-main {
  flex: 1.6;
}

.banner-side {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 12px;
}

.banner-item {
  position: relative;
  display: block;
  border-radius: var(--bili-radius);
  overflow: hidden;
  background: #e3e5e7;

  &.main {
    height: 100%;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
  }

  &:hover img {
    transform: scale(1.03);
  }
}

.banner-info {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 40px 16px 12px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: #fff;

  h2 {
    font-size: 16px;
    font-weight: 500;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  p {
    font-size: 13px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--bili-text-secondary);
  transition: color 0.2s, background 0.2s;

  &:hover:not(:disabled) {
    color: var(--bili-pink);
    background: rgba(251, 114, 153, 0.08);
  }
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px 16px;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: var(--bili-text-tertiary);
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

.loading-more {
  text-align: center;
  padding: 20px;
  color: var(--bili-text-tertiary);
}

@media (max-width: 900px) {
  .banner-section {
    flex-direction: column;
    height: auto;
  }

  .banner-main .banner-item {
    height: 200px;
  }
}
</style>
