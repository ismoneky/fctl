<template>
    <view class="profile">

        <view class="container">
            <!-- 用户信息卡片 -->
            <view class="user-card">
                <view class="user-header">
                    <image class="avatar" :src="userInfo.avatar" mode="aspectFill"></image>
                    <view class="user-info">
                        <text class="username">{{ userInfo.name }}</text>
                        <text class="user-phone">{{ userInfo.phone }}</text>
                    </view>
                </view>

                <view class="user-stats">
                    <view class="stat-item" @click="goToBooking(1)">
                        <text class="stat-number">{{ userStats.pending }}</text>
                        <text class="stat-label">已完成</text>
                    </view>
                    <view class="stat-divider"></view>
                    <view class="stat-item" @click="goToBooking(2)">
                        <text class="stat-number">{{ userStats.completed }}</text>
                        <text class="stat-label">已取消</text>
                    </view>

                </view>
            </view>


            <!-- 功能菜单 -->
            <view class="menu-section">
                <view class="menu-group">
                    <view class="menu-item" @click="handleMenuClick('orders')">
                        <view class="menu-left">
                            <text class="menu-icon">📋</text>
                            <text class="menu-text">我的订单</text>
                        </view>
                        <text class="menu-arrow">›</text>
                    </view>
                    <view class="menu-item" @click="handleMenuClick('help')">
                        <view class="menu-left">
                            <text class="menu-icon">❓</text>
                            <text class="menu-text">帮助中心</text>
                        </view>
                        <text class="menu-arrow">›</text>
                    </view>
                    <view class="menu-item" @click="handleMenuClick('feedback')">
                        <view class="menu-left">
                            <text class="menu-icon">💬</text>
                            <text class="menu-text">意见反馈</text>
                        </view>
                        <text class="menu-arrow">›</text>
                    </view>
                </view>

                <!-- <view class="menu-group">
				<view class="menu-item" @click="handleMenuClick('settings')">
					<view class="menu-left">
						<text class="menu-icon">⚙️</text>
						<text class="menu-text">设置</text>
					</view>
					<text class="menu-arrow">›</text>
				</view>
			</view> -->
            </view>
        </view>
        <my-tab-bar :current="2"></my-tab-bar>
    </view>

</template>

<script>
import myTabBar from '@/components/my-tab-bar.vue';
export default {
    components: {
        myTabBar
    },
    data() {
        return {
            userInfo: {
                avatar: 'https://picsum.photos/200/200?random=10',
                name: '张三',
                phone: '138****8888',
                vipLevel: '黄金会员',
                points: 1580
            },
            userStats: {
                pending: 2,
                completed: 15,
                collection: 8
            },
            couponCount: 3
        }
    },
    onShow() {
        // 每次显示页面时刷新数据
        this.refreshData();
    },
    // 分享给好友
    onShareAppMessage() {
        return {
            title: '风车天路 - 浪漫风车之旅等你来',
            path: '/pages/index/index',
            imageUrl: ''
        }
    },
    // 分享到朋友圈
    onShareTimeline() {
        return {
            title: '风车天路 - 浪漫风车之旅等你来',
            query: '',
            imageUrl: ''
        }
    },
    methods: {
        refreshData() {
            // 这里可以调用API获取最新数据
            // 模拟数据刷新
        },
        editProfile() {
            uni.showToast({
                title: '编辑个人资料',
                icon: 'none'
            });
            // uni.navigateTo({
            //     url: '/pages/edit-profile/edit-profile'
            // });
        },
        goToBooking(tabIndex) {
            uni.reLaunch({
                url: '/pages/booking/booking'
            });
            // 可以通过事件总线传递tab索引
            uni.$emit('switchBookingTab', tabIndex);
        },
        goToCollection() {
            uni.showToast({
                title: '我的收藏',
                icon: 'none'
            });
        },
        goToVip() {
            uni.showToast({
                title: '会员中心',
                icon: 'none'
            });
        },
        handleMenuClick(type) {
            const menuMap = {
                'orders': '我的订单',
                'collection': '我的收藏',
                'coupon': '优惠券',
                'id-card': '常用证件',
                'address': '地址管理',
                'help': '帮助中心',
                'feedback': '意见反馈',
                'about': '关于我们',
                'settings': '设置'
            };

            uni.showToast({
                title: menuMap[type] || '功能开发中',
                icon: 'none'
            });

            // 实际项目中根据type跳转到对应页面
            // uni.navigateTo({
            //     url: `/pages/${type}/${type}`
            // });
        },
        handleLogout() {
            uni.showModal({
                title: '提示',
                content: '确定要退出登录吗?',
                success: (res) => {
                    if (res.confirm) {
                        // 清除登录信息
                        uni.showToast({
                            title: '已退出登录',
                            icon: 'success'
                        });
                        // 实际项目中跳转到登录页
                        // uni.reLaunch({
                        //     url: '/pages/login/login'
                        // });
                    }
                }
            });
        }
    }
}
</script>

<style scoped>
.profile {
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

/* 用户信息卡片 */
.user-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 40rpx 30rpx;
    margin-bottom: 20rpx;
}

.user-header {
    display: flex;
    align-items: center;
    margin-bottom: 40rpx;
}

.avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 60rpx;
    border: 4rpx solid rgba(255, 255, 255, 0.3);
    margin-right: 20rpx;
}

.user-info {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.username {
    font-size: 36rpx;
    font-weight: bold;
    color: #fff;
    margin-bottom: 10rpx;
}

.user-phone {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.8);
}

.edit-btn {
    padding: 10rpx 30rpx;
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
    border-radius: 30rpx;
    font-size: 26rpx;
    border: 1rpx solid rgba(255, 255, 255, 0.3);
}

.user-stats {
    display: flex;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 20rpx;
    padding: 30rpx 0;
    backdrop-filter: blur(10rpx);
}

.stat-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.stat-number {
    font-size: 40rpx;
    font-weight: bold;
    color: #fff;
    margin-bottom: 10rpx;
}

.stat-label {
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.8);
}

.stat-divider {
    width: 1rpx;
    height: 60rpx;
    background: rgba(255, 255, 255, 0.2);
    align-self: center;
}

/* 会员卡片 */
.vip-card {
    margin: 0 30rpx 20rpx;
    background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%);
    border-radius: 20rpx;
    padding: 30rpx;
    box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.1);
}

.vip-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.vip-left {
    display: flex;
    flex-direction: column;
}

.vip-title {
    font-size: 36rpx;
    font-weight: bold;
    color: #fff;
    margin-bottom: 8rpx;
}

.vip-desc {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.9);
}

.vip-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.vip-points {
    font-size: 28rpx;
    color: #fff;
    margin-bottom: 10rpx;
}

.vip-btn {
    padding: 8rpx 25rpx;
    background: rgba(255, 255, 255, 0.3);
    color: #fff;
    border-radius: 30rpx;
    font-size: 24rpx;
    border: 1rpx solid rgba(255, 255, 255, 0.5);
}

/* 功能菜单 */
.menu-section {
    padding: 0 30rpx;
}

.menu-group {
    background: #fff;
    border-radius: 20rpx;
    margin-bottom: 20rpx;
    overflow: hidden;
}

.menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 30rpx;
    border-bottom: 1rpx solid #f0f0f0;
}

.menu-item:last-child {
    border-bottom: none;
}

.menu-left {
    display: flex;
    align-items: center;
    position: relative;
}

.menu-icon {
    font-size: 40rpx;
    margin-right: 20rpx;
}

.menu-text {
    font-size: 30rpx;
    color: #333;
}

.badge {
    position: absolute;
    top: -10rpx;
    left: 50rpx;
    min-width: 32rpx;
    height: 32rpx;
    line-height: 32rpx;
    background: #ff4757;
    color: #fff;
    font-size: 20rpx;
    text-align: center;
    border-radius: 16rpx;
    padding: 0 8rpx;
}

.menu-arrow {
    font-size: 40rpx;
    color: #ddd;
}

/* 退出登录 */
.logout-section {
    padding: 0 30rpx;
    margin-top: 20rpx;
}

.logout-btn {
    width: 100%;
    height: 90rpx;
    line-height: 90rpx;
    background: #fff;
    color: #ff6b6b;
    font-size: 32rpx;
    border-radius: 20rpx;
    border: none;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}
</style>
