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
        <option value="1">待审核</option>
        <option value="2">已通过</option>
        <option value="3">未通过</option>
      </select>
      <button class="btn btn-primary" @click="loadList(true)">搜索</button>
    </div>

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
          <td><img :src="getResourceUrl(item.videoCover)" class="cover-thumb" alt="" /></td>
          <td class="title-cell">{{ item.videoName }}</td>
          <td>{{ item.nickName || '-' }}</td>
          <td>{{ formatCount(item.playCount) }}</td>
          <td>
            <span class="tag" :class="statusInfo(item.status).type">
              {{ statusInfo(item.status).label }}
            </span>
          </td>
          <td>{{ formatDate(item.createTime) }}</td>
          <td class="actions">
            <button v-if="item.status == 1" class="btn-link" @click="openAudit(item, 2)">通过</button>
            <button v-if="item.status == 1" class="btn-link danger" @click="openAudit(item, 3)">拒绝</button>
            <button class="btn-link" @click="toggleRecommend(item)">
              {{ item.recommendType == 1 ? '取消推荐' : '推荐' }}
            </button>
            <button class="btn-link danger" @click="deleteVideo(item)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="empty-tip">暂无数据</div>

    <div v-if="hasMore" class="pagination">
      <button class="btn btn-default" @click="loadMore">加载更多</button>
    </div>

    <div v-if="auditVisible" class="modal-mask" @click.self="auditVisible = false">
      <div class="modal-box">
        <div class="modal-header">
          <h3>{{ auditStatus == 2 ? '审核通过' : '审核拒绝' }}</h3>
          <button @click="auditVisible = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-item">
            <label>审核原因</label>
            <textarea v-model="auditReason" rows="3" :placeholder="auditStatus == 2 ? '可选' : '请填写拒绝原因'" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="auditVisible = false">取消</button>
          <button class="btn btn-primary" @click="submitAudit">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { videoApi } from '@/api'
import { formatCount, formatDate, getResourceUrl, VIDEO_STATUS } from '@/utils/format'

const list = ref([])
const loading = ref(false)
const pageNo = ref(1)
const hasMore = ref(true)
const query = reactive({ videoNameFuzzy: '', status: '' })

const auditVisible = ref(false)
const auditItem = ref(null)
const auditStatus = ref(2)
const auditReason = ref('')

function statusInfo(status) {
  return VIDEO_STATUS[status] || { label: '未知', type: 'info' }
}

async function loadList(reset = false) {
  if (loading.value) return
  loading.value = true
  if (reset) pageNo.value = 1

  try {
    const data = new FormData()
    data.append('pageNo', String(pageNo.value))
    data.append('videoNameFuzzy', query.videoNameFuzzy)
    if (query.status) data.append('status', query.status)

    const res = await videoApi.loadVideoList(data)
    const items = res.data?.list || res.data || []
    list.value = reset ? items : [...list.value, ...items]
    hasMore.value = items.length >= 20
  } catch {
    if (reset) list.value = []
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
  const data = new FormData()
  data.append('videoId', auditItem.value.videoId)
  data.append('status', String(auditStatus.value))
  data.append('reason', auditReason.value)
  await videoApi.auditVideo(data)
  auditVisible.value = false
  loadList(true)
}

async function toggleRecommend(item) {
  await videoApi.recommendVideo(item.videoId)
  item.recommendType = item.recommendType == 1 ? 0 : 1
}

async function deleteVideo(item) {
  if (!confirm(`确定删除「${item.videoName}」？`)) return
  await videoApi.deleteVideo(item.videoId)
  loadList(true)
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

.actions {
  white-space: nowrap;
}
</style>
