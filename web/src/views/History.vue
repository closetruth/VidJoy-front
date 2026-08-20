<template>
  <div class="history-page">
    <div class="page-actions">
      <button v-if="historyList.length" class="btn-outline" @click="cleanAll">清空历史</button>
    </div>

    <div v-if="loading" class="loading-spinner">加载中</div>
    <div v-else-if="historyList.length" class="history-list">
      <router-link
        v-for="item in historyList"
        :key="item.videoId"
        :to="`/video/${item.videoId}`"
        class="history-item"
      >
        <img :src="getResourceUrl(item.videoCover)" class="cover" alt="" />
        <div class="info">
          <h3>{{ item.videoName }}</h3>
          <p class="meta">{{ item.nickName }} · {{ formatTime(item.lastPlayTime) }}</p>
        </div>
        <button class="del-btn" @click.prevent="removeItem(item.videoId)">×</button>
      </router-link>
    </div>
    <div v-else class="empty-state">暂无观看历史</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { historyApi } from '@/api'
import { formatTime, getResourceUrl, normalizeVideoList } from '@/utils/format'
import { getWatchHistory, removeWatchHistory, clearWatchHistory } from '@/utils/localInteract'

const historyList = ref([])
const loading = ref(true)
const useLocal = ref(false)

async function loadHistory() {
  loading.value = true
  try {
    const res = await historyApi.loadHistory()
    const list = normalizeVideoList(res.data)
    historyList.value = list.length ? list : getWatchHistory()
    useLocal.value = !list.length
  } catch {
    useLocal.value = true
    historyList.value = getWatchHistory()
  } finally {
    loading.value = false
  }
}

async function removeItem(videoId) {
  if (useLocal.value) {
    removeWatchHistory(videoId)
  } else {
    try {
      await historyApi.delHistory(videoId)
    } catch {
      removeWatchHistory(videoId)
    }
  }
  historyList.value = historyList.value.filter((h) => h.videoId !== videoId)
}

async function cleanAll() {
  if (!confirm('确定清空所有历史记录？')) return
  if (useLocal.value) {
    clearWatchHistory()
  } else {
    try {
      await historyApi.cleanHistory()
    } catch {
      clearWatchHistory()
    }
  }
  historyList.value = []
}

onMounted(loadHistory)
</script>

<style scoped lang="scss">
.page-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: #fff;
  border-radius: var(--bili-radius);
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: var(--bili-shadow);
  }
}

.cover {
  width: 160px;
  height: 90px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.info {
  flex: 1;

  h3 {
    font-size: 15px;
    font-weight: 500;
    margin-bottom: 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .meta {
    font-size: 13px;
    color: var(--bili-text-tertiary);
  }
}

.del-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 20px;
  color: var(--bili-text-tertiary);
  flex-shrink: 0;

  &:hover {
    background: #f6f7f8;
    color: var(--bili-pink);
  }
}

.empty-state {
  text-align: center;
  padding: 80px;
  color: var(--bili-text-tertiary);
}
</style>
