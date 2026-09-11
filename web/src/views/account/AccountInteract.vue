<template>
  <div class="account-interact">
    <div class="toolbar">
      <div class="tabs">
        <button type="button" :class="{ active: tab === 'comment' }" @click="switchTab('comment')">
          评论
        </button>
        <button type="button" :class="{ active: tab === 'danmu' }" @click="switchTab('danmu')">
          弹幕
        </button>
      </div>
      <select v-model="filterVideoId" class="video-select" @change="reloadList">
        <option value="">全部稿件</option>
        <option v-for="v in videoOptions" :key="v.videoId" :value="v.videoId">
          {{ v.videoName || v.videoId }}
        </option>
      </select>
    </div>

    <p v-if="errorMsg" class="error-tip">{{ errorMsg }}</p>
    <div v-if="loading && !list.length" class="loading-spinner">加载中</div>

    <ul v-else-if="list.length" class="item-list">
      <li v-for="item in list" :key="rowKey(item)" class="item-row">
        <img
          v-if="tab === 'comment'"
          class="avatar"
          :src="getAvatarUrl(item.avatar)"
          alt=""
        />
        <div class="item-main">
          <p class="party-line">
            <router-link
              v-if="senderUserId(item)"
              :to="`/user/${senderUserId(item)}`"
              class="party-link"
            >
              {{ senderName(item) }}
            </router-link>
            <span v-else>{{ senderName(item) }}</span>
            <span class="arrow">→</span>
            <router-link
              v-if="tab === 'comment' && replyUserId(item)"
              :to="`/user/${replyUserId(item)}`"
              class="party-link"
            >
              {{ receiverLabel(item) }}
            </router-link>
            <router-link
              v-else-if="item.videoId"
              :to="`/video/${item.videoId}`"
              class="party-link"
            >
              {{ receiverLabel(item) }}
            </router-link>
            <span v-else>{{ receiverLabel(item) }}</span>
          </p>
          <p class="content">{{ displayContent(item) }}</p>
          <p class="meta">
            <router-link
              v-if="item.videoId"
              :to="`/video/${item.videoId}`"
              class="video-link"
            >
              {{ displayVideoName(item) }}
            </router-link>
            <span>· {{ formatDate(item.postTime) }}</span>
          </p>
        </div>
        <button
          type="button"
          class="btn-outline danger"
          :disabled="actingId === rowKey(item)"
          @click="removeItem(item)"
        >
          删除
        </button>
      </li>
    </ul>
    <p v-else-if="!loading" class="empty-tip">
      {{ tab === 'comment' ? '暂无评论' : '暂无弹幕' }}
    </p>

    <div v-if="hasMore && !loading" class="load-more">
      <button type="button" class="btn-outline" @click="loadMore">加载更多</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ucenterApi } from '@/api'
import { formatDate, pickField, getAvatarUrl } from '@/utils/format'

const tab = ref('comment')
const list = ref([])
const videoOptions = ref([])
const filterVideoId = ref('')
const loading = ref(false)
const errorMsg = ref('')
const pageNo = ref(1)
const hasMore = ref(false)
const actingId = ref('')

function rowKey(item) {
  if (tab.value === 'comment') return `c-${item.commentId}`
  return `d-${item.danmuId}`
}

function itemId(item) {
  return tab.value === 'comment' ? item?.commentId : item?.danmuId
}

function displayContent(item) {
  if (tab.value === 'comment') return item.content || ''
  return item.text || ''
}

function displayVideoName(item) {
  return (
    pickField(item, 'videoName', 'video_name') ||
    videoOptions.value.find((v) => String(v.videoId) === String(item.videoId))?.videoName ||
    item.videoId
  )
}

function shortUser(userId) {
  if (!userId) return '用户'
  const s = String(userId)
  return `用户${s.slice(-4)}`
}

function senderUserId(item) {
  return item?.userId ? String(item.userId) : ''
}

function senderName(item) {
  return (
    pickField(item, 'nickName', 'nick_name') ||
    shortUser(item?.userId)
  )
}

function replyUserId(item) {
  if (tab.value !== 'comment') return ''
  return item?.replyUserId ? String(item.replyUserId) : ''
}

function receiverLabel(item) {
  if (tab.value === 'comment') {
    if (item?.replyNickName || item?.replyUserId) {
      return item.replyNickName || shortUser(item.replyUserId)
    }
    return `稿件（${displayVideoName(item)}）`
  }
  return `稿件（${displayVideoName(item)}）`
}

function parsePage(payload) {
  if (Array.isArray(payload)) {
    return { list: payload, pageTotal: 1 }
  }
  if (!payload || typeof payload !== 'object') {
    return { list: [], pageTotal: 1 }
  }
  const rows = Array.isArray(payload.list)
    ? payload.list
    : Array.isArray(payload.records)
      ? payload.records
      : []
  const pageTotal = Number(payload.pageTotal)
  return {
    list: rows,
    pageTotal: Number.isFinite(pageTotal) && pageTotal > 0 ? pageTotal : null
  }
}

async function loadVideos() {
  try {
    const res = await ucenterApi.loadAllVideo()
    const raw = res.data
    videoOptions.value = Array.isArray(raw) ? raw : raw?.list || []
  } catch {
    videoOptions.value = []
  }
}

async function loadList(reset = false) {
  if (loading.value) return
  loading.value = true
  if (reset) {
    pageNo.value = 1
    list.value = []
    hasMore.value = false
  }
  errorMsg.value = ''
  const requestPage = pageNo.value
  try {
    const params = {
      pageNo: requestPage,
      ...(filterVideoId.value ? { videoId: filterVideoId.value } : {})
    }
    const res =
      tab.value === 'comment'
        ? await ucenterApi.loadComment(params)
        : await ucenterApi.loadDanmu(params)
    const page = parsePage(res.data)
    const existing = new Set(list.value.map((row) => String(itemId(row))))
    const fresh = page.list.filter((row) => {
      const id = itemId(row)
      if (id == null || id === '') return false
      return !existing.has(String(id))
    })

    if (reset) {
      list.value = fresh.length ? fresh : page.list
    } else {
      list.value = [...list.value, ...fresh]
    }

    // 不以响应 pageNo 覆盖本地页码；空页或无新增则停止
    if (page.list.length === 0 || (!reset && fresh.length === 0)) {
      hasMore.value = false
    } else if (page.pageTotal != null) {
      hasMore.value = requestPage < page.pageTotal
    } else {
      hasMore.value = page.list.length > 0
    }
  } catch (e) {
    if (reset) list.value = []
    hasMore.value = false
    errorMsg.value = e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function reloadList() {
  loadList(true)
}

function switchTab(next) {
  if (tab.value === next) return
  tab.value = next
  reloadList()
}

function loadMore() {
  if (!hasMore.value || loading.value) return
  pageNo.value += 1
  loadList(false)
}

async function removeItem(item) {
  const tip = tab.value === 'comment' ? '确定删除这条评论？' : '确定删除这条弹幕？'
  if (!confirm(tip)) return
  const key = rowKey(item)
  actingId.value = key
  errorMsg.value = ''
  try {
    if (tab.value === 'comment') {
      await ucenterApi.delComment(item.commentId)
    } else {
      await ucenterApi.delDanmu(item.danmuId)
    }
    list.value = list.value.filter((row) => rowKey(row) !== key)
  } catch (e) {
    errorMsg.value = e?.message || '删除失败'
  } finally {
    actingId.value = ''
  }
}

onMounted(async () => {
  await loadVideos()
  await loadList(true)
})
</script>

<style scoped lang="scss">
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.tabs {
  display: flex;
  gap: 8px;

  button {
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
  }
}

.video-select {
  margin-left: auto;
  height: 32px;
  min-width: 200px;
  max-width: 320px;
  padding: 0 10px;
  border: 1px solid var(--bili-border);
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  background: #fff;
  border-radius: var(--bili-radius);
  box-shadow: var(--bili-shadow);
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  background: #eee;
}

.item-main {
  flex: 1;
  min-width: 0;
}

.party-line {
  font-size: 13px;
  color: var(--bili-text-secondary);
  margin-bottom: 6px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.party-link {
  color: var(--bili-pink);
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
}

.arrow {
  color: var(--bili-text-tertiary);
  margin: 0 2px;
}

.content {
  font-size: 14px;
  color: var(--bili-text);
  line-height: 1.5;
  word-break: break-word;
  margin-bottom: 6px;
}

.meta {
  font-size: 12px;
  color: var(--bili-text-tertiary);
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.video-link {
  color: var(--bili-pink);

  &:hover {
    text-decoration: underline;
  }
}

.btn-outline.danger {
  flex-shrink: 0;
  color: #f53f3f;
  border-color: rgba(245, 63, 63, 0.3);
  font-size: 13px;
  padding: 4px 12px;

  &:hover:not(:disabled) {
    background: rgba(245, 63, 63, 0.08);
  }
}

.error-tip {
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(245, 63, 63, 0.08);
  color: #f53f3f;
  font-size: 13px;
}

.empty-tip {
  text-align: center;
  padding: 48px;
  color: var(--bili-text-tertiary);
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
