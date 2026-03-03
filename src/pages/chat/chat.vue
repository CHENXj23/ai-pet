<template>
  <view class="pet-home-page">
    
    <!-- 场景一：未选择宠物 (引导页) -->
    <view v-if="!selectedPet" class="selection-screen">
      <view class="header-text">
        <text class="title">选择一个伙伴</text>
        <text class="subtitle">它将陪伴你度过每一个时刻 🌟</text>
      </view>
      
      <scroll-view scroll-y class="pet-grid">
        <view 
          v-for="pet in petOptions" 
          :key="pet.type" 
          class="pet-card"
          @click="selectPet(pet)"
        >
          <view class="pet-emoji">{{ pet.emoji }}</view>
          <text class="pet-name">{{ pet.name }}</text>
          <text class="pet-desc">{{ pet.desc }}</text>
        </view>
      </scroll-view>
    </view>

    <!-- 场景二：已选择宠物 (聊天家园) -->
    <view v-else class="chat-screen">
      
      <!-- 顶部：宠物形象展示区 -->
      <view class="pet-stage" :style="{ backgroundImage: `url(${bgImages[selectedPet.type]})` }">
        <view class="pet-avatar-container">
          <text class="pet-avatar-emoji">{{ currentPetInfo.emoji }}</text>
        </view>
        <view class="pet-status-bar">
          <text class="status-item">🍖 {{ hunger }}%</text>
          <text class="status-item">❤️ {{ happiness }}%</text>
        </view>
        <text class="welcome-text">我是{{ currentPetInfo.name }}，随时都在哦～</text>
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
          
          <!-- 宠物头像 -->
          <view v-if="msg.role === 'pet'" class="avatar">
            <text class="avatar-emoji">{{ currentPetInfo.emoji }}</text>
          </view>
          
          <!-- 气泡 -->
          <view :class="['bubble', msg.role === 'user' ? 'bubble-user' : 'bubble-pet']">
            <text>{{ msg.content }}</text>
          </view>

          <!-- 用户头像 (可选，这里简化不显示) -->
          <view v-if="msg.role === 'user'" class="avatar user-avatar">
            <text class="avatar-emoji">🧑</text>
          </view>
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
const hunger = ref(80)
const happiness = ref(90)

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

// 背景图 (可以用渐变色代替，或者找一些温馨的插画 URL)
const bgImages: any = {
  dog: 'linear-gradient(180deg, #FFF5E6 0%, #FFE0B2 100%)',
  cat: 'linear-gradient(180deg, #F3E5F5 0%, #E1BEE7 100%)',
  rabbit: 'linear-gradient(180deg, #E8F5E9 0%, #C8E6C9 100%)',
  parrot: 'linear-gradient(180deg, #E0F7FA 0%, #B2EBF2 100%)',
  hamster: 'linear-gradient(180deg, #FFF3E0 0%, #FFE0B2 100%)'
}

// 计算当前宠物信息
const currentPetInfo = computed(() => {
  return petOptions.find(p => p.type === selectedPet.value) || petOptions[0]
})

// --- 生命周期 ---
onMounted(() => {
  // 1. 检查本地是否有存储的选择
  const storedPet = uni.getStorageSync('my_pet_type')
  if (storedPet) {
    selectedPet.value = storedPet
    // 加载历史聊天记录 (模拟，实际应从云数据库加载)
    messages.value = [
      { role: 'pet', content: `欢迎回家！我是${currentPetInfo.value.name}，今天想我了吗？🏠` }
    ]
  }
})

// --- 方法 ---

// 选择宠物
const selectPet = (pet: any) => {
  selectedPet.value = pet.type
  // 保存到本地
  uni.setStorageSync('my_pet_type', pet.type)
  
  // 初始化欢迎语
  messages.value = [
    { role: 'pet', content: `汪/喵/叽！你好呀主人！我是${pet.name}，以后请多关照哦～🐾` }
  ]
}

// 发送消息
const sendMessage = async () => {
  if (!inputText.value.trim() || loading.value) return

  const userMsg = inputText.value
  messages.value.push({ role: 'user', content: userMsg })
  inputText.value = ''
  loading.value = true
  
  // 滚动到底部
  await nextTick()
  scrollToView.value = 'msg-' + (messages.value.length - 1)

  try {
    const res: any = await wx.cloud.callFunction({
      name: 'chatWithPet',
      data: {
        userMessage: userMsg,
        petName: currentPetInfo.value.name,
        // 可以扩展：告诉 AI 它是什么动物，让它演得更像
        petType: currentPetInfo.value.type 
      }
    })

    if (res.result && res.result.success) {
      messages.value.push({ role: 'pet', content: res.result.reply })
      // 简单的互动反馈
      happiness.value = Math.min(100, happiness.value + 2)
    } else {
      messages.value.push({ role: 'pet', content: '哎呀，我有点没听清，能再说一次吗？🥺' })
    }
  } catch (err) {
    messages.value.push({ role: 'pet', content: '网络好像断了，检查一下好不好？📶' })
  } finally {
    loading.value = false
    // 再次滚动
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

/* --- 选择页样式 --- */
.selection-screen {
  padding: 40rpx;
  background: #FDFBF7;
  height: 100%;
}
.header-text {
  text-align: center;
  margin-bottom: 60rpx;
  margin-top: 40rpx;
}
.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}
.subtitle {
  font-size: 28rpx;
  color: #999;
}
.pet-grid {
  height: calc(100vh - 300rpx);
}
.pet-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 8rpx 20rpx rgba(0,0,0,0.05);
  transition: transform 0.2s;
  &:active {
    transform: scale(0.98);
  }
}
.pet-emoji {
  font-size: 100rpx;
  margin-bottom: 20rpx;
}
.pet-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}
.pet-desc {
  font-size: 26rpx;
  color: #999;
}

/* --- 聊天页样式 --- */
.chat-screen {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* 顶部舞台 */
.pet-stage {
  padding: 40rpx 30rpx 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  /* 背景渐变由 JS 控制 */
  background-size: cover;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
  z-index: 10;
}
.pet-avatar-container {
  width: 160rpx;
  height: 160rpx;
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
.pet-avatar-emoji {
  font-size: 80rpx;
}
.pet-status-bar {
  display: flex;
  gap: 30rpx;
  margin-bottom: 10rpx;
}
.status-item {
  font-size: 24rpx;
  color: #666;
  background: rgba(255,255,255,0.5);
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
}
.welcome-text {
  font-size: 26rpx;
  color: #555;
  font-weight: 500;
}

/* 消息列表 */
.message-list {
  flex: 1;
  padding: 30rpx;
  background: rgba(255,255,255,0.5);
}
.message-row {
  display: flex;
  align-items: flex-end;
  margin-bottom: 30rpx;
}
.row-user {
  flex-direction: row-reverse;
}
.avatar {
  width: 70rpx;
  height: 70rpx;
  border-radius: 50%;
  background: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin: 0 15rpx;
}
.user-avatar {
  background: #DCF8C6;
}
.avatar-emoji {
  font-size: 36rpx;
}
.bubble {
  max-width: 70%;
  padding: 20rpx 26rpx;
  border-radius: 20rpx;
  font-size: 30rpx;
  line-height: 1.5;
  position: relative;
  box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.05);
}
.bubble-pet {
  background: #fff;
  color: #333;
  border-bottom-left-radius: 4rpx;
}
.bubble-user {
  background: #FF9A9E; /* 温馨粉 */
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  color: #fff;
  border-bottom-right-radius: 4rpx;
}

/* 底部输入栏 */
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