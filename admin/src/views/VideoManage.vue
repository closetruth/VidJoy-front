<template>
  <div class="page-card">
    <div class="page-header">
      <h2>视频管理</h2>
    </div>

    <div class="search-bar">
      <input v-model="query.videoNameFuzzy" placeholder="搜索视频标题" @keyup.enter="loadList(true)" />
      <select v-model="query.status">
        <option value="">全部状态</option>
        <option value="0">转码中</option>
        <option value="1">转码失败</option>
        <option value="2">待审核</option>
        <option value="3">已通过</option>
        <option value="4">未通过</option>
      </select>
      <button class="btn btn-primary" @click="loadList(true)">搜索</button>
    </div>

    <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
    <div v-if="loading" class="empty-tip">加载中...</div>
    <table v-else-if="list.length" class="data-table">
      <thead>
        <tr>
          <th>封面</th>
          <th>标题</th>
          <th>UP主</th>
          <th>播放量</th>
          <th>状态</th>
          <th>发布时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in list" :key="item.videoId">
          <td>
            <img
              :src="coverUrl(pickField(item, 'videoCover', 'video_cover'))"
              class="cover-thumb"
              alt=""
              @error="onCoverError"
            />
          </td>
          <td class="title-cell">{{ videoTitle(item) }}</td>
          <td>{{ uploaderName(item) }}</td>
          <td>{{ formatCount(pickField(item, 'playCount', 'play_count') || 0) }}</td>
          <td>
            <span class="tag" :class="statusInfo(item.status).type">
              {{ statusInfo(item.status).label }}
            </span>
          </td>
          <td>{{ formatDate(item.createTime) }}</td>
          <td class="actions">
            <button v-if="item.status == 2" class="btn-link" @click="openAudit(item, 3)">通过</button>
            <button v-if="item.status == 2" class="btn-link danger" @click="openAudit(item, 4)">拒绝</button>
            <button class="btn-link" @click="toggleRecommend(item)">
              {{ item.recommendType == 1 ? '取消推荐' : '推荐' }}
            </button>
            <button class="btn-link danger" @click="removeVideo(item)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="empty-tip">暂无数据</div>

    <div v-if="hasMore && !loading" class="pagination">
      <button class="btn btn-default" @click="loadMore">加载更多</button>
    </div>

    <div v-if="auditVisible" class="modal-mask" @click.self="auditVisible = false">
      <div class="modal-box">
        <div class="modal-header">
          <h3>{{ auditStatus == 3 ? '审核通过' : '审核拒绝' }}</h3>
          <button @click="auditVisible = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-item">
            <label>审核原因</label>
            <textarea
              v-model="auditReason"
              rows="3"
              :placeholder="auditStatus == 3 ? '可选' : '请填写拒绝原因'"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="auditVisible = false">取消</button>
          <button class="btn btn-primary" :disabled="submitting" @click="submitAudit">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { videoApi } from '@/api'
import { formatCount, formatDate, getResourceUrl, VIDEO_STATUS, pickField } from '@/utils/format'

const COVER_PLACEHOLDER = 'https://i0.hdslb.com/bfs/archive/placeholder.jpg'

const list = ref([])
const loading = ref(false)
const submitting = ref(false)
const errorMsg = ref('')
const pageNo = ref(1)
const hasMore = ref(true)
const query = reactive({ videoNameFuzzy: '', status: '' })

const auditVisible = ref(false)
const auditItem = ref(null)
const auditStatus = ref(3)
const auditReason = ref('')

function statusInfo(status) {
  return VIDEO_STATUS[status] || { label: '未知', type: 'info' }
}

function coverUrl(sourceName) {
  return getResourceUrl(sourceName) || COVER_PLACEHOLDER
}

function videoTitle(item) {
  return pickField(item, 'videoName', 'video_name') || '未命名视频'
}

function uploaderName(item) {
  return pickField(item, 'nickName', 'nick_name', 'userNickName') || pickField(item, 'userId', 'user_id') || '-'
}

function onCoverError(e) {
  e.target.src = COVER_PLACEHOLDER
}

function normalizeVideoItem(item) {
  if (!item || typeof item !== 'object') return item
  return {
    ...item,
    videoId: pickField(item, 'videoId', 'video_id') || item.videoId,
    videoName: pickField(item, 'videoName', 'video_name') || item.videoName,
    videoCover: pickField(item, 'videoCover', 'video_cover') || item.videoCover,
    nickName: pickField(item, 'nickName', 'nick_name', 'userNickName') || item.nickName,
    userId: pickField(item, 'userId', 'user_id') || item.userId,
    playCount: pickField(item, 'playCount', 'play_count') || item.playCount || 0,
    recommendType: pickField(item, 'recommendType', 'recommend_type') ?? item.recommendType,
    status: item.status ?? item.videoStatus
  }
}

function buildParams() {
  const params = { pageNo: pageNo.value }
  const kw = query.videoNameFuzzy.trim()
  if (kw) params.videoNameFuzzy = kw
  if (query.status !== '') params.status = Number(query.status)
  return params
}

async function loadList(reset = false) {
  if (loading.value) return
  loading.value = true
  if (reset) pageNo.value = 1

  try {
    const res = await videoApi.loadVideoList(buildParams())
    const payload = res.data || {}
    const items = (payload.list || payload.records || []).map(normalizeVideoItem)
    const pageSize = payload.pageSize || 15
    const totalCount = payload.totalCount ?? 0
    const currentPage = payload.pageNo || pageNo.value

    list.value = reset ? items : [...list.value, ...items]
    hasMore.value = currentPage * pageSize < totalCount
    errorMsg.value = ''
  } catch (e) {
    if (reset) list.value = []
    errorMsg.value = e?.message || '加载视频列表失败'
  } finally {
    loading.value = false
  }
}

function loadMore() {
  pageNo.value++
  loadList()
}

function openAudit(item, status) {
  auditItem.value = item
  auditStatus.value = status
  auditReason.value = ''
  auditVisible.value = true
}

async function submitAudit() {
  if (auditStatus.value === 4 && !auditReason.value.trim()) {
    errorMsg.value = '请填写拒绝原因'
    return
  }
  submitting.value = true
  errorMsg.value = ''
  try {
    const data = new FormData()
    data.append('videoId', auditItem.value.videoId)
    data.append('status', String(auditStatus.value))
    data.append('reason', auditReason.value)
    await videoApi.auditVideo(data)
    auditVisible.value = false
    loadList(true)
  } catch (e) {
    errorMsg.value = e?.message || '审核失败'
  } finally {
    submitting.value = false
  }
}

async function toggleRecommend(item) {
  try {
    await videoApi.recommendVideo(item.videoId)
    item.recommendType = item.recommendType == 1 ? 0 : 1
  } catch (e) {
    errorMsg.value = e?.message || '推荐操作失败'
  }
}

async function removeVideo(item) {
  if (!confirm(`确定删除「${videoTitle(item)}」？`)) return
  try {
    await videoApi.deleteVideo(item.videoId)
    loadList(true)
  } catch (e) {
    errorMsg.value = e?.message || '删除失败'
  }
}

onMounted(() => loadList(true))
</script>

<style scoped lang="scss">
.title-cell {
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cover-thumb {
  width: 96px;
  height: 54px;
  object-fit: cover;
  border-radius: 4px;
  background: #e3e5e7;
}

.actions {
  white-space: nowrap;
}

.error-msg {
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: 8px;
  background: rgba(245, 63, 63, 0.08);
  border: 1px solid rgba(245, 63, 63, 0.22);
  color: #f53f3f;
  font-size: 13px;
}
</style>
