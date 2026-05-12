<template>
	<view class="container">
		<view class="form-container">

			<!-- 待支付：倒计时主卡片 -->
			<view class="status-hero status-hero--pending" v-if="formData.status === 'pending'">
				<text class="hero-title">待支付</text>
				<text class="hero-desc">请尽快完成支付，超时将自动关闭订单</text>
				<view class="countdown-inline" v-if="countdown > 0">
					<view class="countdown-inline-block">
						<text class="countdown-num">{{ countdownDisplay.mm }}</text>
						<text class="countdown-unit">分</text>
					</view>
					<text class="countdown-sep">:</text>
					<view class="countdown-inline-block">
						<text class="countdown-num">{{ countdownDisplay.ss }}</text>
						<text class="countdown-unit">秒</text>
					</view>
				</view>
			</view>

			<!-- 待使用：状态条 -->
			<view class="status-bar status-bar-confirmed" v-if="formData.status === 'confirmed'">
				<view class="status-bar-info">
					<text class="status-bar-label">待使用</text>
					<text class="status-bar-desc">支付成功，请凭核验码入场</text>
				</view>
			</view>

			<!-- 已完成 -->
			<view class="status-hero status-hero--completed" v-if="formData.status === 'completed'">
				<text class="hero-title hero-title--completed">已完成</text>
				<text class="hero-desc">感谢您的光临，期待再次相见</text>
			</view>

			<!-- 已取消 -->
			<view class="status-hero status-hero--cancelled" v-if="formData.status === 'cancelled'">
				<text class="hero-title hero-title--cancelled">订单已取消</text>
				<text class="hero-desc">订单已关闭，如需出行请重新预约</text>
			</view>

			<!-- 已退款 -->
			<view class="status-hero status-hero--refunded" v-if="formData.status === 'refunded'">
				<text class="hero-title hero-title--refunded">退款成功</text>
				<text class="hero-desc">款项将原路退回，请耐心等待到账</text>
			</view>

			<!-- 基本信息 -->
			<view class="form-section">
				<view class="section-title">
					<view class="title-icon-wrap">
						<image class="title-icon-svg xinxi" src="/static/svg/renyuanxinxi.svg" mode="aspectFit" />
					</view>
					<text class="title-text">基本信息</text>
				</view>

				<!-- 人数 -->
				<view class="form-item">
					<text class="label">预约人数</text>
					<view class="detail-value">{{ formData.personCount }} 人</view>
				</view>

				<!-- 出行人员列表 -->
				<view class="passenger-list" v-if="passengerList.length > 0">
					<view class="passenger-item" v-for="(p, idx) in passengerList" :key="idx">
						<view class="passenger-item-header">
							<text class="passenger-item-tag">{{ idx === 0 ? '联系人' : `第${idx + 1}位` }}</text>
							<text class="passenger-item-name">{{ p.name }}</text>
						</view>
						<view class="form-item passenger-sub-item">
							<text class="label">手机号码</text>
							<view class="detail-value">{{ p.phone }}</view>
						</view>
						<view class="form-item passenger-sub-item" style="margin-bottom:0">
							<text class="label">身份证号</text>
							<view class="detail-value">{{ p.idCard }}</view>
						</view>
					</view>
				</view>
				<!-- 兼容旧数据（无 passengers 字段时） -->
				<template v-else>
					<view class="form-item">
						<text class="label">联系人姓名</text>
						<view class="detail-value">{{ formData.name }}</view>
					</view>
					<view class="form-item">
						<text class="label">手机号码</text>
						<view class="detail-value">{{ formData.phone }}</view>
					</view>
					<view class="form-item">
						<text class="label">身份证号</text>
						<view class="detail-value">{{ formData.idCard }}</view>
					</view>
				</template>
                
				<!-- 预约日期 -->
				<view class="form-item">
					<text class="label">预约日期</text>
					<view class="detail-value">{{ formatDateText(formData.bookingDate) }}</view>
				</view>

				<!-- 预约时间段（隐藏展示，字段保留） -->
			</view>

			<!-- 出行方式 -->
			<view class="form-section">
				<view class="section-title">
					<view class="title-icon-wrap">
						<image class="title-icon-svg car" src="/static/svg/roadster-fill.svg" mode="aspectFit" />
					</view>
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

				<!-- 自驾：车辆类型 + 车牌号 -->
				<template v-if="formData.travelMode === 'selfDriving'">
					<view class="form-item">
						<text class="label">车辆类型</text>
						<view class="detail-value">{{ getVehicleTypeLabel() }}</view>
					</view>
					<view class="form-item">
						<text class="label">车牌号</text>
						<view class="detail-value">{{ formData.licensePlate }}</view>
					</view>
				</template>

			<!-- 观光团信息 -->
			<template v-if="formData.travelMode === 'tourGroup'">

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
			</template>

			</view>

			<!-- 备注信息（隐藏展示，字段保留） -->

			<!-- 核验二维码 - 仅待使用状态显示 -->
			<view class="qr-section" v-if="formData.status === 'confirmed' && formData.bookingId">
				<view class="qr-card">
					<text class="qr-card-title">入场核验码</text>
					<text class="qr-card-subtitle">请向管理员出示此二维码</text>
					<view class="qr-code-wrap">
						<image v-if="qrImageUrl" class="qr-image" :src="qrImageUrl" mode="aspectFit" />
						<view v-else class="qr-placeholder" />
						<l-qrcode
							class="qr-canvas-hidden"
							:value="formData.bookingId"
							size="360rpx"
							color="#333333"
							bgColor="#ffffff"
							errorLevel="H"
							:useCanvasToTempFilePath="true"
							@success="onQrSuccess"
						/>
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
				passengerList: [],  // 解析后的出行人员列表
				qrImageUrl: '',
				countdown: 0,
				countdownTimer: null,
				_lastClickTime: 0
			}
		},
		computed: {
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
			onQrSuccess(url) {
				this.qrImageUrl = url;
			},
			// 获取车辆类型标签
			getVehicleTypeLabel() {
				const type = this.vehicleTypes.find(item => item.value === this.formData.vehicleType);
				return type ? type.label : this.formData.vehicleType;
			},
			// 带支付状态启动倒计时
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
						}).then(res => {
							if (res.success) {
								uni.showModal({
									title: '退款申请已提交',
									content: '退款成功！微信将自动返还回您的账户，请您耐心等待。',
									showCancel: false,
									confirmText: '我知道了',
									success: () => {
										uni.reLaunch({ url: '/pages/booking/booking' });
									}
								});
							} else {
								uni.showModal({
									title: '退款失败',
									content: res.data?.message || '退款申请失败，请稍后重试',
									showCancel: false,
									confirmText: '我知道了'
								});
							}
						}).catch(err => {
							uni.showModal({
								title: '退款失败',
								content: err.data?.message || '退款申请失败，请稍后重试',
								showCancel: false,
								confirmText: '我知道了'
							});
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
						// 解析出行人员列表
						if (res.data.passengers) {
							try {
								const list = typeof res.data.passengers === 'string'
									? JSON.parse(res.data.passengers)
									: res.data.passengers;
								this.passengerList = Array.isArray(list) ? list : [];
							} catch(e) {
								this.passengerList = [];
							}
						} else {
							this.passengerList = [];
						}
						this.startCountdown();
						this.loopDetail();
					} else {
						uni.showToast({ title: '加载详情失败', icon: 'none' });
					}
				}).catch(() => {
					uni.showToast({ title: '加载详情失败', icon: 'none' });
				}).finally(() => {
					uni.hideLoading();
				});
			},
			loopDetail() {
				if(this.formData.status === 'confirmed') {
					this.timer = setTimeout(() => {
						request({
							method: 'GET',
							url: `/bookings/${this.formData.bookingId}`
						}).then(res => {
							if (res.success && res.data) {
								this.formData = res.data;
								this.loopDetail();
							}
						})
					}, 5000)
				}
			}
		}
	}
</script>

<style scoped>
	.container {
		min-height: 100vh;
		background-color: #f5f8fa;
		padding-bottom: 40rpx;
		box-sizing: border-box;
	}

	.form-container {
		padding: 24rpx;
		box-sizing: border-box;
	}

	/* 待使用状态条（横向紧凑，保持原风格） */
	.status-bar {
		display: flex;
		align-items: center;
		border-radius: 20rpx;
		padding: 28rpx 30rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
	}

	.status-bar-confirmed { background: linear-gradient(135deg, #3F99F6, #33C5A0); }

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

	/* ===== 状态 Hero 卡片（居中大图标式） ===== */
	.status-hero {
		border-radius: 24rpx;
		margin-bottom: 20rpx;
		padding: 48rpx 40rpx 44rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	/* 待支付 —— 暖橙，营造紧迫感 */
	.status-hero--pending {
		background: linear-gradient(160deg, #fff8f0 0%, #fff3e0 100%);
		border: 1.5rpx solid #ffe0b2;
	}

	/* 已完成 —— 清新绿 */
	.status-hero--completed {
		background: linear-gradient(160deg, #f0fdf6 0%, #e6faf0 100%);
		border: 1.5rpx solid #b2dfcc;
	}

	/* 已取消 —— 中性灰，低调 */
	.status-hero--cancelled {
		background: #f5f6f8;
		border: 1.5rpx solid #e0e0e0;
	}

	/* 已退款 —— 浅蓝紫，温和提示 */
	.status-hero--refunded {
		background: linear-gradient(160deg, #f3f4ff 0%, #f0f7fb 100%);
		border: 1.5rpx solid #E6E6E6;
	}

	/* 标题 */
	.hero-title {
		font-size: 38rpx;
		font-weight: 800;
		color: #f57c00;
		margin-bottom: 12rpx;
		letter-spacing: 1rpx;
	}

	.hero-title--completed { color: #2db96a; }
	.hero-title--cancelled { color: #888; }
	.hero-title--refunded  { color: #3F99F6; }

	/* 副文案 */
	.hero-desc {
		font-size: 26rpx;
		color: #aaa;
		text-align: center;
		line-height: 1.6;
	}

	/* 倒计时（内嵌在 pending hero 卡片里） */
	.countdown-inline {
		display: flex;
		align-items: center;
		margin-top: 32rpx;
		gap: 0;
	}

	.countdown-inline-block {
		display: flex;
		align-items: baseline;
		background: rgba(245,124,0,0.10);
		border-radius: 14rpx;
		padding: 12rpx 28rpx;
	}

	.countdown-num {
		font-size: 72rpx;
		font-weight: 800;
		color: #f57c00;
		line-height: 1;
		font-variant-numeric: tabular-nums;
	}

	.countdown-unit {
		font-size: 24rpx;
		color: #f57c00;
		margin-left: 6rpx;
		font-weight: 600;
	}

	.countdown-sep {
		font-size: 52rpx;
		font-weight: bold;
		color: #f5a623;
		margin: 0 14rpx;
		line-height: 1;
		opacity: 0.7;
	}

	/* 表单区块 */
	.form-section {
		background: #fff;
		border-radius: 20rpx;
		margin-bottom: 24rpx;
		overflow: hidden;
	}

	.section-title {
		display: flex;
		align-items: center;
		padding: 32rpx 30rpx 28rpx;
	}

	.title-icon-wrap {
		width: 44rpx;
		height: 44rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 8rpx;
		flex-shrink: 0;
	}

	.title-icon-svg {
	}

	.xinxi {
		width: 38rpx;
		height: 34rpx;
		margin-bottom: 10rpx;
	}

	.car {
		width: 36rpx;
		height: 36rpx;
	}

	.title-text {
		font-size: 28rpx;
		font-weight: 700;
		color: #2F6E8E;
	}

	/* 表单项 */
	.form-item {
		margin-bottom: 24rpx;
		padding: 0 30rpx;
		position: relative;
		width: 100%;
		box-sizing: border-box;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: flex-start;
	}

	.form-item:last-child {
		margin-bottom: 30rpx;
	}

	.label {
		display: block;
		font-size: 26rpx;
		color: #444;
		margin-bottom: 0;
		font-weight: 500;
		width: 180rpx;
		flex-shrink: 0;
	}

	.detail-value {
		font-size: 28rpx;
		color: #2F6E8E;
		font-weight: 500;
		line-height: 1.5;
		word-break: break-all;
		text-align: right;
		flex: 1;
	}

	/* 出行人员列表 */
	.passenger-list {
		padding: 0 24rpx 16rpx;
		display: flex;
		flex-direction: column;
		gap: 16rpx;
	}

	.passenger-item {
		background: #f5f8fa;
		border-radius: 14rpx;
		padding: 20rpx 20rpx 16rpx;
		border: 1.5rpx solid #E6E6E6;
	}

	.passenger-item-header {
		display: flex;
		align-items: center;
		gap: 14rpx;
		margin-bottom: 16rpx;
	}

	.passenger-item-tag {
		font-size: 22rpx;
		color: #3F99F6;
		background: #f0f7fb;
		padding: 4rpx 16rpx;
		border-radius: 16rpx;
		font-weight: 600;
		flex-shrink: 0;
	}

	.passenger-item-name {
		font-size: 30rpx;
		font-weight: 700;
		color: #2F6E8E;
	}

	.passenger-sub-item {
		padding: 0 !important;
		margin-bottom: 12rpx !important;
	}

	/* 二维码区域 */
	.qr-section {
		margin-bottom: 20rpx;
	}

	.qr-card {
		background: linear-gradient(135deg, #3F99F6 0%, #33C5A0 100%);
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
		display: flex;
		align-items: center;
		justify-content: center;
		width: 360rpx;
		height: 360rpx;
		box-sizing: content-box;
	}

	.qr-image {
		width: 360rpx;
		height: 360rpx;
		display: block;
	}

	.qr-placeholder {
		width: 360rpx;
		height: 360rpx;
		background: #f0f0f0;
		border-radius: 8rpx;
	}

	.qr-canvas-hidden {
		position: fixed;
		left: -9999rpx;
		top: -9999rpx;
		opacity: 0;
		pointer-events: none;
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
		background: linear-gradient(135deg, #3F99F6 0%, #33C5A0 100%);
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
