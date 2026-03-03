<template>
  <view class="container">
    <text class="title">我的 AI 宠物</text>
    <button @click="goToChat">和旺财聊天</button>
    <!-- 如果加载中有数据 -->
    <view v-if="pet" class="pet-card">
      <text class="pet-name">{{ pet.name }}</text>
      <text class="pet-type">品种：{{ pet.type }}</text>
      <text class="pet-mood">心情值：{{ pet.mood }}</text>
    </view>
    
    <!-- 如果没数据 -->
    <view v-else class="loading">
      <text>加载中...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const pet = ref<any>(null)
const goToChat = () => {
  uni.navigateTo({ url: '/pages/chat/chat' })
}
onMounted(() => {
  // 调用云数据库查询
  const db = wx.cloud.database()
  const petsCollection = db.collection('pets')

  petsCollection.get().then((res: any) => {
    console.log('查询成功:', res.data)
    if (res.data.length > 0) {
      pet.value = res.data[0] // 取第一条数据
    }
  }).catch((err: any) => {
    console.error('查询失败:', err)
  })
  
})
</script>

<style scoped lang="scss">
.container {
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.title {
  font-size: 40rpx;
  font-weight: bold;
  margin-bottom: 40rpx;
}
.pet-card {
  background: #fff;
  padding: 40rpx;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.pet-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}
.pet-type, .pet-mood {
  font-size: 28rpx;
  color: #666;
}
</style>