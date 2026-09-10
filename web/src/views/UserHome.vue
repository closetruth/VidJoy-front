<template>
  <div class="user-home">
    <div class="user-banner" :style="bannerStyle">
      <div class="container banner-content">
        <img :src="avatarUrl" class="user-avatar" alt="" />
        <div class="user-info">
          <h1 class="nickname">{{ displayName }}</h1>
          <p class="intro">{{ userInfo?.personIntroduction || '这个人很懒，什么都没写' }}</p>
          <div class="user-stats">
            <button
              v-if="isSelf"
              type="button"
              class="stat-btn"
              @click="$router.push('/account/follow?tab=focus')"
            >
              <strong>{{ formatCount(userInfo?.focusCount) }}</strong> 关注
            </button>
            <span v-else><strong>{{ formatCount(userInfo?.focusCount) }}</strong> 关注</span>
            <button
              v-if="isSelf"
              type="button"
              class="stat-btn"
              @click="$router.push('/account/follow?tab=fans')"
            >
              <strong>{{ formatCount(userInfo?.fansCount) }}</strong> 粉丝
            </button>
            <span v-else><strong>{{ formatCount(userInfo?.fansCount) }}</strong> 粉丝</span>
            <span><strong>{{ formatCount(videoTotal) }}</strong> 投稿</span>
          </div>
        </div>
        <button
          v-if="showFollowBtn"
          class="btn-primary follow-btn"
          @click="toggleFollow"
        >
          {{ followed ? '已关注' : '+ 关注' }}
        </button>
      </div>
    </div>

    <div class="container user-content">
      <div class="tab-bar">
        <button class="tab" :class="{ active: tab === 'video' }" @click="switchTab('video')">投稿</button>
        <button class="tab" :class="{ active: tab === 'collection' }" @click="switchTab('collection')">收藏</button>
        <button class="tab" :class="{ active: tab === 'series' }" @click="switchTab('series')">合集</button>
      </div>

      <div v-if="tab === 'video'" class="toolbar">
        <div class="order-tabs">
          <button
            v-for="item in orderOptions"
            :key="item.value"
            type="button"
            class="order-btn"
            :class="{ active: orderType === item.value }"
            @click="changeOrder(item.value)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <div v-if="tab === 'series' && !seriesDetail && isSelf" class="toolbar">
        <button type="button" class="btn-primary create-btn" @click="openCreateSeries">新建合集</button>
      </div>

      <div v-if="listLoading && !hasCurrentList" class="loading-spinner">加载中</div>

      <template v-else-if="tab === 'series' && seriesDetail">
        <div class="series-detail">
          <div class="detail-head">
            <button type="button" class="back-btn" @click="closeSeriesDetail">← 返回合集列表</button>
            <div class="detail-meta">
              <h2>{{ seriesDetail.videoSeries?.seriesName || '未命名合集' }}</h2>
              <p>{{ seriesDetail.videoSeries?.seriesDescription || '暂无简介' }}</p>
            </div>
            <div v-if="isSelf" class="detail-actions">
              <button type="button" class="btn-outline" @click="openEditSeries">修改合集</button>
              <button type="button" class="btn-outline" @click="openAddVideos">添加视频</button>
              <button type="button" class="btn-outline danger" @click="removeWholeSeries">删除合集</button>
            </div>
          </div>
          <div v-if="detailVideos.length" class="detail-video-list">
            <div v-for="item in detailVideos" :key="item.videoId" class="detail-video-row">
              <router-link :to="`/video/${item.videoId}`" class="detail-video-link">
                <img
                  class="detail-cover"
                  :src="getResourceUrl(item.videoCover) || placeholderCover"
                  alt=""
                />
                <div class="detail-video-info">
                  <span class="detail-title">{{ item.videoName || item.videoId }}</span>
                  <span class="detail-play">{{ formatCount(item.playCount) }} 播放</span>
                </div>
              </router-link>
              <button
                v-if="isSelf"
                type="button"
                class="btn-outline tiny"
                :disabled="seriesActing"
                @click="removeSeriesVideo(item.videoId)"
              >
                移除
              </button>
            </div>
          </div>
          <div v-else class="empty-state">合集内暂无视频</div>
        </div>
      </template>

      <template v-else-if="tab === 'series'">
        <div v-if="seriesList.length" class="series-grid">
          <div
            v-for="(item, index) in seriesList"
            :key="item.seriesId"
            class="series-card"
          >
            <button type="button" class="series-main" @click="openSeriesDetail(item.seriesId)">
              <div class="series-cover" :style="seriesCoverStyle(item)">
                <span v-if="!seriesCoverUrl(item)">合集</span>
              </div>
              <div class="series-body">
                <h3 class="series-name">{{ item.seriesName || '未命名合集' }}</h3>
                <p class="series-desc">{{ item.seriesDescription || '暂无简介' }}</p>
              </div>
            </button>
            <div v-if="seriesVideos(item).length" class="series-thumbs">
              <router-link
                v-for="v in seriesVideos(item)"
                :key="v.videoId"
                v-show="v.videoId"
                class="series-thumb-link"
                :to="`/video/${v.videoId}`"
              >
                <img
                  class="series-thumb"
                  :src="videoCoverOf(v) || placeholderCover"
                  :alt="v.videoName || ''"
                  :title="v.videoName || v.videoId"
                />
              </router-link>
            </div>
            <div v-if="isSelf" class="series-sort">
              <button
                type="button"
                class="sort-btn"
                :disabled="index === 0 || seriesActing"
                @click="moveSeries(index, -1)"
              >
                上移
              </button>
              <button
                type="button"
                class="sort-btn"
                :disabled="index === seriesList.length - 1 || seriesActing"
                @click="moveSeries(index, 1)"
              >
                下移
              </button>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">暂无合集</div>
      </template>

      <template v-else>
        <div v-if="displayList.length" class="video-grid">
          <VideoCard v-for="video in displayList" :key="video.videoId" :video="video" />
        </div>
        <div v-else class="empty-state">
          {{ tab === 'video' ? '暂无投稿' : '暂无公开收藏' }}
        </div>
        <div v-if="hasMore" class="load-more">
          <button type="button" class="btn-outline" :disabled="listLoading" @click="loadMore">
            {{ listLoading ? '加载中...' : '加载更多' }}
          </button>
        </div>
      </template>
    </div>

    <div v-if="showSeriesModal" class="modal-mask" @click.self="closeSeriesModal">
      <div class="modal-card">
        <h3>
          {{
            seriesModalMode === 'create'
              ? '新建合集'
              : seriesModalMode === 'edit'
                ? '修改合集'
                : '添加视频'
          }}
        </h3>
        <template v-if="seriesModalMode === 'create' || seriesModalMode === 'edit'">
          <div class="form-item">
            <label>名称</label>
            <input v-model="seriesForm.name" type="text" maxlength="100" placeholder="合集名称" />
          </div>
          <div class="form-item">
            <label>简介</label>
            <textarea v-model="seriesForm.desc" rows="3" maxlength="200" placeholder="可选" />
          </div>
        </template>
        <div v-if="seriesModalMode !== 'edit'" class="form-item">
          <label>{{ seriesModalMode === 'create' ? '选择视频（至少 1 个）' : '选择要加入的视频' }}</label>
          <div v-if="pickLoading" class="field-tip">加载可选视频...</div>
          <div v-else-if="pickVideos.length" class="pick-list">
            <label v-for="v in pickVideos" :key="v.videoId" class="pick-item">
              <input v-model="seriesForm.videoIds" type="checkbox" :value="v.videoId" />
              <span :title="v.videoName">{{ v.videoName || v.videoId }}</span>
            </label>
          </div>
          <p v-else class="field-tip">暂无可加入合集的投稿</p>
        </div>
        <p v-if="seriesError" class="error-tip">{{ seriesError }}</p>
        <div class="modal-actions">
          <button type="button" class="btn-outline" :disabled="seriesSaving" @click="closeSeriesModal">取消</button>
          <button type="button" class="btn-primary" :disabled="seriesSaving" @click="submitSeriesModal">
            {{ seriesSaving ? '提交中...' : '确定' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { useRoute } from 'vue-router'
import VideoCard from '@/components/video/VideoCard.vue'
import { useUserStore } from '@/stores'
import { uhomeApi } from '@/api'
import {
  formatCount,
  getAvatarUrl,
  getResourceUrl,
  unwrapPagination,
  getUserThemeGradient
} from '@/utils/format'

const route = useRoute()
const userStore = useUserStore()
const userId = computed(() => String(route.params.userId || ''))

const placeholderCover = 'https://i0.hdslb.com/bfs/archive/placeholder.png'

const orderOptions = [
  { value: 0, label: '最新发布' },
  { value: 1, label: '最多播放' },
  { value: 2, label: '最多点赞' }
]

const userInfo = ref(null)
const videoList = ref([])
const collectionList = ref([])
const seriesList = ref([])
const seriesDetail = ref(null)
const videoTotal = ref(0)
const videoPageNo = ref(1)
const videoPageTotal = ref(1)
const collectionPageNo = ref(1)
const collectionPageTotal = ref(1)
const orderType = ref(0)
const tab = ref('video')
const profileLoading = ref(true)
const listLoading = ref(false)
const followed = ref(false)
const following = ref(false)
const videoLoaded = ref(false)
const collectionLoaded = ref(false)
const seriesLoaded = ref(false)
const seriesActing = ref(false)

const showSeriesModal = ref(false)
const seriesModalMode = ref('create') // create | add | edit
const seriesSaving = ref(false)
const pickLoading = ref(false)
const pickVideos = ref([])
const seriesError = ref('')
const seriesForm = reactive({
  name: '',
  desc: '',
  videoIds: []
})

const displayName = computed(() => userInfo.value?.nickName || videoList.value[0]?.nickName || '用户')
const avatarUrl = computed(() =>
  getAvatarUrl(userInfo.value?.avatar || videoList.value[0]?.userAvatar)
)
const bannerStyle = computed(() => ({
  background: getUserThemeGradient(userInfo.value?.theme)
}))
const isSelf = computed(
  () => userStore.userInfo?.userId && String(userStore.userInfo.userId) === userId.value
)
const showFollowBtn = computed(() => userStore.isLoggedIn && !isSelf.value)
const displayList = computed(() =>
  tab.value === 'video' ? videoList.value : collectionList.value
)
const detailVideos = computed(() => {
  const list = seriesDetail.value?.seriesVideoList
  return Array.isArray(list) ? list : []
})
const hasCurrentList = computed(() => {
  if (tab.value === 'series') {
    if (seriesDetail.value) return detailVideos.value.length > 0
    return seriesList.value.length > 0
  }
  return displayList.value.length > 0
})
const hasMore = computed(() => {
  if (tab.value === 'video') return videoPageNo.value < videoPageTotal.value
  if (tab.value === 'collection') return collectionPageNo.value < collectionPageTotal.value
  return false
})

function videoCoverOf(v) {
  if (!v) return ''
  return getResourceUrl(v.videoCover || v.video_cover || '')
}

function seriesVideos(item) {
  const list = item?.videoInfoList || item?.videoList || []
  return Array.isArray(list) ? list.slice(0, 5) : []
}

function seriesCoverUrl(item) {
  const first = seriesVideos(item)[0]
  return videoCoverOf(first)
}

function seriesCoverStyle(item) {
  const url = seriesCoverUrl(item)
  if (!url) return {}
  return {
    backgroundImage: `url(${url})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }
}

async function loadProfile() {
  profileLoading.value = true
  try {
    const res = await uhomeApi.getUserInfo(userId.value)
    userInfo.value = res.data || {}
    followed.value = Boolean(res.data?.haveFocus)
  } catch {
    userInfo.value = null
    followed.value = false
  } finally {
    profileLoading.value = false
  }
}

async function loadVideos(reset = false) {
  if (!userId.value || listLoading.value) return
  listLoading.value = true
  if (reset) {
    videoPageNo.value = 1
    videoList.value = []
  }
  try {
    const res = await uhomeApi.loadVideoList({
      userId: userId.value,
      pageNo: videoPageNo.value,
      orderType: orderType.value
    })
    const page = unwrapPagination(res.data)
    videoList.value = reset ? page.list : [...videoList.value, ...page.list]
    videoPageNo.value = page.pageNo
    videoPageTotal.value = page.pageTotal
    videoTotal.value = page.totalCount
    videoLoaded.value = true
  } catch {
    if (reset) {
      videoList.value = []
      videoTotal.value = 0
      videoPageTotal.value = 1
    }
  } finally {
    listLoading.value = false
  }
}

async function loadCollections(reset = false) {
  if (!userId.value || listLoading.value) return
  listLoading.value = true
  if (reset) {
    collectionPageNo.value = 1
    collectionList.value = []
  }
  try {
    const res = await uhomeApi.loadVideoCollection({
      userId: userId.value,
      pageNo: collectionPageNo.value
    })
    const page = unwrapPagination(res.data)
    collectionList.value = reset ? page.list : [...collectionList.value, ...page.list]
    collectionPageNo.value = page.pageNo
    collectionPageTotal.value = page.pageTotal
    collectionLoaded.value = true
  } catch {
    if (reset) collectionList.value = []
  } finally {
    listLoading.value = false
  }
}

async function loadSeries() {
  if (!userId.value || listLoading.value) return
  listLoading.value = true
  try {
    let raw
    try {
      const res = await uhomeApi.loadVideoSeriesWithVideo(userId.value)
      raw = res.data
    } catch {
      const res = await uhomeApi.loadVideoSeries(userId.value)
      raw = res.data
    }
    const list = Array.isArray(raw) ? raw : raw?.list || []
    seriesList.value = await enrichSeriesVideos(list)
    seriesLoaded.value = true
  } catch {
    seriesList.value = []
  } finally {
    listLoading.value = false
  }
}

/** 列表缺 videoInfoList 时，用详情接口补最多 5 个视频（封面 + 缩略图） */
async function enrichSeriesVideos(list) {
  if (!Array.isArray(list) || !list.length) return []
  const need = list.filter((s) => !seriesVideos(s).length && s.seriesId != null)
  if (!need.length) return list

  const details = await Promise.all(
    need.map(async (s) => {
      try {
        const res = await uhomeApi.getVideoSeriesDetail(s.seriesId)
        const videos = res.data?.seriesVideoList || []
        return {
          seriesId: s.seriesId,
          videoInfoList: videos.slice(0, 5).map((v) => ({
            videoId: v.videoId,
            videoName: v.videoName,
            videoCover: v.videoCover || v.video_cover,
            playCount: v.playCount
          }))
        }
      } catch {
        return { seriesId: s.seriesId, videoInfoList: [] }
      }
    })
  )
  const map = new Map(details.map((d) => [d.seriesId, d.videoInfoList]))
  return list.map((s) => {
    const filled = map.get(s.seriesId)
    if (!filled) return s
    return { ...s, videoInfoList: filled }
  })
}

async function openSeriesDetail(seriesId) {
  listLoading.value = true
  try {
    const res = await uhomeApi.getVideoSeriesDetail(seriesId)
    seriesDetail.value = res.data || null
  } catch (e) {
    alert(e?.message || '加载合集详情失败')
    seriesDetail.value = null
  } finally {
    listLoading.value = false
  }
}

function closeSeriesDetail() {
  seriesDetail.value = null
}

async function ensureTabData(reset = false) {
  if (tab.value === 'video') {
    if (reset || !videoLoaded.value) await loadVideos(true)
  } else if (tab.value === 'collection') {
    if (reset || !collectionLoaded.value) await loadCollections(true)
  } else if (tab.value === 'series') {
    seriesDetail.value = null
    if (reset || !seriesLoaded.value) await loadSeries()
  }
}

async function switchTab(next) {
  if (tab.value === next) return
  tab.value = next
  await ensureTabData(false)
}

async function changeOrder(value) {
  if (orderType.value === value) return
  orderType.value = value
  await loadVideos(true)
}

async function loadMore() {
  if (listLoading.value || !hasMore.value) return
  if (tab.value === 'video') {
    videoPageNo.value += 1
    await loadVideos(false)
  } else if (tab.value === 'collection') {
    collectionPageNo.value += 1
    await loadCollections(false)
  }
}

async function reloadAll() {
  videoLoaded.value = false
  collectionLoaded.value = false
  seriesLoaded.value = false
  videoList.value = []
  collectionList.value = []
  seriesList.value = []
  seriesDetail.value = null
  await loadProfile()
  await ensureTabData(true)
}

async function toggleFollow() {
  if (following.value) return
  following.value = true
  try {
    if (followed.value) {
      await uhomeApi.cancelFocus(userId.value)
      followed.value = false
      if (userInfo.value) {
        userInfo.value.fansCount = Math.max(0, Number(userInfo.value.fansCount || 0) - 1)
      }
    } else {
      await uhomeApi.focus(userId.value)
      followed.value = true
      if (userInfo.value) {
        userInfo.value.fansCount = Number(userInfo.value.fansCount || 0) + 1
      }
    }
  } catch (e) {
    alert(e?.message || '操作失败')
  } finally {
    following.value = false
  }
}

async function loadPickVideos(seriesId) {
  pickLoading.value = true
  pickVideos.value = []
  try {
    const res = await uhomeApi.loadAllVideo(seriesId)
    pickVideos.value = unwrapPagination(res.data).list
  } catch (e) {
    pickVideos.value = []
    seriesError.value = e?.message || '加载视频失败'
  } finally {
    pickLoading.value = false
  }
}

async function openCreateSeries() {
  seriesModalMode.value = 'create'
  seriesError.value = ''
  seriesForm.name = ''
  seriesForm.desc = ''
  seriesForm.videoIds = []
  showSeriesModal.value = true
  await loadPickVideos()
}

async function openAddVideos() {
  if (!seriesDetail.value?.videoSeries?.seriesId) return
  seriesModalMode.value = 'add'
  seriesError.value = ''
  seriesForm.videoIds = []
  showSeriesModal.value = true
  await loadPickVideos(seriesDetail.value.videoSeries.seriesId)
}

function openEditSeries() {
  const series = seriesDetail.value?.videoSeries
  if (!series?.seriesId) return
  seriesModalMode.value = 'edit'
  seriesError.value = ''
  seriesForm.name = series.seriesName || ''
  seriesForm.desc = series.seriesDescription || ''
  seriesForm.videoIds = []
  showSeriesModal.value = true
}

function closeSeriesModal() {
  if (seriesSaving.value) return
  showSeriesModal.value = false
}

async function submitSeriesModal() {
  if (seriesModalMode.value === 'create') {
    await submitCreateSeries()
  } else if (seriesModalMode.value === 'edit') {
    await submitEditSeries()
  } else {
    await submitAddVideos()
  }
}

async function submitCreateSeries() {
  const name = String(seriesForm.name || '').trim()
  if (!name) {
    seriesError.value = '请填写合集名称'
    return
  }
  if (!seriesForm.videoIds.length) {
    seriesError.value = '请至少选择 1 个视频'
    return
  }
  seriesSaving.value = true
  seriesError.value = ''
  try {
    await uhomeApi.saveVideoSeries({
      seriesName: name,
      seriesDescription: String(seriesForm.desc || '').trim(),
      videoIds: seriesForm.videoIds.join(',')
    })
    showSeriesModal.value = false
    seriesLoaded.value = false
    await loadSeries()
  } catch (e) {
    seriesError.value = e?.message || '创建失败'
  } finally {
    seriesSaving.value = false
  }
}

async function submitAddVideos() {
  const series = seriesDetail.value?.videoSeries
  if (!series?.seriesId) return
  if (!seriesForm.videoIds.length) {
    seriesError.value = '请至少选择 1 个视频'
    return
  }
  seriesSaving.value = true
  seriesError.value = ''
  try {
    await uhomeApi.saveVideoSeries({
      seriesId: series.seriesId,
      seriesName: series.seriesName || '-',
      seriesDescription: series.seriesDescription || '',
      videoIds: seriesForm.videoIds.join(',')
    })
    showSeriesModal.value = false
    await openSeriesDetail(series.seriesId)
    seriesLoaded.value = false
    await loadSeries()
  } catch (e) {
    seriesError.value = e?.message || '添加失败'
  } finally {
    seriesSaving.value = false
  }
}

async function submitEditSeries() {
  const series = seriesDetail.value?.videoSeries
  if (!series?.seriesId) return
  const name = String(seriesForm.name || '').trim()
  if (!name) {
    seriesError.value = '请填写合集名称'
    return
  }
  seriesSaving.value = true
  seriesError.value = ''
  try {
    await uhomeApi.saveVideoSeries({
      seriesId: series.seriesId,
      seriesName: name,
      seriesDescription: String(seriesForm.desc || '').trim()
    })
    showSeriesModal.value = false
    await openSeriesDetail(series.seriesId)
    seriesLoaded.value = false
    await loadSeries()
  } catch (e) {
    seriesError.value = e?.message || '修改失败'
  } finally {
    seriesSaving.value = false
  }
}

async function removeSeriesVideo(videoId) {
  const series = seriesDetail.value?.videoSeries
  if (!series?.seriesId || seriesActing.value) return
  if (!confirm('确定从合集中移除该视频？')) return
  seriesActing.value = true
  try {
    await uhomeApi.delServiesVideo({
      seriesId: series.seriesId,
      seriesName: series.seriesName || '-',
      videoIds: videoId
    })
    await openSeriesDetail(series.seriesId)
    seriesLoaded.value = false
    await loadSeries()
  } catch (e) {
    alert(e?.message || '移除失败')
  } finally {
    seriesActing.value = false
  }
}

async function removeWholeSeries() {
  const series = seriesDetail.value?.videoSeries
  if (!series?.seriesId || seriesActing.value) return
  if (!confirm('确定删除该合集内的视频关联？')) return
  seriesActing.value = true
  try {
    await uhomeApi.delVideoSeries({
      seriesId: series.seriesId,
      seriesName: series.seriesName || '-'
    })
    seriesDetail.value = null
    seriesLoaded.value = false
    await loadSeries()
  } catch (e) {
    alert(e?.message || '删除失败')
  } finally {
    seriesActing.value = false
  }
}

async function moveSeries(index, delta) {
  const next = index + delta
  if (next < 0 || next >= seriesList.value.length || seriesActing.value) return
  const list = [...seriesList.value]
  const tmp = list[index]
  list[index] = list[next]
  list[next] = tmp
  seriesList.value = list
  seriesActing.value = true
  try {
    await uhomeApi.changeVideoSeriesSort(list.map((s) => s.seriesId))
  } catch (e) {
    alert(e?.message || '排序失败')
    seriesLoaded.value = false
    await loadSeries()
  } finally {
    seriesActing.value = false
  }
}

watch(userId, () => {
  tab.value = 'video'
  orderType.value = 0
  reloadAll()
})

onMounted(reloadAll)
</script>

<style scoped lang="scss">
.user-banner {
  padding: 40px 0;
  margin-bottom: 20px;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 24px;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid #fff;
  object-fit: cover;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  color: #fff;

  .nickname {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .intro {
    font-size: 14px;
    opacity: 0.9;
    margin-bottom: 12px;
  }
}

.user-stats {
  display: flex;
  gap: 24px;
  font-size: 14px;

  strong {
    font-size: 16px;
    margin-right: 4px;
  }

  .stat-btn {
    color: inherit;
    font-size: inherit;

    &:hover {
      opacity: 0.85;
      text-decoration: underline;
    }
  }
}

.follow-btn {
  flex-shrink: 0;
}

.tab-bar {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--bili-border);
  padding-bottom: 12px;
}

.tab {
  font-size: 16px;
  color: var(--bili-text-tertiary);
  padding-bottom: 8px;
  border-bottom: 2px solid transparent;

  &.active {
    color: var(--bili-pink);
    border-bottom-color: var(--bili-pink);
    font-weight: 500;
  }
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.order-tabs {
  display: flex;
  gap: 8px;
}

.order-btn {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  color: var(--bili-text-secondary);
  background: #f4f4f4;

  &.active {
    color: #fff;
    background: var(--bili-pink);
  }
}

.create-btn {
  margin-left: auto;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px 16px;
}

.series-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.series-card {
  background: #fff;
  border-radius: var(--bili-radius);
  overflow: hidden;
  box-shadow: var(--bili-shadow);
  display: flex;
  flex-direction: column;
}

.series-main {
  text-align: left;
  width: 100%;
  color: inherit;
}

.series-cover {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(251, 114, 153, 0.85), rgba(251, 114, 153, 0.45));
  color: #fff;
  font-weight: 600;
  letter-spacing: 2px;
}

.series-body {
  padding: 12px 14px;
}

.series-name {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--bili-text);
}

.series-desc {
  font-size: 12px;
  color: var(--bili-text-tertiary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.series-thumbs {
  display: flex;
  gap: 6px;
  padding: 0 14px 10px;
}

.series-thumb-link {
  flex-shrink: 0;
  line-height: 0;
  border-radius: 4px;
  overflow: hidden;

  &:hover .series-thumb {
    opacity: 0.85;
  }
}

.series-thumb {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  object-fit: cover;
  background: #eee;
  display: block;
}

.series-sort {
  display: flex;
  gap: 8px;
  padding: 0 14px 12px;
}

.sort-btn {
  flex: 1;
  font-size: 12px;
  padding: 4px 0;
  border-radius: 4px;
  color: var(--bili-text-secondary);
  background: #f4f4f4;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.series-detail {
  .detail-head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 12px 16px;
    margin-bottom: 20px;
  }

  .back-btn {
    color: var(--bili-pink);
    font-size: 14px;
  }

  .detail-meta {
    flex: 1;
    min-width: 180px;

    h2 {
      font-size: 20px;
      margin-bottom: 6px;
    }

    p {
      font-size: 13px;
      color: var(--bili-text-tertiary);
    }
  }

  .detail-actions {
    display: flex;
    gap: 8px;
  }
}

.detail-video-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-video-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #fff;
  border-radius: var(--bili-radius);
  box-shadow: var(--bili-shadow);
}

.detail-video-link {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  color: inherit;
}

.detail-cover {
  width: 120px;
  height: 68px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
  background: #eee;
}

.detail-video-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.detail-title {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-play {
  font-size: 12px;
  color: var(--bili-text-tertiary);
}

.btn-outline.tiny {
  padding: 4px 10px;
  font-size: 12px;
  flex-shrink: 0;
}

.btn-outline.danger {
  color: #f56c6c;
  border-color: rgba(245, 108, 108, 0.45);
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: var(--bili-text-tertiary);
}

.load-more {
  display: flex;
  justify-content: center;
  margin: 24px 0 8px;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-card {
  width: min(480px, 100%);
  max-height: 80vh;
  overflow: auto;
  background: #fff;
  border-radius: 12px;
  padding: 20px 20px 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.16);

  h3 {
    margin-bottom: 16px;
    font-size: 18px;
  }
}

.form-item {
  margin-bottom: 14px;

  label {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    color: var(--bili-text-secondary);
  }

  input[type='text'],
  textarea {
    width: 100%;
    border: 1px solid var(--bili-border);
    border-radius: 6px;
    padding: 8px 10px;
    font-size: 14px;
  }
}

.pick-list {
  max-height: 200px;
  overflow: auto;
  border: 1px solid var(--bili-border);
  border-radius: 6px;
  padding: 8px;
}

.pick-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 4px;
  font-size: 13px;
  cursor: pointer;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.field-tip,
.error-tip {
  font-size: 12px;
  color: var(--bili-text-tertiary);
}

.error-tip {
  color: #f56c6c;
  margin-bottom: 8px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}
</style>
