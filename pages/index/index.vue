<template>
	<view class="index">
		<view class="container">
			<!-- 顶部轮播图 -->
			<view class="banner-section">
				<swiper class="swiper" :indicator-dots="true" :autoplay="true" :interval="3000" :duration="500"
					indicator-color="rgba(255,255,255,0.5)" indicator-active-color="#fff">
					<swiper-item v-for="(item, index) in bannerList" :key="index">
						<image :src="item.image" class="banner-image" mode="aspectFill"></image>
					</swiper-item>
				</swiper>
			</view>

			<!-- 立即预约入口 -->
			<view class="booking-entry">
				<view class="booking-card" @click="goToBooking">
					<view class="booking-left">
						<view class="booking-icon">
							<text class="icon-windmill">
								<text class="iconfont icon-Energy-"></text>
							</text>
						</view>
						<view class="booking-info">
							<text class="booking-title">风车天路</text>
							<text class="booking-subtitle">体验浪漫风车之旅</text>
							<view class="booking-tags">
								<text class="tag">免费开放</text>
								<text class="tag">全天候</text>
							</view>
						</view>
					</view>
					<view class="booking-btn">
						<text class="btn-text">立即预约</text>
						<text class="btn-arrow">→</text>
					</view>
				</view>
			</view>

			<!-- 风车天路特色 -->
			<!-- <view class="section">
                <view class="section-header">
                    <text class="section-title">天路特色</text>
                </view>
                <view class="features-grid">
                    <view class="feature-item" v-for="(item, index) in featureList" :key="index">
                        <text class="feature-icon">{{ item.icon }}</text>
                        <text class="feature-name">{{ item.name }}</text>
                        <text class="feature-desc">{{ item.desc }}</text>
                    </view>
                </view>
            </view> -->

			<!-- 风车美景 -->
			<view class="section">
				<view class="section-header">
					<text class="section-title">风车美景</text>
					<text class="section-more" @click="goToGallery(null, 'all')">更多 ›</text>
				</view>
				<scroll-view scroll-x class="scenic-scroll">
					<view class="scenic-item" v-for="(item, index) in scenicList" :key="index"
						@click="goToGallery(item, index)">
						<image :src="item.image" class="scenic-image" mode="aspectFill"></image>
						<view class="scenic-info">
							<text class="scenic-name">{{ item.name }}</text>
							<text class="scenic-desc">{{ item.desc }}</text>
						</view>
					</view>
				</scroll-view>
			</view>

			<!-- 游玩须知 -->
			<view class="section">
				<view class="section-header">
					<text class="section-title">游玩须知</text>
				</view>
				<view class="notice-list">
					<view class="notice-item" v-for="(item, index) in noticeList" :key="index">
						<view class="notice-dot"></view>
						<text class="notice-text">{{ item.content }}</text>
						<text class="notice-time">{{ item.time }}</text>
					</view>
				</view>
			</view>
		</view>
		<my-tab-bar :current="0"></my-tab-bar>
	</view>
</template>

<script>
	import myTabBar from '../../components/my-tab-bar.vue';
	import {
		request
	} from '../../utils/request.js';
	export default {
		components: {
			myTabBar
		},
		data() {
			return {
				bannerList: [{
						image: "https://s41.ax1x.com/2026/03/12/peAEQER.jpg"
					},
					{
						image: "https://s41.ax1x.com/2026/03/12/peAE14x.jpg"
					},
					{
						image: "https://s41.ax1x.com/2026/03/12/peAEG8K.jpg"
					},
					{
						image: "https://s41.ax1x.com/2026/03/12/peAEJgO.jpg"
					},
					{
						image: "https://s41.ax1x.com/2026/03/12/peAEYvD.jpg"
					},
					{
						image: "https://s41.ax1x.com/2026/03/12/peAEZgU.jpg"
					}
				],
				featureList: [{
						icon: 'icon-Energy-',
						name: '风车奇观',
						desc: '百余座风力发电机',
						image: 'https://picsum.photos/300/200?random=10'
					},
					{
						icon: '🏔️',
						name: '天路美景',
						desc: '蜿蜒曲折的山路风光',
						image: 'https://picsum.photos/300/200?random=11'
					},
					{
						icon: '📸',
						name: '打卡圣地',
						desc: '网红拍照取景地',
						image: 'https://picsum.photos/300/200?random=12'
					},
					{
						icon: '🌤️',
						name: '四季皆宜',
						desc: '一年四季风景各异',
						image: 'https://picsum.photos/300/200?random=13'
					}
				],
				scenicList: [{
						id: 2,
						name: '天路盘山道',
						image: '/static/image10.jpg',
						desc: '自驾天堂'
					},
					{
						id: 3,
						name: '日落观景点',
						image: 'https://s41.ax1x.com/2026/03/12/peAEG8K.jpg',
						desc: '观日出最佳位置'
					},
					{
						id: 4,
						name: '云海平台',
						image: 'https://s41.ax1x.com/2026/03/12/peAENKe.jpg',
						desc: '云雾缭绕仙境'
					},
					{
						id: 1,
						name: '风车观景台',
						image: 'https://s41.ax1x.com/2026/03/12/peAE14x.jpg',
						desc: '最佳观赏点'
					},
				],
				noticeList: [{
						content: '风车天路实行实名制预约，请提前预约',
						time: '02-20'
					},
					{
						content: '山路弯道较多，自驾游客请注意安全',
						time: '02-15'
					},
					{
						content: '天气变化较快，请携带保暖衣物',
						time: '02-10'
					}
				]
			}
		},
		async onLoad() {
			uni.login({
				provider: 'weixin',
				success: async (loginRes) => {
					try {
						console.log('微信登录成功，code:', loginRes.code);
						const res = await request({
							url: '/users/wx-login', // 后端登录接口
							method: 'POST',
							data: {
								code: loginRes.code
							}
						});
						// 适配后端返回格式
						if (res.success && res.data) {
							uni.setStorageSync('token', res.data.token);
							uni.setStorageSync('isAdmin', res.data.admin === true);
						} else {
							uni.showToast({
								title: '微信登录失败',
								icon: 'none'
							});
						}
					} catch (err) {
						uni.showToast({
							title: '微信登录异常',
							icon: 'none'
						});
					}
				},
				fail: (err) => {
					uni.showToast({
						title: '微信授权失败',
						icon: 'none'
					});
					console.log('微信登录失败:', err);
				}
			});
		},
		// 分享给好友
		onShareAppMessage() {
			return {
				title: '风车天路 - 浪漫风车之旅等你来',
				path: '/pages/index/index',
				imageUrl: '' // 可以设置分享图片
			}
		},
		// 分享到朋友圈（需要在 app.json 中配置）
		onShareTimeline() {
			return {
				title: '风车天路 - 浪漫风车之旅等你来',
				query: '',
				imageUrl: ''
			}
		},
		methods: {
			// 跳转到预约页面
			goToBooking() {
				uni.navigateTo({
					url: '/pages/booking-form/booking-form'
				});
			},
			// 跳转到美景画廊
			goToGallery(item, mode) {
				// let path = encodeURIComponent(item.url);
				let url = '/pages/gallery/gallery?mode=' + mode + (item ? '&image=' + encodeURIComponent(item.image) : '');
				uni.navigateTo({
					url: url
				});
			}
		}
	}
</script>

<style scoped>
	.index {
		height: 100vh;
		overflow: hidden;
	}

	.container {
		height: calc(100vh - 100rpx - env(safe-area-inset-bottom));
		background-color: #f5f5f5;
		padding-bottom: 0px;
		overflow: hidden;
		overflow-y: auto;
	}

	/* 轮播图 */
	.banner-section {
		width: 100%;
		height: 400rpx;
	}

	.swiper {
		width: 100%;
		height: 100%;
	}

	.banner-image {
		width: 100%;
		height: 100%;
	}

	/* 立即预约入口 */
	.booking-entry {
		padding: 30rpx;
	}

	.booking-card {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 24rpx;
		padding: 40rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		box-shadow: 0 8rpx 30rpx rgba(102, 126, 234, 0.3);
		position: relative;
		overflow: hidden;
	}

	.booking-card::before {
		content: '🌬️';
		position: absolute;
		right: -20rpx;
		top: -20rpx;
		font-size: 200rpx;
		opacity: 0.1;
		transform: rotate(15deg);
	}

	.booking-left {
		display: flex;
		align-items: center;
		flex: 1;
		z-index: 1;
	}

	.booking-icon {
		width: 100rpx;
		height: 100rpx;
		/* background: rgba(255, 255, 255, 0.2); */
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 25rpx;
		backdrop-filter: blur(10rpx);
	}

	.icon-windmill {
		font-size: 60rpx;
	}

	.iconfont {
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
		width: 100%;
		height: 100%;
		font-size: 80rpx;
	}

	.booking-info {
		display: flex;
		flex-direction: column;
	}

	.booking-title {
		font-size: 40rpx;
		font-weight: bold;
		color: #fff;
		margin-bottom: 8rpx;
	}

	.booking-subtitle {
		font-size: 26rpx;
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: 15rpx;
	}

	.booking-tags {
		display: flex;
		gap: 10rpx;
	}

	.tag {
		padding: 5rpx 15rpx;
		background: rgba(255, 255, 255, 0.25);
		border-radius: 20rpx;
		font-size: 22rpx;
		color: #fff;
		backdrop-filter: blur(5rpx);
	}

	.booking-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		background: #fff;
		padding: 20rpx 30rpx;
		border-radius: 50rpx;
		box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.1);
		z-index: 1;
	}

	.btn-text {
		font-size: 28rpx;
		font-weight: bold;
		color: #667eea;
		margin-bottom: 5rpx;
	}

	.btn-arrow {
		font-size: 32rpx;
		color: #667eea;
	}

	/* 通用section */
	.section {
		margin: 20rpx 30rpx;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.section-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
	}

	.section-more {
		font-size: 28rpx;
		color: #999;
	}

	/* 特色网格 */
	.features-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 20rpx;
	}

	.feature-item {
		background: #fff;
		border-radius: 16rpx;
		padding: 30rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
	}

	.feature-icon {
		font-size: 60rpx;
		margin-bottom: 15rpx;
	}

	.feature-name {
		font-size: 30rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 8rpx;
	}

	.feature-desc {
		font-size: 24rpx;
		color: #999;
	}

	/* 美景列表 */
	.scenic-scroll {
		white-space: nowrap;
	}

	.scenic-item {
		display: inline-block;
		width: 280rpx;
		background: #fff;
		border-radius: 16rpx;
		overflow: hidden;
		margin-right: 20rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
	}

	.scenic-image {
		width: 100%;
		height: 180rpx;
	}

	.scenic-info {
		padding: 20rpx;
	}

	.scenic-name {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 8rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.scenic-desc {
		font-size: 24rpx;
		color: #999;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* 公告列表 */
	.notice-list {
		background: #fff;
		border-radius: 16rpx;
		padding: 20rpx 30rpx;
	}

	.notice-item {
		display: flex;
		align-items: center;
		padding: 20rpx 0;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.notice-item:last-child {
		border-bottom: none;
	}

	.notice-dot {
		width: 12rpx;
		height: 12rpx;
		background: #4A90E2;
		border-radius: 50%;
		margin-right: 20rpx;
		flex-shrink: 0;
	}

	.notice-text {
		flex: 1;
		font-size: 28rpx;
		color: #666;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.notice-time {
		font-size: 24rpx;
		color: #999;
		margin-left: 20rpx;
		flex-shrink: 0;
	}
</style>