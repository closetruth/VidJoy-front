<template>
  <div class="category-page">
    <!-- 加载中 -->
    <div v-if="loadingCat" class="loading-spinner">加载中</div>

    <!-- 分类不存在 -->
    <div v-else-if="!category" class="container empty-state">
      <p>分类不存在</p>
      <router-link to="/" class="btn-primary">返回首页</router-link>
    </div>

    <template v-else>
      <!-- 分类 Banner -->
      <div v-if="category.background" class="category-banner">
        <img :src="getResourceUrl(category.background)" class="banner-img" alt="" />
        <div class="banner-mask">
          <div class="container banner-content">
            <img
              v-if="category.icon"
              :src="getResourceUrl(category.icon)"
              class="banner-icon"
              alt=""
            />
            <h1>{{ category.categoryName }}</h1>
          </div>
        </div>
      </div>

      <!-- 无 Banner 时的标题 -->
      <div v-else class="container category-header">
        <img
          v-if="category.icon"
          :src="getResourceUrl(category.icon)"
          class="header-icon"
          alt=""
        />
        <h1>{{ category.categoryName }}</h1>
      </div>

      <!-- 子分类 Tab -->
      <div v-if="subCategories.length" class="sub-tabs-bar">
        <div class="container sub-tabs-inner">
          <button
            class="sub-tab"
            :class="{ active: activeSubId === category.categoryId }"
            @click="switchSub(category.categoryId)"
          >
            全部
          </button>
          <button
            v-for="sub in subCategories"
            :key="sub.categoryId"
            class="sub-tab"
            :class="{ active: activeSubId === sub.categoryId }"
            @click="switchSub(sub.categoryId)"
          >
            {{ sub.categoryName }}
          </button>
        </div>
      </div>

      <!-- 视频列表 -->
      <section class="container video-section">
        <div v-if="loadingVideos && !videoList.length" class="loading-spinner">加载中</div>
        <div v-else-if="videoList.length" class="video-grid">
          <VideoCard v-for="video in videoList" :key="video.videoId" :video="video" />
        </div>
        <div v-else class="empty-state">
          <p>该分类暂无视频</p>
        </div>

        <div v-if="hasMore && !loadingVideos" class="load-more">
          <button class="btn-outline" @click="loadMore">加载更多</button>
        </div>
        <div v-if="loadingVideos && videoList.length" class="loading-more">加载中...</div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VideoCard from '@/components/video/VideoCard.vue'
import { categoryApi, videoApi } from '@/api'
import { getResourceUrl } from '@/utils/format'

const route = useRoute()
const router = useRouter()

const loadingCat = ref(true)
const allCategories = ref([])
const videoList = ref([])
const loadingVideos = ref(false)
const pageNo = ref(1)
const hasMore = ref(true)
const activeSubId = ref(null)

// 当前选中的分类
const category = computed(() => {
  const id = route.params.categoryId
  return allCategories.value.find((c) => c.categoryId === id) || null
})

// 当前分类的子分类
const subCategories = computed(() => {
  if (!category.value) return []
  return allCategories.value.filter(
    (c) => c.pCategoryId && c.pCategoryId !== '0' && c.pCategoryId === category.value.categoryId
  )
})

// 当前用于请求的 categoryId
const requestCategoryId = computed(() => activeSubId.value || category.value?.categoryId || route.params.categoryId)

// 当前用于请求的 pCategoryId
const requestPCategoryId = computed(() => {
  if (!category.value) return '0'
  // 如果选中了子分类，pCategoryId 就是父分类 ID
  if (activeSubId.value && activeSubId.value !== category.value.categoryId) {
    return category.value.categoryId
  }
  // 选中父分类时，pCategoryId = categoryId
  return category.value.pCategoryId || category.value.categoryId
})

async function loadCategories() {
  loadingCat.value = true
  try {
    const res = await categoryApi.loadAllCategory()
    allCategories.value = res.data || []
  } catch {
    allCategories.value = []
  } finally {
    loadingCat.value = false
  }
}

async function loadVideos(reset = false) {
  if (loadingVideos.value) return
  loadingVideos.value = true
  if (reset) {
    pageNo.value = 1
    hasMore.value = true
  }

  try {
    const data = new FormData()
    data.append('pCategoryId', requestPCategoryId.value)
    data.append('categoryId', requestCategoryId.value)
    data.append('pageNo', String(pageNo.value))

    const res = await videoApi.loadVideo(data)
    const list = res.data?.list || res.data || []

    if (reset) {
      videoList.value = list
    } else {
      videoList.value.push(...list)
    }

    hasMore.value = list.length >= 20
  } catch {
    if (reset) videoList.value = []
    hasMore.value = false
  } finally {
    loadingVideos.value = false
  }
}

function loadMore() {
  pageNo.value++
  loadVideos()
}

function switchSub(subId) {
  activeSubId.value = subId
  // 用 query 参数记录子分类选择（不影响主路由）
  router.replace({ query: { sub: subId !== category.value?.categoryId ? subId : undefined } })
  loadVideos(true)
}

// 监听路由变化（分类切换）
watch(
  () => route.params.categoryId,
  async (newId, oldId) => {
    if (newId !== oldId) {
      activeSubId.value = route.query.sub || null
      // 等 categories 加载完成
      if (!allCategories.value.length) {
        await loadCategories()
      }
      loadVideos(true)
    }
  }
)

onMounted(async () => {
  await loadCategories()
  activeSubId.value = route.query.sub || route.params.categoryId
  loadVideos(true)
})
</script>

<style scoped lang="scss">
.category-page {
  min-height: 60vh;
}

// Banner
.category-banner {
  position: relative;
  height: 200px;
  overflow: hidden;
  background: #e3e5e7;
  margin-bottom: 8px;
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  background: linear-gradient(transparent 20%, rgba(0, 0, 0, 0.55));
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 24px;
  color: #fff;

  h1 {
    font-size: 26px;
    font-weight: 600;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
}

.banner-icon {
  width: 52px;
  height: 52px;
  object-fit: cover;
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

// 无 Banner 的标题
.category-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

  h1 {
    font-size: 22px;
    font-weight: 600;
  }
}

.header-icon {
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: 8px;
}

// 子分类 Tab
.sub-tabs-bar {
  background: #fff;
  border-bottom: 1px solid var(--bili-border);
  margin-bottom: 20px;
}

.sub-tabs-inner {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 44px;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.sub-tab {
  flex-shrink: 0;
  padding: 6px 18px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--bili-text-secondary);
  white-space: nowrap;
  transition: color 0.2s, background 0.2s;

  &:hover {
    color: var(--bili-pink);
    background: rgba(251, 114, 153, 0.06);
  }

  &.active {
    color: var(--bili-pink);
    background: rgba(251, 114, 153, 0.1);
    font-weight: 500;
  }
}

// 视频列表
.video-section {
  padding-top: 8px;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px 16px;
}

.empty-state {
  text-align: center;
  padding: 80px 0;
  color: var(--bili-text-tertiary);

  p {
    margin-bottom: 20px;
    font-size: 15px;
  }
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding-bottom: 40px;
}

.loading-more {
  text-align: center;
  padding: 20px;
  color: var(--bili-text-tertiary);
}

@media (max-width: 900px) {
  .category-banner {
    height: 140px;
  }

  .banner-content h1 {
    font-size: 20px;
  }
}
</style>
