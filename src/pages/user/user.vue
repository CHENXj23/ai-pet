<template>
  <view class="user-page">
    
    <!-- ================= 1. 顶部宠物卡片 ================= -->
    <view class="pet-card" :style="{ background: petBgColor }">
      <view class="pet-avatar-wrapper">
        <text class="pet-avatar-emoji">{{ profile.avatarType ? getEmoji(profile.avatarType) : '❓' }}</text>
      </view>
      
      <view class="pet-info" v-if="hasProfile">
        <text class="pet-name">{{ profile.petName }}</text>
        <text class="pet-breed">{{ profile.breed }} · {{ ageText }}</text>
        <view class="level-badge">Lv.{{ petLevel }}</view>
      </view>
      <view class="pet-info" v-else>
        <text class="pet-name">还未记录宠物哦</text>
        <text class="pet-breed">快来建立档案吧！</text>
      </view>
      
      <!-- 编辑/创建按钮 -->
      <view class="edit-btn" @click="openProfileModal">
        <text class="icon">{{ hasProfile ? '✏️' : '➕' }}</text>
      </view>
    </view>

    <!-- ================= 2. 成长时间轴 ================= -->
    <view class="timeline-section">
      <view class="section-header">
        <text class="s-title">成长足迹</text>
        <text class="s-add" @click="openLogModal" v-if="hasProfile">+ 记录瞬间</text>
      </view>

      <scroll-view scroll-y class="timeline-list">
        <!-- 没档案时的提示 -->
        <view v-if="!hasProfile" class="empty-state">
          <text class="empty-emoji">📝</text>
          <text class="empty-text">请先完善宠物档案，才能记录成长哦～</text>
          <button class="create-btn" @click="openProfileModal">去创建档案</button>
        </view>

        <!-- 有档案但无记录 -->
        <view v-else-if="logs.length === 0" class="empty-state">
          <text class="empty-emoji">🌱</text>
          <text class="empty-text">还没有成长记录，快来添加第一条吧！</text>
        </view>

        <!-- 列表循环 -->
        <view v-else v-for="(item, index) in logs" :key="item._id" class="timeline-item">
          <view class="time-point">
            <view class="dot"></view>
            <view v-if="index !== logs.length - 1" class="line"></view>
          </view>
          <view class="log-card">
            <view class="log-date">{{ item.occurTimeStr || formatDate(item.createTime) }}</view>
            <view class="log-title">{{ item.title }}</view>
            <view class="log-content">{{ item.content }}</view>
            <image v-if="item.image" :src="item.image" mode="aspectFill" class="log-image" />
            <view class="log-tag" :class="getTagClass(item.type)">
              {{ getTypeName(item.type) }}
            </view>
          </view>
        </view>
        <view style="height: 40rpx;"></view>
      </scroll-view>
    </view>

    <!-- ================= 3. 弹窗 A：宠物档案 ================= -->
    <view 
      v-if="showProfileModal" 
      class="modal-mask" 
      @click="closeProfileModal"
      catchtouchmove="true"
    >
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="title">{{ hasProfile ? '编辑宠物档案' : '创建你的宠物' }}</text>
          <text class="close" @click="closeProfileModal">×</text>
        </view>
        
        <scroll-view scroll-y class="modal-body">
          <view class="form-label">选择宠物类型</view>
          <view class="type-selector">
            <view 
              v-for="type in petTypes" 
              :key="type.value"
              class="type-item"
              :class="{ active: profileForm.avatarType === type.value }"
              @click="profileForm.avatarType = type.value"
            >
              <text class="t-emoji">{{ type.emoji }}</text>
              <text class="t-name">{{ type.name }}</text>
            </view>
          </view>

          <input v-model="profileForm.petName" class="input" placeholder="给它取个名字吧" />
          <input v-model="profileForm.breed" class="input" placeholder="品种 (如：金毛、英短)" />
          
          <!-- 【核心修复】使用 picker 组件替代点击事件 -->
          <picker mode="date" :value="profileForm.birthday" start="2020-01-01" :end="currentDate" @change="onBirthdayChange">
            <view class="date-picker-box">
              <text class="date-label">🎂 出生日期：</text>
              <text class="date-value">{{ profileForm.birthday || '点击选择' }}</text>
              <text class="arrow">›</text>
            </view>
          </picker>

          <button class="submit-btn" @click="saveProfile">保存档案</button>
        </scroll-view>
      </view>
    </view>

    <!-- ================= 4. 弹窗 B：记录瞬间 ================= -->
    <view 
      v-if="showLogModal" 
      class="modal-mask" 
      @click="showLogModal = false"
      catchtouchmove="true"
    >
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="title">记录成长瞬间</text>
          <text class="close" @click="showLogModal = false">×</text>
        </view>
        <scroll-view scroll-y class="modal-body">
          <input v-model="newLog.title" class="input" placeholder="标题（如：第一次打疫苗）" />
          
          <!-- 【核心修复】使用 picker 组件替代点击事件 -->
          <picker mode="date" :value="newLog.occurTimeStr" start="2020-01-01" :end="currentDate" @change="onLogDateChange">
            <view class="date-picker-box">
              <text class="date-label">📅 发生时间：</text>
              <text class="date-value">{{ newLog.occurTimeStr || '点击选择日期' }}</text>
              <text class="arrow">›</text>
            </view>
          </picker>

          <textarea v-model="newLog.content" class="textarea" placeholder="发生了什么有趣的事？" />
          <view class="upload-box" @click="chooseImage">
            <text v-if="!newLog.image" class="upload-hint">📷 添加一张照片</text>
            <image v-else :src="newLog.image" class="preview" />
          </view>
          <button class="submit-btn" @click="submitLog">保存记录</button>
        </scroll-view>
      </view>
    </view>

    <!-- 【已删除】不再需要自定义日期输入弹窗 (showDateInputModal) -->

  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// --- 数据定义 ---
const petLevel = ref(5)
const logs = ref<any[]>([])
const hasProfile = ref(false) 
const showProfileModal = ref(false)
const showLogModal = ref(false)

// 获取当前日期字符串 YYYY-MM-DD，用于限制选择器最大日期
const currentDate = new Date().toISOString().split('T')[0]

const petTypes = [
  { value: 'dog', name: '狗狗', emoji: '🐶' },
  { value: 'cat', name: '猫咪', emoji: '🐱' },
  { value: 'rabbit', name: '兔子', emoji: '🐰' },
  { value: 'hamster', name: '仓鼠', emoji: '🐹' },
  { value: 'parrot', name: '鹦鹉', emoji: '🦜' }
]

const profileForm = ref({
  petName: '',
  breed: '',
  birthday: '',
  avatarType: 'dog'
})

const profile = ref({ ...profileForm.value })

const newLog = ref({ 
  title: '', content: '', image: '', type: 'daily',
  occurTime: 0 as number, occurTimeStr: '' as string
})

const petBgColor = 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)'

// --- 计算属性 ---
const ageText = computed(() => {
  if (!profile.value.birthday) return ''
  const birth = new Date(profile.value.birthday)
  const diff = Date.now() - birth.getTime()
  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30))
  return months < 12 ? `${months}个月` : `${Math.floor(months/12)}岁`
})

// --- 生命周期 ---
onMounted(async() => {
  await fetchProfile()
  fetchLogs()
})

// --- 方法 ---

const fetchProfile = async () => {
  // 模拟云数据库调用，实际使用时请确保 wx.cloud 已初始化
  const db = wx.cloud.database()
  try {
    const res: any = await db.collection('user_profiles').limit(1).get()
    console.log('获取档案结果:', res)
    if (res.data.length > 0) {
      hasProfile.value = true
      profile.value = res.data[0]
      profileForm.value = { ...res.data[0] }
    } else {
      hasProfile.value = false
      // 如果没有档案，稍微延迟后自动弹出，引导用户
      setTimeout(() => openProfileModal(), 800)
    }
  } catch (e) {
    console.error('获取档案失败 (可能未初始化云开发)', e)
    // 开发环境容错：如果报错，暂时设为 false 避免白屏
    hasProfile.value = false
  }
}

const fetchLogs = async () => {
  const db = wx.cloud.database()
  try {
    const res: any = await db.collection('pet_logs').orderBy('occurTime', 'desc').get()
    logs.value = res.data
  } catch (e) {
    console.log('获取日志失败', e)
  }
}

const openProfileModal = () => {
  if (hasProfile.value) {
    profileForm.value = { ...profile.value }
  } else {
    profileForm.value = { petName: '', breed: '', birthday: '', avatarType: 'dog' }
  }
  showProfileModal.value = true
}

const closeProfileModal = () => {
  showProfileModal.value = false
}

// 【新增】处理生日选择变化
const onBirthdayChange = (e: any) => {
  profileForm.value.birthday = e.detail.value
}

// 【新增】处理日志日期选择变化
const onLogDateChange = (e: any) => {
  const dateStr = e.detail.value
  newLog.value.occurTimeStr = dateStr
  newLog.value.occurTime = new Date(dateStr).getTime()
}

const saveProfile = async () => {
  if (!profileForm.value.petName || !profileForm.value.birthday) {
    uni.showToast({ title: '请填写名字和生日', icon: 'none' })
    return
  }

  uni.showLoading({ title: '保存中...' })
  const db = wx.cloud.database()

  try {
    if (hasProfile.value) {
      // 更新逻辑
      const res: any = await db.collection('user_profiles').limit(1).get()
      if (res.data.length > 0) {
        await db.collection('user_profiles').doc(res.data[0]._id).update({
          data: profileForm.value
        })
      }
    } else {
      // 新增逻辑
      await db.collection('user_profiles').add({
        data: profileForm.value
      })
    }

    uni.hideLoading()
    uni.showToast({ title: '保存成功', icon: 'success' })
    
    profile.value = { ...profileForm.value }
    hasProfile.value = true
    showProfileModal.value = false
    fetchLogs()

  } catch (err: any) {
    uni.hideLoading()
    console.error(err)
    uni.showToast({ title: '保存失败:' + err.message, icon: 'none' })
  }
}

const openLogModal = () => {
  newLog.value = { title: '', content: '', image: '', type: 'daily', occurTime: Date.now(), occurTimeStr: currentDate }
  showLogModal.value = true
}

const chooseImage = async () => {
  try {
    const res: any = await uni.chooseImage({ count: 1, sizeType: ['compressed'] })
    if (res.tempFilePaths && res.tempFilePaths.length > 0) {
      newLog.value.image = res.tempFilePaths[0]
    }
  } catch (e) {
    console.log('选择图片取消', e)
  }
}

const submitLog = async () => {
  if (!newLog.value.title) {
    uni.showToast({ title: '请填写标题', icon: 'none' }); return
  }
  if (!newLog.value.occurTimeStr) {
    uni.showToast({ title: '请选择日期', icon: 'none' }); return
  }

  uni.showLoading({ title: '保存中...' })
  try {
    const db = wx.cloud.database()
    await db.collection('pet_logs').add({
      data: {
        title: newLog.value.title,
        content: newLog.value.content,
        image: newLog.value.image,
        type: newLog.value.type,
        occurTime: newLog.value.occurTime,
        occurTimeStr: newLog.value.occurTimeStr,
        createTime: Date.now(),
      }
    })
    uni.hideLoading()
    uni.showToast({ title: '记录成功', icon: 'success' })
    showLogModal.value = false
    fetchLogs()
  } catch (err: any) {
    uni.hideLoading()
    console.error(err)
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

const getEmoji = (type: string) => {
  const p = petTypes.find(t => t.value === type)
  return p ? p.emoji : '🐶'
}

const formatDate = (ts: number) => {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getMonth()+1}.${d.getDate()}`
}

const getTypeName = (type: string) => {
  const map: any = { vaccine: '💉 疫苗', bath: '🛁 洗澡', skill: '🎓 技能', daily: '📝 日常' }
  return map[type] || '📝 日常'
}

const getTagClass = (type: string) => {
  const t = type || 'daily'
  return 'tag-' + t
}
</script>

<style scoped lang="scss">
.user-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 40rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Segoe UI, Arial, Roboto, 'PingFang SC', 'miui', 'Hiragino Sans GB', 'Microsoft Yahei', sans-serif;
}
.pet-card {
  padding: 60rpx 40rpx 40rpx;
  display: flex;
  align-items: center;
  color: #fff;
  position: relative;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
}
.pet-avatar-wrapper {
  width: 140rpx;
  height: 140rpx;
  background: rgba(255,255,255,0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 30rpx;
  backdrop-filter: blur(10px);
  flex-shrink: 0;
}
.pet-avatar-emoji { font-size: 70rpx; }
.pet-info { flex: 1; overflow: hidden; }
.pet-name { font-size: 40rpx; font-weight: bold; display: block; margin-bottom: 10rpx; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pet-breed { font-size: 26rpx; opacity: 0.9; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.level-badge { display: inline-block; background: rgba(0,0,0,0.2); padding: 6rpx 16rpx; border-radius: 20rpx; font-size: 22rpx; margin-top: 10rpx; font-weight: bold; }
.edit-btn {
  width: 60rpx;
  height: 60rpx;
  background: rgba(255,255,255,0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  flex-shrink: 0;
  cursor: pointer;
  z-index: 100;
  position: relative;
}

.timeline-section { margin: 30rpx; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30rpx; }
.s-title { font-size: 32rpx; font-weight: bold; color: #333; }
.s-add { font-size: 26rpx; color: #FF6B81; font-weight: bold; cursor: pointer; z-index: 10;}
.timeline-list { max-height: 70vh; }
.timeline-item { display: flex; margin-bottom: 40rpx; }
.time-point { display: flex; flex-direction: column; align-items: center; margin-right: 20rpx; }
.dot { width: 20rpx; height: 20rpx; background: #FF6B81; border-radius: 50%; margin-top: 10rpx; z-index: 2; }
.line { width: 4rpx; flex: 1; background: #eee; margin-top: 10rpx; }
.log-card { flex: 1; background: #fff; padding: 25rpx; border-radius: 20rpx; box-shadow: 0 4rpx 10rpx rgba(0,0,0,0.05); }
.log-date { font-size: 22rpx; color: #999; margin-bottom: 10rpx; }
.log-title { font-size: 30rpx; font-weight: bold; color: #333; margin-bottom: 10rpx; display: block; }
.log-content { font-size: 28rpx; color: #666; line-height: 1.5; display: block; margin-bottom: 15rpx; }
.log-image { width: 100%; height: 300rpx; border-radius: 12rpx; margin-bottom: 15rpx; background: #f5f5f5; }
.log-tag { display: inline-block; padding: 6rpx 16rpx; border-radius: 20rpx; font-size: 22rpx; background: #f0f0f0; color: #666; }
.tag-vaccine { background: #E3F2FD; color: #2196F3; }
.tag-bath { background: #E0F7FA; color: #00BCD4; }
.tag-skill { background: #FFF3E0; color: #FF9800; }

.empty-state { text-align: center; padding: 100rpx 0; color: #999; }
.empty-emoji { font-size: 80rpx; display: block; margin-bottom: 20rpx; }
.create-btn { margin-top: 30rpx; background: #FF6B81; color: #fff; border: none; border-radius: 50rpx; padding: 15rpx 40rpx; font-size: 28rpx; }

.form-label { font-size: 28rpx; color: #666; margin-bottom: 15rpx; margin-top: 10rpx; }
.type-selector { display: flex; gap: 20rpx; margin-bottom: 20rpx; overflow-x: auto; padding: 10rpx 0; }
.type-item { flex-shrink: 0; width: 140rpx; height: 140rpx; background: #f5f5f5; border-radius: 20rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2rpx solid transparent; transition: all 0.3s; }
.type-item.active { background: #FFF0F3; border-color: #FF6B81; transform: scale(1.05); }
.t-emoji { font-size: 50rpx; margin-bottom: 10rpx; }
.t-name { font-size: 24rpx; color: #666; }

/* Picker 样式优化 */
.date-picker-box { 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  background: #f5f5f5; 
  padding: 20rpx 25rpx; 
  border-radius: 12rpx; 
  margin-bottom: 20rpx; 
  font-size: 28rpx; 
  color: #666; 
}
.date-label { color: #999; margin-right: 10rpx; white-space: nowrap; }
.date-value { flex: 1; color: #333; font-weight: 500; text-align: right; }
.arrow { color: #ccc; font-size: 32rpx; margin-left: 10rpx; }

.modal-mask { 
  position: fixed; 
  top: 0; left: 0; right: 0; bottom: 0; 
  width: 100%; height: 100%; 
  background: rgba(0,0,0,0.5); 
  z-index: 999; 
  display: flex; 
  align-items: flex-end; 
}
.modal-content { 
  width: 100%; 
  background: #fff; 
  border-radius: 40rpx 40rpx 0 0; 
  padding: 40rpx 30rpx; 
  max-height: 85vh; 
  display: flex; 
  flex-direction: column; 
  box-sizing: border-box;
}
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30rpx; border-bottom: 1rpx solid #f5f5f5; padding-bottom: 20rpx; }
.title { font-size: 32rpx; font-weight: bold; color: #333; }
.close { font-size: 40rpx; color: #999; padding: 10rpx; line-height: 1; }
.modal-body { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; }

.input, .textarea { width: 100%; background: #f5f5f5; padding: 20rpx; border-radius: 12rpx; margin-bottom: 20rpx; box-sizing: border-box; font-size: 28rpx; }
.textarea { height: 200rpx; }
.input { height: 100rpx; }
.upload-box { width: 200rpx; height: 200rpx; background: #f5f5f5; border-radius: 12rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 30rpx; overflow: hidden; }
.upload-hint { color: #999; font-size: 24rpx; text-align: center; }
.preview { width: 100%; height: 100%; }
.submit-btn { background: #FF6B81; color: #fff; border: none; border-radius: 50rpx; font-size: 30rpx; font-weight: bold; padding: 20rpx 0; margin-top: 10rpx; width: 100%; }
</style>