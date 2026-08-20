<template>
  <div class="page-card">
    <div class="page-header">
      <h2>系统设置</h2>
      <button class="btn btn-primary" :disabled="saving" @click="saveSetting">
        {{ saving ? '保存中...' : '保存设置' }}
      </button>
    </div>

    <div v-if="loading" class="empty-tip">加载中...</div>
    <form v-else class="setting-form" @submit.prevent="saveSetting">
      <div class="form-item">
        <label>注册赠送硬币</label>
        <input v-model="form.registerCoinCount" type="number" min="0" />
      </div>
      <div class="form-item">
        <label>投稿消耗硬币</label>
        <input v-model="form.postVideoCoinCount" type="number" min="0" />
      </div>
      <div class="form-item">
        <label>单个视频大小上限（MB）</label>
        <input v-model="form.videoSize" type="number" min="1" />
      </div>
      <div class="form-item">
        <label>分P数量上限</label>
        <input v-model="form.videoPCount" type="number" min="1" />
      </div>
      <div class="form-item">
        <label>用户投稿数量上限</label>
        <input v-model="form.videoCount" type="number" min="1" />
      </div>
      <div class="form-item">
        <label>评论字数上限</label>
        <input v-model="form.commentCount" type="number" min="1" />
      </div>
      <div class="form-item">
        <label>弹幕字数上限</label>
        <input v-model="form.danmuCount" type="number" min="1" />
      </div>
      <p v-if="saveMsg" class="save-msg" :class="{ error: saveError }">{{ saveMsg }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { settingApi } from '@/api'

const loading = ref(true)
const saving = ref(false)
const saveMsg = ref('')
const saveError = ref(false)

const form = reactive({
  registerCoinCount: 10,
  postVideoCoinCount: 5,
  videoSize: 10,
  videoPCount: 10,
  videoCount: 10,
  commentCount: 20,
  danmuCount: 20
})

async function loadSetting() {
  loading.value = true
  try {
    const res = await settingApi.getSetting()
    const data = res.data || {}
    Object.keys(form).forEach((key) => {
      if (data[key] != null) form[key] = data[key]
    })
  } catch {
    // keep defaults
  } finally {
    loading.value = false
  }
}

async function saveSetting() {
  saving.value = true
  saveMsg.value = ''
  saveError.value = false
  try {
    const data = new FormData()
    Object.entries(form).forEach(([k, v]) => data.append(k, String(v)))
    await settingApi.saveSetting(data)
    saveMsg.value = '保存成功'
  } catch (e) {
    saveMsg.value = e.message || '保存失败'
    saveError.value = true
  } finally {
    saving.value = false
  }
}

onMounted(loadSetting)
</script>

<style scoped lang="scss">
.setting-form {
  max-width: 560px;
}

.save-msg {
  margin-top: 16px;
  font-size: 13px;
  color: var(--admin-success);

  &.error {
    color: var(--admin-danger);
  }
}
</style>
