<template>
  <div class="video-detail">
    <div v-if="loading" class="loading-spinner container">加载中</div>
    <template v-else-if="videoInfo">
      <div class="video-main container">
        <div class="player-area">
          <VideoPlayer
            :src="videoSrc"
            :poster="getResourceUrl(videoInfo.videoCover)"
            :danmu-list="danmuList"
            :show-danmu-input="userStore.isLoggedIn"
            @send-danmu="handleSendDanmu"
          />

          <div class="video-episodes" v-if="episodes.length > 1">
            <button
              v-for="(ep, index) in episodes"
              :key="ep.fileId"
              class="ep-btn"
              :class="{ active: currentFileId === ep.fileId }"
              @click="switchEpisode(ep)"
            >
              P{{ index + 1 }} {{ ep.fileName }}
            </button>
          </div>

          <div class="video-info-bar">
            <h1 class="video-title">{{ videoInfo.videoName }}</h1>
            <div class="video-stats">
              <span>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                {{ formatCount(videoInfo.playCount) }}
              </span>
              <span>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
                {{ formatCount(videoInfo.danmuCount) }}
              </span>
              <span>{{ formatTime(videoInfo.createTime) }}</span>
            </div>

            <div class="action-bar">
              <button class="action-btn" :class="{ active: liked }" @click="toggleLike">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                  <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
                </svg>
                <span>{{ formatCount(videoInfo.likeCount) }}</span>
              </button>
              <button class="action-btn" :class="{ active: coined }" @click="toggleCoin">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                  <circle cx="12" cy="12" r="10"/>
                </svg>
                <span>投币</span>
              </button>
              <button class="action-btn" :class="{ active: collected }" @click="toggleCollect">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                  <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                </svg>
                <span>收藏</span>
              </button>
              <button class="action-btn" @click="shareVideo">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11A2.99 2.99 0 0 0 18 8.92c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81A2.99 2.99 0 0 0 5 8.92c-1.66 0-3 1.34-3 3s1.34 3 3 3c1.3 0 2.4-.84 2.82-2.01l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
                </svg>
                <span>分享</span>
              </button>
            </div>
          </div>

          <CommentSection
            :video-id="videoId"
            @need-login="showLogin = true"
          />
        </div>

        <aside class="sidebar">
          <div class="uploader-card">
            <router-link :to="`/user/${videoInfo.userId}`" class="uploader-info">
              <img :src="getResourceUrl(videoInfo.userAvatar)" class="avatar" alt="" />
              <div>
                <p class="nickname">{{ videoInfo.nickName }}</p>
                <p class="intro">{{ videoInfo.personIntroduction || '这个人很懒，什么都没写' }}</p>
              </div>
            </router-link>
            <button
              v-if="userStore.isLoggedIn && userStore.userInfo.userId !== videoInfo.userId"
              class="btn-primary follow-btn"
              @click="toggleFollow"
            >
              {{ followed ? '已关注' : '+ 关注' }}
            </button>
          </div>

          <div v-if="recommendList.length" class="recommend-card">
            <h3>相关推荐</h3>
            <router-link
              v-for="item in recommendList"
              :key="item.videoId"
              :to="`/video/${item.videoId}`"
              class="recommend-item"
            >
              <img :src="getResourceUrl(item.videoCover)" alt="" />
              <div>
                <p class="title">{{ item.videoName }}</p>
                <p class="meta">{{ formatCount(item.playCount) }}播放 · {{ item.nickName }}</p>
              </div>
            </router-link>
          </div>
        </aside>
      </div>
    </template>

    <LoginDialog v-model:visible="showLogin" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import VideoPlayer from '@/components/video/VideoPlayer.vue'
import CommentSection from '@/components/video/CommentSection.vue'
import LoginDialog from '@/components/auth/LoginDialog.vue'
import { useUserStore } from '@/stores'
import { videoApi, danmuApi, userActionApi, uhomeApi } from '@/api'
import { formatCount, formatTime, getResourceUrl } from '@/utils/format'

const route = useRoute()
const userStore = useUserStore()
const videoId = computed(() => route.params.videoId)

const videoInfo = ref(null)
const episodes = ref([])
const currentFileId = ref('')
const danmuList = ref([])
const recommendList = ref([])
const loading = ref(true)
const liked = ref(false)
const coined = ref(false)
const collected = ref(false)
const followed = ref(false)
const showLogin = ref(false)

const videoSrc = computed(() => {
  if (!currentFileId.value) return ''
  return `/api/file/videoResource/${currentFileId.value}`
})

async function loadVideo() {
  loading.value = true
  try {
    const res = await videoApi.getVideoInfo(videoId.value)
    videoInfo.value = res.data

    const epRes = await videoApi.loadVideoPList(videoId.value)
    episodes.value = epRes.data || []
    if (episodes.value.length) {
      currentFileId.value = episodes.value[0].fileId
      loadDanmu()
    }

    const recRes = await videoApi.getVideoRecommend(videoId.value)
    recommendList.value = recRes.data || []
  } catch {
    videoInfo.value = null
  } finally {
    loading.value = false
  }
}

async function loadDanmu() {
  if (!currentFileId.value) return
  try {
    const data = new FormData()
    data.append('fileId', currentFileId.value)
    data.append('videoId', videoId.value)
    const res = await danmuApi.loadDanmu(data)
    danmuList.value = res.data || []
  } catch {
    danmuList.value = []
  }
}

function switchEpisode(ep) {
  currentFileId.value = ep.fileId
  loadDanmu()
}

async function handleSendDanmu({ text, time }) {
  const data = new FormData()
  data.append('videoId', videoId.value)
  data.append('fileId', currentFileId.value)
  data.append('text', text)
  data.append('mode', '0')
  data.append('color', '16777215')
  data.append('time', String(time))
  await danmuApi.postDanmu(data)
  loadDanmu()
}

async function doUserAction(actionType) {
  if (!userStore.isLoggedIn) {
    showLogin.value = true
    return false
  }
  const data = new FormData()
  data.append('videoId', videoId.value)
  data.append('actionType', actionType)
  data.append('actionCount', '1')
  data.append('commentId', '0')
  await userActionApi.doAction(data)
  return true
}

async function toggleLike() {
  if (await doUserAction('2')) liked.value = !liked.value
}

async function toggleCoin() {
  if (await doUserAction('3')) coined.value = !coined.value
}

async function toggleCollect() {
  if (await doUserAction('4')) collected.value = !collected.value
}

async function toggleFollow() {
  if (!userStore.isLoggedIn) {
    showLogin.value = true
    return
  }
  if (followed.value) {
    await uhomeApi.cancelFocus(videoInfo.value.userId)
  } else {
    await uhomeApi.focus(videoInfo.value.userId)
  }
  followed.value = !followed.value
}

function shareVideo() {
  navigator.clipboard?.writeText(window.location.href)
  alert('链接已复制到剪贴板')
}

watch(videoId, loadVideo)
onMounted(loadVideo)
</script>

<style scoped lang="scss">
.video-detail {
  padding-bottom: 40px;
}

.video-main {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
  align-items: start;
}

.player-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.video-episodes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  background: #fff;
  border-radius: var(--bili-radius);
}

.ep-btn {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--bili-text-secondary);
  background: #f6f7f8;
  transition: all 0.2s;

  &:hover {
    color: var(--bili-pink);
  }

  &.active {
    background: var(--bili-pink);
    color: #fff;
  }
}

.video-info-bar {
  background: #fff;
  border-radius: var(--bili-radius);
  padding: 20px;
}

.video-title {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 12px;
}

.video-stats {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: var(--bili-text-tertiary);
  margin-bottom: 16px;

  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.action-bar {
  display: flex;
  gap: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--bili-border);
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--bili-text-secondary);
  font-size: 12px;
  transition: color 0.2s;

  &:hover,
  &.active {
    color: var(--bili-pink);
  }
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: calc(var(--bili-header-height) + 16px);
}

.uploader-card,
.recommend-card {
  background: #fff;
  border-radius: var(--bili-radius);
  padding: 16px;
}

.uploader-info {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;

  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
  }

  .nickname {
    font-weight: 500;
    margin-bottom: 4px;
  }

  .intro {
    font-size: 12px;
    color: var(--bili-text-tertiary);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.follow-btn {
  width: 100%;
  height: 36px;
}

.recommend-card h3 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
}

.recommend-item {
  display: flex;
  gap: 10px;
  padding: 8px 0;

  &:not(:last-child) {
    border-bottom: 1px solid var(--bili-border);
  }

  img {
    width: 120px;
    height: 68px;
    border-radius: 4px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .title {
    font-size: 13px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 4px;
    transition: color 0.2s;
  }

  &:hover .title {
    color: var(--bili-pink);
  }

  .meta {
    font-size: 12px;
    color: var(--bili-text-tertiary);
  }
}

@media (max-width: 1100px) {
  .video-main {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
  }
}
</style>
