<template>
  <div class="account-settings">
    <form class="settings-form" @submit.prevent="handleSave">
      <div class="form-item">
        <label>头像</label>
        <div class="avatar-row">
          <img :src="avatarPreview" class="avatar-preview" alt="" />
          <input type="file" accept="image/*" @change="onAvatarChange" />
        </div>
        <p class="field-tip">选择图片后会立即上传并保存头像，不会改动昵称</p>
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
      <div class="form-item">
        <label>空间主题</label>
        <div class="theme-grid">
          <button
            v-for="item in USER_THEME_PRESETS"
            :key="item.id"
            type="button"
            class="theme-swatch"
            :class="{ active: theme === item.id }"
            :style="{ background: item.gradient }"
            :title="item.name"
            @click="selectTheme(item.id)"
          >
            <span class="theme-name">{{ item.name }}</span>
          </button>
        </div>
        <p v-if="themeMsg" class="theme-msg">{{ themeMsg }}</p>
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
import { getAvatarUrl, USER_THEME_PRESETS } from '@/utils/format'

const userStore = useUserStore()
const saving = ref(false)
const msg = ref('')
const isError = ref(false)
const avatarPath = ref('')
const originalNickName = ref('')
const theme = ref(1)
const themeMsg = ref('')
const themeSaving = ref(false)

const form = reactive({
  nickName: '',
  sex: '2',
  birthday: '',
  school: '',
  personIntroduction: '',
  noticeInfo: ''
})

const avatarPreview = computed(() =>
  getAvatarUrl(avatarPath.value || userStore.userInfo?.avatar)
)

function fillForm(info) {
  if (!info) return
  const nick = sanitizeFormText(info.nickName)
  form.nickName = nick
  originalNickName.value = nick
  form.sex = String(info.sex ?? 2)
  form.birthday = sanitizeFormText(info.birthday)
  form.school = sanitizeFormText(info.school)
  form.personIntroduction = sanitizeFormText(info.personIntroduction)
  form.noticeInfo = sanitizeFormText(info.noticeInfo)
  avatarPath.value = sanitizeFormText(info.avatar)
  theme.value = Number(info.theme) || 1
}

function sanitizeFormText(value) {
  if (value == null) return ''
  const s = String(value).trim()
  if (!s || s === 'null' || s === 'undefined') return ''
  return s
}

function buildUpdateFormData({ nickName, avatar }) {
  const safeNick = sanitizeFormText(nickName)
  const safeAvatar = sanitizeFormText(avatar)
  if (!safeNick) throw new Error('昵称不能为空')
  if (!safeAvatar) throw new Error('头像不能为空')

  const data = new FormData()
  data.append('nickName', safeNick)
  data.append('avatar', safeAvatar)
  data.append('sex', String(form.sex ?? 2))
  data.append('birthday', sanitizeFormText(form.birthday))
  data.append('school', sanitizeFormText(form.school))
  data.append('personIntroduction', sanitizeFormText(form.personIntroduction))
  data.append('noticeInfo', sanitizeFormText(form.noticeInfo))
  return data
}

/** 未主动改昵称时，沿用加载时的原昵称，避免误触发改名扣币 */
function resolveNickNameForSave() {
  const typed = sanitizeFormText(form.nickName)
  const original = sanitizeFormText(originalNickName.value)
  const fromStore = sanitizeFormText(userStore.userInfo?.nickName)
  if (!typed) return original || fromStore
  if (typed === original) return original || typed
  return typed
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

async function selectTheme(id) {
  if (themeSaving.value || theme.value === id) return
  const prev = theme.value
  theme.value = id
  themeSaving.value = true
  themeMsg.value = ''
  try {
    await uhomeApi.saveTheme(id)
    themeMsg.value = '主题已保存'
    if (userStore.userInfo) {
      userStore.setUser({ ...userStore.userInfo, theme: id })
    }
  } catch (e) {
    theme.value = prev
    themeMsg.value = e?.message || '主题保存失败'
  } finally {
    themeSaving.value = false
  }
}

async function onAvatarChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  msg.value = ''
  isError.value = false
  try {
    const res = await fileApi.uploadImage(file, true)
    const path = typeof res?.data === 'string' ? res.data : ''
    if (!path) throw new Error('上传成功但未返回头像路径')

    const nickName = resolveNickNameForSave()
    if (!nickName) throw new Error('昵称未加载，请刷新页面后再改头像')

    avatarPath.value = path
    // 改头像立即保存，明确带上原昵称，避免只改头像却触发改名逻辑
    await uhomeApi.updateUserInfo(buildUpdateFormData({ nickName, avatar: path }))
    userStore.setUser({
      ...userStore.userInfo,
      nickName,
      avatar: path,
      sex: Number(form.sex)
    })
    form.nickName = nickName
    originalNickName.value = nickName
    // 再拉一次完整资料，避免本地与库不一致
    try {
      const refreshed = await uhomeApi.getUserInfo(userStore.userInfo.userId)
      if (refreshed?.data) {
        fillForm(refreshed.data)
        const nextAvatar = sanitizeFormText(refreshed.data.avatar) || path
        const nextNick = sanitizeFormText(refreshed.data.nickName) || nickName
        avatarPath.value = nextAvatar
        form.nickName = nextNick
        originalNickName.value = nextNick
        userStore.setUser({
          ...userStore.userInfo,
          ...refreshed.data,
          avatar: nextAvatar,
          nickName: nextNick
        })
      }
    } catch {
      /* 刷新失败不影响头像已保存 */
    }
    msg.value = '头像已更新'
  } catch (err) {
    msg.value = err?.message || '头像上传失败'
    isError.value = true
  } finally {
    e.target.value = ''
  }
}

async function handleSave() {
  saving.value = true
  msg.value = ''
  isError.value = false
  try {
    const nickName = resolveNickNameForSave()
    const avatar = sanitizeFormText(avatarPath.value || userStore.userInfo?.avatar)
    if (!nickName) throw new Error('昵称不能为空')
    if (!avatar) throw new Error('请先上传头像')

    const nickChanged = nickName !== sanitizeFormText(originalNickName.value)
    if (nickChanged) {
      const ok = confirm('修改昵称会消耗 5 硬币，确定继续？')
      if (!ok) return
    }

    await uhomeApi.updateUserInfo(buildUpdateFormData({ nickName, avatar }))
    originalNickName.value = nickName
    form.nickName = nickName
    avatarPath.value = avatar
    userStore.setUser({
      ...userStore.userInfo,
      nickName,
      sex: Number(form.sex),
      birthday: sanitizeFormText(form.birthday),
      school: sanitizeFormText(form.school),
      personIntroduction: sanitizeFormText(form.personIntroduction),
      noticeInfo: sanitizeFormText(form.noticeInfo),
      avatar
    })
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

.field-tip {
  margin-top: 6px;
  font-size: 12px;
  color: var(--bili-text-tertiary);
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

.theme-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.theme-swatch {
  position: relative;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid transparent;

  &.active {
    border-color: #fff;
    box-shadow: 0 0 0 2px var(--bili-pink);
  }

  .theme-name {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 2px 4px;
    font-size: 11px;
    color: #fff;
    background: rgba(0, 0, 0, 0.35);
    text-align: center;
  }
}

.theme-msg {
  margin-top: 8px;
  font-size: 12px;
  color: var(--bili-text-tertiary);
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

@media (max-width: 640px) {
  .theme-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
