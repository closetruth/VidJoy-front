<template>
  <div class="account-layout container">
    <aside class="account-sidebar">
      <div class="user-card">
        <img :src="avatarUrl" class="avatar" alt="" />
        <p class="nickname">{{ userStore.userInfo?.nickName }}</p>
        <router-link :to="`/user/${userStore.userInfo?.userId}`" class="space-link">
          查看我的主页 →
        </router-link>
      </div>
      <nav class="side-nav">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="side-item"
          :class="{ active: route.path === item.path }"
        >
          <span class="icon">{{ item.icon }}</span>
          <span>{{ item.title }}</span>
          <span v-if="item.badge" class="badge">{{ item.badge }}</span>
        </router-link>
      </nav>
    </aside>
    <main class="account-main">
      <h1 v-if="route.meta.title" class="page-title">{{ route.meta.title }}</h1>
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores'
import { getResourceUrl } from '@/utils/format'

const route = useRoute()
const userStore = useUserStore()

const avatarUrl = computed(() => {
  const avatar = userStore.userInfo?.avatar
  return avatar ? getResourceUrl(avatar) : 'https://i0.hdslb.com/bfs/face/member/face/placeholder.jpg'
})

const menuItems = computed(() => [
  { path: '/account/home', title: '概览', icon: '🏠' },
  { path: '/account/videos', title: '我的投稿', icon: '🎬' },
  { path: '/account/collection', title: '我的收藏', icon: '⭐' },
  { path: '/account/history', title: '历史记录', icon: '🕐' },
  { path: '/account/message', title: '我的消息', icon: '💬' },
  { path: '/account/settings', title: '账号设置', icon: '⚙️' }
])
</script>

<style scoped lang="scss">
.account-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 20px;
  padding: 20px 20px 40px;
  align-items: start;
}

.account-sidebar {
  position: sticky;
  top: calc(var(--bili-header-height) + 16px);
  background: #fff;
  border-radius: var(--bili-radius);
  overflow: hidden;
  box-shadow: var(--bili-shadow);
}

.user-card {
  padding: 24px 16px;
  text-align: center;
  background: linear-gradient(180deg, rgba(251, 114, 153, 0.08) 0%, #fff 100%);
  border-bottom: 1px solid var(--bili-border);

  .avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    object-fit: cover;
    margin: 0 auto 10px;
    border: 2px solid #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .nickname {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .space-link {
    font-size: 12px;
    color: var(--bili-pink);

    &:hover {
      text-decoration: underline;
    }
  }
}

.side-nav {
  padding: 8px;
}

.side-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 14px;
  color: var(--bili-text-secondary);
  margin-bottom: 4px;
  transition: all 0.2s;

  &:hover {
    background: rgba(251, 114, 153, 0.06);
    color: var(--bili-pink);
  }

  &.active {
    background: rgba(251, 114, 153, 0.1);
    color: var(--bili-pink);
    font-weight: 500;
  }

  .icon {
    width: 20px;
    text-align: center;
  }

  .badge {
    margin-left: auto;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 9px;
    background: var(--bili-pink);
    color: #fff;
    font-size: 11px;
    line-height: 18px;
    text-align: center;
  }
}

.account-main {
  min-height: 400px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .account-layout {
    grid-template-columns: 1fr;
  }

  .account-sidebar {
    position: static;
  }
}
</style>
