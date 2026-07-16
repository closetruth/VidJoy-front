<template>
  <div class="page-card">
    <div class="page-header">
      <h2>弹幕管理</h2>
    </div>

    <div class="search-bar">
      <input v-model="query.videoNameFuzzy" placeholder="搜索视频名称" @keyup.enter="loadList(true)" />
      <button class="btn btn-primary" @click="loadList(true)">搜索</button>
    </div>

    <div v-if="loading" class="empty-tip">加载中...</div>
    <table v-else-if="list.length" class="data-table">
      <thead>
        <tr>
          <th>弹幕内容</th>
          <th>视频</th>
          <th>用户</th>
          <th>时间轴</th>
          <th>发送时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in list" :key="item.danmuId">
          <td class="content-cell">{{ item.text }}</td>
          <td>{{ item.videoName || '-' }}</td>
          <td>{{ item.nickName || '-' }}</td>
          <td>{{ formatDuration(item.time) }}</td>
          <td>{{ formatDate(item.postTime) }}</td>
          <td>
            <button class="btn-link danger" @click="deleteItem(item)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="empty-tip">暂无弹幕</div>

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

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '-'
  const s = Math.floor(Number(seconds))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

async function loadList(reset = false) {
  if (loading.value) return
  loading.value = true
  if (reset) pageNo.value = 1

  try {
    const data = new FormData()
    data.append('pageNo', String(pageNo.value))
    data.append('videoNameFuzzy', query.videoNameFuzzy)

    const res = await interactApi.loadDanmu(data)
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
  if (!confirm('确定删除该弹幕？')) return
  await interactApi.delDanmu(item.danmuId)
  list.value = list.value.filter((d) => d.danmuId !== item.danmuId)
}

onMounted(() => loadList(true))
</script>

<style scoped lang="scss">
.content-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
