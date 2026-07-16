<template>
  <header class="app-header" :class="{ scrolled: isScrolled }">
    <div class="header-inner container">
      <router-link to="/" class="logo">
        <svg class="logo-icon" viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="10" fill="#FB7299"/>
          <text x="24" y="33" text-anchor="middle" fill="white" font-size="22" font-weight="bold">V</text>
        </svg>
        <span class="logo-text">VidJoy</span>
      </router-link>

      <div class="search-box" @click.stop>
        <form class="search-form" @submit.prevent="handleSearch">
          <input
            v-model="keyword"
            type="text"
            placeholder="搜索视频、UP主"
            class="search-input"
            @focus="showSuggest = true"
          />
          <button type="submit" class="search-btn" aria-label="搜索">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </button>
        </form>
        <div v-if="showSuggest && hotKeywords.length" class="search-suggest">
          <div class="suggest-title">VidJoy热搜</div>
          <div
            v-for="(item, index) in hotKeywords"
            :key="index"
            class="suggest-item"
            @click="searchKeyword(item)"
          >
            <span class="rank" :class="{ top: index < 3 }">{{ index + 1 }}</span>
            <span>{{ item }}</span>
          </div>
        </div>
      </div>

      <nav class="header-nav">
        <router-link v-if="userStore.isLoggedIn" to="/upload" class="nav-item upload-btn">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          <span>投稿</span>
        </router-link>

        <router-link v-if="userStore.isLoggedIn" to="/account/history" class="nav-item" title="历史">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
          </svg>
        </router-link>

        <router-link v-if="userStore.isLoggedIn" to="/account/message" class="nav-item" title="消息">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          </svg>
          <span v-if="userStore.noReadCount" class="badge">{{ userStore.noReadCount > 99 ? '99+' : userStore.noReadCount }}</span>
        </router-link>

        <div v-if="userStore.isLoggedIn" class="user-avatar-wrap">
          <router-link :to="`/user/${userStore.userInfo.userId}`" class="user-avatar">
            <img :src="avatarUrl" :alt="userStore.userInfo.nickName" />
          </router-link>
          <div class="user-dropdown">
            <router-link to="/account/home" class="dropdown-item">个人中心</router-link>
            <router-link to="/account/videos" class="dropdown-item">我的投稿</router-link>
            <router-link to="/account/collection" class="dropdown-item">我的收藏</router-link>
            <router-link to="/account/settings" class="dropdown-item">账号设置</router-link>
            <button class="dropdown-item" @click="handleLogout">退出登录</button>
          </div>
        </div>

        <template v-else>
          <button class="nav-item login-btn" @click="$emit('open-login')">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <span>登录</span>
          </button>
        </template>
      </nav>
    </div>
  </header>
  <div v-if="showSuggest" class="search-mask" @click="showSuggest = false" />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores'
import { videoApi } from '@/api'
import { getResourceUrl } from '@/utils/format'

defineEmits(['open-login'])

const router = useRouter()
const userStore = useUserStore()
const keyword = ref('')
const showSuggest = ref(false)
const hotKeywords = ref([])
const isScrolled = ref(false)

const avatarUrl = computed(() => {
  const avatar = userStore.userInfo?.avatar
  return avatar ? getResourceUrl(avatar) : 'https://i0.hdslb.com/bfs/face/member/face/placeholder.jpg'
})

function handleSearch() {
  if (!keyword.value.trim()) return
  showSuggest.value = false
  router.push({ name: 'Search', query: { keyword: keyword.value.trim() } })
}

function searchKeyword(kw) {
  keyword.value = kw
  handleSearch()
}

async function handleLogout() {
  await userStore.logout()
}

function onScroll() {
  isScrolled.value = window.scrollY > 10
}

onMounted(async () => {
  window.addEventListener('scroll', onScroll)
  try {
    const res = await videoApi.getSearchKeywordTop()
    hotKeywords.value = res.data || []
  } catch {
    hotKeywords.value = ['编程', '游戏', '动漫', '音乐', '科技']
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<style scoped lang="scss">
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: var(--bili-header-height);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s, box-shadow 0.2s;

  &.scrolled {
    border-bottom-color: var(--bili-border);
    box-shadow: var(--bili-shadow);
  }
}

.header-inner {
  display: flex;
  align-items: center;
  height: 100%;
  gap: 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;

  .logo-icon {
    width: 36px;
    height: 36px;
  }

  .logo-text {
    font-size: 20px;
    font-weight: 600;
    color: var(--bili-pink);
  }
}

.search-box {
  flex: 1;
  max-width: 500px;
  position: relative;
}

.search-form {
  display: flex;
  height: 40px;
  border: 1px solid var(--bili-border);
  border-radius: 8px;
  overflow: hidden;
  background: #f1f2f3;
  transition: border-color 0.2s, background 0.2s;

  &:focus-within {
    border-color: var(--bili-pink);
    background: #fff;
  }
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0 16px;
  font-size: 14px;
}

.search-btn {
  width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bili-text-secondary);
  transition: color 0.2s;

  &:hover {
    color: var(--bili-pink);
  }
}

.search-suggest {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  padding: 12px 0;
  z-index: 200;
}

.suggest-title {
  padding: 4px 16px 8px;
  font-size: 12px;
  color: var(--bili-text-tertiary);
}

.suggest-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: #f6f7f8;
  }

  .rank {
    width: 18px;
    text-align: center;
    font-size: 12px;
    color: var(--bili-text-tertiary);

    &.top {
      color: var(--bili-pink);
      font-weight: 600;
    }
  }
}

.search-mask {
  position: fixed;
  inset: 0;
  z-index: 99;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 8px;
  color: var(--bili-text-secondary);
  font-size: 14px;
  position: relative;
  transition: color 0.2s, background 0.2s;

  &:hover {
    color: var(--bili-pink);
    background: rgba(251, 114, 153, 0.08);
  }
}

.upload-btn {
  background: var(--bili-pink);
  color: #fff !important;

  &:hover {
    background: var(--bili-pink-hover);
  }
}

.login-btn {
  color: var(--bili-pink);
}

.badge {
  position: absolute;
  top: 2px;
  right: 4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--bili-pink);
  color: #fff;
  font-size: 10px;
  line-height: 16px;
  text-align: center;
}

.user-avatar-wrap {
  position: relative;
  margin-left: 8px;

  &:hover .user-dropdown {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
}

.user-avatar {
  display: block;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid transparent;
  transition: border-color 0.2s;

  &:hover {
    border-color: var(--bili-pink);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 140px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  padding: 8px 0;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-8px);
  transition: all 0.2s;
  z-index: 200;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 10px 20px;
  text-align: left;
  font-size: 14px;
  color: var(--bili-text);
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: #f6f7f8;
    color: var(--bili-pink);
  }
}
</style>
