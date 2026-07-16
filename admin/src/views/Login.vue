<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <div class="logo">V</div>
        <h1>VidJoy 管理后台</h1>
        <p>请登录管理员账号</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-item">
          <label>账号</label>
          <input v-model="form.account" type="text" placeholder="请输入管理员账号" required />
        </div>
        <div class="form-item">
          <label>密码</label>
          <input v-model="form.password" type="password" placeholder="请输入密码" required />
        </div>
        <div class="form-item captcha-row">
          <div class="captcha-input">
            <label>验证码</label>
            <input v-model="form.checkCode" type="text" placeholder="验证码" required />
          </div>
          <img
            v-if="captchaImg"
            :src="captchaImg"
            class="captcha-img"
            alt="验证码"
            @click="refreshCaptcha"
          />
          <button v-else type="button" class="captcha-placeholder" @click="refreshCaptcha">
            点击获取验证码
          </button>
        </div>
        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
        <button type="submit" class="btn btn-primary login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登 录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores'
import { accountApi } from '@/api'
import { parseCaptchaResponse } from '@/utils/captcha'

const router = useRouter()
const adminStore = useAdminStore()
const loading = ref(false)
const errorMsg = ref('')
const captchaImg = ref('')
const checkCodeKey = ref('')

const form = reactive({
  account: '',
  password: '',
  checkCode: ''
})

async function refreshCaptcha() {
  try {
    const res = await accountApi.checkCode()
    const { img, key } = parseCaptchaResponse(res)
    captchaImg.value = img
    checkCodeKey.value = key
    errorMsg.value = ''
  } catch (e) {
    captchaImg.value = ''
    checkCodeKey.value = ''
    errorMsg.value = e.message || '获取验证码失败'
  }
}

async function handleLogin() {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = new FormData()
    data.append('account', form.account)
    data.append('password', form.password)
    data.append('checkCode', form.checkCode)
    data.append('checkCodeKey', checkCodeKey.value)
    await adminStore.login(data)
    const redirect = router.currentRoute.value.query.redirect || '/admin/dashboard'
    router.replace(String(redirect))
  } catch (e) {
    errorMsg.value = e.message || '登录失败'
    refreshCaptcha()
  } finally {
    loading.value = false
  }
}

onMounted(refreshCaptcha)
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1d2129 0%, #2b303b 50%, #1d2129 100%);
}

.login-card {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;

  .logo {
    width: 56px;
    height: 56px;
    margin: 0 auto 16px;
    border-radius: 12px;
    background: var(--admin-primary);
    color: #fff;
    font-size: 28px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  h1 {
    font-size: 22px;
    margin-bottom: 8px;
  }

  p {
    font-size: 13px;
    color: var(--admin-text-tertiary);
  }
}

.captcha-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;

  .captcha-input {
    flex: 1;
  }
}

.captcha-img {
  width: 120px;
  height: 36px;
  border-radius: 6px;
  cursor: pointer;
  object-fit: cover;
  border: 1px solid var(--admin-border);
}

.captcha-placeholder {
  width: 120px;
  height: 36px;
  border-radius: 6px;
  border: 1px dashed var(--admin-border);
  font-size: 12px;
  color: var(--admin-text-tertiary);
  background: #f7f8fa;

  &:hover {
    border-color: var(--admin-primary);
    color: var(--admin-primary);
  }
}

.error-msg {
  color: var(--admin-danger);
  font-size: 13px;
  margin-bottom: 12px;
}

.login-btn {
  width: 100%;
  height: 40px;
  margin-top: 8px;
  font-size: 15px;
}
</style>
