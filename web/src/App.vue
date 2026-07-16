<template>
  <div class="app-layout">
    <AppHeader @open-login="showLogin = true" />
    <CategoryNav v-if="showNav" />
    <main class="main-content">
      <router-view />
    </main>
    <AppFooter v-if="showFooter" />
    <LoginDialog v-model:visible="showLogin" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import CategoryNav from '@/components/layout/CategoryNav.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import LoginDialog from '@/components/auth/LoginDialog.vue'
import { useUserStore } from '@/stores'

const route = useRoute()
const userStore = useUserStore()
const showLogin = ref(false)

const showNav = computed(() => !route.path.startsWith('/account') && route.name !== 'Video')
const showFooter = computed(() => route.name === 'Home')

watch(
  () => route.query.login,
  (val) => {
    if (val === '1') showLogin.value = true
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding-top: 8px;
}
</style>
