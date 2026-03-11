<template>
	<view class="container">
		<!-- Tab切换 -->
		<view class="tabs">
			<view class="tab-item" :class="{ active: currentTab === 0 }" @click="switchTab(0)">
				<text class="tab-text">全部</text>
				<view class="tab-line" v-if="currentTab === 0"></view>
			</view>
			<view class="tab-item" :class="{ active: currentTab === 1 }" @click="switchTab(1)">
				<text class="tab-text">已完成</text>
				<view class="tab-line" v-if="currentTab === 1"></view>
			</view>
			<view class="tab-item" :class="{ active: currentTab === 2 }" @click="switchTab(2)">
				<text class="tab-text">已取消</text>
				<view class="tab-line" v-if="currentTab === 2"></view>
			</view>
		</view>

		<!-- 预约列表 -->
		<scroll-view scroll-y class="booking-list" v-if="bookingList.length > 0">
			<view class="booking-item" v-for="(item, index) in bookingList" :key="item.id">
				<view class="booking-header">
					<view class="booking-type">
						<text class="type-icon">🌬️</text>
						<text class="type-text">风车天路预约</text>
					</view>
					<view class="booking-status" :class="'status-' + item.status">
						{{ getStatusText(item.status) }}
					</view>
				</view>

				<view class="booking-content">
					<view class="content-row">
						<text class="label">预约时间:</text>
						<text class="value">{{ formatDate(item.bookingDate, 'YYYY年MM月DD日') }} {{ item.timeSlot === "morning" ? '上午' : '下午' }}</text>
					</view>
					<view class="content-row">
						<text class="label">预约人数:</text>
						<text class="value">{{ item.personCount }}人</text>
					</view>
					<view class="content-row" v-if="item.plateNumber">
						<text class="label">车牌号:</text>
						<text class="value">{{ item.plateNumber }}</text>
					</view>
					<view class="content-row">
						<text class="label">订单号:</text>
						<text class="value order-no">{{ item.bookingId }}</text>
					</view>
				</view>

				<view class="booking-footer" v-if="item.status === 'none'">
					<button class="btn btn-cancel" @click="showCancelDialog(item)">取消预约</button>
					<button class="btn btn-primary" @click="viewDetail(item)">查看详情</button>
				</view>
				<view class="booking-footer" v-else-if="item.status === 'completed'">
					<button class="btn btn-default" @click="viewDetail(item)">查看详情</button>
					<button class="btn btn-primary" @click="bookAgain(item)">再次预约</button>
				</view>
				<view class="booking-footer" v-else>
					<button class="btn btn-default" @click="viewDetail(item)">查看详情</button>
				</view>
			</view>
		</scroll-view>

		<!-- 空状态 -->
		<view class="empty-state" v-else>
			<text class="empty-icon">📋</text>
			<text class="empty-text">暂无预约记录</text>
			<button class="btn btn-to-home" @click="goToHome">去预约</button>
		</view>

		<!-- 取消预约对话框 -->
		<view class="modal" v-if="showCancel" @click="showCancel = false">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">取消预约</text>
				</view>
				<view class="modal-body">
					<text class="modal-text">确定要取消该预约吗?</text>
					<text class="modal-desc">取消后可能需要重新预约</text>
				</view>
				<view class="modal-footer">
					<view class="modal-btn" @click="showCancel = false">再想想</view>
					<view class="modal-btn modal-btn-primary" @click="confirmCancel">确认取消</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { request } from '../../utils/request.js';
	export default {
		data() {
			return {
				currentTab: 0,
				showCancel: false,
				currentCancelItem: null,
				bookingList: []
			}
		},
		computed: {
		},
		// // 分享给好友
		// onShareAppMessage() {
		// 	return {
		// 		title: '风车天路 - 浪漫风车之旅等你来',
		// 		path: '/pages/index/index',
		// 		imageUrl: ''
		// 	}
		// },
		// // 分享到朋友圈
		// onShareTimeline() {
		// 	return {
		// 		title: '风车天路 - 浪漫风车之旅等你来',
		// 		query: '',
		// 		imageUrl: ''
		// 	}
		// },
                onLoad() {
                    console.log('Booking page loaded');
                    this.getList();
                },
                onShow() {
                    console.log('Booking page shown');
                    this.getList();
                },
		methods: {
                        getList() {
                            const openid = uni.getStorageSync('openid');
                            request({
                                method: 'GET',
                                url: '/bookings',
                                data: {
                                    wechatOpenId: openid,
                                    page: 1,
                                    pageSize: 99,
                                    status: this.currentTab === 0 ? "none" : this.currentTab === 1 ? 'completed' : 'cancelled'
                                }
                            }).then(res => {
                                console.log("订单列表", res);
                                if (res.success && res.data) {
                                    this.bookingList = res.data;
                                } else {
                                    this.bookingList = [];
                                }
                            }).catch(err => {
                                uni.showToast({ title: '订单获取失败，请稍后再试', icon: 'none' });
                                this.bookingList = [];
                            });
                        },
			switchTab(index) {
			    this.currentTab = index;
                            this.getList();
			},
			getStatusText(status) {
				const statusMap = {
					completed: '已完成',
					cancelled: '已取消'
				};
				return statusMap[status] || '';
			},
			showCancelDialog(item) {
				this.currentCancelItem = item;
				this.showCancel = true;
			},
			confirmCancel() {
				if (this.currentCancelItem) {
				    this.currentCancelItem.status = 'cancelled';
                                    request({
                                        url: "/bookings/" + this.currentCancelItem.bookingId,
                                        method: "PUT",
                                        data: {
                                            status: 'cancelled'
                                        }
                                    }).then(res => {
                                        if (res.success) {
                                            uni.showToast({ title: '预约已取消', icon: 'success' });
                                            this.getList();
                                        } else {
                                            uni.showToast({ title: '取消预约失败，请稍后再试', icon: 'none' });
                                        }
                                        this.currentCancelItem = null;
                                    }).catch(err => {
                                        uni.showToast({ title: '取消预约失败，请稍后再试', icon: 'none' });
                                        this.currentCancelItem = null;
                                    });
				}
				this.showCancel = false;
				
			},
			viewDetail(item) {
				uni.navigateTo({
					url: `/pages/booking-form/booking-form?bookingId=${item.bookingId}`
				});
			},
			bookAgain(item) {
				uni.showToast({
					title: '再次预约',
					icon: 'none'
				});
			},
			goToHome() {
				uni.switchTab({
					url: '/pages/index/index'
				});
			},
			formatDate(dateString, format = 'YYYY/MM/DD') {
				const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
				const date = new Date(dateString);
				if (format === 'YYYY年MM月DD日') {
					return `${date.getFullYear()}年${(date.getMonth() + 1).toString().padStart(2, '0')}月${date.getDate().toString().padStart(2, '0')}日`;
				}
				return date.toLocaleDateString('zh-CN', options);
			}
		}
	}
</script>

<style scoped>
	.container {
		min-height: 100vh;
		background-color: #f5f5f5;
	}

	/* Tab切换 */
	.tabs {
		display: flex;
		background: #fff;
		padding: 0 30rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
	}

	.tab-item {
		flex: 1;
		padding: 30rpx 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative;
	}

	.tab-text {
		font-size: 30rpx;
		color: #666;
	}

	.tab-item.active .tab-text {
		color: #667eea;
		font-weight: bold;
	}

	.tab-line {
		position: absolute;
		bottom: 0;
		width: 60rpx;
		height: 6rpx;
		background: #667eea;
		border-radius: 3rpx;
	}

	/* 预约列表 */
	.booking-list {
		height: calc(100vh - 120rpx);
		padding: 20rpx 30rpx;
		box-sizing: border-box;
	}

	.booking-item {
		background: #fff;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
	}

	.booking-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
		padding-bottom: 20rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.booking-type {
		display: flex;
		align-items: center;
	}

	.type-icon {
		font-size: 40rpx;
		margin-right: 10rpx;
	}

	.type-text {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.booking-status {
		padding: 8rpx 20rpx;
		border-radius: 30rpx;
		font-size: 24rpx;
	}

	.status-pending {
		background: #fff3e0;
		color: #ff9800;
	}

	.status-completed {
		background: #e8f5e9;
		color: #4caf50;
	}

	.status-cancelled {
		background: #fce4ec;
		color: #e91e63;
	}

	.booking-content {
		margin-bottom: 20rpx;
	}

	.content-row {
		display: flex;
		padding: 15rpx 0;
	}

	.label {
		font-size: 28rpx;
		color: #999;
		width: 180rpx;
		flex-shrink: 0;
	}

	.value {
		font-size: 28rpx;
		color: #333;
		flex: 1;
	}

	.order-no {
		color: #667eea;
	}

	.booking-footer {
		display: flex;
		gap: 20rpx;
		padding-top: 20rpx;
		border-top: 1rpx solid #f0f0f0;
	}

	.btn {
		flex: 1;
		height: 70rpx;
		line-height: 70rpx;
		text-align: center;
		border-radius: 35rpx;
		font-size: 28rpx;
		border: none;
	}

	.btn-default {
		background: #f5f5f5;
		color: #666;
	}

	.btn-cancel {
		background: #fff;
		color: #ff6b6b;
		border: 2rpx solid #ff6b6b;
	}

	.btn-primary {
	    background: #667eea;
	    color: #fff;
	}
        .btn-to-home {
            flex: none;
            width: 300rpx;
            background: #667eea;
	    color: #fff;
        }

	/* 空状态 */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: calc(100vh - 200rpx);
	}

	.empty-icon {
		font-size: 120rpx;
		margin-bottom: 30rpx;
	}

	.empty-text {
		font-size: 32rpx;
		color: #999;
		margin-bottom: 50rpx;
	}

	.empty-state .btn-primary {
		width: 300rpx;
	}

	/* 模态框 */
	.modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 999;
	}

	.modal-content {
		width: 600rpx;
		background: #fff;
		border-radius: 20rpx;
		overflow: hidden;
	}

	.modal-header {
		padding: 40rpx 30rpx 20rpx;
		text-align: center;
	}

	.modal-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
	}

	.modal-body {
		padding: 20rpx 30rpx 40rpx;
		text-align: center;
	}

	.modal-text {
		font-size: 32rpx;
		color: #333;
		display: block;
		margin-bottom: 15rpx;
	}

	.modal-desc {
		font-size: 26rpx;
		color: #999;
		display: block;
	}

	.modal-footer {
		display: flex;
                border-top: solid 1rpx #f0f0f0;
	}

	.modal-btn {
		flex: 1;
		height: 100rpx;
		line-height: 100rpx;
		text-align: center;
		font-size: 32rpx;
		background: #fff;
		color: #666;
		border: none;
		border-radius: 0;
	}

	.modal-btn-primary {
		color: #667eea;
		font-weight: bold;
		border-left: 1rpx solid #f0f0f0;
	}
</style>
