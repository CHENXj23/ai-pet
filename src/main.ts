import { createSSRApp } from 'vue'
import App from './App.vue'

// 初始化云开发环境
wx.cloud.init({
  env: 'cloud1-8gk1dsm693f06a40', // 填入你的环境 ID
  traceUser: true, // 记录用户访问
})

export function createApp() {
  const app = createSSRApp(App)
  return {
    app
  }
}