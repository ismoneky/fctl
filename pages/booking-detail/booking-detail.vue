<template>
	<view class="container">
		<view class="form-container">

			<!-- 订单状态栏 -->
			<view class="status-bar" :class="'status-bar-' + formData.status" v-if="formData.status">
				<text class="status-bar-icon">{{ statusConfig[formData.status].icon }}</text>
				<view class="status-bar-info">
					<text class="status-bar-label">{{ statusConfig[formData.status].label }}</text>
					<text class="status-bar-desc">{{ statusConfig[formData.status].desc }}</text>
				</view>
			</view>

			<!-- 待支付倒计时 -->
			<view class="countdown-card" v-if="formData.status === 'pending' && countdown > 0">
				<text class="countdown-tip">请在以下时间内完成支付，超时订单将自动关闭</text>
				<view class="countdown-time">
					<view class="time-block">
						<text class="time-num">{{ countdownDisplay.mm }}</text>
						<text class="time-unit">分</text>
					</view>
					<text class="time-sep">:</text>
					<view class="time-block">
						<text class="time-num">{{ countdownDisplay.ss }}</text>
						<text class="time-unit">秒</text>
					</view>
				</view>
			</view>

			<!-- 基本信息 -->
			<view class="form-section">
				<view class="section-title">
					<text class="title-icon">👤</text>
					<text class="title-text">基本信息</text>
				</view>

				<!-- 人数 -->
				<view class="form-item">
					<text class="label">预约人数</text>
					<view class="detail-value">{{ formData.personCount }} 人</view>
				</view>

				<!-- 联系人姓名 -->
				<view class="form-item">
					<text class="label">联系人姓名</text>
					<view class="detail-value">{{ formData.name }}</view>
				</view>

				<!-- 手机号 -->
				<view class="form-item">
					<text class="label">手机号码</text>
					<view class="detail-value">{{ formData.phone }}</view>
				</view>

				<!-- 身份证号 -->
				<view class="form-item">
					<text class="label">身份证号</text>
					<view class="detail-value">{{ formData.idCard }}</view>
				</view>
                
				<!-- 预约日期 -->
				<view class="form-item">
					<text class="label">预约日期</text>
					<view class="detail-value">{{ formatDateText(formData.bookingDate) }}</view>
				</view>

				<!-- 预约时间段 -->
				<view class="form-item">
					<text class="label">预约时间段</text>
					<view class="detail-value">
						<text>{{ formData.timeSlot === 'morning' ? '上午 (08:00-12:00)' : '下午 (12:00-18:00)' }}</text>
					</view>
				</view>
			</view>

			<!-- 出行方式 -->
			<view class="form-section">
				<view class="section-title">
					<text class="title-icon">🚗</text>
					<text class="title-text">出行方式</text>
				</view>

				<view class="form-item">
					<text class="label">出行方式</text>
					<view class="detail-value">
						<text v-if="formData.travelMode === 'scenicBus'">景区摆渡车</text>
						<text v-else-if="formData.travelMode === 'selfDriving'">自驾出行</text>
						<text v-else-if="formData.travelMode === 'tourGroup'">观光团</text>
						<text v-else>{{ formData.travelMode }}</text>
					</view>
				</view>
			</view>

			<!-- 自驾信息 -->
			<view class="form-section" v-if="formData.travelMode === 'selfDriving'">
				<view class="section-title">
					<text class="title-icon">🚙</text>
					<text class="title-text">车辆信息</text>
				</view>

				<!-- 车辆类型 -->
				<view class="form-item">
					<text class="label">车辆类型</text>
					<view class="detail-value">{{ getVehicleTypeLabel() }}</view>
				</view>

				<!-- 车牌号 -->
				<view class="form-item">
					<text class="label">车牌号</text>
					<view class="detail-value">{{ formData.licensePlate }}</view>
				</view>
			</view>

			<!-- 观光团信息 -->
			<view class="form-section" v-if="formData.travelMode === 'tourGroup'">
				<view class="section-title">
					<text class="title-icon">👥</text>
					<text class="title-text">观光团信息</text>
				</view>

				<!-- 旅行社名称 -->
				<view class="form-item">
					<text class="label">旅行社名称</text>
					<view class="detail-value">{{ formData.tourGroupName }}</view>
				</view>

				<!-- 团队编号 -->
				<view class="form-item">
					<text class="label">团队编号</text>
					<view class="detail-value">{{ formData.tourNumber }}</view>
				</view>
			</view>

			<!-- 备注信息 -->
			<view class="form-section" v-if="formData.remarks">
				<view class="section-title">
					<text class="title-icon">📝</text>
					<text class="title-text">备注信息</text>
				</view>

				<view class="form-item">
					<view class="detail-value">{{ formData.remarks }}</view>
				</view>
			</view>

			<!-- 核验二维码 - 仅待使用状态显示 -->
			<view class="qr-section" v-if="formData.status === 'confirmed' && formData.bookingId">
				<view class="qr-card">
					<text class="qr-card-title">入场核验码</text>
					<text class="qr-card-subtitle">请向管理员出示此二维码</text>
					<view class="qr-code-wrap">
						<image class="qr-code" :src="qrCodeUrl" mode="aspectFit" />
					</view>
					<text class="qr-booking-id">订单号：{{ formData.bookingId }}</text>
				</view>
				<view class="action-bar">
					<view class="refund-btn" @tap="onRefund">申请退款</view>
				</view>
			</view>

			<!-- 待支付 - 支付按钮 -->
			<view class="action-bar" v-if="formData.status === 'pending'">
				<view class="pay-btn" @tap="onPay">立即支付</view>
			</view>
		</view>
	</view>
</template>

<script>
	import {
		request
	} from '../../utils/request';
	import { handlePayment } from '../../utils/payment';

	export default {
		data() {
			return {
				formData: {
					name: '',
					phone: '',
					idCard: '',
					bookingDate: '',
					timeSlot: '',
					travelMode: '',
					licensePlate: '',
					vehicleType: '',
					tourGroupName: '',
					tourOrderNumber: '',
					personCount: 1,
					remarks: '',
					status: '',
					bookingId: '',
					paymentExpiredAt: null
				},
				vehicleTypes: [
					{ label: '摩托', value: 'wheelMotorcycle' },
					{ label: '小型客车', value: 'smallCar' },
				],
				statusConfig: {
					pending:   { icon: '⏳', label: '待支付',  desc: '请尽快完成支付，超时订单将自动关闭' },
					confirmed: { icon: '✅', label: '待使用',  desc: '支付成功，请凭核验码入场' },
					completed: { icon: '🎉', label: '已完成',  desc: '感谢您的光临，期待再次相见' },
					cancelled: { icon: '❌', label: '已取消',  desc: '订单已取消' },
					refunded:  { icon: '💸', label: '已退款',  desc: '退款将原路返回，请耐心等待' },
				},
				countdown: 0,       // 剩余秒数
				countdownTimer: null,
				_lastClickTime: 0   // 防抖时间戳
			}
		},
		computed: {
			qrCodeUrl() {
				if (!this.formData.bookingId) return '';
				const encodedUrl = encodeURIComponent(this.formData.bookingId);
				return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}`;
			},
			countdownDisplay() {
				const total = Math.max(0, this.countdown);
				const mm = String(Math.floor(total / 60)).padStart(2, '0');
				const ss = String(total % 60).padStart(2, '0');
				return { mm, ss };
			}
		},
		onLoad(options) {
			if (options.bookingId) {
				this.getBookingDetail(options.bookingId);
			}
		},
		onUnload() {
			this.clearCountdown();
		},
		methods: {
			formatDateText(dateStr) {
				if (!dateStr) return '';
				
				// 如果是时间戳
				if (typeof dateStr === 'number') {
					const date = new Date(dateStr);
					const year = date.getFullYear();
					const month = (date.getMonth() + 1).toString().padStart(2, '0');
					const day = date.getDate().toString().padStart(2, '0');
					return `${year}年${month}月${day}日`;
				}
				
				const str = String(dateStr);
				// 尝试正则匹配 YYYY-MM-DD
				const match = str.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
				if (match) {
					return `${match[1]}年${match[2].padStart(2, '0')}月${match[3].padStart(2, '0')}日`;
				}

				// 其他情况尝试 new Date
				const date = new Date(dateStr);
				if (!isNaN(date.getTime())) {
					const year = date.getFullYear();
					const month = (date.getMonth() + 1).toString().padStart(2, '0');
					const day = date.getDate().toString().padStart(2, '0');
					return `${year}年${month}月${day}日`;
				}
				
				return dateStr;
			},
			// 获取车辆类型标签
			getVehicleTypeLabel() {
				const type = this.vehicleTypes.find(item => item.value === this.formData.vehicleType);
				return type ? type.label : this.formData.vehicleType;
			},
			// 启动倒计时
			startCountdown() {
				this.clearCountdown();
				if (!this.formData.paymentExpiredAt || this.formData.status !== 'pending') return;
				const expiredAt = new Date(this.formData.paymentExpiredAt).getTime();
				const calc = () => Math.max(0, Math.floor((expiredAt - Date.now()) / 1000));
				this.countdown = calc();
				if (this.countdown <= 0) {
					this.getBookingDetail(this.formData.bookingId);
					return;
				}
				this.countdownTimer = setInterval(() => {
					this.countdown = calc();
					if (this.countdown <= 0) {
						this.clearCountdown();
						this.getBookingDetail(this.formData.bookingId);
					}
				}, 1000);
			},
			clearCountdown() {
				if (this.countdownTimer) {
					clearInterval(this.countdownTimer);
					this.countdownTimer = null;
				}
			},
			_throttle(fn, interval = 2000) {
				const now = Date.now();
				if (now - this._lastClickTime < interval) return;
				this._lastClickTime = now;
				fn();
			},
			onPay() {
				this._throttle(() => {
					handlePayment(this.formData.bookingId);
				});
			},
			onRefund() {
				this._throttle(() => { this._doRefund(); });
			},
			_doRefund() {
				uni.showModal({
					title: '申请退款',
					content: '确认申请退款？退款将原路返回，请耐心等待',
					confirmText: '确认退款',
					confirmColor: '#f5515f',
					success: (res) => {
						if (!res.confirm) return;
						uni.showLoading({ title: '退款申请中...' });
						request({
							method: 'POST',
							url: `bookings/${this.formData.bookingId}/refund`
						}).then(() => {
							uni.showModal({
								title: '退款申请已提交',
								content: '退款成功！微信将自动返还回您的账户，请您耐心等待。',
								showCancel: false,
								confirmText: '我知道了',
								success: () => {
									uni.reLaunch({ url: '/pages/booking/booking' });
								}
							});
						}).catch(() => {
							uni.showToast({ title: '退款申请失败，请稍后重试', icon: 'none' });
						}).finally(() => {
							uni.hideLoading();
						});
					}
				});
			},
			// 获取预约详情
			getBookingDetail(bookingId) {
				uni.showLoading({
					title: '加载中...'
				});
				request({
					method: 'GET',
					url: `/bookings/${bookingId}`
				}).then(res => {
					if (res.success && res.data) {
						this.formData = res.data;
						this.startCountdown();
					} else {
						uni.showToast({ title: '加载详情失败', icon: 'none' });
					}
				}).catch(() => {
					uni.showToast({ title: '加载详情失败', icon: 'none' });
				}).finally(() => {
					uni.hideLoading();
				});
			}
		}
	}
</script>

<style scoped>
	.container {
		min-height: 100vh;
		background-color: #f5f5f5;
		padding-bottom: 40rpx;
		box-sizing: border-box;
	}

	.form-container {
		padding: 20rpx 30rpx 0;
		box-sizing: border-box;
	}

	/* 订单状态栏 */
	.status-bar {
		display: flex;
		align-items: center;
		border-radius: 20rpx;
		padding: 28rpx 30rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
	}

	.status-bar-pending   { background: linear-gradient(135deg, #ff9800, #f57c00); }
	.status-bar-confirmed { background: linear-gradient(135deg, #667eea, #764ba2); }
	.status-bar-completed { background: linear-gradient(135deg, #43e97b, #38f9d7); }
	.status-bar-cancelled { background: linear-gradient(135deg, #bbb, #999); }
	.status-bar-refunded  { background: linear-gradient(135deg, #f5515f, #f7971e); }

	.status-bar-icon {
		font-size: 56rpx;
		margin-right: 24rpx;
		flex-shrink: 0;
	}

	.status-bar-info {
		display: flex;
		flex-direction: column;
	}

	.status-bar-label {
		font-size: 34rpx;
		font-weight: bold;
		color: #fff;
		margin-bottom: 6rpx;
	}

	.status-bar-desc {
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.85);
		line-height: 1.5;
	}

	/* 倒计时卡片 */
	.countdown-card {
		background: #fff;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.countdown-tip {
		font-size: 24rpx;
		color: #999;
		margin-bottom: 20rpx;
		text-align: center;
	}

	.countdown-time {
		display: flex;
		align-items: center;
	}

	.time-block {
		display: flex;
		align-items: baseline;
		background: #fff8f0;
		border-radius: 12rpx;
		padding: 10rpx 24rpx;
	}

	.time-num {
		font-size: 64rpx;
		font-weight: bold;
		color: #f57c00;
		line-height: 1;
		font-variant-numeric: tabular-nums;
	}

	.time-unit {
		font-size: 24rpx;
		color: #f57c00;
		margin-left: 6rpx;
	}

	.time-sep {
		font-size: 48rpx;
		font-weight: bold;
		color: #f57c00;
		margin: 0 16rpx;
		line-height: 1;
	}

	/* 表单区块 */
	.form-section {
		background: #fff;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
		box-sizing: border-box;
		width: 100%;
		overflow: hidden;
	}

	.section-title {
		display: flex;
		align-items: center;
		margin-bottom: 30rpx;
		padding-bottom: 20rpx;
		border-bottom: 2rpx solid #f0f0f0;
	}

	.title-icon {
		font-size: 40rpx;
		margin-right: 15rpx;
	}

	.title-text {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	/* 表单项 */
	.form-item {
		margin-bottom: 30rpx;
		position: relative;
		width: 100%;
		box-sizing: border-box;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: flex-start;
	}

	.form-item:last-child {
		margin-bottom: 0;
	}

	.label {
		display: block;
		font-size: 28rpx;
		color: #666;
		margin-bottom: 0;
		font-weight: 400;
		width: 180rpx;
		flex-shrink: 0;
	}

	.detail-value {
		font-size: 28rpx;
		color: #333;
		font-weight: 500;
		line-height: 1.5;
		word-break: break-all;
		text-align: left;
		flex: 1;
	}

	/* 二维码区域 */
	.qr-section {
		margin-bottom: 20rpx;
	}

	.qr-card {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 20rpx;
		padding: 40rpx 30rpx 36rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		box-shadow: 0 8rpx 30rpx rgba(102, 126, 234, 0.3);
	}

	.qr-card-title {
		font-size: 34rpx;
		font-weight: bold;
		color: #fff;
		margin-bottom: 10rpx;
	}

	.qr-card-subtitle {
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.75);
		margin-bottom: 36rpx;
	}

	.qr-code-wrap {
		background: #fff;
		border-radius: 20rpx;
		padding: 20rpx;
		box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.15);
	}

	.qr-code {
		width: 360rpx;
		height: 360rpx;
		display: block;
	}

	.qr-booking-id {
		margin-top: 28rpx;
		font-size: 22rpx;
		color: rgba(255, 255, 255, 0.6);
		letter-spacing: 1px;
	}

	/* 操作按钮栏 */
	.action-bar {
		padding: 20rpx 0 10rpx;
	}

	.pay-btn {
		height: 90rpx;
		line-height: 90rpx;
		text-align: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
		font-size: 34rpx;
		font-weight: bold;
		border-radius: 45rpx;
		box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.35);
	}

	.refund-btn {
		height: 90rpx;
		line-height: 90rpx;
		text-align: center;
		background: #fff;
		color: #f5515f;
		font-size: 32rpx;
		font-weight: bold;
		border-radius: 45rpx;
		border: 2rpx solid #f5515f;
	}
</style>
