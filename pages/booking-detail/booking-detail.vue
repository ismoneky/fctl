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

			<!-- 核验二维码 - 仅已支付状态显示 -->
			<view class="form-section qr-section" v-if="formData.status === 'confirmed' && formData.verifyUrl">
				<view class="section-title">
					<text class="title-icon">🔍</text>
					<text class="title-text">入场核验</text>
				</view>
				<view class="qr-container">
					<image class="qr-code" :src="qrCodeUrl" mode="aspectFit" />
					<text class="qr-tip">请向管理员出示此二维码进行核验</text>
				</view>
			</view>
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
				formData: {
					name: '', // 联系人姓名
					phone: '', // 联系人手机号
					idCard: '', // 联系人身份证号
					bookingDate: '', // 预约日期
					timeSlot: '', // 预约时间段（morning/afternoon）
					travelMode: '', // 出行方式（scenicBus/selfDriving/tour_group）
					licensePlate: '', // 车牌号（自驾时必填）
					vehicleType: '', // 车辆类型（自驾时必填）
					tourGroupName: '', // 旅游团名称（旅游团时必填）
					tourOrderNumber: '', // 旅游团订单编号（旅游团时必填）
					personCount: 1, // 预约人数
					remarks: '', // 备注信息
					status: '', // 订单状态
					bookingId: '' // 核验链接
				},
				vehicleTypes: [{
						label: '摩托',
						value: 'wheelMotorcycle'
					},
					{
						label: '小型客车',
						value: 'smallCar'
					},
				],
			}
		},
		computed: {
			// 生成二维码图片URL
			qrCodeUrl() {
				if (!this.formData.bookingId) return '';
				// 使用微信小程序二维码生成API
				// 将核验链接编码后生成二维码图片
				const encodedUrl = encodeURIComponent(this.formData.bookingId);
				return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}`;
			}
		},
		onLoad(options) {
			if (options.bookingId) {
				this.getBookingDetail(options.bookingId);
			}
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
					} else {
						uni.showToast({
							title: '加载详情失败',
							icon: 'none'
						});
					}
				}).catch(err => {
					uni.showToast({
						title: '加载详情失败',
						icon: 'none'
					});
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
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.qr-section .section-title {
		border-bottom-color: rgba(255, 255, 255, 0.2);
	}

	.qr-section .title-text {
		color: #fff;
	}

	.qr-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 20rpx 0;
	}

	.qr-code {
		width: 400rpx;
		height: 400rpx;
		background: #fff;
		border-radius: 20rpx;
		padding: 20rpx;
		box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.2);
	}

	.qr-tip {
		margin-top: 30rpx;
		font-size: 28rpx;
		color: #fff;
		text-align: center;
	}
</style>
