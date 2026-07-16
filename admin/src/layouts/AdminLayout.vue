<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="sidebar-logo">
        <span class="logo-icon">V</span>
        <span class="logo-text">VidJoy</span>
      </div>
      <nav class="sidebar-nav">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
        >
          <span class="nav-icon" v-html="item.icon" />
          <span>{{ item.title }}</span>
        </router-link>
      </nav>
    </aside>

    <div class="main-area">
      <header class="top-header">
        <div class="breadcrumb">{{ currentTitle }}</div>
        <div class="header-right">
          <span class="admin-name">{{ adminStore.displayName }}</span>
          <button class="btn btn-default" @click="handleLogout">退出</button>
        </div>
      </header>
      <main class="page-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '@/stores'

const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()

const menuItems = [
  { path: '/admin/dashboard', title: '数据概览', icon: '📊' },
  { path: '/admin/video', title: '视频管理', icon: '🎬' },
  { path: '/admin/category', title: '分类管理', icon: '📁' },
  { path: '/admin/user', title: '用户管理', icon: '👤' },
  { path: '/admin/danmu', title: '弹幕管理', icon: '💬' },
  { path: '/admin/comment', title: '评论管理', icon: '📝' },
  { path: '/admin/setting', title: '系统设置', icon: '⚙️' }
]

const currentTitle = computed(() => route.meta.title || '管理后台')

function isActive(path) {
  return route.path === path || route.path.startsWith(path + '/')
}

async function handleLogout() {
  await adminStore.logout()
  router.push('/admin/login')
}
</script>

<style scoped lang="scss">
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: var(--admin-sidebar-width);
  background: var(--admin-sidebar-bg);
  flex-shrink: 0;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  height: var(--admin-header-height);
  padding: 0 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  .logo-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--admin-primary);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 16px;
  }

  .logo-text {
    color: #fff;
    font-size: 16px;
    font-weight: 600;
  }
}

.sidebar-nav {
  padding: 12px 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.65);
  font-size: 14px;
  margin-bottom: 4px;
  transition: all 0.2s;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.06);
  }

  &.active {
    color: #fff;
    background: var(--admin-sidebar-active);
  }

  .nav-icon {
    font-size: 16px;
    width: 20px;
    text-align: center;
  }
}

.main-area {
  flex: 1;
  margin-left: var(--admin-sidebar-width);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.top-header {
  height: var(--admin-header-height);
  background: var(--admin-header-bg);
  border-bottom: 1px solid var(--admin-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 50;
}

.breadcrumb {
  font-size: 15px;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.admin-name {
  font-size: 13px;
  color: var(--admin-text-secondary);
}

.page-content {
  flex: 1;
  padding: 20px 24px;
}
</style>
