<template>
  <div class="account-home">
    <div class="stat-row">
      <div class="stat-item">
        <span class="num">{{ formatCount(countInfo.allCount || countInfo.videoCount) }}</span>
        <span class="label">投稿</span>
      </div>
      <div class="stat-item">
        <span class="num">{{ formatCount(countInfo.fansCount) }}</span>
        <span class="label">粉丝</span>
      </div>
      <div class="stat-item">
        <span class="num">{{ formatCount(countInfo.focusCount) }}</span>
        <span class="label">关注</span>
      </div>
      <div class="stat-item">
        <span class="num">{{ formatCount(countInfo.currentCoin || userStore.userInfo?.currentCoin) }}</span>
        <span class="label">硬币</span>
      </div>
    </div>

    <div class="quick-actions">
      <router-link to="/upload" class="action-card">
        <span class="icon">📤</span>
        <span>投稿视频</span>
      </router-link>
      <router-link to="/account/videos" class="action-card">
        <span class="icon">🎬</span>
        <span>管理投稿</span>
      </router-link>
      <router-link to="/account/history" class="action-card">
        <span class="icon">🕐</span>
        <span>观看历史</span>
      </router-link>
      <router-link to="/account/settings" class="action-card">
        <span class="icon">⚙️</span>
        <span>账号设置</span>
      </router-link>
    </div>

    <section class="section">
      <div class="section-header">
        <h2>最近投稿</h2>
        <router-link to="/account/videos" class="more">查看全部 →</router-link>
      </div>
      <div v-if="loading" class="loading-spinner">加载中</div>
      <div v-else-if="videoList.length" class="video-grid">
        <VideoCard v-for="video in videoList" :key="video.videoId" :video="video" />
      </div>
      <div v-else class="empty-tip">
        还没有投稿，
        <router-link to="/upload">去投稿</router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import VideoCard from '@/components/video/VideoCard.vue'
import { useUserStore } from '@/stores'
import { ucenterApi, accountApi, uhomeApi } from '@/api'
import { formatCount, normalizeVideoList } from '@/utils/format'

const userStore = useUserStore()
const videoList = ref([])
const countInfo = ref({})
const loading = ref(true)

async function loadData() {
  loading.value = true
  try {
    const [videoRes, countRes, userCountRes, profileRes] = await Promise.all([
      ucenterApi.loadVideoList({ pageNo: 1 }),
      ucenterApi.getVideoCountInfo().catch(() => ({ data: {} })),
      accountApi.getUserCountInfo().catch(() => ({ data: {} })),
      userStore.userInfo?.userId
        ? uhomeApi.getUserInfo(userStore.userInfo.userId).catch(() => ({ data: {} }))
        : Promise.resolve({ data: {} })
    ])
    videoList.value = normalizeVideoList(videoRes.data).slice(0, 4)
    countInfo.value = {
      ...(userCountRes.data || {}),
      ...(profileRes.data || {}),
      ...(countRes.data || {})
    }
  } catch {
    videoList.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-item {
  background: #fff;
  border-radius: var(--bili-radius);
  padding: 20px;
  text-align: center;
  box-shadow: var(--bili-shadow);

  .num {
    display: block;
    font-size: 24px;
    font-weight: 600;
    color: var(--bili-pink);
    margin-bottom: 4px;
  }

  .label {
    font-size: 13px;
    color: var(--bili-text-tertiary);
  }
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  background: #fff;
  border-radius: var(--bili-radius);
  box-shadow: var(--bili-shadow);
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    color: var(--bili-pink);
    transform: translateY(-2px);
  }

  .icon {
    font-size: 28px;
  }
}

.section {
  background: #fff;
  border-radius: var(--bili-radius);
  padding: 20px;
  box-shadow: var(--bili-shadow);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  h2 {
    font-size: 16px;
    font-weight: 600;
  }

  .more {
    font-size: 13px;
    color: var(--bili-text-tertiary);

    &:hover {
      color: var(--bili-pink);
    }
  }
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.empty-tip {
  text-align: center;
  padding: 40px;
  color: var(--bili-text-tertiary);

  a {
    color: var(--bili-pink);
  }
}

@media (max-width: 768px) {
  .stat-row,
  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
