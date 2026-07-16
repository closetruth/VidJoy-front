import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useUserStore } from './stores'
import './styles/global.scss'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// 应用启动时尝试 cookie 自动登录，更新顶栏状态
const userStore = useUserStore()
userStore.ensureAuth().finally(() => {
  app.mount('#app')
})
