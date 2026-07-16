<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="dialog-mask" @click.self="close">
        <div class="dialog-box">
          <button class="close-btn" @click="close">×</button>
          <div class="dialog-header">
            <button
              class="tab-btn"
              :class="{ active: mode === 'login' }"
              @click="mode = 'login'"
            >
              登录
            </button>
            <button
              class="tab-btn"
              :class="{ active: mode === 'register' }"
              @click="mode = 'register'"
            >
              注册
            </button>
          </div>

          <form class="dialog-form" @submit.prevent="handleSubmit">
            <div class="form-item">
              <input v-model="form.email" type="email" placeholder="邮箱" required />
            </div>
            <div class="form-item">
              <input
                v-model="form.password"
                type="password"
                :placeholder="mode === 'login' ? '密码' : '设置密码'"
                required
              />
            </div>
            <div v-if="mode === 'register'" class="form-item">
              <input v-model="form.nickName" type="text" placeholder="昵称" required />
            </div>
            <div class="form-item captcha-row">
              <input v-model="form.checkCode" type="text" placeholder="验证码" required />
              <img
                v-if="captchaImg"
                :src="captchaImg"
                class="captcha-img"
                alt="验证码"
                @click="refreshCaptcha"
              />
              <button v-else type="button" class="captcha-placeholder" @click="refreshCaptcha">
                获取验证码
              </button>
            </div>
            <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
            <button type="submit" class="btn-primary submit-btn" :disabled="loading">
              {{ loading ? '提交中...' : mode === 'login' ? '登录' : '注册' }}
            </button>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, reactive } from 'vue'
import { useUserStore } from '@/stores'
import { accountApi } from '@/api'
import { parseCaptchaResponse } from '@/utils/captcha'
import { useRouter, useRoute } from 'vue-router'

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['update:visible'])

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()
const mode = ref('login')
const loading = ref(false)
const errorMsg = ref('')
const captchaImg = ref('')
const checkCodeKey = ref('')

const form = reactive({
  email: '',
  password: '',
  nickName: '',
  checkCode: ''
})

function close() {
  emit('update:visible', false)
  errorMsg.value = ''
}

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

async function handleSubmit() {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = new FormData()
    data.append('email', form.email)
    data.append('checkCodeKey', checkCodeKey.value)
    data.append('checkCode', form.checkCode)

    if (mode.value === 'login') {
      data.append('password', form.password)
      await userStore.login(data)
      close()
      const redirect = route.query.redirect || '/account/home'
      router.push(String(redirect))
    } else {
      data.append('registerPassword', form.password)
      data.append('nickName', form.nickName)
      await accountApi.register(data)
      mode.value = 'login'
      errorMsg.value = '注册成功，请登录'
      refreshCaptcha()
    }
  } catch (e) {
    errorMsg.value = e.message || '操作失败'
    refreshCaptcha()
  } finally {
    loading.value = false
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      refreshCaptcha()
      form.email = ''
      form.password = ''
      form.nickName = ''
      form.checkCode = ''
    }
  }
)
</script>

<style scoped lang="scss">
.dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
}

.dialog-box {
  position: relative;
  width: 400px;
  padding: 32px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.15);
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 16px;
  font-size: 24px;
  color: var(--bili-text-tertiary);
  line-height: 1;

  &:hover {
    color: var(--bili-text);
  }
}

.dialog-header {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.tab-btn {
  font-size: 18px;
  font-weight: 500;
  color: var(--bili-text-tertiary);
  padding-bottom: 8px;
  border-bottom: 2px solid transparent;
  transition: color 0.2s, border-color 0.2s;

  &.active {
    color: var(--bili-pink);
    border-bottom-color: var(--bili-pink);
  }
}

.form-item {
  margin-bottom: 16px;

  input {
    width: 100%;
    height: 44px;
    padding: 0 16px;
    border: 1px solid var(--bili-border);
    border-radius: 8px;
    font-size: 14px;
    transition: border-color 0.2s;

    &:focus {
      border-color: var(--bili-pink);
    }
  }
}

.captcha-row {
  display: flex;
  gap: 12px;

  input {
    flex: 1;
  }
}

.captcha-img {
  width: 120px;
  height: 44px;
  border-radius: 8px;
  cursor: pointer;
  object-fit: cover;
}

.captcha-placeholder {
  width: 120px;
  height: 44px;
  border-radius: 8px;
  border: 1px dashed var(--bili-border);
  font-size: 12px;
  color: var(--bili-text-tertiary);
  flex-shrink: 0;

  &:hover {
    border-color: var(--bili-pink);
    color: var(--bili-pink);
  }
}

.error-msg {
  color: #f85a54;
  font-size: 13px;
  margin-bottom: 12px;
}

.submit-btn {
  width: 100%;
  margin-top: 8px;
}
</style>
