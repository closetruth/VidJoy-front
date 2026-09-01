<template>
  <div class="video-detail">
    <div v-if="loading" class="loading-spinner container">加载中</div>
    <template v-else-if="videoInfo">
      <div class="video-main container">
        <div class="player-area">
          <VideoPlayer
            ref="playerRef"
            :src="videoSrc"
            :poster="getResourceUrl(videoInfo.videoCover)"
            :danmu-list="danmuList"
            :danmu-enabled="!closeDanmu"
            :show-danmu-input="userStore.isLoggedIn && !closeDanmu"
            @send-danmu="sendDanmu"
          />

          <div class="video-episodes" v-if="episodes.length > 1">
            <button
              v-for="(ep, index) in episodes"
              :key="ep.fileId"
              class="ep-btn"
              :class="{ active: currentFileId === ep.fileId }"
              @click="switchEpisode(ep)"
            >
              <span class="ep-label">P{{ ep.fileIndex ?? index + 1 }}</span>
              <span class="ep-name">{{ ep.fileName || `分P${index + 1}` }}</span>
              <span v-if="ep.duration" class="ep-duration">{{ formatDuration(ep.duration) }}</span>
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
              <span v-if="onlineCount > 0">{{ onlineCount }} 人在看</span>
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
                <span>{{ formatCount(videoInfo.coinCount) }}</span>
              </button>
              <button class="action-btn" :class="{ active: collected }" @click="toggleCollect">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                  <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                </svg>
                <span>{{ formatCount(videoInfo.collectCount) }}</span>
              </button>
              <button class="action-btn" @click="shareVideo">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11A2.99 2.99 0 0 0 18 8.92c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81A2.99 2.99 0 0 0 5 8.92c-1.66 0-3 1.34-3 3s1.34 3 3 3c1.3 0 2.4-.84 2.82-2.01l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
                </svg>
                <span>分享</span>
              </button>
            </div>
          </div>

          <div v-if="videoInfo.introduction || tagList.length" class="video-desc">
            <p v-if="tagList.length" class="tag-list">
              <span v-for="tag in tagList" :key="tag" class="tag">#{{ tag }}</span>
            </p>
            <p v-if="videoInfo.introduction" class="intro">{{ videoInfo.introduction }}</p>
          </div>

          <CommentSection
            v-if="!closeComment"
            :video-id="videoId"
            :video-user-id="videoInfo.userId"
            @need-login="showLogin = true"
          />
          <div v-else class="comment-closed">UP 主已关闭评论</div>
        </div>

        <aside class="sidebar">
          <div class="uploader-card">
            <router-link :to="`/user/${videoInfo.userId}`" class="uploader-info">
              <img :src="getResourceUrl(videoInfo.userAvatar || videoInfo.avatar)" class="avatar" alt="" />
              <div>
                <p class="nickname">{{ videoInfo.nickName }}</p>
                <p class="intro">{{ videoInfo.personIntroduction || '这个人很懒，什么都没写' }}</p>
              </div>
            </router-link>
            <button
              v-if="userStore.userInfo?.userId !== videoInfo.userId"
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import VideoPlayer from '@/components/video/VideoPlayer.vue'
import CommentSection from '@/components/video/CommentSection.vue'
import LoginDialog from '@/components/auth/LoginDialog.vue'
import { useUserStore } from '@/stores'
import { videoApi, fileApi, danmuApi, userActionApi, uhomeApi } from '@/api'
import { formatCount, formatTime, formatDuration, getResourceUrl, unwrapVideoInfo, applyUserActionList, getDeviceId, normalizeVideoList } from '@/utils/format'
import { clearAuthSession } from '@/utils/auth'
import { fetchRelatedVideos } from '@/utils/videoList'
import {
  addWatchHistory,
  isCollected,
  toggleCollect as toggleLocalCollect,
  isLiked,
  toggleLike as toggleLocalLike,
  isCoined,
  addCoin
} from '@/utils/localInteract'

const route = useRoute()
const userStore = useUserStore()
const videoId = computed(() => route.params.videoId)

const videoInfo = ref(null)
const episodes = ref([])
const currentFileId = ref('')
const recommendList = ref([])
const loading = ref(true)
const liked = ref(false)
const coined = ref(false)
const collected = ref(false)
const showLogin = ref(false)
const onlineCount = ref(0)
const danmuList = ref([])
const followed = ref(false)
const playerRef = ref(null)
const sendingDanmu = ref(false)
let onlineTimer = null

const interactionFlags = computed(() => String(videoInfo.value?.interaction || '').split(',').filter(Boolean))
const closeDanmu = computed(() => interactionFlags.value.includes('1'))
const closeComment = computed(() => interactionFlags.value.includes('0'))
const tagList = computed(() =>
  String(videoInfo.value?.tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
)

const videoSrc = computed(() => {
  if (!currentFileId.value) return ''
  return fileApi.videoPlaylistUrl(currentFileId.value)
})

function normalizeEpisodeList(data) {
  const list = Array.isArray(data) ? data : data?.list || []
  return [...list].sort((a, b) => {
    const ai = Number(a.fileIndex ?? 0)
    const bi = Number(b.fileIndex ?? 0)
    return ai - bi
  })
}

/** 获取视频分P列表，默认选中第一P */
async function loadVideoPList() {
  const epRes = await videoApi.loadVideoPList(videoId.value)
  episodes.value = normalizeEpisodeList(epRes.data ?? epRes)
  currentFileId.value = episodes.value[0]?.fileId || ''
}

function applyLocalActions(info) {
  const id = info?.videoId
  liked.value = isLiked(id)
  coined.value = isCoined(id)
  collected.value = isCollected(id)
}

async function loadVideo() {
  loading.value = true
  episodes.value = []
  currentFileId.value = ''
  liked.value = false
  coined.value = false
  collected.value = false
  onlineCount.value = 0
  stopOnlineReport()
  try {
    const res = await videoApi.getVideoInfo(videoId.value)
    const payload = res.data || {}
    videoInfo.value = unwrapVideoInfo(payload)
    const actions = applyUserActionList(payload.userActionList)
    applyLocalActions(videoInfo.value)
    if (actions.liked) liked.value = true
    if (actions.coined) coined.value = true
    if (actions.collected) collected.value = true
    followed.value = Boolean(payload.haveFocus || videoInfo.value.haveFocus)

    addWatchHistory(videoInfo.value)
    await loadVideoPList()
    startOnlineReport()
    loadDanmu()

    try {
      const rec = await videoApi.getVideoRecommend(videoId.value)
      const list = normalizeVideoList(rec.data)
      recommendList.value = list.length
        ? list.filter((item) => item.videoId !== videoId.value)
        : await fetchRelatedVideos(videoId.value)
    } catch {
      try {
        recommendList.value = await fetchRelatedVideos(videoId.value)
      } catch {
        recommendList.value = []
      }
    }
  } catch {
    videoInfo.value = null
    episodes.value = []
    currentFileId.value = ''
  } finally {
    loading.value = false
  }
}

async function reportOnline() {
  if (!videoId.value) return
  try {
    const res = await videoApi.reportVideoPlayOnline(videoId.value, getDeviceId())
    const n = Number(res?.data)
    if (Number.isFinite(n) && n >= 0) onlineCount.value = n
  } catch {
    // 接口暂返回 null 时忽略
  }
}

function startOnlineReport() {
  stopOnlineReport()
  reportOnline()
  onlineTimer = setInterval(reportOnline, 5000)
}

function stopOnlineReport() {
  if (onlineTimer) {
    clearInterval(onlineTimer)
    onlineTimer = null
  }
}

function switchEpisode(ep) {
  if (!ep?.fileId || currentFileId.value === ep.fileId) return
  currentFileId.value = ep.fileId
  loadDanmu()
}

function requireLogin() {
  if (userStore.isLoggedIn) return true
  showLogin.value = true
  return false
}

async function doVideoAction(actionType) {
  const data = new FormData()
  data.append('videoId', videoId.value)
  data.append('actionType', String(actionType))
  data.append('actionCount', '1')
  data.append('commentId', '')
  await userActionApi.doAction(data)
}

async function loadDanmu() {
  if (!videoId.value || !currentFileId.value || closeDanmu.value) {
    danmuList.value = []
    return
  }
  try {
    const res = await danmuApi.loadDanmu(currentFileId.value, videoId.value)
    const payload = res.data || []
    danmuList.value = Array.isArray(payload) ? payload : payload.list || []
  } catch {
    danmuList.value = []
  }
}

async function sendDanmu(payload) {
  if (sendingDanmu.value) return
  if (!currentFileId.value) {
    playerRef.value?.resetDanmuSending?.()
    alert('当前分P未就绪，请稍后再发弹幕')
    return
  }
  if (closeDanmu.value) {
    playerRef.value?.resetDanmuSending?.()
    alert('UP主已关闭弹幕')
    return
  }
  sendingDanmu.value = true
  try {
    const authed = await userStore.ensureAuth()
    if (!authed) {
      showLogin.value = true
      return
    }
    const data = new FormData()
    data.append('videoId', videoId.value)
    data.append('fileId', currentFileId.value)
    data.append('text', payload.text)
    data.append('time', String(Math.floor(payload.time || 0)))
    data.append('color', '16777215')
    data.append('mode', '0')
    await danmuApi.postDanmu(data)
    const item = {
      danmuId: `local-${Date.now()}`,
      text: payload.text,
      time: Math.floor(payload.time || 0),
      color: '16777215',
      mode: 0
    }
    danmuList.value = [...danmuList.value, item]
    if (videoInfo.value) {
      videoInfo.value.danmuCount = Number(videoInfo.value.danmuCount || 0) + 1
    }
  } catch (e) {
    const msg = e?.message || '弹幕发送失败'
    if (/901|登录|token/i.test(msg)) {
      userStore.userInfo = null
      clearAuthSession()
      showLogin.value = true
    }
    alert(msg)
  } finally {
    sendingDanmu.value = false
    playerRef.value?.resetDanmuSending?.()
  }
}

async function toggleFollow() {
  if (!requireLogin() || !videoInfo.value) return
  if (followed.value) {
    await uhomeApi.cancelFocus(videoInfo.value.userId)
    followed.value = false
  } else {
    await uhomeApi.focus(videoInfo.value.userId)
    followed.value = true
  }
}

function toggleLike() {
  if (!requireLogin() || !videoInfo.value) return
  const next = !liked.value
  doVideoAction(2)
    .then(() => {
      liked.value = next
      videoInfo.value.likeCount = Math.max(0, Number(videoInfo.value.likeCount || 0) + (next ? 1 : -1))
    })
    .catch(() => {
      liked.value = toggleLocalLike(videoInfo.value.videoId)
      const delta = liked.value ? 1 : -1
      videoInfo.value.likeCount = Math.max(0, Number(videoInfo.value.likeCount || 0) + delta)
    })
}

function toggleCoin() {
  if (!requireLogin() || !videoInfo.value) return
  if (coined.value) return
  doVideoAction(3)
    .then(() => {
      coined.value = true
      videoInfo.value.coinCount = Number(videoInfo.value.coinCount || 0) + 1
    })
    .catch(() => {
      if (addCoin(videoInfo.value.videoId)) {
        coined.value = true
        videoInfo.value.coinCount = Number(videoInfo.value.coinCount || 0) + 1
      }
    })
}

function toggleCollect() {
  if (!requireLogin() || !videoInfo.value) return
  const next = !collected.value
  doVideoAction(4)
    .then(() => {
      collected.value = next
      videoInfo.value.collectCount = Math.max(0, Number(videoInfo.value.collectCount || 0) + (next ? 1 : -1))
      toggleLocalCollect(videoInfo.value)
    })
    .catch(() => {
      collected.value = toggleLocalCollect(videoInfo.value)
      const delta = collected.value ? 1 : -1
      videoInfo.value.collectCount = Math.max(0, Number(videoInfo.value.collectCount || 0) + delta)
    })
}

function shareVideo() {
  navigator.clipboard?.writeText(window.location.href)
  alert('链接已复制到剪贴板')
}

watch(videoId, loadVideo)
onMounted(loadVideo)
onUnmounted(stopOnlineReport)
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
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
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

    .ep-duration {
      color: rgba(255, 255, 255, 0.85);
    }
  }
}

.ep-label {
  font-weight: 600;
  flex-shrink: 0;
}

.ep-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ep-duration {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--bili-text-tertiary);
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

.video-desc {
  background: #fff;
  border-radius: var(--bili-radius);
  padding: 16px 20px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.tag {
  font-size: 13px;
  color: var(--bili-pink);
}

.intro {
  font-size: 14px;
  line-height: 1.7;
  color: var(--bili-text-secondary);
  white-space: pre-wrap;
}

.comment-closed {
  background: #fff;
  border-radius: var(--bili-radius);
  padding: 32px;
  text-align: center;
  color: var(--bili-text-tertiary);
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
