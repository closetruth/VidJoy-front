<template>
  <div class="dashboard">
    <div class="welcome-card page-card">
      <div>
        <h2>欢迎回来，{{ adminStore.displayName }}</h2>
        <p>这里是 VidJoy 管理后台，可通过左侧菜单管理视频、用户与系统配置。</p>
      </div>
      <button class="btn btn-default" :disabled="loading" @click="refreshAll">
        {{ loading ? '刷新中...' : '刷新数据' }}
      </button>
    </div>

    <div class="stat-cards">
      <div v-for="item in statItems" :key="item.key" class="stat-card">
        <div class="label">{{ item.label }}</div>
        <div class="value">{{ formatCount(stats[item.key]) }}</div>
      </div>
    </div>

    <div class="charts-row">
      <div class="page-card chart-card">
        <h3>近7日数据趋势</h3>
        <div v-if="weekData.length" class="bar-chart">
          <div v-for="(day, index) in weekData" :key="index" class="bar-group">
            <div class="bars">
              <div
                class="bar play"
                :style="{ height: barHeight(day.playCount) + '%' }"
                :title="'播放: ' + day.playCount"
              />
              <div
                class="bar user"
                :style="{ height: barHeight(day.userCount) + '%' }"
                :title="'用户: ' + day.userCount"
              />
            </div>
            <span class="bar-label">{{ day.dateLabel }}</span>
          </div>
        </div>
        <div v-else class="empty-tip">暂无统计数据</div>
        <div class="chart-legend">
          <span><i class="dot play" />播放量</span>
          <span><i class="dot user" />新增用户</span>
        </div>
      </div>

      <div class="page-card quick-card">
        <h3>快捷操作</h3>
        <div class="quick-links">
          <router-link to="/admin/video" class="quick-item">
            <span class="icon">🎬</span>
            <span>视频审核</span>
          </router-link>
          <router-link to="/admin/user" class="quick-item">
            <span class="icon">👤</span>
            <span>用户管理</span>
          </router-link>
          <router-link to="/admin/category" class="quick-item">
            <span class="icon">📁</span>
            <span>分类管理</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { userApi, videoApi, indexApi } from '@/api'
import { formatCount } from '@/utils/format'
import { useAdminStore } from '@/stores'

const adminStore = useAdminStore()
const stats = ref({})
const weekData = ref([])
const loading = ref(false)

const statItems = [
  { key: 'userCount', label: '用户总数' },
  { key: 'videoCount', label: '投稿总数' },
  { key: 'auditCount', label: '待审核' },
  { key: 'passCount', label: '已通过' }
]

const maxBarValue = ref(1)

function barHeight(val) {
  const n = Number(val) || 0
  return Math.max((n / maxBarValue.value) * 100, 4)
}

async function loadStats() {
  try {
    const res = await indexApi.getActualTimeStatisticsInfo()
    const data = res.data || {}
    if (Object.keys(data).length) {
      stats.value = data
      return
    }
  } catch {
    // fallback to list totals
  }
  try {
    const [userRes, allRes, auditRes, passRes] = await Promise.all([
      userApi.loadUser({ pageNo: 1 }),
      videoApi.loadVideoList({ pageNo: 1 }),
      videoApi.loadVideoList({ pageNo: 1, status: 2 }),
      videoApi.loadVideoList({ pageNo: 1, status: 3 })
    ])
    stats.value = {
      userCount: userRes.data?.totalCount ?? 0,
      videoCount: allRes.data?.totalCount ?? 0,
      auditCount: auditRes.data?.totalCount ?? 0,
      passCount: passRes.data?.totalCount ?? 0
    }
  } catch {
    stats.value = {}
  }
}

async function loadWeekStats() {
  try {
    const res = await indexApi.getWeekStatisticsInfo()
    const list = res.data || []
    weekData.value = list.map((item) => ({
      ...item,
      dateLabel: item.statisticsDate?.slice(5) || item.date?.slice(5) || ''
    }))
    const allValues = list.flatMap((d) => [Number(d.playCount) || 0, Number(d.userCount) || 0])
    maxBarValue.value = Math.max(...allValues, 1)
  } catch {
    weekData.value = []
  }
}

async function refreshAll() {
  loading.value = true
  await Promise.all([loadStats(), loadWeekStats()])
  loading.value = false
}

onMounted(refreshAll)
</script>

<style scoped lang="scss">
.welcome-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;

  h2 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 6px;
  }

  p {
    font-size: 13px;
    color: var(--admin-text-tertiary);
  }
}

.charts-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}

.chart-card,
.quick-card {
  h3 {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 20px;
  }
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 200px;
  padding: 0 8px;
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.bars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 180px;
}

.bar {
  width: 16px;
  border-radius: 3px 3px 0 0;
  min-height: 4px;
  transition: height 0.3s;

  &.play {
    background: var(--admin-primary);
  }

  &.user {
    background: var(--admin-info);
  }
}

.bar-label {
  font-size: 11px;
  color: var(--admin-text-tertiary);
  margin-top: 8px;
}

.chart-legend {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 16px;
  font-size: 12px;
  color: var(--admin-text-secondary);

  .dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 2px;
    margin-right: 6px;

    &.play {
      background: var(--admin-primary);
    }

    &.user {
      background: var(--admin-info);
    }
  }
}

.quick-links {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  border-radius: 8px;
  background: #f7f8fa;
  transition: all 0.2s;

  &:hover {
    background: rgba(251, 114, 153, 0.08);
    color: var(--admin-primary);
  }

  .icon {
    font-size: 24px;
  }

  span:last-child {
    font-size: 13px;
  }
}

@media (max-width: 900px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
}
</style>
