<template>
  <div class="user-home">
    <div class="user-banner" :style="bannerStyle">
      <div class="container banner-content">
        <img :src="avatarUrl" class="user-avatar" alt="" />
        <div class="user-info">
          <h1 class="nickname">{{ displayName }}</h1>
          <p class="intro">{{ userInfo?.personIntroduction || '这个人很懒，什么都没写' }}</p>
          <div class="user-stats">
            <span><strong>{{ formatCount(userInfo?.focusCount) }}</strong> 关注</span>
            <span><strong>{{ formatCount(userInfo?.fansCount) }}</strong> 粉丝</span>
            <span><strong>{{ formatCount(videoList.length) }}</strong> 投稿</span>
          </div>
        </div>
        <button
          v-if="showFollowBtn"
          class="btn-primary follow-btn"
          @click="toggleFollow"
        >
          {{ followed ? '已关注' : '+ 关注' }}
        </button>
      </div>
    </div>

    <div class="container user-content">
      <div class="tab-bar">
        <button class="tab" :class="{ active: tab === 'video' }" @click="tab = 'video'">投稿</button>
        <button class="tab" :class="{ active: tab === 'collection' }" @click="tab = 'collection'">收藏</button>
      </div>

      <div v-if="loading" class="loading-spinner">加载中</div>
      <div v-else-if="displayList.length" class="video-grid">
        <VideoCard v-for="video in displayList" :key="video.videoId" :video="video" />
      </div>
      <div v-else class="empty-state">{{ tab === 'video' ? '暂无投稿' : '暂无公开收藏' }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import VideoCard from '@/components/video/VideoCard.vue'
import { useUserStore } from '@/stores'
import { uhomeApi } from '@/api'
import { formatCount, getResourceUrl, normalizeVideoList } from '@/utils/format'
import { fetchPublicVideoPages } from '@/utils/videoList'

const route = useRoute()
const userStore = useUserStore()
const userId = computed(() => String(route.params.userId || ''))

const userInfo = ref(null)
const videoList = ref([])
const collectionList = ref([])
const loading = ref(true)
const followed = ref(false)
const tab = ref('video')

const displayName = computed(() => userInfo.value?.nickName || videoList.value[0]?.nickName || '用户')
const avatarUrl = computed(() => {
  return getResourceUrl(userInfo.value?.avatar || videoList.value[0]?.userAvatar)
    || 'https://i0.hdslb.com/bfs/face/member/face/placeholder.jpg'
})
const bannerStyle = computed(() => ({
  background: 'linear-gradient(135deg, #fb7299 0%, #ff9db5 100%)'
}))
const showFollowBtn = computed(() => {
  return userStore.isLoggedIn && userStore.userInfo?.userId !== userId.value
})
const displayList = computed(() => (tab.value === 'video' ? videoList.value : collectionList.value))

async function loadUser() {
  loading.value = true
  try {
    const res = await uhomeApi.getUserInfo(userId.value)
    userInfo.value = res.data || {}
    followed.value = Boolean(res.data?.haveFocus)
  } catch {
    userInfo.value = null
    followed.value = false
  }

  try {
    const videoRes = await uhomeApi.loadVideoList({ userId: userId.value, pageNo: 1 })
    videoList.value = normalizeVideoList(videoRes.data)
    if (!videoList.value.length) {
      const all = await fetchPublicVideoPages(8)
      videoList.value = all.filter((item) => String(item.userId) === userId.value)
    }
  } catch {
    try {
      const all = await fetchPublicVideoPages(8)
      videoList.value = all.filter((item) => String(item.userId) === userId.value)
    } catch {
      videoList.value = []
    }
  }

  try {
    const data = new FormData()
    data.append('userId', userId.value)
    data.append('pageNo', '1')
    const colRes = await uhomeApi.loadUserCollection(data)
    collectionList.value = normalizeVideoList(colRes.data)
  } catch {
    collectionList.value = []
  } finally {
    loading.value = false
  }
}

async function toggleFollow() {
  if (followed.value) {
    await uhomeApi.cancelFocus(userId.value)
  } else {
    await uhomeApi.focus(userId.value)
  }
  followed.value = !followed.value
}

watch(userId, loadUser)
onMounted(loadUser)
</script>

<style scoped lang="scss">
.user-banner {
  padding: 40px 0;
  margin-bottom: 20px;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 24px;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid #fff;
  object-fit: cover;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  color: #fff;

  .nickname {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .intro {
    font-size: 14px;
    opacity: 0.9;
    margin-bottom: 12px;
  }
}

.user-stats {
  display: flex;
  gap: 24px;
  font-size: 14px;

  strong {
    font-size: 16px;
    margin-right: 4px;
  }
}

.follow-btn {
  flex-shrink: 0;
}

.tab-bar {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--bili-border);
  padding-bottom: 12px;
}

.tab {
  font-size: 16px;
  color: var(--bili-text-tertiary);
  padding-bottom: 8px;
  border-bottom: 2px solid transparent;

  &.active {
    color: var(--bili-pink);
    border-bottom-color: var(--bili-pink);
    font-weight: 500;
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
</style>
