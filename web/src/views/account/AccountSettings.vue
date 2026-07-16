<template>
  <div class="account-settings">
    <form class="settings-form" @submit.prevent="handleSave">
      <div class="form-item">
        <label>昵称</label>
        <input v-model="form.nickName" type="text" placeholder="昵称" />
      </div>
      <div class="form-item">
        <label>性别</label>
        <select v-model="form.sex">
          <option value="2">保密</option>
          <option value="1">男</option>
          <option value="0">女</option>
        </select>
      </div>
      <div class="form-item">
        <label>生日</label>
        <input v-model="form.birthday" type="date" />
      </div>
      <div class="form-item">
        <label>学校</label>
        <input v-model="form.school" type="text" placeholder="学校" />
      </div>
      <div class="form-item">
        <label>个人简介</label>
        <textarea v-model="form.personIntroduction" rows="4" placeholder="介绍一下自己吧" />
      </div>
      <div class="form-item">
        <label>空间公告</label>
        <textarea v-model="form.noticeInfo" rows="3" placeholder="空间公告" />
      </div>
      <p v-if="msg" class="msg" :class="{ error: isError }">{{ msg }}</p>
      <button type="submit" class="btn-primary" :disabled="saving">
        {{ saving ? '保存中...' : '保存修改' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/stores'
import { uhomeApi } from '@/api'

const userStore = useUserStore()
const saving = ref(false)
const msg = ref('')
const isError = ref(false)

const form = reactive({
  nickName: '',
  sex: '2',
  birthday: '',
  school: '',
  personIntroduction: '',
  noticeInfo: ''
})

function fillForm(info) {
  if (!info) return
  form.nickName = info.nickName || ''
  form.sex = String(info.sex ?? 2)
  form.birthday = info.birthday || ''
  form.school = info.school || ''
  form.personIntroduction = info.personIntroduction || ''
  form.noticeInfo = info.noticeInfo || ''
}

async function loadInfo() {
  if (!userStore.userInfo?.userId) return
  try {
    const res = await uhomeApi.getUserInfo(userStore.userInfo.userId)
    fillForm(res.data)
  } catch {
    fillForm(userStore.userInfo)
  }
}

async function handleSave() {
  saving.value = true
  msg.value = ''
  isError.value = false
  try {
    const data = new FormData()
    Object.entries(form).forEach(([k, v]) => data.append(k, v))
    await uhomeApi.updateUserInfo(data)
    const updated = { ...userStore.userInfo, ...form, sex: Number(form.sex) }
    userStore.setUser(updated)
    msg.value = '保存成功'
  } catch (e) {
    msg.value = e.message || '保存失败'
    isError.value = true
  } finally {
    saving.value = false
  }
}

onMounted(loadInfo)
</script>

<style scoped lang="scss">
.settings-form {
  max-width: 480px;
  background: #fff;
  padding: 24px;
  border-radius: var(--bili-radius);
  box-shadow: var(--bili-shadow);
}

.form-item {
  margin-bottom: 16px;

  label {
    display: block;
    font-size: 13px;
    color: var(--bili-text-secondary);
    margin-bottom: 6px;
  }

  input,
  select,
  textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--bili-border);
    border-radius: 8px;
    font-size: 14px;

    &:focus {
      border-color: var(--bili-pink);
    }
  }
}

.msg {
  font-size: 13px;
  color: #00b42a;
  margin-bottom: 12px;

  &.error {
    color: #f53f3f;
  }
}

.btn-primary {
  min-width: 120px;
}
</style>
