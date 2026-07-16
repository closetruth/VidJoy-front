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
        <label>网站名称</label>
        <input v-model="form.webSiteName" placeholder="VidJoy" />
      </div>
      <div class="form-item">
        <label>网站描述</label>
        <textarea v-model="form.webSiteDescription" rows="3" placeholder="网站简介" />
      </div>
      <div class="form-item">
        <label>网站公告</label>
        <textarea v-model="form.webSiteNotice" rows="4" placeholder="首页公告内容" />
      </div>
      <div class="form-item">
        <label>注册开关</label>
        <select v-model="form.registerEnable">
          <option value="1">开启注册</option>
          <option value="0">关闭注册</option>
        </select>
      </div>
      <div class="form-item">
        <label>投稿审核</label>
        <select v-model="form.videoAuditEnable">
          <option value="1">需要审核</option>
          <option value="0">无需审核</option>
        </select>
      </div>
      <div class="form-item">
        <label>弹幕审核</label>
        <select v-model="form.danmuAuditEnable">
          <option value="1">需要审核</option>
          <option value="0">无需审核</option>
        </select>
      </div>
      <div class="form-item">
        <label>评论审核</label>
        <select v-model="form.commentAuditEnable">
          <option value="1">需要审核</option>
          <option value="0">无需审核</option>
        </select>
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
  webSiteName: '',
  webSiteDescription: '',
  webSiteNotice: '',
  registerEnable: '1',
  videoAuditEnable: '1',
  danmuAuditEnable: '0',
  commentAuditEnable: '0'
})

async function loadSetting() {
  loading.value = true
  try {
    const res = await settingApi.getSetting()
    const data = res.data || {}
    Object.keys(form).forEach((key) => {
      if (data[key] != null) form[key] = String(data[key])
    })
  } catch {
    // use defaults
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
    Object.entries(form).forEach(([k, v]) => data.append(k, v))
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
