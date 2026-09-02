<template>
  <div class="comment-section">
    <div class="comment-header">
      <h3>评论 <span class="count">{{ totalCount }}</span></h3>
      <div class="order-tabs">
        <button :class="{ active: orderType === '0' }" @click="changeOrder('0')">最热</button>
        <button :class="{ active: orderType === '1' }" @click="changeOrder('1')">最新</button>
      </div>
    </div>

    <div v-if="userStore.isLoggedIn" class="comment-input">
      <img :src="avatarUrl" class="avatar" alt="" />
      <div class="input-wrap">
        <textarea
          v-model="content"
          placeholder="发条友善的评论"
          rows="3"
          @focus="inputFocused = true"
        />
        <div v-if="inputFocused" class="input-actions">
          <button class="btn-primary" :disabled="!content.trim() || posting" @click="postComment">
            {{ posting ? '发布中...' : '发布' }}
          </button>
        </div>
      </div>
    </div>
    <div v-else class="login-tip">
      <button @click="$emit('need-login')">登录</button> 后发表评论
    </div>

    <div v-if="loading" class="loading-spinner">加载中</div>
    <ul v-else-if="comments.length" class="comment-list">
      <li v-for="comment in comments" :key="comment.commentId" class="comment-item">
        <img :src="getResourceUrl(comment.avatar)" class="avatar" alt="" />
        <div class="comment-body">
          <div class="comment-user">
            <span class="nickname">{{ comment.nickName }}</span>
            <span v-if="comment.topType === 1" class="top-tag">置顶</span>
          </div>
          <p class="comment-content">{{ comment.content }}</p>
          <div class="comment-meta">
            <span class="time">{{ formatTime(comment.postTime) }}</span>
            <button class="action-btn" @click="likeComment(comment)">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
              </svg>
              {{ formatCount(comment.likeCount) }}
            </button>
            <button class="action-btn" @click="replyTo(comment)">回复</button>
            <button
              v-if="canTop"
              class="action-btn"
              @click="toggleTop(comment)"
            >
              {{ comment.topType === 1 ? '取消置顶' : '置顶' }}
            </button>
            <button
              v-if="canDelete(comment)"
              class="action-btn"
              @click="deleteComment(comment)"
            >
              删除
            </button>
          </div>

          <div v-if="replyingTo === comment.commentId" class="reply-input">
            <textarea v-model="replyContent" placeholder="回复 @{{ comment.nickName }}" rows="2" />
            <button class="btn-primary" @click="submitReply(comment)">回复</button>
          </div>

          <ul v-if="comment.children?.length" class="reply-list">
            <li v-for="reply in comment.children" :key="reply.commentId" class="reply-item">
              <img :src="getResourceUrl(reply.avatar)" class="avatar small" alt="" />
              <div>
                <span class="nickname">{{ reply.nickName }}</span>
                <span v-if="reply.replyNickName" class="reply-to"> 回复 @{{ reply.replyNickName }}</span>
                <p class="comment-content">{{ reply.content }}</p>
                <div class="comment-meta">
                  <span class="time">{{ formatTime(reply.postTime) }}</span>
                  <button
                    v-if="canDelete(reply)"
                    class="action-btn"
                    @click="deleteComment(reply)"
                  >
                    删除
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </li>
    </ul>
    <p v-else class="empty-tip">还没有评论，来抢沙发吧</p>

    <div v-if="hasMore && !loading" class="load-more">
      <button class="btn-outline" @click="loadMore">查看更多评论</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useUserStore } from '@/stores'
import { commentApi, userActionApi } from '@/api'
import { formatCount, formatTime, getResourceUrl } from '@/utils/format'

const props = defineProps({
  videoId: { type: String, required: true },
  videoUserId: { type: String, default: '' }
})

defineEmits(['need-login'])

const userStore = useUserStore()
const comments = ref([])
const loading = ref(false)
const posting = ref(false)
const content = ref('')
const replyContent = ref('')
const replyingTo = ref(null)
const orderType = ref('0')
const pageNo = ref(1)
const totalCount = ref(0)
const hasMore = ref(true)
const inputFocused = ref(false)

const avatarUrl = computed(() => {
  const avatar = userStore.userInfo?.avatar
  return avatar ? getResourceUrl(avatar) : 'https://i0.hdslb.com/bfs/face/member/face/placeholder.jpg'
})

const canTop = computed(() => {
  const uid = userStore.userInfo?.userId
  return uid && props.videoUserId && String(uid) === String(props.videoUserId)
})

function canDelete(comment) {
  const uid = userStore.userInfo?.userId
  if (!uid) return false
  return String(comment.userId) === String(uid) || canTop.value
}

async function loadComments(reset = false) {
  if (!props.videoId || loading.value) return
  loading.value = true
  if (reset) pageNo.value = 1

  try {
    const data = new FormData()
    data.append('videoId', props.videoId)
    data.append('pageNo', String(pageNo.value))
    data.append('orderType', orderType.value)

    const res = await commentApi.loadComment(data)
    const payload = res.data || {}
    const list = payload.list || payload.records || (Array.isArray(payload) ? payload : [])
    totalCount.value = payload.totalCount ?? list.length

    comments.value = reset ? list : [...comments.value, ...list]
    hasMore.value = list.length >= 20
  } catch {
    if (reset) comments.value = []
    hasMore.value = false
  } finally {
    loading.value = false
  }
}

function changeOrder(type) {
  orderType.value = type
  loadComments(true)
}

function loadMore() {
  pageNo.value++
  loadComments()
}

async function postComment() {
  if (!content.value.trim()) return
  posting.value = true
  try {
    const data = new FormData()
    data.append('videoId', props.videoId)
    data.append('content', content.value.trim())
    data.append('replyCommentId', '0')
    data.append('imgPath', '')
    await commentApi.postComment(data)
    content.value = ''
    inputFocused.value = false
    await loadComments(true)
  } finally {
    posting.value = false
  }
}

function replyTo(comment) {
  replyingTo.value = comment.commentId
  replyContent.value = ''
}

async function submitReply(comment) {
  if (!replyContent.value.trim()) return
  const data = new FormData()
  data.append('videoId', props.videoId)
  data.append('content', replyContent.value.trim())
  data.append('replyCommentId', comment.commentId)
  data.append('imgPath', '')
  await commentApi.postComment(data)
  replyingTo.value = null
  replyContent.value = ''
  await loadComments(true)
}

async function likeComment(comment) {
  if (!userStore.isLoggedIn) return
  const data = new FormData()
  data.append('videoId', props.videoId)
  data.append('actionType', '0')
  data.append('actionCount', '1')
  data.append('commentId', String(comment.commentId))
  await userActionApi.doAction(data)
  comment.likeCount = (comment.likeCount || 0) + 1
}

async function toggleTop(comment) {
  if (comment.topType === 1) {
    await commentApi.cancelTopComment(comment.commentId)
  } else {
    await commentApi.topComment(comment.commentId)
  }
  await loadComments(true)
}

async function deleteComment(comment) {
  if (!confirm('确定删除这条评论？')) return
  await commentApi.userDelComment(comment.commentId)
  await loadComments(true)
}

watch(() => props.videoId, () => loadComments(true))
onMounted(() => loadComments(true))
</script>

<style scoped lang="scss">
.comment-section {
  background: #fff;
  border-radius: var(--bili-radius);
  padding: 20px;
}

.comment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;

  h3 {
    font-size: 18px;
    font-weight: 600;

    .count {
      font-size: 14px;
      color: var(--bili-text-tertiary);
      font-weight: 400;
    }
  }
}

.order-tabs {
  display: flex;
  gap: 16px;

  button {
    font-size: 14px;
    color: var(--bili-text-tertiary);
    padding-bottom: 4px;
    border-bottom: 2px solid transparent;

    &.active {
      color: var(--bili-pink);
      border-bottom-color: var(--bili-pink);
    }
  }
}

.comment-input {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;

  &.small {
    width: 32px;
    height: 32px;
  }
}

.input-wrap {
  flex: 1;

  textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--bili-border);
    border-radius: 8px;
    resize: vertical;
    font-size: 14px;
    transition: border-color 0.2s;

    &:focus {
      border-color: var(--bili-pink);
    }
  }
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.login-tip {
  padding: 16px;
  margin-bottom: 20px;
  background: #f6f7f8;
  border-radius: 8px;
  text-align: center;
  color: var(--bili-text-secondary);

  button {
    color: var(--bili-pink);
    font-weight: 500;
  }
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-item {
  display: flex;
  gap: 12px;
}

.comment-user {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.nickname {
  font-size: 13px;
  font-weight: 500;
  color: var(--bili-text-secondary);
}

.top-tag {
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--bili-pink);
  color: #fff;
  font-size: 11px;
}

.comment-content {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 8px;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: var(--bili-text-tertiary);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--bili-text-tertiary);
  transition: color 0.2s;

  &:hover {
    color: var(--bili-pink);
  }
}

.reply-input {
  margin-top: 12px;

  textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--bili-border);
    border-radius: 6px;
    font-size: 13px;
    margin-bottom: 8px;
  }
}

.reply-list {
  margin-top: 12px;
  padding: 12px;
  background: #f6f7f8;
  border-radius: 8px;
}

.reply-item {
  display: flex;
  gap: 8px;
  padding: 8px 0;

  &:not(:last-child) {
    border-bottom: 1px solid var(--bili-border);
  }
}

.reply-to {
  color: var(--bili-blue);
  font-size: 13px;
}

.empty-tip {
  text-align: center;
  padding: 32px 0;
  color: var(--bili-text-tertiary);
  font-size: 14px;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
