<template>
  <div class="account-settings">
    <form class="settings-form" @submit.prevent="handleSave">
      <div class="form-item">
        <label>头像</label>
        <div class="avatar-row">
          <img :src="avatarPreview" class="avatar-preview" alt="" />
          <input type="file" accept="image/*" @change="onAvatarChange" />
        </div>
      </div>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores'
import { uhomeApi, fileApi } from '@/api'
import { getResourceUrl } from '@/utils/format'

const userStore = useUserStore()
const saving = ref(false)
const msg = ref('')
const isError = ref(false)
const avatarPath = ref('')

const form = reactive({
  nickName: '',
  sex: '2',
  birthday: '',
  school: '',
  personIntroduction: '',
  noticeInfo: ''
})

const avatarPreview = computed(() => {
  return getResourceUrl(avatarPath.value || userStore.userInfo?.avatar)
    || 'https://i0.hdslb.com/bfs/face/member/face/placeholder.jpg'
})

function fillForm(info) {
  if (!info) return
  form.nickName = info.nickName || ''
  form.sex = String(info.sex ?? 2)
  form.birthday = info.birthday || ''
  form.school = info.school || ''
  form.personIntroduction = info.personIntroduction || ''
  form.noticeInfo = info.noticeInfo || ''
  avatarPath.value = info.avatar || ''
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

async function onAvatarChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    const res = await fileApi.uploadImage(file, true)
    avatarPath.value = res.data || ''
  } catch (err) {
    msg.value = err.message || '头像上传失败'
    isError.value = true
  }
}

async function handleSave() {
  saving.value = true
  msg.value = ''
  isError.value = false
  try {
    const data = new FormData()
    Object.entries(form).forEach(([k, v]) => data.append(k, v))
    if (avatarPath.value) data.append('avatar', avatarPath.value)
    await uhomeApi.updateUserInfo(data)
    const updated = {
      ...userStore.userInfo,
      ...form,
      sex: Number(form.sex),
      avatar: avatarPath.value || userStore.userInfo?.avatar
    }
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

.avatar-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-preview {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
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
