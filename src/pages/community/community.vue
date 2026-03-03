<template>
  <view class="community-page">
    
    <!-- 顶部导航 (固定) -->
    <!-- <view class="top-nav">
      <text 
        v-for="tab in tabs" 
        :key="tab.id" 
        :class="['nav-item', currentTab === tab.id ? 'active' : '']"
        @click="switchTab(tab.id)"
      >
        {{ tab.name }}
      </text>
      <view class="active-line" :style="{ left: activeLineLeft + 'px' }"></view>
    </view> -->

    <!-- 内容区域 (瀑布流) -->
    <scroll-view scroll-y class="content-scroll" @scroll="onScroll">
      <view class="waterfall-container">
        
        <!-- 循环渲染帖子卡片 -->
        <view 
          v-for="(item, index) in posts" 
          :key="item.id" 
          class="post-card"
          @click="goToDetail(item._id)"
        >
          <!-- 图片区域 -->
          <view class="image-wrapper">
            <image :src="item.image" mode="aspectFill" class="post-image" />
            <!-- 视频标识 (如果有) -->
            <view v-if="item.isVideo" class="video-icon">▶️</view>
          </view>

          <!-- 标题 -->
          <view class="title">{{ item.title }}</view>

          <!-- 底部用户信息 -->
          <view class="user-bar">
            <view class="user-info">
              <image :src="item.avatar" class="user-avatar" />
              <text class="user-name">{{ item.username }}</text>
            </view>
            <view class="like-wrapper" @click.stop="toggleLike(index)">
              <text :class="['heart-icon', item.isLiked ? 'liked' : '']">
                {{ item.isLiked ? '❤️' : '🤍' }}
              </text>
              <text class="like-count">{{ item.likes }}</text>
            </view>
          </view>
        </view>

      </view>
      
      <!-- 加载提示 -->
      <view class="loading-text">
        {{ isLoading ? '加载中...' : '没有更多啦～' }}
      </view>
    </scroll-view>

    <!-- 悬浮发布按钮 -->
    <view class="fab-button" @click="showPublishModal = true">
      <text class="fab-icon">+</text>
    </view>
    <!-- 发布弹窗 (半屏) -->
    <view v-if="showPublishModal" class="modal-mask" @click="closeModal">
      <view class="modal-content" @click.stop>
        <!-- 顶部标题栏 -->
        <view class="modal-header">
          <text class="cancel-btn" @click="closeModal">取消</text>
          <text class="title">发布动态</text>
          <text class="publish-btn" :class="{ active: canPublish }" @click="submitPost">发布</text>
        </view>

        <!-- 表单区域 -->
        <scroll-view scroll-y class="modal-body">
          <!-- 标题输入 -->
          <input 
            v-model="formData.title" 
            class="input-title" 
            placeholder="填写标题会更吸引人哦～" 
            maxlength="20"
          />
          
          <!-- 正文输入 -->
          <textarea 
            v-model="formData.content" 
            class="input-content" 
            placeholder="分享你和宠物的日常..." 
            maxlength="500"
          />

          <!-- 图片上传区 -->
          <view class="image-upload-area">
            <!-- 已选图片列表 -->
            <view v-for="(img, index) in formData.images" :key="index" class="image-item">
              <image :src="img" mode="aspectFill" class="preview-img" />
              <view class="delete-btn" @click="removeImage(index)">
                <text class="icon">×</text>
              </view>
            </view>
            
            <!-- 添加图片按钮 (最多选 9 张) -->
            <view v-if="formData.images.length < 9" class="upload-btn" @click="chooseImage">
              <text class="icon">📷</text>
              <text class="hint">添加图片</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted ,onUnmounted, computed} from 'vue'
import { onShow } from '@dcloudio/uni-app'
// --- 1. 顶部导航 (保持不变) ---
const tabs = [
  { id: 'follow', name: '关注' },
  { id: 'explore', name: '发现' },
  { id: 'nearby', name: '附近' }
]
const currentTab = ref('explore')
const activeLineLeft = ref(90) 

const switchTab = (id: string) => {
  currentTab.value = id
  if (id === 'follow') activeLineLeft.value = 20
  if (id === 'explore') activeLineLeft.value = 90
  if (id === 'nearby') activeLineLeft.value = 160
  // 切换 Tab 时重新加载数据
  fetchPosts()
}
// --- 新增：监听刷新事件 ---
const refreshListener = () => {
  console.log('收到刷新信号，重新加载列表...')
  fetchPosts() // 调用原本的获取数据函数
}
onShow(() => {
  // 绑定监听器
  uni.$on('refreshCommunityList', refreshListener)
})

// --- 生命周期：页面卸载时 (防止内存泄漏) ---
onUnmounted(() => {
  // 移除监听器
  uni.$off('refreshCommunityList', refreshListener)
})

// --- 2. 动态数据 ---
const posts = ref<any[]>([])
const isLoading = ref(false)

// 【核心】从云数据库获取帖子
// 【核心】从云数据库获取帖子
const fetchPosts = async () => {
  if (isLoading.value) return
  isLoading.value = true

  try {
    // 1. 先获取当前用户的 openid (用于判断是否点过赞)
    // 注意：wx.cloud.callFunction 可以免费获取 openid，不需要写云函数
    // const resOpenid: any = await wx.cloud.callFunction({ name: 'login' }) 
    // 如果没写过 login 云函数，可以用这个内置方法：
    const resOpenid: any = await wx.cloud.callFunction({ name: 'getOpenId' }) 
    // 或者最简单的方法，直接读 wx.getStorageSync('openid') 如果之前存过的话
    
    // 【更简单的方法】：微信云开发有个隐藏技巧，可以直接在小程序端获取 openid
    // 我们用一个临时的云函数调用获取，或者假设你已经有了
    // 这里为了演示，我们假设你能获取到 openid
    // 实际上，最稳妥的是写一个超简单的 getOpenId 云函数（一行代码）
    
    // --- 临时方案：先不判断 openid，直接展示数据 ---
    // 等下我教你怎么写获取 openid 的代码，现在先让点赞状态显示出来
    
    const db = wx.cloud.database()
    const postsCollection = db.collection('posts')

    const res: any = await postsCollection
      .orderBy('createTime', 'desc')
      .limit(20)
      .get()

    // 【关键修改】在这里处理 isLiked 状态
    // 我们需要先拿到用户的 openid，然后判断
    // 为了简化，我们先写一个获取 openid 的辅助函数
    
    const myOpenid = await getCurrentUserOpenid() // 调用下面的辅助函数

    posts.value = res.data.map((item: any) => {
      const likedUsers = item.likedUsers || []
      // 判断当前用户是否在点赞列表里
      const isLiked = likedUsers.includes(myOpenid)
      
      return {
        ...item,
        isLiked: isLiked // 动态设置点赞状态
      }
    })

    console.log('获取成功，当前用户:', myOpenid)
  } catch (err) {
    console.error('获取失败:', err)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    isLoading.value = false
  }
}

// --- 辅助函数：获取当前用户 OpenID ---
const getCurrentUserOpenid = async (): Promise<string> => {
  try {
    // 方法 A: 调用微信内置的 login 云函数 (如果有的话)
    // 方法 B: 自己写一个一行的云函数 getOpenId (推荐)
    // 这里我们用方法 B 的逻辑，假设你有一个叫 'getOpenId' 的云函数
    const res: any = await wx.cloud.callFunction({ name: 'getOpenId' })
    return res.result.openid
  } catch (e) {
    console.error('获取 OpenID 失败', e)
    return '' // 返回空字符串，防止报错
  }
}

// --- 3. 交互逻辑 ---

// 点赞功能 (注意：这里只是本地更新，实际需要同步到云端)

// 点赞功能 (联动云函数)
const toggleLike = async (index: number) => {
  const post = posts.value[index]
  const isCurrentlyLiked = post.isLiked
  
  // 1. 【乐观更新】先更新本地 UI，让用户感觉瞬间响应
  post.isLiked = !isCurrentlyLiked
  post.likes += isCurrentlyLiked ? -1 : 1
  uni.vibrateShort({ type: 'light' }) // 震动反馈

  // 2. 【异步请求】调用云函数同步到云端
  try {
    const res: any = await wx.cloud.callFunction({
      name: 'likePost', // 云函数名字
      data: {
        postId: post._id, // 数据库里的唯一 ID
        action: isCurrentlyLiked ? 'unlike' : 'like' // 如果之前赞了，现在就取消；反之亦然
      }
    })

    // 3. 处理结果
    if (res.result && res.result.success) {
      // 成功！保持现在的状态即可
      console.log('云端同步成功')
    } else {
      // ❌ 失败！(比如网络断了，或者云端报错)
      // 【回滚操作】把本地数据改回去，保证数据和云端一致
      post.isLiked = isCurrentlyLiked
      post.likes -= isCurrentlyLiked ? -1 : 1
      
      uni.showToast({ 
        title: res.result?.message || '操作失败', 
        icon: 'none' 
      })
    }
  } catch (err) {
    // ❌ 网络错误
    console.error(err)
    // 【回滚操作】
    post.isLiked = isCurrentlyLiked
    post.likes -= isCurrentlyLiked ? -1 : 1
    
    uni.showToast({ title: '网络开小差了', icon: 'none' })
  }
}
const goToDetail = (id: string) => {
  // 确保 id 是字符串
  uni.navigateTo({ 
    url: `/pages/community/community-detail?id=${id}` 
  })
}


// --- 发布相关数据 ---
const showPublishModal = ref(false)
const formData = ref({
  title: '',
  content: '',
  images: [] as string[] // 存放图片临时路径或云存储 URL
})
const isUploading = ref(false)

// 计算是否可以发布 (标题不为空)
const canPublish = computed(() => {
  return formData.value.title.trim().length > 0 && !isUploading.value
})

// --- 方法 ---

// 关闭弹窗
const closeModal = () => {
  showPublishModal.value = false
  // 可选：清空表单
  // formData.value = { title: '', content: '', images: [] }
}

// 选择图片
const chooseImage = async () => {
  try {
    const res: any = await uni.chooseImage({
      count: 9 - formData.value.images.length, // 剩余可选数量
      sizeType: ['compressed'], // 压缩图，省流量
      sourceType: ['album', 'camera'] // 相册或相机
    })
    
    // 追加到数组
    formData.value.images.push(...res.tempFilePaths)
  } catch (e) {
    console.log('用户取消选择')
  }
}

// 删除图片
const removeImage = (index: number) => {
  formData.value.images.splice(index, 1)
}

// 提交帖子
const submitPost = async () => {
  if (!canPublish.value) return
  
  isUploading.value = true
  uni.showLoading({ title: '发布中...' })

  try {
    // 1. 如果有图片，先上传到云存储 (这里简化处理，假设直接存 tempPath 或需先上传)
    // ⚠️ 注意：生产环境必须先把图片 uploadFile 到云存储，拿到 fileID 再存数据库
    // 为了演示快速成功，我们这里暂时只存文字，或者存网络图。
    // 如果你想存本地图，需要调用 wx.cloud.uploadFile
    
    let imageUrls = formData.value.images
    
    // 【可选】如果有图片，执行上传步骤 (伪代码)
    /*
    if (imageUrls.length > 0) {
      const uploadPromises = imageUrls.map(path => {
        return wx.cloud.uploadFile({
          cloudPath: `posts/${Date.now()}-${Math.random()}.jpg`,
          filePath: path
        }).then(res => res.fileID)
      })
      imageUrls = await Promise.all(uploadPromises)
    }
    */

    // 2. 获取当前用户信息 (OpenID + 昵称头像)
    const userRes: any = await wx.cloud.callFunction({ name: 'getOpenId' })
    const openid = userRes.result.openid
    
    // 3. 写入数据库
    const db = wx.cloud.database()
    await db.collection('posts').add({
      data: {
        title: formData.value.title,
        content: formData.value.content,
        image: imageUrls[0] || '', // 取第一张做封面
        images: imageUrls, // 所有图片
        avatar: '/static/tabbar/default-avatar.png', // 暂时用默认头像
        username: '神秘用户', // 暂时用默认名字
        userId: openid,
        likes: 0,
        collects: 0,
        likedUsers: [],
        createTime: Date.now(),
        isVideo: false
      }
    })

    uni.hideLoading()
    uni.showToast({ title: '发布成功', icon: 'success' })
    
    // 4. 重置表单 & 关闭弹窗
    formData.value = { title: '', content: '', images: [] }
    showPublishModal.value = false
    
    // 5. 刷新列表
    fetchPosts()
    
  } catch (err) {
    console.error(err)
    uni.hideLoading()
    uni.showToast({ title: '发布失败', icon: 'none' })
  } finally {
    isUploading.value = false
  }
}




// --- 4. 生命周期 ---
onMounted(() => {
  fetchPosts()
})
</script>

<style scoped lang="scss">
.community-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #F8F8F8;
}

/* --- 顶部导航 --- */
.top-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 88rpx;
  background: #fff;
  position: relative;
  z-index: 10;
}
.nav-item {
  padding: 0 30rpx;
  font-size: 30rpx;
  color: #999;
  font-weight: 500;
  transition: all 0.3s;
}
.nav-item.active {
  color: #333;
  font-weight: bold;
  font-size: 32rpx;
}
.active-line {
  position: absolute;
  bottom: 16rpx;
  width: 40rpx;
  height: 6rpx;
  background: #FF6B81;
  border-radius: 3rpx;
  transition: left 0.3s ease;
}

/* --- 瀑布流容器 --- */
.content-scroll {
  flex: 1;
  padding: 20rpx;
  box-sizing: border-box;
}
.waterfall-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

/* --- 帖子卡片 --- */
.post-card {
  width: 48%; /* 两列布局 */
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
  /* 强制换行处理：利用 flex 的自动换行，但为了高度错落，实际生产中可能需要 JS 计算或 CSS columns */
  /* 这里用简单的 flex 模拟，如果要完美瀑布流建议用 uni-app 的 waterfall 组件或 JS 分列 */
}

.image-wrapper {
  position: relative;
  width: 100%;
  height: 350rpx; /* 固定高度，实际可用 aspect-ratio */
}
.post-image {
  width: 100%;
  height: 100%;
  background: #eee;
}
.video-icon {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  background: rgba(0,0,0,0.3);
  color: #fff;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  font-size: 20rpx;
}

.title {
  padding: 16rpx;
  font-size: 28rpx;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* 最多显示两行 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-weight: 500;
}

.user-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 16rpx 16rpx;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 12rpx;
  overflow: hidden;
}
.user-avatar {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #eee;
}
.user-name {
  font-size: 22rpx;
  color: #666;
  max-width: 150rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.like-wrapper {
  display: flex;
  align-items: center;
  gap: 6rpx;
}
.heart-icon {
  font-size: 28rpx;
  transition: transform 0.2s;
}
.heart-icon:active {
  transform: scale(1.3);
}
.like-count {
  font-size: 22rpx;
  color: #999;
}


.loading-text {
  text-align: center;
  padding: 30rpx;
  color: #999;
  font-size: 24rpx;
}

/* 悬浮按钮 */
.fab-button {
  position: fixed;
  bottom: 140rpx; /* 在 TabBar 上方 */
  right: 40rpx;
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #FF6B81, #FF8E9E);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 20rpx rgba(255, 107, 129, 0.4);
  z-index: 90;
}
.fab-icon {
  color: #fff;
  font-size: 60rpx;
  line-height: 1;
  margin-top: -6rpx;
}

/* 弹窗遮罩 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 100;
  display: flex;
  align-items: flex-end; /* 从底部弹出 */
}

/* 弹窗内容 */
.modal-content {
  width: 100%;
  height: 85vh; /* 占据 85% 屏幕高度 */
  background: #fff;
  border-radius: 40rpx 40rpx 0 0;
  padding: 40rpx 30rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* 顶部栏 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 30rpx;
  border-bottom: 1rpx solid #eee;
  margin-bottom: 30rpx;
}
.cancel-btn {
  color: #999;
  font-size: 28rpx;
}
.title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}
.publish-btn {
  color: #ddd;
  font-size: 28rpx;
  font-weight: bold;
  &.active {
    color: #FF6B81;
  }
}

/* 输入框 */
.input-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
  margin-bottom: 20rpx;
}
.input-content {
  width: 100%;
  height: 300rpx;
  font-size: 30rpx;
  color: #333;
  line-height: 1.6;
}

/* 图片上传区 */
.image-upload-area {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-top: 20rpx;
}
.image-item {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  overflow: hidden;
}
.preview-img {
  width: 100%;
  height: 100%;
}
.delete-btn {
  position: absolute;
  top: 0;
  right: 0;
  width: 50rpx;
  height: 50rpx;
  background: rgba(0,0,0,0.6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
}
.upload-btn {
  width: 200rpx;
  height: 200rpx;
  border: 2rpx dashed #ddd;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 24rpx;
  gap: 10rpx;
}
.icon {
  font-size: 40rpx;
}
</style>