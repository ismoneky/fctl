<template>
	<view class="container">
		<!-- Tab切换 -->
		<view class="tabs">
			<view class="tab-item" :class="{ active: currentTab === 0 }" @click="switchTab(0)">
				<text class="tab-text">全部</text>
				<view class="tab-line" v-if="currentTab === 0"></view>
			</view>
			<view class="tab-item" :class="{ active: currentTab === 1 }" @click="switchTab(1)">
				<text class="tab-text">待使用</text>
				<view class="tab-line" v-if="currentTab === 1"></view>
			</view>
			<view class="tab-item" :class="{ active: currentTab === 2 }" @click="switchTab(2)">
				<text class="tab-text">已完成</text>
				<view class="tab-line" v-if="currentTab === 2"></view>
			</view>
			<view class="tab-item" :class="{ active: currentTab === 3 }" @click="switchTab(3)">
				<text class="tab-text">已取消</text>
				<view class="tab-line" v-if="currentTab === 3"></view>
			</view>
		</view>

		<!-- 预约列表 -->
		<scroll-view scroll-y class="booking-list" v-if="filteredList.length > 0">
			<view class="booking-item" v-for="(item, index) in filteredList" :key="item.id">
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
						<text class="value">{{ item.bookingDate }} {{ item.bookingTime }}</text>
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
						<text class="value order-no">{{ item.orderNo }}</text>
					</view>
				</view>

				<view class="booking-footer" v-if="item.status === 'pending'">
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
			<button class="btn btn-primary" @click="goToHome">去预约</button>
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
					<button class="modal-btn" @click="showCancel = false">再想想</button>
					<button class="modal-btn modal-btn-primary" @click="confirmCancel">确认取消</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				currentTab: 0,
				showCancel: false,
				currentCancelItem: null,
				bookingList: [
					{
						id: 1,
						type: 'scenic',
						scenicName: '风车天路',
						bookingDate: '2026-03-15',
						bookingTime: '上午 (08:00-12:00)',
						personCount: 3,
						orderNo: 'BK202603150001',
						status: 'pending'
					},
					{
						id: 2,
						type: 'scenic',
						scenicName: '风车天路',
						bookingDate: '2026-03-20',
						bookingTime: '下午 (12:00-18:00)',
						personCount: 2,
						plateNumber: '京A12345',
						orderNo: 'BK202603200002',
						status: 'pending'
					},
					{
						id: 3,
						type: 'scenic',
						scenicName: '风车天路',
						bookingDate: '2026-02-10',
						bookingTime: '上午 (08:00-12:00)',
						personCount: 4,
						orderNo: 'BK202602100003',
						status: 'completed'
					},
					{
						id: 4,
						type: 'scenic',
						scenicName: '风车天路',
						bookingDate: '2026-02-05',
						bookingTime: '下午 (12:00-18:00)',
						personCount: 2,
						plateNumber: '浙B88888',
						orderNo: 'BK202602050004',
						status: 'cancelled'
					}
				]
			}
		},
		computed: {
			filteredList() {
				if (this.currentTab === 0) {
					return this.bookingList;
				} else if (this.currentTab === 1) {
					return this.bookingList.filter(item => item.status === 'pending');
				} else if (this.currentTab === 2) {
					return this.bookingList.filter(item => item.status === 'completed');
				} else {
					return this.bookingList.filter(item => item.status === 'cancelled');
				}
			}
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
			switchTab(index) {
				this.currentTab = index;
			},
			getStatusText(status) {
				const statusMap = {
					pending: '待使用',
					completed: '已完成',
					cancelled: '已取消'
				};
				return statusMap[status] || status;
			},
			showCancelDialog(item) {
				this.currentCancelItem = item;
				this.showCancel = true;
			},
			confirmCancel() {
				if (this.currentCancelItem) {
					this.currentCancelItem.status = 'cancelled';
					uni.showToast({
						title: '预约已取消',
						icon: 'success'
					});
				}
				this.showCancel = false;
				this.currentCancelItem = null;
			},
			viewDetail(item) {
				uni.showToast({
					title: '查看订单详情',
					icon: 'none'
				});
				// uni.navigateTo({
				//     url: `/pages/booking-detail/booking-detail?id=${item.id}`
				// });
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
		border-top: 1rpx solid #f0f0f0;
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
