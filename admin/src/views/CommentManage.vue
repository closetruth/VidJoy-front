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
const hasMore = ref(true)
const query = reactive({ videoNameFuzzy: '' })

async function loadList(reset = false) {
  if (loading.value) return
  loading.value = true
  if (reset) pageNo.value = 1

  try {
    const data = new FormData()
    data.append('pageNo', String(pageNo.value))
    data.append('videoNameFuzzy', query.videoNameFuzzy)

    const res = await interactApi.loadComment(data)
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
