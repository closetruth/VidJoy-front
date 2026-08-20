<template>
  <div class="message-page">
    <div class="page-actions">
      <button v-if="messages.length" class="btn-outline" @click="readAll">全部已读</button>
    </div>

    <div v-if="loading" class="loading-spinner">加载中</div>
    <ul v-else-if="messages.length" class="message-list">
      <li
        v-for="msg in messages"
        :key="msg.messageId"
        class="message-item"
        :class="{ unread: !msg.readType }"
      >
        <div class="msg-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
        </div>
        <div class="msg-content">
          <p>{{ msg.content || msg.messageContent }}</p>
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
import { messageApi } from '@/api'
import { useUserStore } from '@/stores'
import { formatTime } from '@/utils/format'

const userStore = useUserStore()
const messages = ref([])
const loading = ref(true)

function normalizeMessages(payload) {
  if (Array.isArray(payload)) return payload
  return payload?.list || payload?.records || []
}

async function loadMessages() {
  loading.value = true
  try {
    const res = await messageApi.loadMessage()
    messages.value = normalizeMessages(res.data)
  } catch {
    messages.value = []
  } finally {
    loading.value = false
  }
}

async function readAll() {
  await messageApi.readAll()
  messages.value.forEach((m) => (m.readType = 1))
  userStore.fetchNoReadCount()
}

async function removeItem(msg) {
  await messageApi.delMessage(msg.messageId)
  messages.value = messages.value.filter((m) => m.messageId !== msg.messageId)
}

onMounted(loadMessages)
</script>

<style scoped lang="scss">
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

  p {
    font-size: 14px;
    line-height: 1.5;
    margin-bottom: 6px;
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
