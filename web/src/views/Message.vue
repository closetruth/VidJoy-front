<template>
  <div class="message-page">
    <div class="type-tabs">
      <button
        v-for="tab in tabs"
        :key="String(tab.value)"
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
        :class="{ unread: Number(msg.readType) === 0 }"
      >
        <div class="msg-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
        </div>
        <div class="msg-content" @click="openMessage(msg)">
          <div class="msg-type">{{ typeLabel(msg.messageType) }}</div>
          <p>{{ formatMessageText(msg) }}</p>
          <p v-if="msg.extend?.messageContentReply" class="reply-quote">
            原评论：{{ msg.extend.messageContentReply }}
          </p>
          <span class="time">{{ formatTime(msg.createTime) }}</span>
        </div>
        <button class="del-btn" @click="removeItem(msg)">×</button>
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
import { formatTime } from '@/utils/format'

/** 与后端 MessageTypeEnum 一致 */
const MESSAGE_TYPE = {
  VIDEO_LIKE: 0,
  VIDEO_COLLECT: 1,
  VIDEO_COIN: 2,
  VIDEO_COMMENT: 3,
  VIDEO_DANMU: 4,
  COMMENT_LIKE: 5,
  COMMENT_REPLY: 6,
  SYSTEM: 7
}

const AUDIT_STATUS = {
  0: '转码中',
  1: '转码失败',
  2: '待审核',
  3: '审核成功',
  4: '审核不通过'
}

const tabs = [
  { value: null, label: '全部' },
  { value: MESSAGE_TYPE.VIDEO_LIKE, label: '点赞' },
  { value: MESSAGE_TYPE.VIDEO_COLLECT, label: '收藏' },
  { value: MESSAGE_TYPE.VIDEO_COIN, label: '投币' },
  { value: MESSAGE_TYPE.VIDEO_COMMENT, label: '评论' },
  { value: MESSAGE_TYPE.COMMENT_REPLY, label: '回复' },
  { value: MESSAGE_TYPE.COMMENT_LIKE, label: '评赞' },
  { value: MESSAGE_TYPE.SYSTEM, label: '系统' }
]

const TYPE_LABEL = {
  [MESSAGE_TYPE.VIDEO_LIKE]: '视频点赞',
  [MESSAGE_TYPE.VIDEO_COLLECT]: '视频收藏',
  [MESSAGE_TYPE.VIDEO_COIN]: '视频投币',
  [MESSAGE_TYPE.VIDEO_COMMENT]: '视频评论',
  [MESSAGE_TYPE.VIDEO_DANMU]: '视频弹幕',
  [MESSAGE_TYPE.COMMENT_LIKE]: '评论点赞',
  [MESSAGE_TYPE.COMMENT_REPLY]: '评论回复',
  [MESSAGE_TYPE.SYSTEM]: '系统消息'
}

const router = useRouter()
const userStore = useUserStore()
const messages = ref([])
const loading = ref(true)
const activeType = ref(null)
const groupCounts = ref({})

function parseExtend(raw) {
  if (!raw) return {}
  if (typeof raw === 'object') return raw
  try {
    return JSON.parse(raw) || {}
  } catch {
    return {}
  }
}

function normalizeMessages(payload) {
  const list = Array.isArray(payload) ? payload : payload?.list || payload?.records || []
  return list.map((item) => {
    const extend = parseExtend(item.extendJson || item.extend)
    return {
      ...item,
      messageId: item.messageId,
      messageType: Number(item.messageType),
      readType: Number(item.readType ?? item.recvType ?? 0),
      videoId: item.videoId,
      sendUserId: item.sendUserId,
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
  const content = msg.extend?.messageContent || msg.content || msg.messageContent || ''
  if (type === MESSAGE_TYPE.SYSTEM) {
    const status = msg.extend?.auditStatus
    const statusText = AUDIT_STATUS[status] || '状态更新'
    return `你的稿件审核结果：${statusText}`
  }
  if (type === MESSAGE_TYPE.VIDEO_LIKE) return '有人赞了你的视频'
  if (type === MESSAGE_TYPE.VIDEO_COLLECT) return '有人收藏了你的视频'
  if (type === MESSAGE_TYPE.VIDEO_COIN) return '有人为你的视频投币'
  if (type === MESSAGE_TYPE.COMMENT_LIKE) return '有人赞了你的评论'
  if (type === MESSAGE_TYPE.COMMENT_REPLY || type === MESSAGE_TYPE.VIDEO_COMMENT) {
    return content ? `评论：${content}` : '有人评论了你的视频'
  }
  if (type === MESSAGE_TYPE.VIDEO_DANMU) return content ? `弹幕：${content}` : '有人发了弹幕'
  return content || typeLabel(type)
}

function groupCount(type) {
  if (type == null) {
    return Object.values(groupCounts.value).reduce((sum, n) => sum + Number(n || 0), 0)
  }
  return Number(groupCounts.value[type] || groupCounts.value[String(type)] || 0)
}

function normalizeGroup(payload) {
  const map = {}
  if (!payload) return map
  if (Array.isArray(payload)) {
    payload.forEach((item) => {
      const type = item.messageType ?? item.type
      const count = item.count ?? item.noReadCount ?? item.num
      if (type != null) map[type] = Number(count) || 0
    })
    return map
  }
  Object.keys(payload).forEach((key) => {
    map[key] = Number(payload[key]) || 0
  })
  return map
}

async function loadGroupCounts() {
  try {
    const res = await messageApi.getNoReadCountGroup()
    groupCounts.value = normalizeGroup(res.data)
  } catch {
    groupCounts.value = {}
  }
}

async function loadMessages() {
  loading.value = true
  try {
    const res = await messageApi.loadMessage(activeType.value)
    messages.value = normalizeMessages(res.data)
  } catch {
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
  try {
    await messageApi.readAll(activeType.value)
  } catch {
    /* ignore */
  }
  messages.value.forEach((m) => {
    m.readType = 1
  })
  await loadGroupCounts()
  userStore.fetchNoReadCount()
}

async function removeItem(msg) {
  try {
    await messageApi.delMessage(msg.messageId)
  } catch {
    /* ignore */
  }
  messages.value = messages.value.filter((m) => m.messageId !== msg.messageId)
  await loadGroupCounts()
  userStore.fetchNoReadCount()
}

onMounted(async () => {
  await Promise.all([loadMessages(), loadGroupCounts()])
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
  padding: 16px;
  background: #fff;
  border-radius: var(--bili-radius);

  &.unread {
    background: rgba(251, 114, 153, 0.04);
    border-left: 3px solid var(--bili-pink);
  }
}

.msg-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f6f7f8;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bili-pink);
  flex-shrink: 0;
}

.msg-content {
  flex: 1;
  cursor: pointer;

  .msg-type {
    font-size: 12px;
    color: var(--bili-pink);
    margin-bottom: 4px;
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

  .time {
    font-size: 12px;
    color: var(--bili-text-tertiary);
  }
}

.del-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: var(--bili-text-tertiary);

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
