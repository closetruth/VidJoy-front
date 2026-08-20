<template>
  <div class="category-zone">
    <nav class="category-nav">
    <div class="container nav-inner">
      <router-link
        to="/"
        class="nav-tab"
        :class="{ active: route.name === 'Home' }"
      >
        首页
      </router-link>
      <div class="nav-tabs">
        <router-link
          v-for="cat in categories"
          :key="cat.categoryId"
          :to="`/category/${cat.categoryId}`"
          class="nav-tab"
          :class="{ active: route.name === 'Category' && route.params.categoryId === cat.categoryId }"
        >
          <img v-if="cat.icon" :src="getResourceUrl(cat.icon)" class="cat-icon" alt="" />
          {{ cat.categoryName }}
        </router-link>
      </div>
      <div class="nav-more">
        <button class="more-btn" @click="scrollRight">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
          </svg>
        </button>
      </div>
    </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCategoryStore } from '@/stores'
import { getResourceUrl } from '@/utils/format'

const route = useRoute()
const categoryStore = useCategoryStore()
const categories = ref([])

function scrollRight() {
  const el = document.querySelector('.nav-tabs')
  if (el) el.scrollBy({ left: 200, behavior: 'smooth' })
}

onMounted(async () => {
  try {
    const data = await categoryStore.loadCategories()
    categories.value = data.filter((c) => !c.pCategoryId || Number(c.pCategoryId) === 0)
  } catch {
    categories.value = []
  }
})
</script>

<style scoped lang="scss">
.category-zone {
  margin-bottom: 8px;
}

.category-nav {
  background: #fff;
  border-bottom: 1px solid var(--bili-border);
}

.nav-inner {
  display: flex;
  align-items: center;
  height: var(--bili-nav-height);
  gap: 4px;
}

.nav-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.nav-tab {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 14px;
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

.cat-icon {
  width: 20px;
  height: 20px;
  object-fit: cover;
  border-radius: 4px;
}

.more-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: var(--bili-text-tertiary);

  &:hover {
    background: #f6f7f8;
    color: var(--bili-text);
  }
}
</style>
