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
					<text class="status-bar-label">{{ formData.isFree ? '免费预约' : '待使用' }}</text>
					<text class="status-bar-desc" v-if="formData.isFree">
						{{ formData.freeReason === 'member' ? '月卡会员免费预约，凭预约码入场' : (formData.freeReason === 'age' ? '儿童/老人年龄免费预约，凭预约码入场' : '每日免费预约成功，凭预约码入场') }}
					</text>
					<text class="status-bar-desc" v-else>预约成功，凭预约码入场</text>
				</view>
				<text class="status-bar-tag" v-if="formData.isFree">免&nbsp;费</text>
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

				<!-- 人数（突出展示：数字 48rpx 加粗主题色，单位 32rpx） -->
				<view class="form-item">
					<text class="label">预约人数</text>
					<view class="detail-value person-count-value">
						<text class="person-count-number">{{ formData.personCount }}</text>
						<text class="person-count-unit">人</text>
					</view>
				</view>

				<!-- 出行人员列表 -->
				<view class="passenger-list" v-if="passengerList.length > 0">
					<view class="passenger-item" v-for="(p, idx) in passengerList" :key="idx">
						<view class="passenger-item-header">
							<text class="passenger-item-tag">{{ p.typeLabel }}</text>
							<text class="passenger-item-name">{{ p.name }}</text>
						</view>
						<view class="form-item passenger-sub-item">
							<text class="label">手机号码</text>
							<view class="detail-value">{{ p.phone }}</view>
						</view>
						<view class="form-item passenger-sub-item" style="margin-bottom:0">
							<text class="label">身份证号</text>
							<!-- 掩码展示；未提供身份证时显示「未提供」 -->
							<view class="detail-value">{{ p.maskedIdCardText }}</view>
						</view>
						<!-- 计费状态：年龄免费（绿）/ 暂时无法投保（黄）/ 整单免费 / 正常收费 -->
						<view class="passenger-status-tags">
							<text v-if="p.ageFreeStatusText" class="passenger-status-tag passenger-status-tag--free">{{ p.ageFreeStatusText }}</text>
							<text v-if="p.idCardUnavailable" class="passenger-status-tag passenger-status-tag--warn">按正常价格收费 · 暂时无法投保</text>
							<text v-if="!p.ageFree && !p.idCardUnavailable && !p.finalCharged" class="passenger-status-tag passenger-status-tag--free">整单免费</text>
							<text v-if="!p.ageFree && !p.idCardUnavailable && p.finalCharged" class="passenger-status-tag passenger-status-tag--normal">正常收费</text>
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

				<!-- 免费来源 -->
				<view class="form-item" v-if="formData.isFree">
					<text class="label">免费来源</text>
					<view class="detail-value">
						<text v-if="formData.freeReason === 'member'">月卡会员免费</text>
						<text v-else-if="formData.freeReason === 'age'">儿童/老人年龄免费</text>
						<text v-else>每日免费名额</text>
					</view>
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
					<view class="form-item" v-if="formData.vehicleType !== 'nonMotorized'">
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
				<view class="qr-card" :class="{ 'qr-card--member': isMotorcycleMember }">
					<view v-if="isMotorcycleMember" class="qr-member-badge">会员</view>
					<!-- 预约人数醒目展示（二维码上方，半透明白底胶囊 + 大号数字） -->
					<view class="qr-person-count">
						<text class="qr-person-count-label">预约人数</text>
						<text class="qr-person-count-number">{{ formData.personCount }}</text>
						<text class="qr-person-count-unit">人</text>
					</view>
					<text class="qr-card-title">{{ isMotorcycleMember ? '会员免费核验码' : '入场核验码' }}</text>
					<text class="qr-card-subtitle">{{ isMotorcycleMember ? '摩托车月卡会员免费订单' : '请向管理员出示此二维码' }}</text>
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
				<!-- 免费订单不支持退款，隐藏退款按钮 -->
				<view class="action-bar" v-if="!formData.isFree">
					<view class="refund-btn" @tap="onRefund">申请退款</view>
				</view>
			</view>

			<!-- 待支付 - 支付按钮 -->
			<view class="action-bar" v-if="formData.status === 'pending'">
				<view class="pay-btn" :class="{ 'pay-btn--disabled': paymentLaunching }" @tap="onPay">{{ paymentLaunching ? '正在准备支付…' : '立即支付' }}</view>
			</view>
		</view>
	</view>
</template>

<script>
	import {
		request
	} from '../../utils/request';
	import { handlePayment } from '../../utils/payment';
	import { normalizePassengerListForDisplay } from '../../utils/passenger-display.js';

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
					{ label: '小型客车', value: 'smallCar' },
					{ label: '摩托', value: 'wheelMotorcycle' },
					{ label: '非机动车', value: 'nonMotorized' },
				],
				passengerList: [],  // 解析后的出行人员列表
				qrImageUrl: '',
				countdown: 0,
				countdownTimer: null,
				_lastClickTime: 0,
				paymentLaunching: false,  // 支付准备中状态锁（替代节流，真实状态控制）
				timer: null  // 详情刷新定时器
			}
		},
		computed: {
			countdownDisplay() {
				const total = Math.max(0, this.countdown);
				const mm = String(Math.floor(total / 60)).padStart(2, '0');
				const ss = String(total % 60).padStart(2, '0');
				return { mm, ss };
			},
			// 摩托车会员订单：免费且来源为会员且车辆类型为摩托车，用于二维码卡片样式区分
			isMotorcycleMember() {
				return !!(this.formData.isFree
					&& this.formData.freeReason === 'member'
					&& this.formData.vehicleType === 'wheelMotorcycle');
			},
			// 免费人数（finalCharged=false，含整单免费与年龄免费）
			freePeopleCount() {
				return this.passengerList.filter((p) => p.finalCharged === false).length;
			},
			// 收费人数（finalCharged=true）
			chargedPeopleCount() {
				return this.passengerList.filter((p) => p.finalCharged === true).length;
			}
		},
		onLoad(options = {}) {
			const bookingId = options.bookingId || options.id;
			if (bookingId) {
				this.getBookingDetail(String(bookingId));
			}
		},
		onShow() {
			// 从微信支付返回或从其他页面返回时，重新拉取订单详情，避免展示旧状态
			if (this.formData.bookingId && !this.paymentLaunching) {
				this.getBookingDetail(this.formData.bookingId);
			}
		},
		onUnload() {
			this.clearCountdown();
			this.clearDetailTimer();
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
			clearDetailTimer() {
				if (this.timer) {
					clearTimeout(this.timer);
					this.timer = null;
				}
			},
			_throttle(fn, interval = 2000) {
				const now = Date.now();
				if (now - this._lastClickTime < interval) return;
				this._lastClickTime = now;
				fn();
			},
			onPay() {
				if (this.paymentLaunching) return;

				this.paymentLaunching = true;

				const onSuccess = () => {
					// 支付成功后重新拉取订单详情，展示最新状态（二维码等）
					this.getBookingDetail(this.formData.bookingId);
				};

				handlePayment(this.formData.bookingId, onSuccess)
					.then(() => {
						// 已支付：onSuccess 已刷新详情
					})
					.catch(() => {
						// 未支付/查询失败/准备失败：留在当前页面并刷新一次
						this.getBookingDetail(this.formData.bookingId);
					})
					.finally(() => {
						this.paymentLaunching = false;
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
						// 保留 Vue 已观察的 formData 对象，避免小程序端整体替换对象后视图不刷新。
						Object.assign(this.formData, res.data);
						// 解析出行人员列表
						this.passengerList = normalizePassengerListForDisplay(res.data.passengers, res.data);
						this.startCountdown();
						// 详情重新加载后，先清理上一条定时器链
						this.clearDetailTimer();
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
					// 创建新五秒定时器前先清理旧定时器
					this.clearDetailTimer();
					this.timer = setTimeout(() => {
						// 定时器触发时先把当前 timer 置空，再请求详情并决定是否继续下一轮
						this.timer = null;
						request({
							method: 'GET',
							url: `/bookings/${this.formData.bookingId}`
						}).then(res => {
							if (res.success && res.data) {
								Object.assign(this.formData, res.data);
								this.passengerList = normalizePassengerListForDisplay(res.data.passengers, res.data);
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

	.status-bar-tag {
		margin-left: auto;
		flex-shrink: 0;
		font-size: 26rpx;
		font-weight: 700;
		color: #2db96a;
		background: #fff;
		padding: 8rpx 20rpx;
		border-radius: 30rpx;
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

	/* 待支付 —— 蓝绿渐变，与页面主色保持一致 */
	.status-hero--pending {
		background: linear-gradient(135deg, #3F99F6 0%, #2F6E8E 100%);
		border: none;
		box-shadow: 0 8rpx 32rpx rgba(63, 153, 246, 0.28);
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
		color: #fff;
		margin-bottom: 10rpx;
		letter-spacing: 1rpx;
	}

	.hero-title--completed { color: #2db96a; }
	.hero-title--cancelled { color: #888; }
	.hero-title--refunded  { color: #3F99F6; }

	.status-hero--completed .hero-desc,
	.status-hero--cancelled .hero-desc,
	.status-hero--refunded  .hero-desc {
		color: #aaa;
	}

	/* 副文案 */
	.hero-desc {
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.72);
		text-align: center;
		line-height: 1.6;
	}

	/* 倒计时（内嵌在 pending hero 卡片里） */
	.countdown-inline {
		display: flex;
		align-items: center;
		margin-top: 36rpx;
		gap: 0;
	}

	.countdown-inline-block {
		display: flex;
		align-items: baseline;
		background: rgba(255, 255, 255, 0.15);
		border-radius: 16rpx;
		padding: 14rpx 32rpx;
	}

	.countdown-num {
		font-size: 68rpx;
		font-weight: 800;
		color: #fff;
		line-height: 1;
		font-variant-numeric: tabular-nums;
		letter-spacing: 2rpx;
	}

	.countdown-unit {
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.75);
		margin-left: 6rpx;
		font-weight: 500;
		align-self: flex-end;
		padding-bottom: 8rpx;
	}

	.countdown-sep {
		font-size: 48rpx;
		font-weight: 300;
		color: rgba(255, 255, 255, 0.5);
		margin: 0 16rpx;
		line-height: 1;
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
		font-size: 30rpx;
		color: #2F6E8E;
		font-weight: 500;
		line-height: 1.5;
		word-break: break-all;
		text-align: right;
		flex: 1;
	}

	/* 预约人数突出展示：数字 48rpx 加粗主题色，单位 32rpx，独立于普通详情值 */
	.person-count-value {
		display: flex;
		align-items: baseline;
		justify-content: flex-end;
		gap: 6rpx;
	}
	.person-count-number {
		font-size: 48rpx;
		font-weight: 800;
		color: #2F6E8E;
		line-height: 1.1;
		font-variant-numeric: tabular-nums;
	}
	.person-count-unit {
		font-size: 32rpx;
		font-weight: 600;
		color: #2F6E8E;
	}
	.person-count-summary {
		margin-top: 8rpx;
		font-size: 24rpx;
		color: #888;
	}

	/* 人员计费状态标签 */
	.passenger-status-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 10rpx;
		margin-top: 14rpx;
	}
	.passenger-status-tag {
		font-size: 22rpx;
		border-radius: 8rpx;
		padding: 4rpx 14rpx;
	}
	.passenger-status-tag--free {
		color: #2e9e5b;
		background: #e8f7ee;
	}
	.passenger-status-tag--warn {
		color: #a0761a;
		background: #fff8e1;
	}
	.passenger-status-tag--normal {
		color: #888;
		background: #f2f3f5;
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
		font-size: 24rpx;
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
		position: relative;
		overflow: hidden;
	}

	/* 摩托车会员订单：金色主题，与普通订单区分方便现场核验 */
	.qr-card--member {
		background: linear-gradient(135deg, #B8860B 0%, #E8B339 50%, #F0C75E 100%);
		box-shadow: 0 8rpx 30rpx rgba(184, 134, 11, 0.35);
	}

	.qr-member-badge {
		position: absolute;
		top: 0;
		right: 0;
		background: #fff;
		color: #B8860B;
		font-size: 24rpx;
		font-weight: bold;
		padding: 6rpx 20rpx;
		border-bottom-left-radius: 16rpx;
	}

	/* 二维码上方预约人数醒目展示：主题深蓝渐变实色胶囊 + 白字，水平居中 */
	.qr-person-count {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 10rpx;
		background: linear-gradient(135deg, #2F6E8E 0%, #1F4E6E 100%);
		border-radius: 60rpx;
		padding: 12rpx 40rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 4rpx 12rpx rgba(31, 78, 110, 0.45);
	}
	.qr-person-count-label {
		font-size: 28rpx;
		color: #ffffff;
		font-weight: 500;
	}
	.qr-person-count-number {
		font-size: 52rpx;
		color: #ffffff;
		font-weight: 800;
		line-height: 1;
		font-variant-numeric: tabular-nums;
		margin: 0 16rpx;
	}
	.qr-person-count-unit {
		font-size: 32rpx;
		color: #ffffff;
		font-weight: 600;
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
		font-size: 24rpx;
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

	.pay-btn--disabled {
		opacity: 0.6;
		pointer-events: none;
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
