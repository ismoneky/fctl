<template>
	<view class="container">
		<view class="form-container">
			<!-- 基本信息 -->
			<view class="form-section">
				<view class="section-title">
					<text class="title-icon">👤</text>
					<text class="title-text">基本信息</text>
				</view>

				<!-- 人数 -->
				<view class="form-item required">
					<text class="label">预约人数</text>
					<view class="input-wrapper">
						<view class="stepper">
							<button class="stepper-btn" @click="decreasePerson">-</button>
							<input class="stepper-input" type="number" v-model.number="formData.personCount"
								@input="onPersonCountInput" />
							<button class="stepper-btn" @click="increasePerson">+</button>
						</view>
					</view>
				</view>

				<!-- 联系人姓名 -->
				<view class="form-item required">
					<text class="label">联系人姓名</text>
					<view class="input-wrapper">
						<input class="input" v-model="formData.name" placeholder="请输入联系人姓名" />
					</view>
				</view>

				<!-- 手机号 -->
				<view class="form-item required">
					<text class="label">手机号码</text>
					<view class="input-wrapper">
						<input class="input" type="number" maxlength="11" v-model="formData.phone" placeholder="请输入手机号码" />
					</view>
				</view>

				<!-- 身份证号 -->
				<view class="form-item required">
					<text class="label">身份证号</text>
					<view class="input-wrapper">
						<input class="input" maxlength="18" v-model="formData.idCard" placeholder="请输入身份证号码" />
					</view>
				</view>


				<!-- 预约日期 -->
				<view class="form-item required">
					<text class="label">预约日期</text>
					<view class="input-wrapper">
						<picker mode="date" :start="minDate" :end="maxDate" @change="onDateChange">
							<view class="picker">
								{{ formData.bookingDate || '请选择预约日期' }}
							</view>
						</picker>
					</view>
				</view>

				<!-- 预约时间段 -->
				<view class="form-item required">
					<text class="label">预约时间段</text>
					<view class="time-period-group">
						<view class="time-period-item" :class="{ active: formData.timeSlot === 'morning' }"
							@click="onTimePeriodChange('morning')">
							<view class="period-info">
								<text class="period-title">上午</text>
								<text class="period-time">08:00-12:00</text>
							</view>
							<view class="period-check" v-if="formData.timeSlot === 'morning'">✓</view>
						</view>
						<view class="time-period-item" :class="{ active: formData.timeSlot === 'afternoon' }"
							@click="onTimePeriodChange('afternoon')">
							<view class="period-info">
								<text class="period-title">下午</text>
								<text class="period-time">12:00-18:00</text>
							</view>
							<view class="period-check" v-if="formData.timeSlot === 'afternoon'">✓</view>
						</view>
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
					<text class="label required-label">选择出行方式</text>
					<view class="travel-type-group">
						<view class="travel-type-item" :class="{ active: formData.travelMode === item.value }"
							v-for="item in travelModeList" :key="item.value" @click="onTravelTypeChange(item.value)">
							<text class="travel-icon">{{ item.icon }}</text>
							<text class="travel-label">{{ item.label }}</text>
							<view class="travel-check" v-if="formData.travelMode === item.value">✓</view>
						</view>
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
				<view class="form-item required">
					<text class="label">车辆类型</text>
					<view class="input-wrapper">
						<picker mode="selector" :range="vehicleTypes" range-key="label" @change="onVehicleTypeChange">
							<view class="picker">
								{{ getVehicleTypeLabel() || '请选择车辆类型' }}
							</view>
						</picker>
					</view>
				</view>

				<!-- 车牌号 -->
				<view class="form-item required">
					<text class="label">车牌号</text>
					<view class="input-wrapper">
						<input class="input" v-model="formData.licensePlate" placeholder="请输入车牌号" />
					</view>
				</view>
			</view>

			<!-- 观光团信息 -->
			<view class="form-section" v-if="formData.travelMode === 'tourGroup'">
				<view class="section-title">
					<text class="title-icon">👥</text>
					<text class="title-text">观光团信息</text>
				</view>

				<!-- 旅行社名称 -->
				<view class="form-item required">
					<text class="label">旅行社名称</text>
					<view class="input-wrapper">
						<input class="input" v-model="formData.tourGroupName" placeholder="请输入旅行社名称" />
					</view>
				</view>

				<!-- 团队编号 -->
				<view class="form-item required">
					<text class="label">团队编号</text>
					<view class="input-wrapper">
						<input class="input" v-model="formData.tourNumber" placeholder="请输入团队编号" />
					</view>
				</view>
			</view>

			<!-- 备注信息 -->
			<view class="form-section">
				<view class="section-title">
					<text class="title-icon">📝</text>
					<text class="title-text">备注信息</text>
				</view>

				<view class="form-item">
					<textarea class="textarea" v-model="formData.remarks" placeholder="请输入备注信息（选填）" maxlength="200" />
					<text class="char-count">{{ formData.remarks.length }}/200</text>
				</view>
			</view>
		</view>

		<!-- 提交按钮 -->
		<view class="submit-section" v-if="!formData.bookingId">
			<button class="submit-btn" @click="handleSubmit">
				<text class="submit-icon"></text>
				<text>立即预约</text>
			</button>
		</view>
	</view>
</template>

<script>
import {
	request
} from '../../utils/request';

export default {
	data() {
		return {
			id: '', // 景区ID，从路由参数获取
			formData: {
				name: 'zhang', // 联系人姓名
				phone: '13261732722', // 联系人手机号
				idCard: '410621200008210019', // 联系人身份证号
				bookingDate: '', // 预约日期
				timeSlot: 'morning', // 预约时间段（morning/afternoon）
				travelMode: 'selfDriving', // 出行方式（scenicBus/selfDriving/tour_group）
				licensePlate: '京A12345', // 车牌号（自驾时必填）
				vehicleType: 'wheelMotorcycle', // 车辆类型（自驾时必填）
				tourGroupName: '', // 旅游团名称（旅游团时必填）
				tourOrderNumber: '', // 旅游团订单编号（旅游团时必填）
				personCount: 1, // 预约人数
				remarks: '' // 备注信息
			},
			travelModeList: [{
				label: '景区摆渡车',
				value: 'scenicBus',
				icon: '🚌'
			},
			{
				label: '自驾出行',
				value: 'selfDriving',
				icon: '🚗'
			},
				// {
				// 	label: '观光团',
				// 	value: 'tourGroup',
				// 	icon: '👥'
				// }
			],
			vehicleTypes: [{
				label: '摩托',
				value: 'wheelMotorcycle'
			},
			{
				label: '小型客车',
				value: 'smallCar'
			},
			],
			minDate: '',
			maxDate: ''
		}
	},
	onLoad(options) {
		// 检查是否携带 bookingId 参数
		if (options.bookingId) {
			this.getBookingDetail(options.bookingId);
		} else {
			// 设置日期范围（今天到3个月后）
			const today = new Date();
			const maxDay = new Date();
			maxDay.setMonth(maxDay.getMonth() + 3);

			this.minDate = this.formatDate(today);
			this.maxDate = this.formatDate(maxDay);
		}
	},
	// 分享配置
	onShareAppMessage() {
		return {
			title: '风车天路 - 浪漫风车之旅等你来',
			path: '/pages/index/index'
		}
	},
	methods: {
		// 人数增加
		increasePerson() {
			if (this.formData.personCount < 99) {
				this.formData.personCount++;
			}
		},
		// 人数减少
		decreasePerson() {
			if (this.formData.personCount > 1) {
				this.formData.personCount--;
			}
		},
		// 人数输入
		onPersonCountInput(e) {
			let value = parseInt(e.detail.value) || 1;
			if (value < 1) value = 1;
			if (value > 99) value = 99;
			this.formData.personCount = value;
		},
		// 年龄段选择
		onAgeRangeChange(e) {
			this.formData.ageRange = this.ageRanges[e.detail.value];
		},
		// 日期选择
		onDateChange(e) {
			this.formData.bookingDate = e.detail.value;
		},
		// 时间段选择
		onTimePeriodChange(period) {
			this.formData.timeSlot = period;
		},
		// 出行方式选择
		onTravelTypeChange(value) {
			this.formData.travelMode = value;
		},
		// 车辆类型选择
		onVehicleTypeChange(e) {
			this.formData.vehicleType = this.vehicleTypes[e.detail.value].value;
		},
		// 获取车辆类型标签
		getVehicleTypeLabel() {
			const type = this.vehicleTypes.find(item => item.value === this.formData.vehicleType);
			return type ? type.label : '';
		},
		// 格式化日期
		formatDate(date) {
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			return `${year}-${month}-${day}`;
		},
		// 验证手机号
		validatePhone(phone) {
			const reg = /^1[3-9]\d{9}$/;
			return reg.test(phone);
		},
		// 验证身份证号
		validateIdCard(idCard) {
			const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
			return reg.test(idCard);
		},
		// 验证车牌号
		validatePlateNumber(plateNumber) {
			const reg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{4,5}[A-Z0-9挂学警港澳]$/;
			return reg.test(plateNumber);
		},
		// 表单验证
		validateForm() {
			// 验证人数
			if (!this.formData.personCount || this.formData.personCount < 1) {
				uni.showToast({
					title: '请输入预约人数',
					icon: 'none'
				});
				return false;
			}

			// 验证联系人姓名
			if (!this.formData.name.trim()) {
				uni.showToast({
					title: '请输入联系人姓名',
					icon: 'none'
				});
				return false;
			}

			// 验证手机号
			if (!this.formData.phone) {
				uni.showToast({
					title: '请输入手机号码',
					icon: 'none'
				});
				return false;
			}
			if (!this.validatePhone(this.formData.phone)) {
				uni.showToast({
					title: '请输入正确的手机号码',
					icon: 'none'
				});
				return false;
			}

			// 验证身份证号
			if (!this.formData.idCard) {
				uni.showToast({
					title: '请输入身份证号码',
					icon: 'none'
				});
				return false;
			}
			if (!this.validateIdCard(this.formData.idCard)) {
				uni.showToast({
					title: '请输入正确的身份证号码',
					icon: 'none'
				});
				return false;
			}

			// 验证预约日期
			if (!this.formData.bookingDate) {
				uni.showToast({
					title: '请选择预约日期',
					icon: 'none'
				});
				return false;
			}

			// 验证预约时间段
			if (!this.formData.timeSlot) {
				uni.showToast({
					title: '请选择预约时间段',
					icon: 'none'
				});
				return false;
			}
			// 如果是自驾，验证车辆信息
			if (this.formData.travelMode === 'selfDriving') {
				if (!this.formData.vehicleType) {
					uni.showToast({
						title: '请选择车辆类型',
						icon: 'none'
					});
					return false;
				}
				if (!this.formData.licensePlate) {
					uni.showToast({
						title: '请输入车牌号',
						icon: 'none'
					});
					return false;
				}
				if (!this.validatePlateNumber(this.formData.licensePlate)) {
					uni.showToast({
						title: '请输入正确的车牌号',
						icon: 'none'
					});
					return false;
				}
			}

			// // 如果是观光团，验证观光团信息
			// if (this.formData.travelType === 'tour-group') {
			// 	if (!this.formData.tourInfo.agencyName.trim()) {
			// 		uni.showToast({
			// 			title: '请输入旅行社名称',
			// 			icon: 'none'
			// 		});
			// 		return false;
			// 	}
			// 	if (!this.formData.tourInfo.groupNumber.trim()) {
			// 		uni.showToast({
			// 			title: '请输入团队编号',
			// 			icon: 'none'
			// 		});
			// 		return false;
			// 	}
			// 	if (!this.formData.tourInfo.busPlateNumber) {
			// 		uni.showToast({
			// 			title: '请输入大巴车牌号',
			// 			icon: 'none'
			// 		});
			// 		return false;
			// 	}
			// 	if (!this.validatePlateNumber(this.formData.tourInfo.busPlateNumber)) {
			// 		uni.showToast({
			// 			title: '请输入正确的大巴车牌号',
			// 			icon: 'none'
			// 		});
			// 		return false;
			// 	}
			// }

			return true;
		},
		// 提交表单
		handleSubmit() {
			// 验证表单
			if (!this.validateForm()) {
				return;
			}

			// 显示加载提示
			uni.showLoading({
				title: '提交中...'
			});
			// 直接提交 formData，字段与后端保持一致
			const submitData = {
				...this.formData,
				wechatOpenId: uni.getStorageSync('openid')
			};
			request({
				method: 'POST',
				url: '/bookings',
				data: submitData
			}).then(res => {
				if (res.success) {
					const bookingId = res.data.bookingId;
					// 调用支付接口
					this.handlePayment(bookingId);
				} else {
					uni.showToast({
						title: '预约失败，请稍后再试',
						icon: 'error'
					});
				}
			}).catch(err => {
				console.log('预约提交失败:', err);
				uni.showToast({
					title: err.data?.message || '预约失败，请稍后再试',
					icon: 'error'
				});
			}).finally(() => {
				uni.hideLoading();
			});
		},
		// 处理支付
		handlePayment(bookingId) {
			uni.showLoading({
				title: '准备支付...'
			});
			request({
				method: 'POST',
				url: `bookings/${bookingId}/pay`,
				data: {
				    wechatOpenId: uni.getStorageSync('openid')
				}
			}).then(res => {
				if (res.success) {
					const payParams = res.data;
					// 发起微信支付
					uni.requestPayment({
						provider: 'wxpay',
						appId: payParams.appId,
						timeStamp: payParams.timeStamp,
						nonceStr: payParams.nonceStr,
						package: payParams.package,
						signType: payParams.signType,
						paySign: payParams.paySign,
						success: () => {
							// wx.requestPayment success 不等于支付成功，需调后端查单确认
							this.pollPaymentStatus(bookingId);
						},
						fail: (err) => {
							if (err.errMsg && err.errMsg.includes('cancel')) {
								uni.showToast({
									title: '已取消支付',
									icon: 'none'
								});
							} else {
								// 其他失败也需查单确认实际状态
								this.pollPaymentStatus(bookingId);
							}
						}
					});
				} else {
					uni.showToast({
						title: '获取支付参数失败',
						icon: 'error'
					});
				}
			}).catch(err => {
				console.log('获取支付参数失败:', err);
				uni.showToast({
					title: '获取支付参数失败，请稍后再试',
					icon: 'error'
				});
			}).finally(() => {
				uni.hideLoading();
			});
		},
		// 轮询支付状态
		pollPaymentStatus(bookingId) {
			const MAX_RETRIES = 5;
			const INTERVAL = 3000;
			let retries = 0;

			const timer = setInterval(() => {
				retries++;
				request({
					method: 'GET',
					url: `bookings/${bookingId}/pay-status`
				}).then(res => {
					if (res.success) {
						const status = res.data.status;
						if (status === 'paid') {
							clearInterval(timer);
							uni.showToast({
								title: '支付成功',
								icon: 'success'
							});
							// 跳转到预约列表
							uni.reLaunch({
								url: '/pages/booking/booking'
							});
						} else if (retries >= MAX_RETRIES) {
							clearInterval(timer);
							uni.showToast({
								title: '支付状态确认中，请稍后刷新订单页面查看',
								icon: 'none',
								duration: 3000
							});
						}
					} else if (retries >= MAX_RETRIES) {
						clearInterval(timer);
						uni.showToast({
							title: '支付状态确认中，请稍后刷新订单页面查看',
							icon: 'none',
							duration: 3000
						});
					}
				}).catch(err => {
					console.log('查询支付状态失败:', err);
					if (retries >= MAX_RETRIES) {
						clearInterval(timer);
						uni.showToast({
							title: '支付状态确认中，请稍后刷新订单页面查看',
							icon: 'none',
							duration: 3000
						});
					}
				});
			}, INTERVAL);
		},
		// 获取预约详情
		getBookingDetail(bookingId) {
			request({
				method: 'GET',
				url: `/bookings/${bookingId}`
			}).then(res => {
				if (res.success && res.data) {
					this.formData = res.data;
				} else {
					uni.showToast({ title: '加载详情失败', icon: 'none' });
				}
			}).catch(err => {
				uni.showToast({ title: '加载详情失败', icon: 'none' });
			});
		}
	}
}
</script>

<style scoped>
.container {
	min-height: 100vh;
	background-color: #f5f5f5;
	padding-bottom: 140rpx;
	box-sizing: border-box;
}

.form-container {
	padding: 20rpx 30rpx 0;
	box-sizing: border-box;
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
}

.form-item:last-child {
	margin-bottom: 0;
}

.form-item.required .label::before {
	content: '*';
	color: #ff4757;
	margin-right: 5rpx;
}

.label {
	display: block;
	font-size: 28rpx;
	color: #333;
	margin-bottom: 15rpx;
	font-weight: 500;
	word-break: break-word;
}

.required-label::before {
	content: '*';
	color: #ff4757;
	margin-right: 5rpx;
}

.input-wrapper {
	width: 100%;
	box-sizing: border-box;
}

.input,
.picker {
	width: 100%;
	height: 80rpx;
	line-height: 80rpx;
	padding: 0 25rpx;
	background: #f8f8f8;
	border-radius: 12rpx;
	font-size: 28rpx;
	color: #333;
	box-sizing: border-box;
}

.picker {
	color: #999;
}

.textarea {
	width: 100%;
	min-height: 200rpx;
	padding: 20rpx;
	background: #f8f8f8;
	border-radius: 12rpx;
	font-size: 28rpx;
	color: #333;
	box-sizing: border-box;
}

.char-count {
	display: block;
	text-align: right;
	font-size: 24rpx;
	color: #999;
	margin-top: 10rpx;
}

/* 步进器 */
.stepper {
	display: flex;
	align-items: center;
	background: #f8f8f8;
	border-radius: 12rpx;
	overflow: hidden;
}

.stepper-btn {
	width: 80rpx;
	height: 80rpx;
	line-height: 80rpx;
	text-align: center;
	background: #f8f8f8;
	color: #667eea;
	font-size: 40rpx;
	border: none;
	padding: 0;
	margin: 0;
}

.stepper-btn::after {
	border: none;
}

.stepper-input {
	flex: 1;
	height: 80rpx;
	line-height: 80rpx;
	text-align: center;
	font-size: 32rpx;
	color: #333;
	background: #f8f8f8;
	border: none;
}

/* 时间段选择 */
.time-period-group {
	display: flex;
	gap: 20rpx;
	width: 100%;
	box-sizing: border-box;
}

.time-period-item {
	flex: 1;
	display: flex;
	align-items: center;
	padding: 25rpx 20rpx;
	background: #f8f8f8;
	border-radius: 16rpx;
	border: 3rpx solid transparent;
	position: relative;
	transition: all 0.3s;
	box-sizing: border-box;
	min-width: 0;
}

.time-period-item.active {
	background: #e8f4ff;
	border-color: #667eea;
	box-shadow: 0 4rpx 12rpx rgba(74, 144, 226, 0.15);
}

.period-icon {
	font-size: 50rpx;
	margin-right: 15rpx;
}

.period-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	min-width: 0;
	overflow: hidden;
}

.period-title {
	font-size: 30rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 5rpx;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.period-time {
	font-size: 24rpx;
	color: #999;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.time-period-item.active .period-title {
	color: #667eea;
}

.time-period-item.active .period-time {
	color: #667eea;
}

.period-check {
	width: 40rpx;
	height: 40rpx;
	line-height: 40rpx;
	text-align: center;
	background: #667eea;
	color: #fff;
	border-radius: 50%;
	font-size: 24rpx;
	font-weight: bold;
}

/* 出行方式选择 */
.travel-type-group {
	display: flex;
	flex-direction: column;
	gap: 15rpx;
	width: 100%;
	box-sizing: border-box;
}

.travel-type-item {
	display: flex;
	align-items: center;
	padding: 30rpx;
	background: #f8f8f8;
	border-radius: 16rpx;
	border: 3rpx solid transparent;
	position: relative;
	transition: all 0.3s;
	box-sizing: border-box;
}

.travel-type-item.active {
	background: #e8f4ff;
	border-color: #667eea;
	box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.15);
}

.travel-icon {
	font-size: 50rpx;
	margin-right: 20rpx;
}

.travel-label {
	flex: 1;
	font-size: 30rpx;
	font-weight: bold;
	color: #333;
}

.travel-type-item.active .travel-label {
	color: #667eea;
}

.travel-check {
	width: 40rpx;
	height: 40rpx;
	line-height: 40rpx;
	text-align: center;
	background: #667eea;
	color: #fff;
	border-radius: 50%;
	font-size: 24rpx;
	font-weight: bold;
}

/* 单选框组（备用） */
.radio-group {
	display: flex;
	gap: 20rpx;
	width: 100%;
	box-sizing: border-box;
}

.radio-item {
	display: flex;
	align-items: center;
	padding: 20rpx 30rpx;
	background: #f8f8f8;
	border-radius: 12rpx;
	flex: 1;
	box-sizing: border-box;
	min-width: 0;
}

.radio-label {
	margin-left: 15rpx;
	font-size: 28rpx;
	color: #333;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

/* 提交区域 */
.submit-section {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 20rpx 30rpx;
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
	background: #fff;
	box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
	z-index: 100;
}

.submit-btn {
	width: 100%;
	height: 90rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: #fff;
	font-size: 32rpx;
	font-weight: bold;
	border-radius: 45rpx;
	border: none;
	box-shadow: 0 8rpx 20rpx rgba(102, 126, 234, 0.3);
}

.submit-btn::after {
	border: none;
}

.submit-icon {
	font-size: 36rpx;
	margin-right: 10rpx;
}
</style>