<template>
  <div class="message-page">
    <div class="type-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="type-tab"
        :class="{ active: activeType === tab.value }"
        @click="changeType(tab.value)"
      >
        {{ tab.label }}
        <span v-if="groupCount(tab.value)" class="tab-badge">{{ groupCount(tab.value) }}</span>
      </button>
    </div>

    <div class="page-actions">
      <button v-if="messages.length" class="btn-outline" @click="readAll">全部已读</button>
    </div>

    <div v-if="loading" class="loading-spinner">加载中</div>
    <ul v-else-if="messages.length" class="message-list">
      <li
        v-for="msg in messages"
        :key="msg.messageId"
        class="message-item"
        :class="{ unread: isUnread(msg) }"
      >
        <img :src="getAvatarUrl(msg.sendUserAvatar)" class="msg-avatar" alt="" />
        <div class="msg-content" @click="openMessage(msg)">
          <div class="msg-head">
            <span class="sender">{{ msg.sendUserName || '用户' }}</span>
            <span class="msg-type">{{ typeLabel(msg.messageType) }}</span>
          </div>
          <p>{{ formatMessageText(msg) }}</p>
          <p v-if="msg.extend?.messageContentReply" class="reply-quote">
            原评论：{{ msg.extend.messageContentReply }}
          </p>
          <div class="msg-foot">
            <span class="time">{{ formatTime(msg.createTime) }}</span>
            <span v-if="msg.videoName" class="video-name">{{ msg.videoName }}</span>
          </div>
        </div>
        <img
          v-if="msg.videoCover"
          :src="getResourceUrl(msg.videoCover)"
          class="msg-cover"
          alt=""
          @click="openMessage(msg)"
        />
        <button class="del-btn" @click.stop="removeItem(msg)">×</button>
      </li>
    </ul>
    <div v-else class="empty-state">暂无消息</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { messageApi } from '@/api'
import { useUserStore } from '@/stores'
import { formatTime, getAvatarUrl, getResourceUrl } from '@/utils/format'

/** 与后端 MessageTypeEnum 一致。全部为前端聚合，loadMessage 仍按类型分别请求 */
const MESSAGE_TYPE = {
  ALL: -1,
  VIDEO_LIKE: 0,
  VIDEO_COLLECT: 1,
  VIDEO_COIN: 2,
  VIDEO_COMMENT: 3,
  VIDEO_DANMU: 4,
  COMMENT_LIKE: 5,
  COMMENT_REPLY: 6,
  SYSTEM: 7
}

const ALL_TYPES = [
  MESSAGE_TYPE.VIDEO_LIKE,
  MESSAGE_TYPE.VIDEO_COLLECT,
  MESSAGE_TYPE.VIDEO_COIN,
  MESSAGE_TYPE.VIDEO_COMMENT,
  MESSAGE_TYPE.VIDEO_DANMU,
  MESSAGE_TYPE.COMMENT_LIKE,
  MESSAGE_TYPE.COMMENT_REPLY,
  MESSAGE_TYPE.SYSTEM
]

const AUDIT_STATUS = {
  0: '转码中',
  1: '转码失败',
  2: '待审核',
  3: '审核成功',
  4: '审核不通过'
}

const tabs = [
  { value: MESSAGE_TYPE.ALL, label: '全部' },
  { value: MESSAGE_TYPE.VIDEO_LIKE, label: '点赞' },
  { value: MESSAGE_TYPE.VIDEO_COLLECT, label: '收藏' },
  { value: MESSAGE_TYPE.VIDEO_COIN, label: '投币' },
  { value: MESSAGE_TYPE.VIDEO_COMMENT, label: '评论' },
  { value: MESSAGE_TYPE.VIDEO_DANMU, label: '弹幕' },
  { value: MESSAGE_TYPE.COMMENT_REPLY, label: '回复' },
  { value: MESSAGE_TYPE.COMMENT_LIKE, label: '评赞' },
  { value: MESSAGE_TYPE.SYSTEM, label: '系统' }
]

const TYPE_LABEL = {
  [MESSAGE_TYPE.VIDEO_LIKE]: '赞了你的视频',
  [MESSAGE_TYPE.VIDEO_COLLECT]: '收藏了你的视频',
  [MESSAGE_TYPE.VIDEO_COIN]: '投币了你的视频',
  [MESSAGE_TYPE.VIDEO_COMMENT]: '评论了你的视频',
  [MESSAGE_TYPE.VIDEO_DANMU]: '发了弹幕',
  [MESSAGE_TYPE.COMMENT_LIKE]: '赞了你的评论',
  [MESSAGE_TYPE.COMMENT_REPLY]: '回复了你',
  [MESSAGE_TYPE.SYSTEM]: '系统通知'
}

const router = useRouter()
const userStore = useUserStore()
const messages = ref([])
const loading = ref(true)
const activeType = ref(MESSAGE_TYPE.ALL)
const groupCounts = ref({})

function parseExtend(item) {
  if (item?.userMessageExtendDto && typeof item.userMessageExtendDto === 'object') {
    return item.userMessageExtendDto
  }
  const raw = item?.extendJson || item?.extend
  if (!raw) return {}
  if (typeof raw === 'object') return raw
  try {
    return JSON.parse(raw) || {}
  } catch {
    return {}
  }
}

function isUnread(msg) {
  const flag = msg.readType ?? msg.recvType
  return Number(flag) === 0 || flag == null
}

function unwrapList(payload) {
  if (Array.isArray(payload)) return payload
  return payload?.list || payload?.records || payload?.data?.list || []
}

function normalizeMessages(payload) {
  const list = unwrapList(payload)
  return list.map((item) => {
    const extend = parseExtend(item)
    return {
      ...item,
      messageId: item.messageId,
      messageType: Number(item.messageType),
      readType: item.readType ?? item.recvType,
      recvType: item.recvType ?? item.readType,
      videoId: item.videoId,
      videoName: item.videoName || item.video_name || '',
      videoCover: item.videoCover || item.video_cover || '',
      sendUserId: item.sendUserId,
      sendUserName: item.sendUserName || item.send_user_name || '',
      sendUserAvatar: item.sendUserAvatar || item.send_user_avatar || '',
      createTime: item.createTime,
      extend
    }
  })
}

function typeLabel(type) {
  return TYPE_LABEL[Number(type)] || '消息'
}

function formatMessageText(msg) {
  const type = Number(msg.messageType)
  const content = msg.extend?.messageContent || ''
  if (type === MESSAGE_TYPE.SYSTEM) {
    const status = msg.extend?.auditStatus
    return `你的稿件审核结果：${AUDIT_STATUS[status] || '状态更新'}`
  }
  if (
    (type === MESSAGE_TYPE.VIDEO_COMMENT || type === MESSAGE_TYPE.COMMENT_REPLY) &&
    content
  ) {
    return content
  }
  if (type === MESSAGE_TYPE.VIDEO_DANMU && content) return content
  return typeLabel(type)
}

function groupCount(type) {
  if (type === MESSAGE_TYPE.ALL) {
    return ALL_TYPES.reduce((sum, t) => sum + groupCount(t), 0)
  }
  return Number(groupCounts.value[type] || groupCounts.value[String(type)] || 0)
}

function normalizeGroup(payload) {
  const map = {}
  if (!payload) return map
  if (Array.isArray(payload)) {
    payload.forEach((item) => {
      const t = item.messageType ?? item.type
      const c = item.messageCount ?? item.count ?? item.noReadCount ?? 0
      if (t != null) map[t] = Number(c) || 0
    })
    return map
  }
  Object.keys(payload).forEach((key) => {
    map[key] = Number(payload[key]) || 0
  })
  return map
}

function unreadOf(list) {
  return list.filter(isUnread).length
}

function applyGroupFromLists(byType) {
  const map = {}
  ALL_TYPES.forEach((t) => {
    map[t] = unreadOf(byType[t] || [])
  })
  groupCounts.value = map
}

async function fetchByType(type) {
  const res = await messageApi.loadMessage(type, 1)
  return normalizeMessages(res.data)
}

async function fetchAllByType() {
  const lists = await Promise.all(
    ALL_TYPES.map(async (type) => {
      try {
        return await fetchByType(type)
      } catch (e) {
        console.warn('[message] loadMessage failed', type, e)
        return []
      }
    })
  )
  const byType = {}
  ALL_TYPES.forEach((type, i) => {
    byType[type] = lists[i]
  })
  return byType
}

function flattenMessages(byType) {
  return ALL_TYPES.flatMap((type) => byType[type] || []).sort((a, b) => {
    const tb = new Date(b.createTime || 0).getTime()
    const ta = new Date(a.createTime || 0).getTime()
    if (tb !== ta) return tb - ta
    return Number(b.messageId || 0) - Number(a.messageId || 0)
  })
}

async function loadGroupCounts(preloaded) {
  try {
    const res = await messageApi.getNoReadCountGroup()
    const map = normalizeGroup(res.data)
    const sum = Object.values(map).reduce((s, v) => s + (Number(v) || 0), 0)
    if (sum > 0) {
      groupCounts.value = map
      return
    }
  } catch {
    /* 分组未读按 recv_type=0，null 会得到空结果，改用列表回退 */
  }
  const byType = preloaded || (await fetchAllByType())
  applyGroupFromLists(byType)
}

async function loadMessages() {
  loading.value = true
  try {
    if (activeType.value === MESSAGE_TYPE.ALL) {
      const byType = await fetchAllByType()
      messages.value = flattenMessages(byType)
      if (!ALL_TYPES.some((t) => groupCount(t) > 0)) applyGroupFromLists(byType)
    } else {
      messages.value = await fetchByType(activeType.value)
    }
  } catch (e) {
    console.warn('[message] loadMessage failed', e)
    messages.value = []
  } finally {
    loading.value = false
  }
}

function changeType(type) {
  if (activeType.value === type) return
  activeType.value = type
  loadMessages()
}

function openMessage(msg) {
  if (msg.videoId) router.push(`/video/${msg.videoId}`)
}

async function readAll() {
  const types =
    activeType.value === MESSAGE_TYPE.ALL ? ALL_TYPES : [activeType.value]
  await Promise.all(
    types.map((type) =>
      messageApi.readAll(type).catch((e) => {
        console.warn('[message] readAll failed', type, e)
      })
    )
  )
  messages.value.forEach((m) => {
    m.readType = 1
    m.recvType = 1
  })
  const next = { ...groupCounts.value }
  types.forEach((type) => {
    next[type] = 0
  })
  groupCounts.value = next
  userStore.noReadCount = ALL_TYPES.reduce((sum, t) => sum + (Number(next[t]) || 0), 0)
}

async function removeItem(msg) {
  try {
    await messageApi.delMessage(msg.messageId)
  } catch (e) {
    console.warn('[message] delMessage failed', e)
  }
  messages.value = messages.value.filter((m) => m.messageId !== msg.messageId)
  await loadGroupCounts()
  userStore.fetchNoReadCount()
}

onMounted(async () => {
  loading.value = true
  try {
    const byType = await fetchAllByType()
    messages.value = flattenMessages(byType)
    await loadGroupCounts(byType)
  } catch (e) {
    console.warn('[message] loadMessage failed', e)
    messages.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
.type-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.type-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--bili-text-secondary);
  font-size: 13px;
  cursor: pointer;

  &:hover {
    color: var(--bili-pink);
  }

  &.active {
    color: var(--bili-pink);
    background: rgba(251, 114, 153, 0.1);
    font-weight: 600;
  }
}

.tab-badge {
  min-width: 16px;
  padding: 0 5px;
  border-radius: 8px;
  background: var(--bili-pink);
  color: #fff;
  font-size: 11px;
  line-height: 16px;
  text-align: center;
}

.page-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 16px;
  background: #fff;
  border-radius: var(--bili-radius);

  &.unread {
    background: rgba(251, 114, 153, 0.04);
    border-left: 3px solid var(--bili-pink);
  }
}

.msg-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  background: #f6f7f8;
}

.msg-content {
  flex: 1;
  min-width: 0;
  cursor: pointer;

  .msg-head {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 4px;
  }

  .sender {
    font-size: 13px;
    font-weight: 600;
    color: var(--bili-text);
  }

  .msg-type {
    font-size: 12px;
    color: var(--bili-text-tertiary);
  }

  p {
    font-size: 14px;
    line-height: 1.5;
    margin-bottom: 6px;
  }

  .reply-quote {
    font-size: 12px;
    color: var(--bili-text-tertiary);
    padding: 6px 8px;
    background: #f6f7f8;
    border-radius: 4px;
  }

  .msg-foot {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 12px;
    color: var(--bili-text-tertiary);
  }

  .video-name {
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.msg-cover {
  width: 64px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
  cursor: pointer;
  background: #f6f7f8;
}

.del-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
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
