<template>
  <div class="account-follow">
    <div class="tabs">
      <button :class="{ active: tab === 'focus' }" @click="switchTab('focus')">关注</button>
      <button :class="{ active: tab === 'fans' }" @click="switchTab('fans')">粉丝</button>
    </div>

    <p v-if="error" class="error-tip">{{ error }}</p>
    <div v-if="loading && !list.length" class="loading-spinner">加载中</div>
    <ul v-else-if="list.length" class="user-list">
      <li v-for="item in list" :key="rowKey(item)" class="user-item">
        <router-link :to="`/user/${otherUserId(item)}`" class="user-main">
          <img :src="avatarOf(item)" class="avatar" alt="" />
          <div class="meta">
            <p class="name">{{ displayName(item) }}</p>
            <p class="intro">{{ item.otherIntroduction || '这个人很懒，什么都没写' }}</p>
          </div>
        </router-link>
        <button
          v-if="tab === 'focus'"
          type="button"
          class="btn-outline"
          :disabled="actingId === otherUserId(item)"
          @click="cancelFocus(item)"
        >
          取消关注
        </button>
        <button
          v-else
          type="button"
          class="btn-primary"
          :disabled="actingId === otherUserId(item) || Number(item.focusType) === 1"
          @click="focusBack(item)"
        >
          {{ Number(item.focusType) === 1 ? '已关注' : '回关' }}
        </button>
      </li>
    </ul>
    <p v-else-if="!loading" class="empty-tip">{{ tab === 'focus' ? '还没有关注任何人' : '还没有粉丝' }}</p>

    <div v-if="hasMore && !loading" class="load-more">
      <button type="button" class="btn-outline" @click="loadMore">加载更多</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { uhomeApi } from '@/api'
import { getAvatarUrl } from '@/utils/format'

const route = useRoute()
const router = useRouter()

const tab = ref(route.query.tab === 'fans' ? 'fans' : 'focus')
const list = ref([])
const loading = ref(false)
const pageNo = ref(1)
const hasMore = ref(false)
const error = ref('')
const actingId = ref('')

function otherUserId(item) {
  // 优先 otherUserId；关注列表对方在 focusUserId，粉丝列表对方在 userId
  if (item?.otherUserId) return String(item.otherUserId)
  if (tab.value === 'focus') return String(item?.focusUserId || '')
  return String(item?.userId || '')
}

function displayName(item) {
  if (item?.otherNickName) return item.otherNickName
  return otherUserId(item) ? `用户${String(otherUserId(item)).slice(-4)}` : '用户'
}

function rowKey(item) {
  return `${tab.value}-${otherUserId(item)}-${item?.focusTime || ''}`
}

function avatarOf(item) {
  return getAvatarUrl(item?.otherAvatar)
}

function parsePage(payload) {
  if (!payload || typeof payload !== 'object') {
    return { list: [], pageTotal: 1, pageNo: 1 }
  }
  const rows = Array.isArray(payload.list)
    ? payload.list
    : Array.isArray(payload.records)
      ? payload.records
      : Array.isArray(payload)
        ? payload
        : []
  return {
    list: rows,
    pageTotal: Number(payload.pageTotal ?? 1) || 1,
    pageNo: Number(payload.pageNo ?? 1) || 1
  }
}

async function loadList(reset = false) {
  if (loading.value) return
  loading.value = true
  error.value = ''
  if (reset) pageNo.value = 1
  try {
    const api = tab.value === 'focus' ? uhomeApi.loadFocusList : uhomeApi.loadFansList
    const res = await api(pageNo.value)
    const parsed = parsePage(res.data)
    list.value = reset ? parsed.list : [...list.value, ...parsed.list]
    hasMore.value = pageNo.value < parsed.pageTotal
  } catch (e) {
    if (reset) list.value = []
    hasMore.value = false
    error.value = e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function switchTab(next) {
  if (tab.value === next) return
  tab.value = next
  router.replace({ query: { ...route.query, tab: next } })
  loadList(true)
}

function loadMore() {
  pageNo.value += 1
  loadList()
}

async function cancelFocus(item) {
  const id = otherUserId(item)
  if (!id || actingId.value) return
  actingId.value = id
  try {
    await uhomeApi.cancelFocus(id)
    list.value = list.value.filter((row) => otherUserId(row) !== id)
  } catch (e) {
    alert(e?.message || '取消关注失败')
  } finally {
    actingId.value = ''
  }
}

async function focusBack(item) {
  const id = otherUserId(item)
  if (!id || actingId.value || Number(item.focusType) === 1) return
  actingId.value = id
  try {
    await uhomeApi.focus(id)
    item.focusType = 1
  } catch (e) {
    alert(e?.message || '关注失败')
  } finally {
    actingId.value = ''
  }
}

watch(
  () => route.query.tab,
  (v) => {
    const next = v === 'fans' ? 'fans' : 'focus'
    if (next !== tab.value) {
      tab.value = next
      loadList(true)
    }
  }
)

onMounted(() => loadList(true))
</script>

<style scoped lang="scss">
.tabs {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--bili-border);

  button {
    padding: 0 0 10px;
    font-size: 15px;
    color: var(--bili-text-tertiary);
    border-bottom: 2px solid transparent;

    &.active {
      color: var(--bili-pink);
      border-bottom-color: var(--bili-pink);
      font-weight: 500;
    }
  }
}

.error-tip {
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  background: #fff7e6;
  color: #d48806;
  font-size: 13px;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #fff;
  border-radius: var(--bili-radius);
  box-shadow: var(--bili-shadow);
}

.user-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  background: #f1f2f3;
  flex-shrink: 0;
}

.meta {
  min-width: 0;

  .name {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 4px;
  }

  .intro {
    font-size: 12px;
    color: var(--bili-text-tertiary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.empty-tip {
  text-align: center;
  padding: 48px 0;
  color: var(--bili-text-tertiary);
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
