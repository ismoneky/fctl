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
						<input class="input" v-model="formData.contactName" placeholder="请输入联系人姓名" />
					</view>
				</view>

				<!-- 手机号 -->
				<view class="form-item required">
					<text class="label">手机号码</text>
					<view class="input-wrapper">
						<input class="input" type="number" maxlength="11" v-model="formData.phone"
							placeholder="请输入手机号码" />
					</view>
				</view>

				<!-- 身份证号 -->
				<view class="form-item required">
					<text class="label">身份证号</text>
					<view class="input-wrapper">
						<input class="input" maxlength="18" v-model="formData.idCard" placeholder="请输入身份证号码" />
					</view>
				</view>

				<!-- 年龄段 -->
				<view class="form-item">
					<text class="label">年龄段</text>
					<view class="input-wrapper">
						<picker mode="selector" :range="ageRanges" @change="onAgeRangeChange">
							<view class="picker">
								{{ formData.ageRange || '请选择年龄段' }}
							</view>
						</picker>
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
						<view class="time-period-item" :class="{ active: formData.timePeriod === 'morning' }"
							@click="onTimePeriodChange('morning')">
							<text class="period-icon">🌅</text>
							<view class="period-info">
								<text class="period-title">上午</text>
								<text class="period-time">08:00-12:00</text>
							</view>
							<view class="period-check" v-if="formData.timePeriod === 'morning'">✓</view>
						</view>
						<view class="time-period-item" :class="{ active: formData.timePeriod === 'afternoon' }"
							@click="onTimePeriodChange('afternoon')">
							<text class="period-icon">🌇</text>
							<view class="period-info">
								<text class="period-title">下午</text>
								<text class="period-time">12:00-18:00</text>
							</view>
							<view class="period-check" v-if="formData.timePeriod === 'afternoon'">✓</view>
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
						<view class="travel-type-item" :class="{ active: formData.travelType === item.value }"
							v-for="item in travelTypes" :key="item.value" @click="onTravelTypeChange(item.value)">
							<text class="travel-icon">{{ item.icon }}</text>
							<text class="travel-label">{{ item.label }}</text>
							<view class="travel-check" v-if="formData.travelType === item.value">✓</view>
						</view>
					</view>
				</view>
			</view>

			<!-- 自驾信息 -->
			<view class="form-section" v-if="formData.travelType === 'self-driving'">
				<view class="section-title">
					<text class="title-icon">🚙</text>
					<text class="title-text">车辆信息</text>
				</view>

				<!-- 车辆类型 -->
				<view class="form-item required">
					<text class="label">车辆类型</text>
					<view class="input-wrapper">
						<picker mode="selector" :range="vehicleTypes" range-key="label"
							@change="onVehicleTypeChange">
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
						<input class="input" v-model="formData.vehicleInfo.plateNumber"
							placeholder="请输入车牌号，如：京A12345" />
					</view>
				</view>

				<!-- 车辆颜色 -->
				<view class="form-item">
					<text class="label">车辆颜色</text>
					<view class="input-wrapper">
						<input class="input" v-model="formData.vehicleInfo.color" placeholder="请输入车辆颜色" />
					</view>
				</view>
			</view>

			<!-- 观光团信息 -->
			<view class="form-section" v-if="formData.travelType === 'tour-group'">
				<view class="section-title">
					<text class="title-icon">👥</text>
					<text class="title-text">观光团信息</text>
				</view>

				<!-- 旅行社名称 -->
				<view class="form-item required">
					<text class="label">旅行社名称</text>
					<view class="input-wrapper">
						<input class="input" v-model="formData.tourInfo.agencyName" placeholder="请输入旅行社名称" />
					</view>
				</view>

				<!-- 团队编号 -->
				<view class="form-item required">
					<text class="label">团队编号</text>
					<view class="input-wrapper">
						<input class="input" v-model="formData.tourInfo.groupNumber" placeholder="请输入团队编号" />
					</view>
				</view>

				<!-- 导游姓名 -->
				<view class="form-item">
					<text class="label">导游姓名</text>
					<view class="input-wrapper">
						<input class="input" v-model="formData.tourInfo.guideName" placeholder="请输入导游姓名" />
					</view>
				</view>

				<!-- 导游电话 -->
				<view class="form-item">
					<text class="label">导游电话</text>
					<view class="input-wrapper">
						<input class="input" type="number" maxlength="11" v-model="formData.tourInfo.guidePhone"
							placeholder="请输入导游电话" />
					</view>
				</view>

				<!-- 旅游大巴车牌号 -->
				<view class="form-item required">
					<text class="label">大巴车牌号</text>
					<view class="input-wrapper">
						<input class="input" v-model="formData.tourInfo.busPlateNumber"
							placeholder="请输入大巴车牌号" />
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
					<textarea class="textarea" v-model="formData.remark" placeholder="请输入备注信息（选填）"
						maxlength="200" />
					<text class="char-count">{{ formData.remark.length }}/200</text>
				</view>
			</view>
		</view>

		<!-- 提交按钮 -->
		<view class="submit-section">
			<button class="submit-btn" @click="handleSubmit">
				<text class="submit-icon">🌬️</text>
				<text>立即预约</text>
			</button>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				scenicId: '', // 景区ID，从路由参数获取
				formData: {
					personCount: 1,
					contactName: '',
					phone: '',
					idCard: '',
					ageRange: '',
					bookingDate: '',
					timePeriod: '', // morning: 上午, afternoon: 下午
					travelType: '', // shuttle-bus: 景区摆渡车, self-driving: 自驾, tour-group: 观光团
					vehicleInfo: {
						type: '',
						plateNumber: '',
						color: ''
					},
					tourInfo: {
						agencyName: '',
						groupNumber: '',
						guideName: '',
						guidePhone: '',
						busPlateNumber: ''
					},
					remark: ''
				},
				ageRanges: ['18岁以下', '18-30岁', '31-45岁', '46-60岁', '60岁以上'],
				travelTypes: [{
						label: '景区摆渡车',
						value: 'shuttle-bus',
						icon: '🚌'
					},
					{
						label: '自驾出行',
						value: 'self-driving',
						icon: '🚗'
					},
					{
						label: '观光团',
						value: 'tour-group',
						icon: '👥'
					}
				],
				vehicleTypes: [{
						label: '轿车',
						value: 'car'
					},
					{
						label: 'SUV',
						value: 'suv'
					},
					{
						label: '商务车',
						value: 'van'
					},
					{
						label: '客车',
						value: 'bus'
					}
				],
				minDate: '',
				maxDate: ''
			}
		},
		onLoad(options) {
			// 获取景区ID
			if (options.scenicId) {
				this.scenicId = options.scenicId;
			}

			// 设置日期范围（今天到3个月后）
			const today = new Date();
			const maxDay = new Date();
			maxDay.setMonth(maxDay.getMonth() + 3);

			this.minDate = this.formatDate(today);
			this.maxDate = this.formatDate(maxDay);
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
				this.formData.timePeriod = period;
			},
			// 出行方式选择
			onTravelTypeChange(value) {
				this.formData.travelType = value;
			},
			// 车辆类型选择
			onVehicleTypeChange(e) {
				this.formData.vehicleInfo.type = this.vehicleTypes[e.detail.value].value;
			},
			// 获取车辆类型标签
			getVehicleTypeLabel() {
				const type = this.vehicleTypes.find(item => item.value === this.formData.vehicleInfo.type);
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
				if (!this.formData.contactName.trim()) {
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
				if (!this.formData.timePeriod) {
					uni.showToast({
						title: '请选择预约时间段',
						icon: 'none'
					});
					return false;
				}

				// 验证出行方式
				if (!this.formData.travelType) {
					uni.showToast({
						title: '请选择出行方式',
						icon: 'none'
					});
					return false;
				}

				// 如果是自驾，验证车辆信息
				if (this.formData.travelType === 'self-driving') {
					if (!this.formData.vehicleInfo.type) {
						uni.showToast({
							title: '请选择车辆类型',
							icon: 'none'
						});
						return false;
					}
					if (!this.formData.vehicleInfo.plateNumber) {
						uni.showToast({
							title: '请输入车牌号',
							icon: 'none'
						});
						return false;
					}
					if (!this.validatePlateNumber(this.formData.vehicleInfo.plateNumber)) {
						uni.showToast({
							title: '请输入正确的车牌号',
							icon: 'none'
						});
						return false;
					}
				}

				// 如果是观光团，验证观光团信息
				if (this.formData.travelType === 'tour-group') {
					if (!this.formData.tourInfo.agencyName.trim()) {
						uni.showToast({
							title: '请输入旅行社名称',
							icon: 'none'
						});
						return false;
					}
					if (!this.formData.tourInfo.groupNumber.trim()) {
						uni.showToast({
							title: '请输入团队编号',
							icon: 'none'
						});
						return false;
					}
					if (!this.formData.tourInfo.busPlateNumber) {
						uni.showToast({
							title: '请输入大巴车牌号',
							icon: 'none'
						});
						return false;
					}
					if (!this.validatePlateNumber(this.formData.tourInfo.busPlateNumber)) {
						uni.showToast({
							title: '请输入正确的大巴车牌号',
							icon: 'none'
						});
						return false;
					}
				}

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

				// 模拟提交
				setTimeout(() => {
					uni.hideLoading();

					// 提交成功
					uni.showModal({
						title: '预约成功',
						content: '您的预约已提交，请在预约记录中查看',
						showCancel: false,
						success: () => {
							// 跳转到预约记录页面
							uni.switchTab({
								url: '/pages/booking/booking'
							});
						}
					});

					// 实际项目中，这里应该调用API提交数据
					// uni.request({
					//     url: 'your-api-url',
					//     method: 'POST',
					//     data: this.formData,
					//     success: (res) => {
					//         // 处理成功
					//     },
					//     fail: (err) => {
					//         // 处理失败
					//     }
					// });
				}, 1500);
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
