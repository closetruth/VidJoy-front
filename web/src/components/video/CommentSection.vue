<template>
  <div class="comment-section">
    <div class="comment-header">
      <h3>评论 <span class="count">{{ totalCount }}</span></h3>
      <div class="order-tabs">
        <button :class="{ active: orderType === 0 }" @click="changeOrder(0)">最热</button>
        <button :class="{ active: orderType === 1 }" @click="changeOrder(1)">最新</button>
      </div>
    </div>

    <div v-if="userStore.isLoggedIn" class="comment-input">
      <img :src="avatarUrl" class="avatar" alt="" />
      <div class="input-wrap">
        <textarea
          v-model="content"
          placeholder="发条友善的评论"
          rows="3"
          maxlength="500"
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
      <button type="button" @click="$emit('need-login')">登录</button> 后发表评论
    </div>

    <p v-if="loadError" class="error-tip">{{ loadError }}</p>

    <div v-if="loading && !comments.length" class="loading-spinner">加载中</div>
    <ul v-else-if="comments.length" class="comment-list">
      <li v-for="comment in comments" :key="comment.commentId" class="comment-item">
        <img :src="getAvatarUrl(comment.avatar)" class="avatar" alt="" />
        <div class="comment-body">
          <div class="comment-user">
            <span class="nickname">{{ comment.nickName }}</span>
            <span v-if="Number(comment.topType) === 1" class="top-tag">置顶</span>
          </div>
          <p class="comment-content">{{ comment.content }}</p>
          <div class="comment-meta">
            <span class="time">{{ formatTime(comment.postTime) }}</span>
            <button
              type="button"
              class="action-btn"
              :class="{ active: isCommentLiked(comment.commentId) }"
              :disabled="isLiking(comment.commentId)"
              @click="likeComment(comment)"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
              </svg>
              {{ formatCount(comment.likeCount) }}
            </button>
            <button
              v-if="userStore.isLoggedIn"
              type="button"
              class="action-btn"
              @click="replyTo(comment)"
            >
              回复
            </button>
            <button
              v-if="canTop"
              type="button"
              class="action-btn"
              :disabled="topping"
              @click="toggleTop(comment)"
            >
              {{ Number(comment.topType) === 1 ? '取消置顶' : '置顶' }}
            </button>
            <button
              v-if="canDelete(comment)"
              type="button"
              class="action-btn danger"
              :disabled="deleting"
              @click="deleteComment(comment)"
            >
              删除
            </button>
          </div>

          <div v-if="replyingTo === comment.commentId" class="reply-input">
            <textarea
              v-model="replyContent"
              :placeholder="replyTargetName ? `回复 @${replyTargetName}` : `回复 @${comment.nickName}`"
              rows="2"
              maxlength="500"
            />
            <div class="reply-actions">
              <button type="button" class="btn-outline" @click="cancelReply">取消</button>
              <button
                type="button"
                class="btn-primary"
                :disabled="!replyContent.trim() || posting"
                @click="submitReply"
              >
                回复
              </button>
            </div>
          </div>

          <ul v-if="comment.children?.length" class="reply-list">
            <li v-for="reply in comment.children" :key="reply.commentId" class="reply-item">
              <img :src="getAvatarUrl(reply.avatar)" class="avatar small" alt="" />
              <div>
                <span class="nickname">{{ reply.nickName }}</span>
                <span v-if="getReplyLabel(reply)" class="reply-to"> 回复 @{{ getReplyLabel(reply) }}</span>
                <p class="comment-content">{{ reply.content }}</p>
                <div class="comment-meta">
                  <span class="time">{{ formatTime(reply.postTime) }}</span>
                  <button
                    type="button"
                    class="action-btn"
                    :class="{ active: isCommentLiked(reply.commentId) }"
                    :disabled="isLiking(reply.commentId)"
                    @click="likeComment(reply)"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                      <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
                    </svg>
                    {{ formatCount(reply.likeCount) }}
                  </button>
                  <button
                    v-if="userStore.isLoggedIn"
                    type="button"
                    class="action-btn"
                    @click="replyTo(comment, reply)"
                  >
                    回复
                  </button>
                  <button
                    v-if="canDelete(reply)"
                    type="button"
                    class="action-btn danger"
                    :disabled="deleting"
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
    <p v-else-if="!loading" class="empty-tip">还没有评论，来抢沙发吧</p>

    <div v-if="hasMore && !loading" class="load-more">
      <button type="button" class="btn-outline" @click="loadMore">查看更多评论</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useUserStore } from '@/stores'
import { commentApi, userActionApi } from '@/api'
import { formatCount, formatTime, getAvatarUrl, USER_ACTION_TYPE } from '@/utils/format'

const PAGE_SIZE = 15

const props = defineProps({
  videoId: { type: String, required: true },
  videoUserId: { type: String, default: '' }
})

const emit = defineEmits(['need-login'])

const userStore = useUserStore()
const comments = ref([])
/** 已点赞的评论 id（统一 String，避免 number/string 对不上） */
const likedCommentIds = ref(new Set())
/** 点赞请求中的评论 id */
const likingCommentIds = ref(new Set())
const loading = ref(false)
const posting = ref(false)
const content = ref('')
const replyContent = ref('')
/** 回复输入框挂在哪条一级评论下 */
const replyingTo = ref(null)
/** 真正传给后端的 replyCommentId（一级或楼中楼） */
const replyTargetId = ref(null)
const replyTargetName = ref('')
const replyTargetUserId = ref('')
const orderType = ref(0)
const pageNo = ref(1)
const totalCount = ref(0)
const hasMore = ref(false)
const inputFocused = ref(false)
const loadError = ref('')
const topping = ref(false)
const deleting = ref(false)

const avatarUrl = computed(() => getAvatarUrl(userStore.userInfo?.avatar))

/** 仅视频 UP 主可置顶 */
const canTop = computed(() => {
  const uid = userStore.userInfo?.userId
  return Boolean(uid && props.videoUserId && String(uid) === String(props.videoUserId))
})

/** 评论作者或视频 UP 主可删（与后端 deleteComment 一致） */
function canDelete(comment) {
  const uid = userStore.userInfo?.userId
  if (!uid) return false
  return String(comment?.userId) === String(uid) || canTop.value
}

/** 置顶评论排到列表最前（不依赖后端是否已插入） */
function putTopFirst(list) {
  const items = Array.isArray(list) ? list : []
  const tops = []
  const rest = []
  const seen = new Set()
  for (const item of items) {
    const id = item?.commentId
    if (id != null && seen.has(id)) continue
    if (id != null) seen.add(id)
    if (Number(item?.topType) === 1) tops.push(item)
    else rest.push(item)
  }
  return [...tops, ...rest]
}

/** 规范化列表：优先用后端 children，否则按 pCommentId 组树 */
function normalizeCommentList(list) {
  const items = Array.isArray(list) ? list : []
  const hasBackendChildren = items.some((item) => Array.isArray(item?.children))
  let roots
  if (hasBackendChildren) {
    roots = items
      .filter((item) => Number(item.pCommentId ?? 0) === 0)
      .map((item) => ({
        ...item,
        children: Array.isArray(item.children) ? item.children : []
      }))
  } else {
    const map = new Map()
    roots = []
    for (const raw of items) {
      map.set(raw.commentId, { ...raw, children: [] })
    }
    for (const raw of items) {
      const node = map.get(raw.commentId)
      const pid = Number(raw.pCommentId ?? 0)
      if (pid > 0 && map.has(pid)) {
        map.get(pid).children.push(node)
      } else {
        roots.push(node)
      }
    }
  }
  return putTopFirst(roots)
}

/** 楼中楼「回复 @谁」：优先 replyNickName，其次用 replyUserId 在同楼查找 */
function getReplyLabel(reply) {
  if (reply?.replyNickName) return reply.replyNickName
  const uid = reply?.replyUserId
  if (!uid) return ''
  for (const root of comments.value) {
    if (String(root.userId) === String(uid)) return root.nickName || ''
    for (const child of root.children || []) {
      if (String(child.userId) === String(uid)) return child.nickName || ''
    }
  }
  return ''
}

function commentKey(commentId) {
  return String(commentId ?? '')
}

function isCommentLiked(commentId) {
  const key = commentKey(commentId)
  return key ? likedCommentIds.value.has(key) : false
}

function isLiking(commentId) {
  const key = commentKey(commentId)
  return key ? likingCommentIds.value.has(key) : false
}

function applyUserActionList(list) {
  const liked = new Set()
  if (!Array.isArray(list)) {
    likedCommentIds.value = liked
    return
  }
  for (const item of list) {
    const type = Number(item?.actionType ?? item?.action_type)
    const commentId = item?.commentId ?? item?.comment_id
    const key = commentKey(commentId)
    if (type === USER_ACTION_TYPE.COMMENT_LIKE && key && key !== '0') {
      liked.add(key)
    }
  }
  likedCommentIds.value = liked
}

function parseLoadPayload(payload) {
  // 关评论时后端可能直接返回 []
  if (Array.isArray(payload)) {
    return { list: payload, totalCount: payload.length, pageTotal: 1, pageNo: 1, userActionList: [] }
  }
  if (!payload || typeof payload !== 'object') {
    return { list: [], totalCount: 0, pageTotal: 0, pageNo: 1, userActionList: [] }
  }

  const page = payload.commentData || payload
  const list = Array.isArray(page.list) ? page.list : Array.isArray(page.records) ? page.records : []
  return {
    list,
    totalCount: Number(page.totalCount ?? list.length) || 0,
    pageTotal: Number(page.pageTotal ?? 1) || 1,
    pageNo: Number(page.pageNo ?? 1) || 1,
    userActionList: payload.userActionList || []
  }
}

async function loadComments(reset = false) {
  if (!props.videoId || loading.value) return
  loading.value = true
  loadError.value = ''
  if (reset) pageNo.value = 1

  try {
    const data = new FormData()
    data.append('videoId', props.videoId)
    // 首页不传 pageNo，后端 pageNo==null 时才会把置顶评论插到最前
    if (!reset && pageNo.value > 1) {
      data.append('pageNo', String(pageNo.value))
    }
    data.append('orderType', String(orderType.value))

    const res = await commentApi.loadComment(data)
    const parsed = parseLoadPayload(res.data)
    const nested = normalizeCommentList(parsed.list)

    comments.value = putTopFirst(reset ? nested : [...comments.value, ...nested])
    totalCount.value = parsed.totalCount
    hasMore.value = pageNo.value < parsed.pageTotal || parsed.list.length >= PAGE_SIZE
    if (reset) applyUserActionList(parsed.userActionList)
  } catch (e) {
    const msg = e?.message || '加载评论失败'
    if (reset) {
      comments.value = []
      totalCount.value = 0
      if (/901|登录|token/i.test(msg)) {
        loadError.value = userStore.isLoggedIn
          ? '登录状态异常，请重新登录后再查看评论'
          : '请先登录后查看评论'
      } else {
        loadError.value = msg
      }
    }
    hasMore.value = false
  } finally {
    loading.value = false
  }
}

function changeOrder(type) {
  if (orderType.value === type) return
  orderType.value = type
  loadComments(true)
}

function loadMore() {
  pageNo.value++
  loadComments()
}

async function postComment() {
  if (!content.value.trim() || posting.value) return
  if (!userStore.isLoggedIn) {
    emit('need-login')
    return
  }
  posting.value = true
  try {
    const data = new FormData()
    data.append('videoId', props.videoId)
    data.append('content', content.value.trim())
    // 顶层评论不要传 replyCommentId，后端 null 才会当成新评论
    data.append('imgPath', '')
    await commentApi.postComment(data)
    content.value = ''
    inputFocused.value = false
    await loadComments(true)
  } catch (e) {
    alert(e?.message || '发布失败')
  } finally {
    posting.value = false
  }
}

function replyTo(rootComment, reply) {
  if (!userStore.isLoggedIn) {
    emit('need-login')
    return
  }
  // 点子评论「回复」时 target 必须是子评论，后端才能写入 replyUserId
  const target = reply || rootComment
  replyingTo.value = rootComment.commentId
  replyTargetId.value = target.commentId
  replyTargetName.value = target.nickName || ''
  replyTargetUserId.value = target.userId || ''
  replyContent.value = ''
}

function cancelReply() {
  replyingTo.value = null
  replyTargetId.value = null
  replyTargetName.value = ''
  replyTargetUserId.value = ''
  replyContent.value = ''
}

async function submitReply() {
  if (!replyContent.value.trim() || posting.value) return
  const targetId = replyTargetId.value
  if (!targetId) {
    alert('请选择要回复的评论')
    return
  }
  posting.value = true
  try {
    const data = new FormData()
    data.append('videoId', props.videoId)
    data.append('content', replyContent.value.trim())
    // 传被回复评论的真实 id（一级或楼中楼），不要只传根评论 id
    data.append('replyCommentId', String(targetId))
    data.append('imgPath', '')
    await commentApi.postComment(data)
    cancelReply()
    await loadComments(true)
  } catch (e) {
    alert(e?.message || '回复失败')
  } finally {
    posting.value = false
  }
}

async function likeComment(comment) {
  if (!userStore.isLoggedIn) {
    emit('need-login')
    return
  }
  const key = commentKey(comment?.commentId)
  if (!key || key === '0' || isLiking(key)) return

  const wasLiked = isCommentLiked(key)
  const prevCount = Number(comment.likeCount || 0)

  // 乐观更新
  const nextLiked = new Set(likedCommentIds.value)
  if (wasLiked) nextLiked.delete(key)
  else nextLiked.add(key)
  likedCommentIds.value = nextLiked
  comment.likeCount = wasLiked ? Math.max(0, prevCount - 1) : prevCount + 1

  const nextLiking = new Set(likingCommentIds.value)
  nextLiking.add(key)
  likingCommentIds.value = nextLiking

  try {
    await userActionApi.doVideoAction(
      props.videoId,
      USER_ACTION_TYPE.COMMENT_LIKE,
      1,
      comment.commentId
    )
  } catch (e) {
    // 回滚
    const rollback = new Set(likedCommentIds.value)
    if (wasLiked) rollback.add(key)
    else rollback.delete(key)
    likedCommentIds.value = rollback
    comment.likeCount = prevCount
    alert(e?.message || '点赞失败')
  } finally {
    const done = new Set(likingCommentIds.value)
    done.delete(key)
    likingCommentIds.value = done
  }
}

async function toggleTop(comment) {
  if (!canTop.value || topping.value) return
  topping.value = true
  try {
    if (Number(comment.topType) === 1) {
      await commentApi.cancelTopComment(comment.commentId)
    } else {
      await commentApi.topComment(comment.commentId)
    }
    await loadComments(true)
  } catch (e) {
    alert(e?.message || '操作失败')
  } finally {
    topping.value = false
  }
}

async function deleteComment(comment) {
  if (!canDelete(comment) || deleting.value) return
  if (!confirm('确定删除这条评论吗？')) return
  deleting.value = true
  try {
    // 后端 deleteComment 清子评时用了 setCommentId（无效），前端先删可见子评再删本体
    const children = Array.isArray(comment.children) ? [...comment.children] : []
    if (Number(comment.pCommentId ?? 0) === 0 && children.length) {
      for (const child of children) {
        if (!canDelete(child)) continue
        try {
          await commentApi.userDelComment(child.commentId)
        } catch {
          // 单条子评失败不阻断删主评
        }
      }
    }
    await commentApi.userDelComment(comment.commentId)
    await loadComments(true)
  } catch (e) {
    alert(e?.message || '删除失败')
  } finally {
    deleting.value = false
  }
}

watch(
  () => props.videoId,
  () => {
    cancelReply()
    loadComments(true)
  }
)
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
  background: #f1f2f3;

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

.input-actions,
.reply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
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

.error-tip {
  margin-bottom: 16px;
  padding: 10px 12px;
  border-radius: 6px;
  background: #fff7e6;
  color: #d48806;
  font-size: 13px;
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
  white-space: pre-wrap;
  word-break: break-word;
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

  &:hover,
  &.active {
    color: var(--bili-pink);
  }

  &.danger:hover {
    color: #f56c6c;
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
  color: var(--bili-blue, #00a1d6);
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
