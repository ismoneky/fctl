<template>
	<view class="container">
		<view class="form-container">
			<!-- 基本信息 -->
			<view class="form-section">
				<view class="section-title">
					<view class="title-icon-wrap">
						<image class="title-icon-svg xinxi" src="/static/svg/renyuanxinxi.svg" mode="aspectFit" />
					</view>
					<text class="title-text">基本信息</text>
				</view>

				<!-- 人数 + 联系人姓名 同一行两列 -->
				<view class="form-row-two">
					<view class="field-col">
						<text class="field-label required-star">预约人数</text>
						<view class="stepper-box">
							<button class="stepper-btn" @click="decreasePerson">－</button>
							<input class="stepper-input" type="number" v-model.number="formData.personCount" @input="onPersonCountInput" />
							<button class="stepper-btn stepper-btn--plus" @click="increasePerson">＋</button>
						</view>
					</view>
					<view class="field-col">
						<text class="field-label required-star">联系人姓名</text>
						<view class="input-box">
							<input class="field-input" v-model="formData.name" placeholder="请输入" placeholder-style="color:#c8c8c8" />
						</view>
					</view>
				</view>

				<!-- 手机号 -->
				<view class="field-block">
					<text class="field-label required-star">手机号码</text>
					<view class="input-box">
						<input class="field-input" type="number" maxlength="11" v-model="formData.phone" placeholder="请输入手机号码" placeholder-style="color:#c8c8c8" />
					</view>
				</view>

				<!-- 身份证号 -->
				<view class="field-block">
					<text class="field-label required-star">身份证号</text>
					<view class="input-box">
						<input class="field-input" maxlength="18" v-model="formData.idCard" placeholder="请输入身份证号码" placeholder-style="color:#c8c8c8" />
					</view>
				</view>

				<!-- 预约日期 -->
				<view class="field-block">
					<text class="field-label required-star">预约日期</text>
					<picker mode="date" :start="minDate" :end="maxDate" @change="onDateChange">
						<view class="input-box input-box--picker">
							<text class="picker-text" :class="formData.bookingDate ? 'picker-text--filled' : ''">
								{{ formData.bookingDate || '请选择预约日期' }}
							</text>
							<image class="picker-icon-svg" src="/static/svg/rili.svg" mode="aspectFit" />
						</view>
					</picker>
				</view>

				<!-- 预约时间段 -->
				<view class="field-block">
					<text class="field-label required-star">预约时间段</text>
					<view class="time-group">
						<view class="time-item" :class="{ 'time-item--active': formData.timeSlot === 'morning' }"
							@click="onTimePeriodChange('morning')">
							<view class="time-item__info">
								<text class="time-item__title" :class="{ 'time-item__title--active': formData.timeSlot === 'morning' }">上午</text>
								<text class="time-item__sub" :class="{ 'time-item__sub--active': formData.timeSlot === 'morning' }">08:00-12:00</text>
							</view>
							<view class="radio-circle" :class="{ 'radio-circle--checked': formData.timeSlot === 'morning' }">
								<text v-if="formData.timeSlot === 'morning'" class="radio-check">✓</text>
							</view>
						</view>
						<view class="time-item" :class="{ 'time-item--active': formData.timeSlot === 'afternoon' }"
							@click="onTimePeriodChange('afternoon')">
							<view class="time-item__info">
								<text class="time-item__title" :class="{ 'time-item__title--active': formData.timeSlot === 'afternoon' }">下午</text>
								<text class="time-item__sub" :class="{ 'time-item__sub--active': formData.timeSlot === 'afternoon' }">12:00-18:00</text>
							</view>
							<view class="radio-circle" :class="{ 'radio-circle--checked': formData.timeSlot === 'afternoon' }">
								<text v-if="formData.timeSlot === 'afternoon'" class="radio-check">✓</text>
							</view>
						</view>
					</view>
				</view>
			</view>

			<!-- 出行方式 + 车辆/观光团信息 -->
			<view class="form-section">
				<view class="section-title">
					<view class="title-icon-wrap">
						<image class="title-icon-svg car" src="/static/svg/roadster-fill.svg" mode="aspectFit" />
					</view>
					<text class="title-text">出行方式</text>
				</view>

				<picker mode="selector" :range="travelModeList" range-key="label" @change="onTravelPickerChange">
					<view class="travel-select-row">
						<text class="field-label required-star">选择出行方式</text>
						<view class="travel-select-right">
							<text class="travel-select-value" :class="formData.travelMode ? 'travel-select-value--filled' : ''">
								{{ getTravelModeLabel() || '请选择出行方式' }}
							</text>
							<text class="travel-arrow">›</text>
						</view>
					</view>
				</picker>

				<!-- 自驾：车辆类型 + 车牌号 -->
				<template v-if="formData.travelMode === 'selfDriving'">
					<view class="section-divider"></view>
					<view class="field-block">
						<text class="field-label required-star">车辆类型</text>
						<picker mode="selector" :range="vehicleTypes" range-key="label" @change="onVehicleTypeChange">
							<view class="input-box input-box--picker">
								<text class="picker-text" :class="getVehicleTypeLabel() ? 'picker-text--filled' : ''">
									{{ getVehicleTypeLabel() || '请选择车辆类型' }}
								</text>
								<text class="picker-arrow">›</text>
							</view>
						</picker>
					</view>
					<view class="field-block">
						<text class="field-label required-star">车牌号</text>
						<view class="input-box input-box--picker" @click="showPlateKeyboard">
							<text class="picker-text" :class="formData.licensePlate ? 'picker-text--filled' : ''">
								{{ formData.licensePlate ? formatPlate(formData.licensePlate) : '请输入车牌号' }}
							</text>
							<text class="picker-arrow">›</text>
						</view>
						<xm-keyboard-v2 ref="plateKeyboard" title="请输入车牌号" type="plate" :max="8" :cursor="true" @confirm="onPlateConfirm"></xm-keyboard-v2>
					</view>
				</template>

				<!-- 观光团：旅行社 + 团队编号 -->
				<template v-if="formData.travelMode === 'tourGroup'">
					<view class="section-divider"></view>
					<view class="field-block">
						<text class="field-label required-star">旅行社名称</text>
						<view class="input-box">
							<input class="field-input" v-model="formData.tourGroupName" placeholder="请输入旅行社名称" placeholder-style="color:#c8c8c8" />
						</view>
					</view>
					<view class="field-block">
						<text class="field-label required-star">团队编号</text>
						<view class="input-box">
							<input class="field-input" v-model="formData.tourNumber" placeholder="请输入团队编号" placeholder-style="color:#c8c8c8" />
						</view>
					</view>
				</template>
			</view>

			<!-- 备注信息 -->
			<view class="form-section">
				<view class="section-title">
					<view class="title-icon-wrap">
						<image class="title-icon-svg beizhu" src="/static/svg/24_beizhu.svg" mode="aspectFit" />
					</view>
					<text class="title-text">备注信息</text>
				</view>
				<view class="remarks-block">
					<textarea class="remarks-textarea" v-model="formData.remarks" placeholder="请输入备注信息（选填）" placeholder-style="color:#c8c8c8" maxlength="200" />
					<text class="char-count">{{ formData.remarks.length }}/200</text>
				</view>
			</view>
		</view>

		<!-- 底部：勾选 + 金额 + 提交按钮 -->
		<view class="submit-bar">
			<view class="agree-row" @click="agreedNotice = !agreedNotice">
				<view class="agree-checkbox" :class="{ 'agree-checkbox--checked': agreedNotice }">
					<text v-if="agreedNotice" class="agree-check-icon">✓</text>
				</view>
				<text class="agree-text">我已阅读并同意</text>
				<text class="agree-link" @click.stop="showNotice">《预约须知》</text>
			</view>
			<view class="submit-row">
				<view class="price-info" v-if="paymentAmount != null">
					<view class="price-row">
						<text class="price-symbol">¥</text>
						<text class="price-value">{{ (paymentAmount / 100).toFixed(2) }}</text>
					</view>
					<text class="price-desc">预约收费（含卫生管理费）</text>
				</view>
				<view class="price-info" v-else>
					<view style="flex:1"></view>
				</view>
				<button class="submit-btn" :class="{ 'submit-btn--disabled': !agreedNotice }" @click="handleSubmit">立即预约</button>
			</view>
		</view>

		<!-- 预约须知浮层 -->
		<view class="notice-mask" v-if="noticeVisible" @click="noticeVisible = false"></view>
		<view class="notice-popup" :class="{ 'notice-popup--show': noticeVisible }">
			<view class="notice-popup__header">
				<text class="notice-popup__title">预约须知</text>
				<text class="notice-popup__close" @click="noticeVisible = false">✕</text>
			</view>
			<scroll-view class="notice-popup__body" scroll-y>
				<!-- 预订须知 -->
				<text class="notice-group-title">预订须知</text>
				<view class="notice-row">
					<view class="notice-left">
						<view class="notice-tag notice-tag--blue">可订今天</view>
					</view>
					<text class="notice-row__text">23:59前可订今天</text>
				</view>
				<view class="notice-row">
					<view class="notice-left">
						<view class="notice-tag notice-tag--blue">有效期内可验</view>
					</view>
					<text class="notice-row__text">出游日期当天有效</text>
				</view>
				<view class="notice-row">
					<view class="notice-left">
						<view class="notice-tag notice-tag--blue">有条件退</view>
					</view>
					<text class="notice-row__text">有效期后1天23:30前未使用可申请退款，逾期不可退。</text>
				</view>

				<!-- 其他说明 -->
				<text class="notice-group-title" style="margin-top:36rpx">其他说明</text>
				<view class="notice-row">
					<text class="notice-row__label">其他须知</text>
					<text class="notice-row__text">适用人群：年龄19周岁（包含）~60周岁（不含）{{ '\n\n' }}一、门票仅限当日当次使用！{{ '\n' }}二、退票政策：实行限时退票规则，即在预订日、门票使用日和门票使用日的后一天，可以对未使用的门票进行退票，已使用或超过规定时限的门票无法退票。{{ '\n' }}三、符合半票优惠政策的游客需持相应证件在现场售票窗口购票；符合免票优惠政策的游客持相应证件在检票口直接办理入山。{{ '\n\n' }}四、预订成功的门票无需换取纸质票，直接凭本人身份证验票入山。</text>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
import {
	request
} from '../../utils/request';
import { handlePayment, pollPaymentStatus } from '../../utils/payment';

export default {
	data() {
		return {
			id: '', // 景区ID，从路由参数获取
			formData: {
				name: '', // 联系人姓名
				phone: '', // 联系人手机号
				idCard: '', // 联系人身份证号
				bookingDate: '', // 预约日期
				timeSlot: 'morning', // 预约时间段（morning/afternoon）
				travelMode: 'selfDriving', // 出行方式（scenicBus/selfDriving/tour_group）
				licensePlate: '', // 车牌号（自驾时必填）
				vehicleType: 'smallCar', // 车辆类型（自驾时必填）
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
			vehicleTypes: [
				{
					label: '小型客车',
					value: 'smallCar'
				},
				{
					label: '摩托',
					value: 'wheelMotorcycle'
				},
			],
			minDate: '',
			maxDate: '',
			_lastClickTime: 0,  // 防抖时间戳
			paymentAmount: 1000, // 单次支付金额（分），从接口获取
			agreedNotice: false, // 是否同意预约须知
			noticeVisible: false // 预约须知弹层显示
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
		// 获取支付金额配置
		request({ method: 'GET', url: '/system-config/payment-config' }).then(res => {
			if (res.data?.paymentAmount != null) {
				this.paymentAmount = res.data.paymentAmount;
			}
		}).catch(() => {});
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
		// 显示车牌键盘
		showPlateKeyboard() {
			this.$refs.plateKeyboard.toShow(this.formData.licensePlate);
		},
		// 车牌号确认
		onPlateConfirm(value) {
			this.formData.licensePlate = value;
		},
		// 车牌号格式化显示（省份·号码）
		formatPlate(value) {
			if (!value) return '';
			return [value.substring(0, 2), value.substring(2)].filter(x => x).join('·');
		},
		// 获取车辆类型标签
		getVehicleTypeLabel() {
			const type = this.vehicleTypes.find(item => item.value === this.formData.vehicleType);
			return type ? type.label : '';
		},
		// 获取出行方式标签
		getTravelModeLabel() {
			const mode = this.travelModeList.find(item => item.value === this.formData.travelMode);
			return mode ? mode.label : '';
		},
		// 出行方式picker选择
		onTravelPickerChange(e) {
			this.formData.travelMode = this.travelModeList[e.detail.value].value;
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
		// 显示预约须知
		showNotice() {
			this.noticeVisible = true;
		},
		// 提交表单
		handleSubmit() {
			const now = Date.now();
			if (now - this._lastClickTime < 2000) return;
			this._lastClickTime = now;

			// 校验是否同意须知
			if (!this.agreedNotice) {
				uni.showToast({ title: '请先阅读并同意预约须知', icon: 'none' });
				return;
			}

			// 验证表单
			if (!this.validateForm()) {
				return;
			}

			// 显示加载提示
			const loading = uni.showLoading({
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
                                    uni.showModal({
                                        title: "预约失败",
                                        content: err.data?.message,
                                        showCancel: false,
                                        confirmText: "我知道了",
                                    });
				}
			}).catch(err => {
                                uni.showModal({
                                    title: "预约失败",
                                    content: err.data?.message,
                                    showCancel: false,
                                    confirmText: "我知道了",
                                });
			}).finally(() =>{
                            uni.hideLoading();
            })
		},
		// 处理支付（使用公共方法）
		handlePayment(bookingId) {
			handlePayment(bookingId);
		},
		// 获取预约详情
		getBookingDetail(bookingId) {
			request({
				method: 'GET',
				url: `/bookings/${bookingId}`
			}).then(res => {
				if (res.success && res.data) {
					this.formData.name =  res.data.name
					this.formData.phone = res.data.phone
					this.formData.idCard = res.data.idCard
					this.formData.licensePlate = res.data.licensePlate
					this.formData.vehicleType = res.data.vehicleType
					this.formData.personCount = res.data.personCount
				}
			})
		}
	}
}
</script>

<style scoped>
/* ===== 整体容器 ===== */
.container {
	min-height: 100vh;
	background-color: #f0f2f8;
	padding-bottom: 200rpx;
	box-sizing: border-box;
}

/* ===== 顶部 header ===== */
.page-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	padding: 28rpx 30rpx 20rpx;
	background: #f0f2f8;
}

.header-left {
	display: flex;
	flex-direction: column;
}

.header-title {
	font-size: 36rpx;
	font-weight: 700;
	color: #1a1a2e;
	line-height: 1.2;
}

.header-sub {
	font-size: 24rpx;
	color: #999;
	margin-top: 6rpx;
}

.header-notice {
	display: flex;
	align-items: center;
	background: #eef0fb;
	border-radius: 28rpx;
	padding: 8rpx 16rpx;
	gap: 4rpx;
	flex-shrink: 0;
}

.notice-icon {
	font-size: 22rpx;
	color: #7c8ef0;
}

.notice-text {
	font-size: 22rpx;
	color: #7c8ef0;
	font-weight: 500;
}

.notice-arrow {
	font-size: 24rpx;
	color: #7c8ef0;
	font-weight: 300;
}

.form-container {
	padding: 24rpx;
	box-sizing: border-box;
}

/* ===== 卡片区块 ===== */
.form-section {
	background: #fff;
	border-radius: 20rpx;
	margin-bottom: 24rpx;
	overflow: hidden;
}

/* ===== 区块标题 ===== */
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

.title-icon {
	font-size: 36rpx;
}

.title-icon-svg {
/* 	width: 38rpx;
	height: 38rpx; */
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

.beizhu {
	width: 38rpx;
	height: 38rpx;
}
.title-text {
	font-size: 28rpx;
	font-weight: 700;
	color: #1a1a2e;
}

/* ===== 两列行（人数 + 联系人） ===== */
.form-row-two {
	display: flex;
	gap: 20rpx;
	padding: 0 24rpx 24rpx;
}

.field-col {
	flex: 1;
	min-width: 0;
}

/* ===== 单行字段块 ===== */
.field-block {
	padding: 0 24rpx 24rpx;
}

/* ===== 字段标签 ===== */
.field-label {
	display: block;
	font-size: 26rpx;
	color: #444;
	font-weight: 500;
	margin-bottom: 14rpx;
}

.required-star::before {
	content: '* ';
	color: #7c8ef0;
}

/* ===== 输入框容器 ===== */
.input-box {
	width: 100%;
	height: 80rpx;
	border: 1.5rpx solid #e0e3f0;
	border-radius: 12rpx;
	padding: 0 20rpx;
	box-sizing: border-box;
	display: flex;
	align-items: center;
	background: #fff;
}

.input-box--picker {
	justify-content: space-between;
}

.field-input {
	flex: 1;
	height: 80rpx;
	line-height: 80rpx;
	font-size: 28rpx;
	color: #1a1a2e;
	background: transparent;
	border: none;
	padding: 0;
}

/* ===== Picker 显示文本 ===== */
.picker-text {
	flex: 1;
	font-size: 28rpx;
	color: #c8c8c8;
}

.picker-text--filled {
	color: #1a1a2e;
}

.picker-icon {
	font-size: 32rpx;
	color: #999;
}

.picker-icon-svg {
	width: 38rpx;
	height: 38rpx;
	flex-shrink: 0;
}

.picker-arrow {
	font-size: 36rpx;
	color: #bbb;
	font-weight: 300;
}

/* ===== 步进器 ===== */
.stepper-box {
	width: 100%;
	height: 80rpx;
	border: 1.5rpx solid #e0e3f0;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	overflow: hidden;
	background: #fff;
}

.stepper-btn {
	width: 72rpx;
	height: 80rpx;
	line-height: 80rpx;
	text-align: center;
	background: #f5f6fb;
	color: #7c8ef0;
	font-size: 36rpx;
	border: none;
	padding: 0;
	margin: 0;
	flex-shrink: 0;
}

.stepper-btn--plus {
	color: #7c8ef0;
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
	font-weight: 600;
	color: #1a1a2e;
	background: transparent;
	border: none;
}

/* ===== 时间段选择 ===== */
.time-group {
	display: flex;
	gap: 20rpx;
}

.time-item {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 22rpx 20rpx;
	border: 1.5rpx solid #e0e3f0;
	border-radius: 14rpx;
	background: #fff;
	box-sizing: border-box;
}

.time-item--active {
	border-color: #7c8ef0;
	background: #f0f2ff;
}

.time-item__info {
	display: flex;
	flex-direction: column;
}

.time-item__title {
	font-size: 30rpx;
	font-weight: 600;
	color: #333;
	margin-bottom: 6rpx;
}

.time-item__title--active {
	color: #7c8ef0;
}

.time-item__sub {
	font-size: 22rpx;
	color: #aaa;
}

.time-item__sub--active {
	color: #7c8ef0;
}

/* 单选圆圈 */
.radio-circle {
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	border: 2rpx solid #d0d0d0;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.radio-circle--checked {
	background: #7c8ef0;
	border-color: #7c8ef0;
}

.radio-check {
	font-size: 22rpx;
	color: #fff;
	font-weight: bold;
}

/* ===== 卡片内分隔线 ===== */
.section-divider {
	height: 1.5rpx;
	background: #f0f0f5;
	margin: 0 24rpx 24rpx;
}

/* ===== 出行方式行 ===== */
.travel-select-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 24rpx 28rpx;
}

.travel-select-row .field-label {
	margin-bottom: 0;
	flex-shrink: 0;
}

.travel-select-right {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.travel-select-value {
	font-size: 28rpx;
	color: #c8c8c8;
}

.travel-select-value--filled {
	color: #1a1a2e;
}

.travel-arrow {
	font-size: 36rpx;
	color: #bbb;
	font-weight: 300;
}

/* ===== 备注 ===== */
.remarks-block {
	padding: 0 24rpx 24rpx;
}

.remarks-textarea {
	width: 100%;
	min-height: 160rpx;
	padding: 20rpx;
	border: 1.5rpx solid #e0e3f0;
	border-radius: 12rpx;
	font-size: 28rpx;
	color: #1a1a2e;
	box-sizing: border-box;
	background: #fff;
}

.char-count {
	display: block;
	text-align: right;
	font-size: 24rpx;
	color: #bbb;
	margin-top: 10rpx;
}

/* ===== 底部提交栏 ===== */
.submit-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	display: flex;
	flex-direction: column;
	padding: 16rpx 30rpx;
	padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
	background: #fff;
	box-shadow: 0 -2rpx 20rpx rgba(0, 0, 0, 0.06);
	z-index: 100;
}

/* 勾选行 */
.agree-row {
	display: flex;
	align-items: center;
	margin-bottom: 16rpx;
}

.agree-checkbox {
	width: 36rpx;
	height: 36rpx;
	border-radius: 8rpx;
	border: 2rpx solid #d0d3e8;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 12rpx;
	flex-shrink: 0;
	background: #fff;
}

.agree-checkbox--checked {
	background: #7c8ef0;
	border-color: #7c8ef0;
}

.agree-check-icon {
	font-size: 22rpx;
	color: #fff;
	font-weight: bold;
}

.agree-text {
	font-size: 26rpx;
	color: #666;
}

.agree-link {
	font-size: 26rpx;
	color: #7c8ef0;
	font-weight: 500;
}

/* 金额+按钮行 */
.submit-row {
	display: flex;
	align-items: center;
}

.price-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
}

.price-row {
	display: flex;
	align-items: baseline;
	gap: 2rpx;
}

.price-symbol {
	font-size: 26rpx;
	color: #7c8ef0;
	font-weight: 600;
	line-height: 1;
}

.price-value {
	font-size: 56rpx;
	color: #7c8ef0;
	font-weight: 700;
	line-height: 1;
}

.price-desc {
	font-size: 22rpx;
	color: #999;
	margin-top: 6rpx;
}

.submit-btn {
	width: 280rpx;
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
	flex-shrink: 0;
}

.submit-btn--disabled {
	background: linear-gradient(135deg, #b0b8f0 0%, #c0a8d8 100%);
	opacity: 0.7;
}

.submit-btn::after {
	border: none;
}

/* ===== 预约须知浮层 ===== */
.notice-mask {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.45);
	z-index: 200;
}

.notice-popup {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	background: #fff;
	border-radius: 32rpx 32rpx 0 0;
	z-index: 201;
	display: flex;
	flex-direction: column;
	max-height: 75vh;
	transform: translateY(100%);
	transition: transform 0.3s ease;
}

.notice-popup--show {
	transform: translateY(0);
}

.notice-popup__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 36rpx 40rpx 24rpx;
	border-bottom: 1.5rpx solid #f0f0f0;
	flex-shrink: 0;
}

.notice-popup__title {
	font-size: 34rpx;
	font-weight: 700;
	color: #1a1a2e;
}

.notice-popup__close {
	font-size: 36rpx;
	color: #999;
	padding: 8rpx;
	line-height: 1;
}

.notice-popup__body {
	flex: 1;
	padding: 28rpx 40rpx;
	padding-bottom: calc(28rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
}

.notice-group-title {
	display: block;
	font-size: 28rpx;
	font-weight: 700;
	color: #1a1a2e;
	margin-bottom: 20rpx;
}

.notice-row {
	display: flex;
	align-items: flex-start;
	gap: 16rpx;
	margin-bottom: 20rpx;
}

.notice-left {
	width: 160rpx;
	flex-shrink: 0;
	display: flex;
}

.notice-tag {
	flex-shrink: 0;
	font-size: 22rpx;
	font-weight: 600;
	padding: 6rpx 14rpx;
	border-radius: 8rpx;
	line-height: 1.4;
	align-self: flex-start;
	margin-top: 4rpx;
	text-align: center;
}

.notice-tag--blue {
	background: #e8ecff;
	color: #7c8ef0;
}

.notice-row__label {
	flex-shrink: 0;
	font-size: 26rpx;
	font-weight: 600;
	color: #333;
	min-width: 120rpx;
}

.notice-row__text {
	flex: 1;
	font-size: 26rpx;
	color: #555;
	line-height: 1.6;
}
</style>