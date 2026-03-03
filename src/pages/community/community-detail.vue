<template>
  <view class="detail-container" v-if="post">
    
    <!-- 上半部分：帖子内容 (可滚动) -->
    <scroll-view 
      scroll-y 
      class="content-scroll" 
      :style="{ height: scrollViewHeight }"
      @scrolltolower="loadMoreComments"
    >
      <!-- 1. 核心图片区 -->
      <view class="image-section">
        <image 
          v-if="post.image" 
          :src="post.image" 
          mode="widthFix" 
          class="main-image"
          @click="previewImage"
        ></image>
        <view v-else class="no-image">
          <text class="no-image-text">暂无图片</text>
        </view>
      </view>

      <!-- 2. 标题与正文 -->
      <view class="text-section">
        <text class="post-title">{{ post.title }}</text>
        
        <!-- 如果有 content 字段才显示 -->
        <text class="post-content" v-if="post.content">{{ post.content }}</text>
        
        <!-- 标签展示 (模拟) -->
        <view class="tags-row" v-if="post.content && post.content.includes('#')">
          <text class="tag">#萌宠</text>
          <text class="tag">#日常</text>
        </view>
      </view>

      <!-- 3. 作者信息栏 -->
      <!-- 3. 作者信息栏 (合并互动数据) -->
      <view class="author-bar">
        <!-- 左侧：作者信息 -->
        <view class="author-left">
          <image :src="post.avatar || '/static/tabbar/default-avatar.png'" class="author-avatar" mode="aspectFill"></image>
          <view class="author-info">
            <text class="author-name">{{ post.username || '未知用户' }}</text>
            <text class="post-time">{{ formatDate(post.createTime) }}</text>
          </view>
        </view>

        <!-- 右侧：互动数据 + 关注按钮 -->
        <view class="author-right">
          <!-- 点赞数 -->
          <view class="inter-item-small" @click="handleLike">
            <text class="icon-small">{{ post.isLiked ? '❤️' : '🤍' }}</text>
            <text class="num-small">{{ post.likes || 0 }}</text>
          </view>
          
          <!-- 收藏数 (暂时保留，如果你也想删掉，就把这块删除) -->
          <!-- <view class="inter-item-small">
            <text class="icon-small">⭐</text>
            <text class="num-small">{{ post.collects || 0 }}</text>
          </view> -->
          
          <!-- 关注按钮 -->
          <!-- <button class="follow-btn" size="mini">关注</button> -->
        </view>
      </view>

      <!-- 5. 评论区标题 -->
      <view class="comment-header">
        <text class="header-title">共 {{ comments.length }} 条评论</text>
        <!-- <text class="header-sort">按热度排序</text> -->
      </view>

      <!-- 6. 评论列表 -->
      <view class="comment-list">
        <view v-if="comments.length === 0" class="empty-comment">
          还没有评论，快来抢沙发吧～
        </view>

        <view v-for="item in comments" :key="item._id" class="comment-item">
          <image :src="item.avatar || '/static/tabbar/default-avatar.png'" class="c-avatar" mode="aspectFill"></image>
          <view class="c-body">
            <view class="c-top">
              <text class="c-name">{{ item.username || '神秘用户' }}</text>
              <text class="c-time">{{ formatDate(item.createTime) }}</text>
            </view>
            <text class="c-text">{{ item.content }}</text>
            
            <!-- 评论下的点赞 -->
            <view class="c-actions">
              <!-- <view class="c-like">
                <text class="icon-small">🤍</text>
                <text class="num-small">{{ item.likes || 0 }}</text>
              </view>
              <text class="c-reply">回复</text> -->
            </view>
          </view>
        </view>
        
        <view class="loading-more">{{ loadingMore ? '加载中...' : '' }}</view>
      </view>
    </scroll-view>

    <!-- 下半部分：固定底部输入框 -->
    <view class="fixed-bottom">
      <view class="input-wrapper">
        <input 
          v-model="commentText" 
          class="chat-input" 
          placeholder="说点什么..." 
          confirm-type="send"
          @confirm="submitComment"
        />
        <!-- <view class="action-icons">
          <text class="icon-btn">😊</text>
          <text class="icon-btn">📷</text>
        </view> -->
        <button 
          class="send-btn-small" 
          :class="{ active: commentText.trim() }"
          @click="submitComment"
          :disabled="!commentText.trim()"
        >
          发送
        </button>
      </view>
    </view>

  </view>
  
  <!-- 加载中提示 -->
  <view v-else class="loading-page">
    <text>加载中...</text>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

// --- 数据 ---
const postId = ref('')
const post = ref<any>(null)
const comments = ref<any[]>([])
const commentText = ref('')
const loadingMore = ref(false)
const myOpenid = ref('')
const myUserInfo = ref({ username: '神秘用户', avatar: '' })

// 计算滚动区域高度
const scrollViewHeight = computed(() => {
  return 'calc(100vh - 110rpx)' 
})

// --- 生命周期 ---
onLoad((options) => {
  console.log('接收到的参数:', options) // 【调试】看看传进来的 ID 对不对
  if (options.id) {
    postId.value = options.id
    initPage()
  } else {
    uni.showToast({ title: '帖子 ID 缺失', icon: 'none' })
  }
})

// --- 核心逻辑 ---

const initPage = async () => {
  await getCurrentUser()
  await fetchPostDetail()
  await fetchComments()
}

const getCurrentUser = async () => {
  try {
    const res: any = await wx.cloud.callFunction({ name: 'getOpenId' })
    myOpenid.value = res.result.openid
    console.log('当前用户 OpenID:', myOpenid.value)
  } catch (e) { console.error(e) }
}

const fetchPostDetail = async () => {
  const db = wx.cloud.database()
  try {
    const res: any = await db.collection('posts').doc(postId.value).get()
    const data = res.data
    
    console.log('获取到的帖子数据:', data) // 【调试】打印完整数据
    
    // 判断是否点赞
    data.isLiked = (data.likedUsers || []).includes(myOpenid.value)
    post.value = data
    
    // 设置标题
    uni.setNavigationBarTitle({ title: data.title.substring(0, 8) + '...' })
  } catch (err) {
    console.error('获取详情失败:', err)
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

const fetchComments = async () => {
  loadingMore.value = true
  const db = wx.cloud.database()
  const res: any = await db.collection('comments')
    .where({ postId: postId.value })
    .orderBy('createTime', 'asc')
    .limit(20)
    .get()
  comments.value = res.data
  loadingMore.value = false
}

const submitComment = async () => {
  if (!commentText.value.trim()) return
  if (!myOpenid.value) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  const newComment = {
    postId: postId.value,
    userId: myOpenid.value,
    username: myUserInfo.value.username,
    avatar: myUserInfo.value.avatar,
    content: commentText.value.trim(),
    createTime: Date.now(),
    likes: 0
  }

  try {
    const db = wx.cloud.database()
    await db.collection('comments').add({ data: newComment })
    
    comments.value.push(newComment)
    commentText.value = ''
    uni.vibrateShort({ type: 'light' })
  } catch (err) {
    uni.showToast({ title: '发送失败', icon: 'none' })
  }
}

const handleLike = async () => {
  if (!post.value) return
  const action = post.value.isLiked ? 'unlike' : 'like'
  
  // 1. 本地先变 (乐观更新)
  post.value.isLiked = !post.value.isLiked
  post.value.likes += action === 'like' ? 1 : -1
  
  try {
    await wx.cloud.callFunction({
      name: 'likePost',
      data: { postId: post.value._id, action }
    })
    
    // ✅【关键】点赞成功后，触发全局事件通知社区页刷新
    uni.$emit('refreshCommunityList') 
    
  } catch (e) {
    // 失败回滚
    post.value.isLiked = !post.value.isLiked
    post.value.likes -= action === 'like' ? 1 : -1
    uni.showToast({ title: '网络开小差', icon: 'none' })
  }
}

const previewImage = () => {
  if (post.value?.image) {
    uni.previewImage({
      urls: [post.value.image],
      current: post.value.image
    })
  }
}

const formatDate = (ts: number) => {
  if (!ts) return ''
  const date = new Date(ts)
  const diff = (Date.now() - date.getTime()) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return Math.floor(diff / 60) + '分钟前'
  if (diff < 86400) return Math.floor(diff / 3600) + '小时前'
  return `${date.getMonth()+1}-${date.getDate()}`
}

const loadMoreComments = () => {}
</script>

<style scoped lang="scss">
.detail-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #fff;
}
.loading-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  color: #999;
}

/* 滚动区域 */
.content-scroll {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 1. 图片区 */
.image-section {
  width: 100%;
  background: #f5f5f5;
  min-height: 400rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.main-image {
  width: 100%;
  display: block;
}
.no-image {
  height: 400rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 28rpx;
}

/* 2. 文字区 */
.text-section {
  padding: 30rpx;
}
.post-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
  line-height: 1.4;
}
.post-content {
  font-size: 30rpx;
  color: #333;
  line-height: 1.6;
  display: block;
  white-space: pre-wrap;
}
.tags-row {
  margin-top: 20rpx;
}
.tag {
  color: #1E80FF;
  font-size: 28rpx;
  margin-right: 15rpx;
}

/* 3. 作者栏 */
.author-bar {
  display: flex;
  justify-content: space-between; /* 左右分布 */
  align-items: center; /* 垂直居中 */
  padding: 20rpx 30rpx;
  border-top: 1rpx solid #f5f5f5;
  border-bottom: 1rpx solid #f5f5f5;
}

.author-left {
  display: flex;
  align-items: center;
  flex: 1; /* 让左侧占据剩余空间 */
}

.author-avatar {
  width: 70rpx;
  height: 70rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  background: #eee;
}

.author-info {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 6rpx;
}
.post-time {
  font-size: 22rpx;
  color: #999;
}
/* 新增：右侧互动区 */
.author-right {
  display: flex;
  align-items: center;
  gap: 20rpx; /* 元素之间的间距 */
}

/* 小型互动项 (点赞/收藏) */
.inter-item-small {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 8rpx 12rpx;
  background: #f5f5f5;
  border-radius: 30rpx;
}

.icon-small {
  font-size: 28rpx;
  line-height: 1;
}

.num-small {
  font-size: 24rpx;
  color: #666;
  font-weight: 500;
}

/* 关注按钮样式微调 */
.follow-btn {
  background: #FF6B81;
  color: #fff;
  border: none;
  padding: 10rpx 30rpx;
  border-radius: 30rpx;
  font-size: 24rpx;
  line-height: 1.5;
  margin: 0;
  white-space: nowrap; /* 防止换行 */
}

/* 4. 互动栏 */
.interaction-bar {
  display: flex;
  padding: 30rpx;
  gap: 50rpx;
  border-bottom: 1rpx solid #f5f5f5;
}
.inter-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
  color: #666;
}
.icon { font-size: 32rpx; }
.num { font-size: 26rpx; font-weight: 500; }

/* 5. 评论标题 */
.comment-header {
  display: flex;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background: #f9f9f9;
  font-size: 26rpx;
  color: #999;
  border-bottom: 1rpx solid #eee;
}
.header-title { color: #333; font-weight: bold; }

/* 6. 评论列表 */
.comment-list {
  padding: 0 30rpx 100rpx 30rpx;
}
.empty-comment {
  text-align: center;
  padding: 60rpx 0;
  color: #999;
  font-size: 28rpx;
}
.comment-item {
  display: flex;
  margin-bottom: 40rpx;
  padding-top: 20rpx;
}
.c-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  flex-shrink: 0;
  background: #eee;
}
.c-body {
  flex: 1;
}
.c-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10rpx;
}
.c-name {
  font-size: 26rpx;
  color: #666;
  font-weight: 500;
}
.c-time {
  font-size: 22rpx;
  color: #ccc;
}
.c-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.5;
  display: block;
  margin-bottom: 15rpx;
}
.c-actions {
  display: flex;
  gap: 30rpx;
  color: #999;
  font-size: 24rpx;
}
.c-like {
  display: flex;
  align-items: center;
  gap: 5rpx;
}
.icon-small { font-size: 24rpx; }
.num-small { font-size: 22rpx; }

.loading-more {
  text-align: center;
  color: #999;
  font-size: 24rpx;
  padding: 20rpx;
}

/* 底部固定输入框 */
.fixed-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 110rpx;
  background: #fff;
  border-top: 1rpx solid #eee;
  display: flex;
  align-items: center;
  padding: 0 20rpx;
  box-sizing: border-box;
  z-index: 100;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

.input-wrapper {
  display: flex;
  align-items: center;
  flex: 1;
  background: #f5f5f5;
  border-radius: 50rpx;
  padding: 15rpx 20rpx;
}

.chat-input {
  flex: 1;
  font-size: 28rpx;
  background: transparent;
  padding: 10rpx 0;
}

.action-icons {
  display: flex;
  gap: 20rpx;
  margin-right: 15rpx;
}
.icon-btn {
  font-size: 36rpx;
}

.send-btn-small {
  background: #ddd;
  color: #fff;
  border: none;
  padding: 10rpx 25rpx;
  border-radius: 30rpx;
  font-size: 26rpx;
  line-height: 1.5;
  margin: 0;
  transition: all 0.3s;
  &:disabled {
    opacity: 1;
    background: #ddd;
  }
  &.active {
    background: #FF6B81;
  }
}
</style>