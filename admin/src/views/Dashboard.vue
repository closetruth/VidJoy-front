<template>
  <div class="dashboard">
    <div class="welcome-card page-card">
      <div>
        <h2>欢迎回来，{{ adminStore.displayName }}</h2>
        <p>平台实时数据来自统计接口，点击指标可切换近 7 日趋势。</p>
      </div>
      <button class="btn btn-default" :disabled="loading" @click="refreshAll">
        {{ loading ? '刷新中...' : '刷新数据' }}
      </button>
    </div>

    <div class="stat-cards">
      <button
        v-for="item in metricList"
        :key="item.key"
        type="button"
        class="stat-card"
        :class="{ active: selectedType === item.type }"
        @click="selectType(item.type)"
      >
        <div class="label">{{ item.label }}</div>
        <div class="value">{{ formatCount(item.total) }}</div>
        <div class="delta" :class="deltaClass(item.yesterday)">
          昨日 {{ formatDelta(item.yesterday) }}
        </div>
      </button>
    </div>

    <div v-if="opsStats.videoCount != null" class="ops-row">
      <div class="ops-item">投稿 {{ formatCount(opsStats.videoCount) }}</div>
      <div class="ops-item">待审核 {{ formatCount(opsStats.auditCount) }}</div>
      <div class="ops-item">已通过 {{ formatCount(opsStats.passCount) }}</div>
    </div>

    <div class="charts-row">
      <div class="page-card chart-card">
        <div class="chart-header">
          <h3>近7日 · {{ currentMetric?.label || '数据' }}</h3>
          <span class="hint">点击上方指标切换</span>
        </div>
        <div v-if="weekLoading" class="empty-tip">加载趋势中...</div>
        <div v-else-if="weekBars.length" class="bar-chart">
          <div v-for="bar in weekBars" :key="bar.date" class="bar-group">
            <span class="bar-value">{{ formatCount(bar.count) }}</span>
            <div class="bar-track">
              <div class="bar play" :style="{ height: bar.pct + '%' }" />
            </div>
            <span class="bar-label">{{ formatShortDate(bar.date) }}</span>
          </div>
        </div>
        <div v-else class="empty-tip">暂无统计数据</div>
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
import { computed, onMounted, ref } from 'vue'
import { userApi, videoApi, indexApi } from '@/api'
import { formatCount } from '@/utils/format'
import { useAdminStore } from '@/stores'

const METRICS = [
  { type: 0, key: 'playCount', label: '播放量' },
  { type: 1, key: 'userCount', label: '用户' },
  { type: 2, key: 'likeCount', label: '点赞' },
  { type: 3, key: 'collectCount', label: '收藏' },
  { type: 4, key: 'coinCount', label: '投币' },
  { type: 5, key: 'commentCount', label: '评论' },
  { type: 6, key: 'danmuCount', label: '弹幕' }
]

const adminStore = useAdminStore()
const totalCountInfo = ref({})
const preDayData = ref({})
const opsStats = ref({})
const selectedType = ref(0)
const weekRaw = ref([])
const loading = ref(false)
const weekLoading = ref(false)

const currentMetric = computed(() => METRICS.find((m) => m.type === selectedType.value))

const metricList = computed(() =>
  METRICS.map((m) => ({
    ...m,
    total: pickCount(totalCountInfo.value, m.key),
    yesterday: pickPreDay(m.type)
  }))
)

const weekBars = computed(() => {
  const dates = getBeforeDates(7)
  const map = {}
  for (const item of weekRaw.value || []) {
    const date = item.statisticsDate || item.statistics_date || item.date
    if (!date) continue
    map[date] = Number(item.statisticsCount ?? item.statistics_count ?? item.playCount ?? 0) || 0
  }
  const rows = dates.map((date) => ({ date, count: map[date] ?? 0 }))
  const max = Math.max(1, ...rows.map((r) => r.count))
  return rows.map((r) => ({
    ...r,
    pct: r.count > 0 ? Math.max(4, Math.round((r.count / max) * 100)) : 0
  }))
})

function pickCount(obj, key) {
  if (!obj || typeof obj !== 'object') return 0
  if (obj[key] != null && obj[key] !== '') return Number(obj[key]) || 0
  const target = String(key).toLowerCase()
  for (const [k, v] of Object.entries(obj)) {
    if (String(k).toLowerCase() === target) return Number(v) || 0
  }
  return 0
}

function pickPreDay(type) {
  const raw = preDayData.value || {}
  const v = raw[type] ?? raw[String(type)]
  return Number(v ?? 0) || 0
}

function getBeforeDates(day) {
  const list = []
  const calendar = new Date()
  calendar.setHours(0, 0, 0, 0)
  calendar.setDate(calendar.getDate() - day)
  for (let i = 0; i < day; i++) {
    list.push(formatYmd(calendar))
    calendar.setDate(calendar.getDate() + 1)
  }
  return list
}

function formatYmd(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatShortDate(ymd) {
  if (!ymd || typeof ymd !== 'string') return ''
  const parts = ymd.split('-')
  return parts.length >= 3 ? `${parts[1]}-${parts[2]}` : ymd
}

function formatDelta(n) {
  const v = Number(n) || 0
  if (v > 0) return `+${formatCount(v)}`
  return formatCount(v)
}

function deltaClass(n) {
  const v = Number(n) || 0
  if (v > 0) return 'up'
  if (v < 0) return 'down'
  return ''
}

async function loadStats() {
  try {
    const res = await indexApi.getActualTimeStatisticsInfo()
    const data = res.data || {}
    preDayData.value = data.preDayData || {}
    // 后端 IndexController 目前可能只返回 preDayData；有 totalCountInfo 再用
    if (data.totalCountInfo && typeof data.totalCountInfo === 'object') {
      totalCountInfo.value = data.totalCountInfo
    } else {
      totalCountInfo.value = {}
    }
  } catch {
    totalCountInfo.value = {}
    preDayData.value = {}
  }
}

async function loadOpsStats() {
  try {
    const [userRes, allRes, auditRes, passRes] = await Promise.all([
      userApi.loadUser({ pageNo: 1 }),
      videoApi.loadVideoList({ pageNo: 1 }),
      videoApi.loadVideoList({ pageNo: 1, status: 2 }),
      videoApi.loadVideoList({ pageNo: 1, status: 3 })
    ])
    if (pickCount(totalCountInfo.value, 'userCount') === 0) {
      totalCountInfo.value = {
        ...totalCountInfo.value,
        userCount: userRes.data?.totalCount ?? 0
      }
    }
    opsStats.value = {
      videoCount: allRes.data?.totalCount ?? 0,
      auditCount: auditRes.data?.totalCount ?? 0,
      passCount: passRes.data?.totalCount ?? 0
    }
  } catch {
    opsStats.value = {}
  }
}

async function loadWeekStats(type = selectedType.value) {
  weekLoading.value = true
  try {
    const res = await indexApi.getWeekStatisticsInfo(type)
    const payload = res.data
    weekRaw.value = Array.isArray(payload) ? payload : payload?.list || []
  } catch {
    weekRaw.value = []
  } finally {
    weekLoading.value = false
  }
}

function selectType(type) {
  if (selectedType.value === type) return
  selectedType.value = type
  loadWeekStats(type)
}

async function refreshAll() {
  loading.value = true
  await Promise.all([loadStats(), loadOpsStats(), loadWeekStats(selectedType.value)])
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

.stat-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.stat-card {
  text-align: left;
  padding: 16px;
  background: #fff;
  border-radius: var(--admin-radius);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  border: 1px solid transparent;
  transition: border-color 0.15s, transform 0.15s;

  &:hover {
    transform: translateY(-2px);
  }

  &.active {
    border-color: var(--admin-primary);
  }

  .label {
    font-size: 12px;
    color: var(--admin-text-tertiary);
    margin-bottom: 8px;
  }

  .value {
    font-size: 24px;
    font-weight: 600;
    color: var(--admin-primary);
  }

  .delta {
    margin-top: 6px;
    font-size: 12px;
    color: var(--admin-text-tertiary);

    &.up {
      color: var(--admin-success);
    }

    &.down {
      color: var(--admin-danger);
    }
  }
}

.ops-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--admin-text-secondary);
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
  }
}

.chart-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;

  .hint {
    font-size: 12px;
    color: var(--admin-text-tertiary);
  }
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 220px;
  padding: 0 8px;
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.bar-value {
  font-size: 11px;
  color: var(--admin-text-secondary);
  margin-bottom: 6px;
}

.bar-track {
  width: 18px;
  height: 160px;
  display: flex;
  align-items: flex-end;
  background: rgba(251, 114, 153, 0.08);
  border-radius: 3px 3px 0 0;
  overflow: hidden;
}

.bar {
  width: 100%;
  border-radius: 3px 3px 0 0;
  min-height: 4px;
  transition: height 0.3s;

  &.play {
    background: var(--admin-primary);
  }
}

.bar-label {
  font-size: 11px;
  color: var(--admin-text-tertiary);
  margin-top: 8px;
}

.empty-tip {
  color: var(--admin-text-tertiary);
  text-align: center;
  padding: 40px 0;
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
