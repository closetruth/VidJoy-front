<template>
  <div class="page-card">
    <div class="page-header">
      <h2>用户管理</h2>
    </div>

    <div class="search-bar">
      <input v-model="query.nickNameFuzzy" placeholder="搜索昵称" @keyup.enter="loadList(true)" />
      <select v-model="query.status">
        <option value="">全部状态</option>
        <option value="1">正常</option>
        <option value="0">禁用</option>
      </select>
      <button class="btn btn-primary" @click="loadList(true)">搜索</button>
    </div>

    <div v-if="loading" class="empty-tip">加载中...</div>
    <table v-else-if="list.length" class="data-table">
      <thead>
        <tr>
          <th>昵称</th>
          <th>邮箱</th>
          <th>硬币</th>
          <th>状态</th>
          <th>注册时间</th>
          <th>最后登录</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in list" :key="item.userId">
          <td>{{ item.nickName }}</td>
          <td>{{ item.email || '-' }}</td>
          <td>{{ item.currentCoin ?? 0 }}</td>
          <td>
            <span class="tag" :class="userStatus(item.status).type">
              {{ userStatus(item.status).label }}
            </span>
          </td>
          <td>{{ formatDate(item.joinTime) }}</td>
          <td>{{ formatDate(item.lastLoginTime) }}</td>
          <td>
            <button class="btn-link" @click="toggleStatus(item)">
              {{ item.status == 1 ? '禁用' : '启用' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="empty-tip">暂无用户</div>

    <div v-if="hasMore" class="pagination">
      <button class="btn btn-default" @click="loadMore">加载更多</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { userApi } from '@/api'
import { formatDate, USER_STATUS } from '@/utils/format'

const list = ref([])
const loading = ref(false)
const pageNo = ref(1)
const hasMore = ref(true)
const query = reactive({ nickNameFuzzy: '', status: '' })

function userStatus(status) {
  return USER_STATUS[status] || { label: '未知', type: 'info' }
}

async function loadList(reset = false) {
  if (loading.value) return
  loading.value = true
  if (reset) pageNo.value = 1

  try {
    const params = { pageNo: pageNo.value }
    const kw = query.nickNameFuzzy.trim()
    if (kw) params.nickNameFuzzy = kw
    if (query.status !== '') params.status = Number(query.status)

    const res = await userApi.loadUser(params)
    const payload = res.data || {}
    const items = payload.list || payload.records || []
    const pageSize = payload.pageSize || 15
    const totalCount = payload.totalCount ?? 0
    const currentPage = payload.pageNo || pageNo.value

    list.value = reset ? items : [...list.value, ...items]
    hasMore.value = currentPage * pageSize < totalCount
  } catch {
    if (reset) list.value = []
    hasMore.value = false
  } finally {
    loading.value = false
  }
}

function loadMore() {
  pageNo.value++
  loadList()
}

async function toggleStatus(item) {
  const newStatus = item.status == 1 ? 0 : 1
  const action = newStatus == 0 ? '禁用' : '启用'
  if (!confirm(`确定${action}用户「${item.nickName}」？`)) return

  await userApi.changeStatus({ userId: item.userId, status: newStatus })
  item.status = newStatus
}

onMounted(() => loadList(true))
</script>
