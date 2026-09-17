<template>
  <div class="page-card">
    <div class="page-header">
      <h2>评论管理</h2>
    </div>

    <div class="search-bar">
      <input v-model="query.videoNameFuzzy" placeholder="搜索视频名称" @keyup.enter="loadList(true)" />
      <button class="btn btn-primary" @click="loadList(true)">搜索</button>
    </div>

    <div v-if="loading" class="empty-tip">加载中...</div>
    <table v-else-if="list.length" class="data-table">
      <thead>
        <tr>
          <th>评论内容</th>
          <th>视频</th>
          <th>用户</th>
          <th>点赞</th>
          <th>发布时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in list" :key="item.commentId">
          <td class="content-cell">{{ item.content }}</td>
          <td>{{ item.videoName || '-' }}</td>
          <td>{{ item.nickName || '-' }}</td>
          <td>{{ item.likeCount ?? 0 }}</td>
          <td>{{ formatDate(item.postTime) }}</td>
          <td>
            <button class="btn-link danger" @click="deleteItem(item)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="empty-tip">暂无评论</div>

    <div v-if="hasMore" class="pagination">
      <button class="btn btn-default" @click="loadMore">加载更多</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { interactApi } from '@/api'
import { formatDate } from '@/utils/format'

const list = ref([])
const loading = ref(false)
const pageNo = ref(1)
const pageTotal = ref(1)
const hasMore = ref(true)
const query = reactive({ videoNameFuzzy: '' })

async function loadList(reset = false) {
  if (loading.value) return
  loading.value = true
  if (reset) pageNo.value = 1

  try {
    const res = await interactApi.loadComment({ pageNo: pageNo.value })
    const payload = res.data || {}
    const items = payload.list || (Array.isArray(payload) ? payload : [])
    list.value = reset ? items : [...list.value, ...items]
    pageTotal.value = payload.pageTotal || 1
    hasMore.value = pageNo.value < pageTotal.value
  } catch {
    if (reset) list.value = []
    hasMore.value = false
  } finally {
    loading.value = false
  }
}

function loadMore() {
  if (!hasMore.value || loading.value) return
  pageNo.value++
  loadList()
}

async function deleteItem(item) {
  if (!confirm('确定删除该评论？')) return
  await interactApi.delComment(item.commentId)
  list.value = list.value.filter((c) => c.commentId !== item.commentId)
}

onMounted(() => loadList(true))
</script>

<style scoped lang="scss">
.content-cell {
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
