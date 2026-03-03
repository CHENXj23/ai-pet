<template>
  <view class="pet-home-page">
    
    <!-- 场景一：未选择宠物 (梦幻云朵选择页) -->
    <view v-if="!selectedPet" class="cloud-selection">
      <view class="title-container">
        <text class="main-title">宠物伴侣选择</text>
        <text class="sub-title">选择一个伙伴，它将陪伴你度过每一个时刻 🌈</text>
      </view>
      
      <!-- 云朵气泡 -->
      <view class="clouds-container">
        <view 
          v-for="(pet, index) in petOptions" 
          :key="pet.type"
          class="cloud-bubble"
          :style="{ 
            '--delay': index * 0.5 + 's',
            left: getBubblePosition(index).x + '%',
            top: getBubblePosition(index).y + '%'
          }"
          @click="selectPet(pet)"
        >
          <text class="bubble-emoji">{{ pet.emoji }}</text>
          <text class="bubble-name">{{ pet.name }}</text>
        </view>
      </view>
    </view>

    <!-- 场景二：已选择宠物 (3D 动态宠物家园) -->
    <view v-else class="chat-screen">
      
      <!-- 顶部：3D 宠物舞台 -->
      <view class="pet-stage" :style="{ background: bgColors[selectedPet.type] }">
        <!-- Lottie 动画容器 -->
        <view class="lottie-container" v-if="lottieData">
          <!-- 这里用 image 模拟，实际项目中用 lottie-miniapp 组件 -->
          <image 
            :src="getLottieImage(selectedPet.type)" 
            mode="aspectFit" 
            class="lottie-placeholder"
          />
        </view>
        
        <!-- 如果没有 Lottie，用一个大 Emoji + 动画 -->
        <view v-else class="fallback-pet" :class="'pet-' + selectedPet.type">
          <text class="big-emoji">{{ currentPetInfo.emoji }}</text>
        </view>
        
        <!-- 切换按钮 -->
        <view class="switch-btn" @click="clearSelection">返回</view>
      </view>

      <!-- 中部：聊天记录 -->
      <scroll-view 
        scroll-y 
        class="message-list" 
        scroll-into-view="{{ scrollToView }}"
        scroll-with-animation
      >
        <view v-for="(msg, index) in messages" :key="index" 
              :id="'msg-' + index"
              :class="['message-row', msg.role === 'user' ? 'row-user' : 'row-pet']">
          
          <!-- 【情况 A：宠物消息】 -->
          <!-- 结构：[头像] [气泡] -->
          <template v-if="msg.role === 'pet'">
            <view class="avatar">
              <text class="avatar-emoji">{{ currentPetInfo.emoji }}</text>
            </view>
            <view class="bubble bubble-pet">
              <text>{{ msg.content }}</text>
            </view>
          </template>

          <!-- 【情况 B：用户消息】 -->
          <!-- 结构：[气泡] [头像]  <-- 注意这里顺序反过来了！ -->
          <template v-else>
            <view class="bubble bubble-user">
              <text>{{ msg.content }}</text>
            </view>
            <view class="avatar user-avatar">
              <text class="avatar-emoji">🧑</text>
            </view>
          </template>

        </view>
        
        <view style="height: 20rpx;"></view>
      </scroll-view>

      <!-- 底部：输入框 -->
      <view class="input-bar">
        <input 
          v-model="inputText" 
          class="chat-input" 
          placeholder="和{{ currentPetInfo.name }}说说话..." 
          confirm-type="send"
          @confirm="sendMessage"
        />
        <button 
          class="send-btn" 
          :class="{ active: inputText.trim() }"
          @click="sendMessage" 
          :disabled="loading || !inputText.trim()"
        >
          <text v-if="loading">...</text>
          <text v-else>发送</text>
        </button>
      </view>
    </view>

  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'

// --- 数据定义 ---
const selectedPet = ref<string | null>(null)
const inputText = ref('')
const loading = ref(false)
const scrollToView = ref('')

// 消息列表
const messages = ref<any[]>([])

// 宠物选项配置
const petOptions = [
  { type: 'dog', name: '旺财', emoji: '🐶', desc: '忠诚热情，永远爱你' },
  { type: 'cat', name: '咪咪', emoji: '🐱', desc: '高冷傲娇，偶尔撒娇' },
  { type: 'rabbit', name: '团团', emoji: '🐰', desc: '温柔安静，爱吃胡萝卜' },
  { type: 'parrot', name: '皮皮', emoji: '🦜', desc: '聪明话多，学舌高手' },
  { type: 'hamster', name: '球球', emoji: '🐹', desc: '呆萌可爱，喜欢囤粮' }
]

// 背景颜色
const bgColors: any = {
  dog: 'linear-gradient(180deg, #FFF5E6 0%, #FFE0B2 100%)',
  cat: 'linear-gradient(180deg, #F3E5F5 0%, #E1BEE7 100%)',
  rabbit: 'linear-gradient(180deg, #E8F5E9 0%, #C8E6C9 100%)',
  parrot: 'linear-gradient(180deg, #E0F7FA 0%, #B2EBF2 100%)',
  hamster: 'linear-gradient(180deg, #FFF3E0 0%, #FFE0B2 100%)'
}

// 模拟 Lottie 图片 (实际项目中替换成真实的 Lottie JSON 或 GIF)
const lottieImages: any = {
  dog: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&auto=format&fit=crop&q=60',
  cat: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&auto=format&fit=crop&q=60',
  rabbit: 'https://images.unsplash.com/photo-1563889958749-6a3b0d6b0d4c?w=200&auto=format&fit=crop&q=60',
  parrot: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=200&auto=format&fit=crop&q=60',
  hamster: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=200&auto=format&fit=crop&q=60'
}

// 计算当前宠物信息
const currentPetInfo = computed(() => {
  return petOptions.find(p => p.type === selectedPet.value) || petOptions[0]
})

// 是否有 Lottie 数据 (这里简化为 true，实际可判断文件是否存在)
const lottieData = ref(true)

// --- 生命周期 ---
onMounted(() => {
  // 检查本地存储
  const storedPet = uni.getStorageSync('my_pet_type')
  if (storedPet) {
    selectedPet.value = storedPet
    initChat()
  }
})

// --- 方法 ---

// 初始化聊天
const initChat = () => {
  messages.value = [
    { role: 'pet', content: `欢迎回家！我是${currentPetInfo.value.name}，今天想我了吗？🏠` }
  ]
}

// 选择宠物
const selectPet = (pet: any) => {
  selectedPet.value = pet.type
  uni.setStorageSync('my_pet_type', pet.type)
  initChat()
}

// 清除选择，返回选择页
const clearSelection = () => {
  selectedPet.value = null
  uni.removeStorageSync('my_pet_type')
}

// 获取 Lottie 图片 (占位)
const getLottieImage = (type: string) => {
  return lottieImages[type] || lottieImages.dog
}

// 生成云朵位置 (随机但不重叠)
const getBubblePosition = (index: number) => {
  const positions = [
    { x: 20, y: 30 },
    { x: 70, y: 25 },
    { x: 30, y: 60 },
    { x: 65, y: 55 },
    { x: 50, y: 40 }
  ]
  return positions[index % positions.length] || { x: 50, y: 50 }
}

// 发送消息 (逻辑不变)
const sendMessage = async () => {
  if (!inputText.value.trim() || loading.value) return

  const userMsg = inputText.value
  messages.value.push({ role: 'user', content: userMsg })
  inputText.value = ''
  loading.value = true
  
  await nextTick()
  scrollToView.value = 'msg-' + (messages.value.length - 1)

  try {
    const res: any = await wx.cloud.callFunction({
      name: 'chatWithPet',
      data: {
        userMessage: userMsg,
        petName: currentPetInfo.value.name,
        petType: currentPetInfo.value.type 
      }
    })

    if (res.result && res.result.success) {
      messages.value.push({ role: 'pet', content: res.result.reply })
    } else {
      messages.value.push({ role: 'pet', content: '哎呀，我有点没听清，能再说一次吗？🥺' })
    }
  } catch (err) {
    messages.value.push({ role: 'pet', content: '网络好像断了，检查一下好不好？📶' })
  } finally {
    loading.value = false
    await nextTick()
    scrollToView.value = 'msg-' + (messages.value.length - 1)
  }
}
</script>

<style scoped lang="scss">
.pet-home-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
}

/* --- 云朵选择页 --- */
.cloud-selection {
  position: relative;
  height: 100%;
  background: linear-gradient(135deg, #ffa8d4 0%, #ff84e2 100%);
  overflow: hidden;
}
.title-container {
  text-align: center;
  padding: 80rpx 40rpx 60rpx;
  z-index: 10;
  position: relative;
}
.main-title {
  font-size: 52rpx;
  font-weight: bold;
  color: #fff;
  display: block;
  margin-bottom: 20rpx;
  text-shadow: 0 2rpx 10rpx rgba(0,0,0,0.2);
}
.sub-title {
  font-size: 32rpx;
  color: rgba(255,255,255,0.9);
  text-shadow: 0 1rpx 5rpx rgba(0,0,0,0.2);
}

.clouds-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 0 40rpx;
  box-sizing: border-box;
}

.cloud-bubble {
  position: absolute;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  width: 200rpx;
  height: 200rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 10rpx 30rpx rgba(0,0,0,0.2);
  animation: float 6s infinite ease-in-out;
  animation-delay: var(--delay);
  
  &:active {
    transform: scale(0.95);
  }
}
.bubble-emoji {
  font-size: 80rpx;
  margin-bottom: 10rpx;
}
.bubble-name {
  font-size: 24rpx;
  font-weight: bold;
  color: #333;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-30rpx); }
}

.back-hint {
  position: absolute;
  bottom: 60rpx;
  left: 0;
  right: 0;
  text-align: center;
  color: rgba(255,255,255,0.8);
  font-size: 28rpx;
}
.link-text {
  color: #000000;
  font-weight: bold;
  text-decoration: underline;
}

/* --- 聊天页 --- */
.chat-screen {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* 顶部舞台 */
.pet-stage {
  position: relative;
  padding: 40rpx 30rpx 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
  z-index: 10;
  overflow: hidden;
}
.lottie-container {
  width: 200rpx;
  height: 200rpx;
}
.lottie-placeholder {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.fallback-pet {
  width: 180rpx;
  height: 180rpx;
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
  box-shadow: 0 8rpx 20rpx rgba(0,0,0,0.1);
  animation: breathe 3s infinite ease-in-out;
}
.big-emoji {
  font-size: 100rpx;
}

/* 切换按钮 */
.switch-btn {
  position: absolute;
  top: 30rpx;
  left: 30rpx;
  width: 100rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
}

/* 消息列表 & 输入框 (样式保持不变) */
.message-list {
  flex: 1;
  padding: 30rpx 0;
  background: rgba(255,255,255,0.5);
}

/* 每一行消息的容器 */
.message-row {
  display: flex;
  align-items: flex-end; /* 底部对齐，保证头像和气泡底边齐平 */
  margin-bottom: 30rpx;
  width: 100%; /* 占满整行 */
}

/* --- 宠物行 (默认左对齐) --- */
.row-user {
  justify-content: flex-end; /* 内容靠右 */
  /* 注意：因为我们在 template 里把气泡放前面了，所以靠右后就是 [气泡][头像] */
}

/* 头像样式 */
.avatar {
  width: 70rpx;
  height: 70rpx;
  border-radius: 50%;
  background: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0; /* 防止被压缩 */
   
  /* 【关键修改】左右都留出 20rpx 的距离 */
  margin-left: 20rpx;
  margin-right: 20rpx;
}

/* 用户头像特殊背景 */
.user-avatar {
  background: #DCF8C6; /* 浅绿色 */
}
.avatar-emoji {
  font-size: 36rpx;
}
/* 气泡通用样式 */
.bubble {
  max-width: 70%; /* 限制最大宽度 */
  padding: 20rpx 26rpx;
  border-radius: 20rpx;
  font-size: 30rpx;
  line-height: 1.5;
  position: relative;
  box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.05);
  word-break: break-all; /* 防止长单词溢出 */
}


/* 宠物气泡：白色，左下角小尖角 */
.bubble-pet {
  background: #fff;
  color: #333;
  border-bottom-left-radius: 4rpx; 
}

/* 用户气泡：粉色渐变，右下角小尖角 */
.bubble-user {
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  color: #fff;
  border-bottom-right-radius: 4rpx; 
}

.input-bar {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background: #fff;
  border-top: 1rpx solid #f0f0f0;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
.chat-input {
  flex: 1;
  background: #f5f5f5;
  border-radius: 50rpx;
  padding: 20rpx 30rpx;
  font-size: 30rpx;
  margin-right: 20rpx;
}
.send-btn {
  background: #ddd;
  color: #fff;
  border: none;
  padding: 0 30rpx;
  height: 70rpx;
  line-height: 70rpx;
  border-radius: 50rpx;
  font-size: 28rpx;
  font-weight: bold;
  margin: 0;
  transition: all 0.3s;
  &:disabled {
    opacity: 0.6;
  }
  &.active {
    background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
    box-shadow: 0 4rpx 10rpx rgba(255, 154, 158, 0.4);
  }
}

@keyframes breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
</style>