<template>
  <div class="account-statistics">
    <div v-if="loading" class="loading-spinner">加载中</div>
    <template v-else>
      <p v-if="errorMsg" class="error-tip">{{ errorMsg }}</p>

      <div class="stat-grid">
        <button
          v-for="item in metricList"
          :key="item.type"
          type="button"
          class="stat-card"
          :class="{ active: selectedType === item.type }"
          @click="selectType(item.type)"
        >
          <span class="label">{{ item.label }}</span>
          <span class="num">{{ formatCount(item.total) }}</span>
          <span class="delta" :class="deltaClass(item.yesterday)">
            昨日 {{ formatDelta(item.yesterday) }}
          </span>
        </button>
      </div>

      <section class="week-panel">
        <div class="week-header">
          <h2>近 7 日 · {{ currentMetric?.label || '数据' }}</h2>
          <span class="hint">点击上方指标切换趋势</span>
        </div>
        <div v-if="weekLoading" class="loading-spinner small">加载中</div>
        <div v-else-if="weekBars.length" class="bar-chart">
          <div v-for="bar in weekBars" :key="bar.date" class="bar-col">
            <span class="bar-value">{{ formatCount(bar.count) }}</span>
            <div class="bar-track">
              <div class="bar-fill" :style="{ height: bar.pct + '%' }" />
            </div>
            <span class="bar-date">{{ formatShortDate(bar.date) }}</span>
          </div>
        </div>
        <p v-else class="empty-tip">暂无近 7 日数据</p>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ucenterApi } from '@/api'
import { formatCount } from '@/utils/format'

/** 与后端 StatisticsTypeEnum / StatisticsInfoTypeEnum 对齐 */
const METRICS = [
  { type: 0, key: 'playCount', label: '播放' },
  { type: 1, key: 'userCount', label: '粉丝' },
  { type: 2, key: 'likeCount', label: '点赞' },
  { type: 3, key: 'collectCount', label: '收藏' },
  { type: 4, key: 'coinCount', label: '投币' },
  { type: 5, key: 'commentCount', label: '评论' },
  { type: 6, key: 'danmuCount', label: '弹幕' }
]

const loading = ref(true)
const weekLoading = ref(false)
const errorMsg = ref('')
const totalCountInfo = ref({})
const preDayData = ref({})
const selectedType = ref(0)
const weekRaw = ref([])

const metricList = computed(() =>
  METRICS.map((m) => ({
    ...m,
    total: pickCount(totalCountInfo.value, m.key),
    yesterday: pickPreDay(m.type)
  }))
)

const currentMetric = computed(() => METRICS.find((m) => m.type === selectedType.value))

const weekBars = computed(() => {
  const dates = getBeforeDates(7)
  const map = {}
  for (const item of weekRaw.value || []) {
    const date = item.statisticsDate || item.statistics_date
    if (!date) continue
    map[date] = Number(item.statisticsCount ?? item.statistics_count ?? 0) || 0
  }
  const rows = dates.map((date) => ({ date, count: map[date] ?? 0 }))
  const max = Math.max(1, ...rows.map((r) => r.count))
  return rows.map((r) => ({
    ...r,
    pct: Math.round((r.count / max) * 100)
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

async function loadActual() {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await ucenterApi.getActualTimeStatisticsInfo()
    const data = res.data || {}
    totalCountInfo.value = data.totalCountInfo || data || {}
    preDayData.value = data.preDayData || {}
  } catch (e) {
    errorMsg.value = e?.message || e?.info || '加载统计失败'
    totalCountInfo.value = {}
    preDayData.value = {}
  } finally {
    loading.value = false
  }
}

async function loadWeek(type = selectedType.value) {
  weekLoading.value = true
  try {
    const res = await ucenterApi.getWeekStatisticsInfo(type)
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
  loadWeek(type)
}

onMounted(async () => {
  await loadActual()
  await loadWeek(selectedType.value)
})
</script>

<style scoped lang="scss">
.account-statistics {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.error-tip {
  color: #e54d42;
  font-size: 13px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  background: #fff;
  border: 1px solid transparent;
  border-radius: var(--bili-radius);
  box-shadow: var(--bili-shadow);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s;

  &:hover {
    transform: translateY(-2px);
  }

  &.active {
    border-color: var(--bili-pink);
    box-shadow: 0 0 0 1px rgba(251, 114, 153, 0.25), var(--bili-shadow);
  }

  .label {
    font-size: 13px;
    color: var(--bili-text-tertiary);
  }

  .num {
    font-size: 22px;
    font-weight: 600;
    color: var(--bili-pink);
  }

  .delta {
    font-size: 12px;
    color: var(--bili-text-tertiary);

    &.up {
      color: #2ea043;
    }

    &.down {
      color: #e54d42;
    }
  }
}

.week-panel {
  background: #fff;
  border-radius: var(--bili-radius);
  padding: 20px;
  box-shadow: var(--bili-shadow);
}

.week-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;

  h2 {
    font-size: 16px;
    font-weight: 600;
  }

  .hint {
    font-size: 12px;
    color: var(--bili-text-tertiary);
  }
}

.bar-chart {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
  align-items: end;
  min-height: 180px;
}

.bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.bar-value {
  font-size: 11px;
  color: var(--bili-text-secondary);
  line-height: 1;
}

.bar-track {
  width: 100%;
  max-width: 36px;
  height: 120px;
  background: rgba(251, 114, 153, 0.08);
  border-radius: 6px 6px 2px 2px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  min-height: 2px;
  background: linear-gradient(180deg, #ff85ad 0%, var(--bili-pink) 100%);
  border-radius: 6px 6px 0 0;
  transition: height 0.25s ease;
}

.bar-date {
  font-size: 11px;
  color: var(--bili-text-tertiary);
}

.loading-spinner.small {
  padding: 40px;
}

.empty-tip {
  text-align: center;
  padding: 40px;
  color: var(--bili-text-tertiary);
}

@media (max-width: 768px) {
  .week-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .bar-chart {
    gap: 6px;
  }
}
</style>
