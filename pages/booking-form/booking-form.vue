<template>
	<view class="container">
		<view class="form-container">
			<!-- 出行方式 + 车辆/观光团信息（前置：先选出行方式再填出行人） -->
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
					<view class="field-block" v-if="formData.vehicleType !== 'nonMotorized'">
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

			<!-- 基本信息 -->
			<view class="form-section">
				<view class="section-title">
					<view class="title-icon-wrap">
						<image class="title-icon-svg xinxi" src="/static/svg/renyuanxinxi.svg" mode="aspectFit" />
					</view>
					<text class="title-text">基本信息</text>
				</view>

				<!-- 人数选择 -->
				<view class="field-block">
					<text class="field-label required-star">预约人数</text>
					<view class="stepper-box">
						<button class="stepper-btn" @click="decreasePerson">－</button>
						<input class="stepper-input" type="number" :value="inputDisplayValue" @input="onPersonCountInput" />
						<button class="stepper-btn stepper-btn--plus" :disabled="formData.personCount >= maxPerson" :class="{ 'stepper-btn--disabled': formData.personCount >= maxPerson }" @click="increasePerson">＋</button>
					</view>
				</view>

				<!-- 动态出行人员列表 -->
				<block v-if="formData.passengers && formData.passengers.length">
				<view class="passenger-card" v-for="(p, idx) in formData.passengers" :key="idx">
					<text v-if="idx > 0" class="passenger-delete-btn" @click="removePassenger(idx)">✕</text>
					<view class="passenger-card-header">
						<text class="passenger-index">{{ idx === 0 ? '联系人（第1位）' : `第${idx + 1}位出行人` }}</text>
						<text class="passenger-quick-btn" @click="openProfilePicker(idx)">选择常用</text>
					</view>
					<view class="field-block">
						<text class="field-label required-star">姓名</text>
						<view class="input-box">
							<input class="field-input" :value="p.name" placeholder="请输入姓名" placeholder-style="color:#c8c8c8" maxlength="20" @input="onPassengerNameInput($event, idx)" @blur="onPassengerNameBlur(idx)" />
						</view>
					</view>
					<!-- 姓名匹配常用人员弱提示卡片（仅展示掩码手机号，绝不展示身份证明文） -->
					<view v-if="getProfileMatchesForIdx(idx).length === 1" class="profile-hint-card" @click="applyProfileToPassenger(getProfileMatchesForIdx(idx)[0], idx)">
						<text class="profile-hint-text">找到常用人员：{{ getProfileMatchesForIdx(idx)[0].name }} {{ maskPhone(getProfileMatchesForIdx(idx)[0].phone) }}　点击填入</text>
					</view>
					<view v-else-if="getProfileMatchesForIdx(idx).length > 1" class="profile-hint-card" @click="openProfilePicker(idx, getProfileMatchesForIdx(idx))">
						<text class="profile-hint-text">找到 {{ getProfileMatchesForIdx(idx).length }} 位同名常用人员，点击选择</text>
					</view>
					<view class="field-block">
						<text class="field-label required-star">手机号码</text>
						<view class="input-box">
							<input class="field-input" type="number" maxlength="11" v-model="p.phone" placeholder="请输入手机号码" placeholder-style="color:#c8c8c8" />
						</view>
					</view>
					<view class="field-block" style="margin-bottom:0">
						<text class="field-label required-star">身份证号</text>
						<view class="input-box">
							<input class="field-input" maxlength="18" :value="p.idCard" placeholder="请输入18位身份证号码" placeholder-style="color:#c8c8c8" @input="onIdCardInput($event, idx)" @blur="onIdCardBlur($event, idx)" />
						</view>
						<text v-if="p.idCardError" class="field-error-text">{{ p.idCardError }}</text>
					</view>
				</view>
				</block>

				<!-- 预约日期 -->
				<view class="field-block" style="margin-top:24rpx">
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

				<!-- 免费预约提示（三档优先级，由后端 preview 统一判定） -->
				<view class="free-banner" v-if="isMemberFree">
					<text class="free-banner-icon">免</text>
					<view class="free-banner-main">
						<text class="free-banner-title">会员免费</text>
						<text class="free-banner-desc">月卡会员免费预约，不限次数，不占每日免费名额</text>
					</view>
				</view>
				<view class="free-banner" v-else-if="isDailyQuotaFree">
					<text class="free-banner-icon">免</text>
					<view class="free-banner-main">
						<text class="free-banner-title">免费预约</text>
						<text class="free-banner-desc">今日前 {{ previewResult.freeQuotaInfo.limit }} 名预约免费，剩余 {{ previewResult.freeQuotaInfo.remaining }} 个名额，本次预约免费</text>
					</view>
				</view>
				<view class="free-tip free-tip--muted" v-else-if="previewResult && !previewResult.isFree && freeTipText">
					<text class="free-tip-text">{{ freeTipText }}</text>
				</view>

				<!-- 预约时间段（隐藏展示，字段保留） -->
			</view>

			<!-- 选择常用人员弹窗 -->
			<view class="modal-mask" v-if="profilePickerVisible" @click="closeProfilePicker"></view>
			<view class="profile-picker-popup" :class="{ 'profile-picker-popup--show': profilePickerVisible }">
				<view class="profile-picker-header">
					<text class="profile-picker-title">选择常用人员</text>
					<text class="profile-picker-close" @click="closeProfilePicker">✕</text>
				</view>
				<scroll-view class="profile-picker-body" scroll-y>
					<view v-if="currentPickerOptions.length === 0" class="profile-picker-empty">
						<text class="profile-picker-empty-text">暂无常用信息，请先在个人中心添加</text>
					</view>
					<view
						v-for="item in currentPickerOptions"
						:key="item.profileId"
						class="profile-picker-item"
						@click="applyProfileToPassenger(item, currentPickerIdx)"
					>
						<view class="profile-picker-item-main">
							<text class="profile-picker-name">{{ item.name }}</text>
							<text class="profile-picker-phone">{{ maskPhone(item.phone) }}</text>
						</view>
						<text class="profile-picker-idcard">{{ maskIdCard(item.idCard) }}</text>
					</view>
				</scroll-view>
			</view>
			<!-- <view class="fee-tip">
				<view class="required-star">为更好的提供出行保障，本次预约包含入园保险费用，详见<text class="fee-tip-link" @tap="goToService">《用户协议》</text></view>
			</view> -->
			<!-- 备注信息（隐藏展示，字段保留） -->
		</view>

		<!-- 底部：勾选 + 金额 + 提交按钮 -->
		<view class="submit-bar">
				<!-- 勾选项1：预约须知 -->
			<view class="agree-row" @click="agreedNotice = !agreedNotice">
				<view class="agree-checkbox" :class="{
					'agree-checkbox--checked': agreedNotice,
					'agree-checkbox--warn':    !agreedNotice && hasSubmitted,
					'agree-checkbox--flash':   flashNotice
				}">
					<text v-if="agreedNotice" class="agree-check-icon">✓</text>
				</view>
				<text class="agree-text">我已阅读并同意</text>
				<text class="agree-link" @click.stop="showNotice">《预约须知》</text>
			</view>
			<!-- 勾选项2：隐私政策+用户协议 -->
			<view class="agree-row" @click="agreedPrivacy = !agreedPrivacy">
				<view class="agree-checkbox" :class="{
					'agree-checkbox--checked': agreedPrivacy,
					'agree-checkbox--warn':    !agreedPrivacy && hasSubmitted,
					'agree-checkbox--flash':   flashPrivacy
				}">
					<text v-if="agreedPrivacy" class="agree-check-icon">✓</text>
				</view>
				<text class="agree-text">我已阅读并同意</text>
				<text class="agree-link" @click.stop="goToPrivacy">《隐私政策》</text>
				<text class="agree-text">及</text>
				<text class="agree-link" @click.stop="goToService">《用户协议》</text>
			</view>
			<view class="submit-row">
				<view class="price-info" v-if="isMemberFree">
					<view class="price-row">
						<text class="price-value price-value--free">会员免费</text>
					</view>
					<text class="price-desc">月卡会员免费预约，本次预约免费</text>
				</view>
				<view class="price-info" v-else-if="isDailyQuotaFree">
					<view class="price-row">
						<text class="price-value price-value--free">免费预约</text>
					</view>
					<text class="price-desc">每日前{{ previewResult.freeQuotaInfo.limit }}名免费</text>
				</view>
				<view class="price-info" v-else-if="previewResult && previewResult.amount != null">
					<view class="price-row">
						<text class="price-symbol">¥</text>
						<text class="price-value">{{ (previewResult.amount / 100).toFixed(2) }}</text>
					</view>
				</view>
				<view class="price-info" v-else-if="unitPrice != null">
					<view class="price-row">
						<text class="price-symbol">¥</text>
						<text class="price-value">{{ (unitPrice * formData.personCount / 100).toFixed(2) }}</text>
					</view>
				</view>
				<view class="price-info" v-else>
					<view style="flex:1"></view>
				</view>
				<button class="submit-btn" :class="{ 'submit-btn--disabled': submitting || paymentLaunching }" :disabled="submitting || paymentLaunching" @click="handleSubmit">{{ submitting ? '提交中…' : (paymentLaunching ? '支付准备中…' : '立即预约') }}</button>
			</view>
		</view>


		<!-- 预约须知浮层 -->
		<view class="notice-mask" v-if="noticeVisible" @click="noticeVisible = false"></view>
		<view class="notice-popup" :class="{ 'notice-popup--show': noticeVisible }">
			<view class="notice-popup__header">
				<text class="notice-popup__title">风车天路预约须知</text>
				<text class="notice-popup__close" @click="noticeVisible = false">✕</text>
			</view>
			<scroll-view class="notice-popup__body" scroll-y>
				<text class="notice-intro">欢迎您计划前往风车天路游览！为确保您拥有安全、愉快的游玩体验，同时保护当地生态环境与道路秩序，请您仔细阅读并遵守以下预约须知：</text>

				<text class="notice-group-title">一、预约方式</text>
				<text class="notice-body">1. 所有车辆及游客需提前通过官方指定平台（如微信公众号/小程序/APP）进行实名制预约。{{ '\n' }}2. 预约时需填写车牌号、驾驶人及随行人员身份信息、联系方式、预计通行时段。{{ '\n' }}3. 每日预约名额有限，约满即止。建议您至少提前1-3天预约，节假日请尽早安排。</text>

				<text class="notice-group-title">二、开放与通行时间</text>
				<text class="notice-body">· 开放时段：旺季（4月-10月）淡季（11月-3月）{{ '\n' }}· 最晚入园：关闭时间前1小时停止检票及车辆进入{{ '\n' }}· 如遇恶劣天气（大雾、暴雨、冰雪、强风等）、道路维护或突发情况，天路将临时关闭，已预约订单可全额退款或改期。</text>

				<text class="notice-group-title">三、车辆及驾驶要求</text>
				<text class="notice-body">1. 仅允许7座及以下小型客车和摩托、非机动车通行，拖挂车、货车禁止进入。{{ '\n' }}2. 驾驶员需有2年以上实际驾龄，且无严重交通违法记录。{{ '\n' }}3. 山路弯多坡陡，建议选择SUV或底盘较高车型；纯电动车请确保续航充足。{{ '\n' }}4. 全程限速30km/h，严禁弯道超车、占道行驶、逆向行驶。</text>

				<text class="notice-group-title">四、安全与行为规范</text>
				<text class="notice-body">1. 全程系好安全带，乘客请勿将身体探出车外或车顶天窗。{{ '\n' }}2. 禁止下车徒步穿越非指定观景台区域（部分路段临崖、落石风险）。{{ '\n' }}3. 观景台停车请有序入位，严禁在弯道、坡道、窄路边停车拍照或赏景。{{ '\n' }}4. 严禁携带易燃易爆物品、无人机（除提前获批的航拍许可外）、宠物（需全程放在车内且不扰他人）。{{ '\n' }}5. 禁止明火、野炊、露营、吸烟（含电子烟）—— 山区防火，至关重要。</text>

				<text class="notice-group-title">五、天气与穿着建议</text>
				<text class="notice-body">· 天路海拔较高，气温比山下低5-10℃，且天气多变。建议携带外套、雨具、防晒用品。{{ '\n' }}· 若遇大雾或强侧风，请开启雾灯/双闪，减速并保持在车道中间行驶。</text>

				<text class="notice-group-title">六、费用与退改</text>
				<text class="notice-body">· 取消与退款规则：{{ '\n' }}  · 在预约日的前一天（含）之前申请取消，可全额退款。{{ '\n' }}  · 在预约日当天、且尚未完成核验（核验指入口处扫码验证或车牌识别入园）之前申请取消，也可全额退款。{{ '\n' }}  · 一旦完成核验（即车辆及人员已进入风车天路景区），无论是否完整游览，均不予退款。{{ '\n' }}  · 超过预约日期未使用（未在预约日当天开放时段内完成核验），视为自动放弃，不予退款。{{ '\n' }}· 因恶劣天气、道路封闭等不可抗力导致天路临时关闭，已预约订单可联系工作人员。{{ '\n' }}· 须知最终解释权归河南省云玺旅游有限公司所有，内容如有调整以最新公告为准。</text>

				<text class="notice-group-title">七、环保与文明游览</text>
				<text class="notice-body">1. 请自觉带走所有垃圾（车内请自备垃圾袋）。天路沿线不设垃圾桶。{{ '\n' }}2. 禁止采摘花草、挖掘植物、惊扰野生动物。{{ '\n' }}3. 请勿使用音响外放、大声喧哗，共同维护宁静的自然环境。</text>

				<text class="notice-group-title">八、责任声明</text>
				<text class="notice-body">进入风车天路即表示您已知晓并自愿承担户外自驾活动可能存在的风险（包括但不限于落石、侧风、路面湿滑、野生动物突发等）。如因违反本须知规定或因自身疾病、操作不当等引发的人身或财产损害，责任由游客自行承担。管理方已尽安全提示义务，将提供必要协助但不承担直接赔偿。</text>

				<text class="notice-group-title">九、咨询与紧急联络</text>
				<text class="notice-body">· 预约及票务咨询：18639220123（工作时间 09:00-18:00）{{ '\n' }}· 投诉建议：18639220123</text>

				<text class="notice-footer">感谢您的配合与理解。让我们一起守护风车天路的纯净与壮美，平安出行，尽兴而归！</text>
			</scroll-view>
		</view>
	</view>
</template>

<script>
import {
	request
} from '../../utils/request';
import { handlePayment } from '../../utils/payment';
import { validateIdCard as validateIdCardStrict } from '../../utils/validator';
import { normalizeIdCardInput, getIdCardError } from '../../utils/id-card-input.js';
import { findExactProfileMatches } from '../../utils/profile-matcher.js';

export default {
	data() {
		return {
			id: '',
			formData: {
				passengers: [{ name: '', phone: '', idCard: '', idCardError: '' }], // 出行人员列表
				bookingDate: '',
				timeSlot: 'morning',
				travelMode: 'selfDriving',
				licensePlate: '',
				vehicleType: 'smallCar',
				tourGroupName: '',
				tourOrderNumber: '',
				personCount: 1,
				remarks: ''
			},
			inputDisplayValue: 1,
			profileList: [], // 常用人员列表（全部，主动“选择常用”时展示）
			profilePickerVisible: false, // 选择常用人员弹窗
			currentPickerIdx: 0, // 当前正在填写的人员索引
			profilePickerOptions: null, // 弹层展示的候选列表；null 时用全部 profileList，同名匹配时传筛选后的子集
			profileMatchesByIndex: [], // 每位出行人按姓名匹配到的常用人员数组（与 passengers 同长，避免删除/插位时 key 残留串位）
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
				{ label: '非机动车', value: 'nonMotorized' },
			],
			minDate: '',
			maxDate: '',
			_lastClickTime: 0,  // 防抖时间戳
			_previewSeq: 0,     // preview 竞态序号，回调比对丢弃过期请求
			_previewTimer: null, // preview debounce 定时器
			unitPrice: 660,     // 单人金额（分），从 payment-config 兜底获取，preview 未就绪时展示金额
			previewResult: null, // 后端费用预览结果（isFree/freeReason/reason/amount/freeQuotaInfo/memberInfo）
			agreedNotice: false,  // 是否同意预约须知
			agreedPrivacy: false, // 是否同意隐私政策和用户协议
			noticeVisible: false, // 预约须知弹层显示
			flashNotice: false,   // 预约须知勾选框闪烁
			flashPrivacy: false,  // 隐私协议勾选框闪烁
			hasSubmitted: false,  // 是否点击过提交（用于触发常亮红边）
			submitting: false,       // 正在创建预约订单
			paymentLaunching: false  // 正在准备支付
		}
	},
	computed: {
		// 弹层当前展示的候选列表：同名匹配时用筛选子集，否则用全部常用人员
		currentPickerOptions() {
			return Array.isArray(this.profilePickerOptions) ? this.profilePickerOptions : (this.profileList || []);
		},
		// 会员免费：preview 判定为会员免费
		isMemberFree() {
			return !!(this.previewResult && this.previewResult.isFree && this.previewResult.freeReason === 'member');
		},
		// 每日名额免费：preview 判定为每日免费名额命中
		isDailyQuotaFree() {
			return !!(this.previewResult && this.previewResult.isFree && this.previewResult.freeReason === 'dailyQuota');
		},
		// 当前车辆类型允许的最大人数：摩托2 / 小客车7 / 其余10
		maxPerson() {
			const v = this.formData.vehicleType;
			if (v === 'wheelMotorcycle') return 2;
			if (v === 'smallCar') return 7;
			return 10;
		},
		// 不能免费时的提示文案（按 reason 驱动）
		freeTipText() {
			if (!this.previewResult || this.previewResult.isFree) return '';
			const map = {
				member_idcard_not_matched: '乘客身份证与会员记录不一致，本次预约需支付',
				member_plate_not_matched: '车牌号与会员记录不一致，本次预约需支付',
				daily_quota_used: '您今日已享受过免费预约，本次预约需支付',
				daily_quota_full: '今日免费名额已用完，本次预约需支付',
				not_today: '每日免费名额仅限预约当天有效，选择其他日期需正常支付',
			};
			// no_free_activity（免费活动未开启）不展示提示，活动对用户隐藏，仅由价格区展示应付金额
			return map[this.previewResult.reason] || '';
		}
	},
	onLoad(options) {
		// 设置日期范围（今天到3个月后，最小不低于8月10号）
		let today = new Date();
		const maxDay = new Date();
		maxDay.setMonth(maxDay.getMonth() + 3);
		const startTime = new Date('2026-08-10').getTime();
		const todayTime = new Date().getTime();
		if (todayTime < startTime) {
			today = new Date('2026-08-10')
		}
		this.minDate = this.formatDate(today);
		this.maxDate = this.formatDate(maxDay);
		// 检查是否携带 bookingId 参数
		if (options.bookingId) {
			this.getBookingDetail(options.bookingId);
		}
		// 获取支付金额配置（用于 preview 未就绪时的金额兜底展示）
		request({ method: 'GET', url: '/system-config/payment-config' }).then(res => {
			if (res.data?.paymentAmount != null) {
				this.unitPrice = res.data.paymentAmount;
			}
		}).catch(() => {});
		// 费用预览（后端为唯一事实来源，统一替代 /member/status + /member/verify + /bookings/free-quota/status）
		this.fetchPreview();
		// 预加载常用人员列表
		this.fetchProfiles();
		// 温馨提示弹窗（内容由后台系统配置，开关关闭则不弹）
		request({ method: 'GET', url: '/system-config/notice' }).then(res => {
			if (res.data && res.data.enabled && res.data.content) {
				setTimeout(() => {
					uni.showModal({
						title: '温馨提示',
						content: res.data.content,
						confirmText: '我知道了',
						showCancel: false
					});
				}, 800);
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
		// 同步 passengers 数组长度与 personCount
		syncPassengers(count) {
			const current = this.formData.passengers;
			if (count > current.length) {
				for (let i = current.length; i < count; i++) {
					current.push({ name: '', phone: '', idCard: '', idCardError: '' });
				}
			} else if (count < current.length) {
				current.splice(count);
			}
			// 同步匹配状态长度，新增位补空数组，减少位截断
			if (this.profileMatchesByIndex.length < current.length) {
				for (let i = this.profileMatchesByIndex.length; i < current.length; i++) {
					this.profileMatchesByIndex.push([]);
				}
			} else if (this.profileMatchesByIndex.length > current.length) {
				this.profileMatchesByIndex.splice(current.length);
			}
		},
		// 人数增加
		increasePerson() {
			if (this.formData.personCount < this.maxPerson) {
				this.formData.personCount++;
				this.inputDisplayValue = this.formData.personCount;
				this.syncPassengers(this.formData.personCount);
			}
		},
		// 删除指定出行人
		removePassenger(idx) {
			this.formData.passengers.splice(idx, 1);
			this.formData.personCount = this.formData.passengers.length;
			// 同步删除该位匹配状态，避免后续出行人串位
			this.profileMatchesByIndex.splice(idx, 1);
			// 乘客变化后重新预览费用
			this.fetchPreview();
		},
		// 人数减少
		decreasePerson() {
			if (this.formData.personCount > 1) {
				this.formData.personCount--;
				this.inputDisplayValue = this.formData.personCount;
				this.syncPassengers(this.formData.personCount);
				// 乘客减少后重新预览费用
				this.fetchPreview();
			}
		},
		// 人数输入
		onPersonCountInput(e) {
			let value = parseInt(e.detail.value) || 1;
			if (value < 1) value = 1;
			if (value > this.maxPerson) value = this.maxPerson;
			// 人数减少会移除乘客，需重新预览费用
			if (value < this.formData.personCount) {
				this.formData.personCount = value;
				this.inputDisplayValue = value;
				this.syncPassengers(value);
				this.fetchPreview();
				return;
			}
			this.formData.personCount = value;
			this.inputDisplayValue = value;
			this.syncPassengers(value);
		},
		// 获取常用人员列表
		async fetchProfiles() {
			try {
				const res = await request({ method: 'GET', url: '/users/profiles' });
				if (res.success) this.profileList = Array.isArray(res.data) ? res.data : [];
			} catch (e) {}
		},
		// 打开选择常用人员弹窗；options 可选，传入时弹层只展示该子集（同名匹配场景），不传展示全部
		openProfilePicker(idx, options) {
			this.currentPickerIdx = idx;
			this.profilePickerOptions = Array.isArray(options) ? options : null;
			this.profilePickerVisible = true;
		},
		closeProfilePicker() {
			this.profilePickerVisible = false;
			this.profilePickerOptions = null;
		},
		// 统一填入函数：主动“选择常用”与同名匹配弱提示都走这里
		// 仅写入 item 的字段；不自动覆盖用户已手动填写的手机号或身份证号（弱提示仅在两者均空时出现，故此处安全）
		applyProfileToPassenger(item, idx) {
			const p = this.formData.passengers[idx];
			if (!p || !item) return;
			this.$set(p, 'name', item.name || p.name);
			this.$set(p, 'phone', item.phone || p.phone);
			this.$set(p, 'idCard', item.idCard || p.idCard);
			this.$set(p, 'idCardError', getIdCardError(normalizeIdCardInput(p.idCard || '')));
			// 填入后清理该索引匹配状态、关闭弹层
			this.$set(this.profileMatchesByIndex, idx, []);
			this.profilePickerVisible = false;
			this.profilePickerOptions = null;
			// 非阻塞 Toast 提示已填入（不超过 1.5 秒）
			uni.showToast({ title: '已填入常用信息', icon: 'none', duration: 1500 });
			// 乘客信息变化后重新预览费用
			this.fetchPreview();
		},
		// 姓名输入：更新姓名并立即清除该索引匹配结果
		onPassengerNameInput(e, idx) {
			const p = this.formData.passengers[idx];
			if (!p) return;
			const raw = (e && e.detail && e.detail.value != null) ? e.detail.value : '';
			this.$set(p, 'name', raw);
			// 姓名变化后立即清除该出行人上一轮匹配结果
			if (this.profileMatchesByIndex[idx] && this.profileMatchesByIndex[idx].length) {
				this.$set(this.profileMatchesByIndex, idx, []);
			}
		},
		// 姓名失焦：仅在手机号与身份证号均为空时建立匹配结果，避免覆盖用户已手动填写的内容
		onPassengerNameBlur(idx) {
			const p = this.formData.passengers[idx];
			if (!p) return;
			const nameTrimmed = String(p.name || '').trim();
			// 只输入一个字或空姓名不提示（设计要求不做单字匹配提示；这里用 trim 后非空即尝试，纯函数内已做完全相等判断）
			if (!nameTrimmed) {
				this.$set(this.profileMatchesByIndex, idx, []);
				return;
			}
			// 手机号或身份证号已有手动内容时不出现弱提示
			if ((p.phone && String(p.phone).trim()) || (p.idCard && String(p.idCard).trim())) {
				this.$set(this.profileMatchesByIndex, idx, []);
				return;
			}
			const matches = findExactProfileMatches(this.profileList, p.name);
			this.$set(this.profileMatchesByIndex, idx, matches);
		},
		// 取某位出行人的匹配结果（模板用）
		getProfileMatchesForIdx(idx) {
			const m = this.profileMatchesByIndex[idx];
			return Array.isArray(m) ? m : [];
		},
		// 遮罩手机号：138****1234
		maskPhone(phone) {
			if (!phone) return '';
			const s = String(phone);
			if (s.length < 7) return s;
			return s.substring(0, 3) + '****' + s.substring(s.length - 4);
		},
		// 遮罩身份证号
		maskIdCard(idCard) {
			if (!idCard || idCard.length < 8) return idCard;
			return idCard.substring(0, 4) + '**********' + idCard.substring(idCard.length - 4);
		},
		// 年龄段选择
		onAgeRangeChange(e) {
			this.formData.ageRange = this.ageRanges[e.detail.value];
		},
		// 日期选择
		onDateChange(e) {
			this.formData.bookingDate = e.detail.value;
			// 切换日期后重新预览费用（仅当天可享受每日免费名额）
			this.fetchPreview();
		},
		// 费用预览：后端为唯一事实来源，传入当前乘客与预约日期，返回完整费用与免费判定
		// 竞态锁：序号法（每次自增，回调比对丢弃过期请求）+ 100ms debounce 合并连续输入
		fetchPreview() {
			const ps = this.formData.passengers || [];
			// 前置校验：所有乘客字段完整 + 身份证强校验通过 + 日期已选，才发请求
			const allComplete = ps.length > 0 && ps.every(p =>
				p.name && p.name.trim() && this.validatePhone(p.phone) && p.idCard && this.validateIdCard(p.idCard)
			);
			if (!allComplete || !this.formData.bookingDate) {
				this.previewResult = null;  // 退回兜底展示
				return;
			}
			const seq = ++this._previewSeq;
			clearTimeout(this._previewTimer);
			this._previewTimer = setTimeout(() => {
				request({
					method: 'POST',
					url: '/bookings/preview',
					data: {
						passengers: ps,
						bookingDate: this.formData.bookingDate,
						travelMode: this.formData.travelMode,
						vehicleType: this.formData.vehicleType,
						licensePlate: this.formData.licensePlate || undefined,
					}
				}).then(res => {
					// 过期请求结果丢弃，保证 UI 对应最新输入
					if (seq !== this._previewSeq) return;
					this.previewResult = (res && res.success && res.data) ? res.data : null;
				}).catch(() => {
					if (seq !== this._previewSeq) return;
					this.previewResult = null;
				});
			}, 100);
		},
		// 身份证输入：归一化（去空格/全角数字/全角X）并立即清除上一轮红色错误状态
		// 使用 :value + @input 显式写回，避免 v-model 与事件回调时序不一致
		onIdCardInput(e, idx) {
			const p = this.formData.passengers[idx];
			if (!p) return;
			const raw = (e && e.detail && e.detail.value != null) ? e.detail.value : '';
			const normalized = normalizeIdCardInput(raw);
			this.$set(p, 'idCard', normalized);
			// 输入值变化后立即清除上一轮错误，不能让用户改对后仍看到旧错误
			if (p.idCardError) {
				this.$set(p, 'idCardError', '');
			}
		},
		// 身份证失焦：按错误分类设置提示；通过时清空错误并调用 fetchPreview()
		onIdCardBlur(e, idx) {
			const p = this.formData.passengers[idx];
			if (!p) return;
			const normalized = normalizeIdCardInput(p.idCard || '');
			this.$set(p, 'idCard', normalized);
			const err = getIdCardError(normalized);
			this.$set(p, 'idCardError', err);
			// 校验通过时才重新预览费用；避免无效输入触发后端请求
			if (!err) {
				this.fetchPreview();
			}
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
			if (this.formData.vehicleType === 'nonMotorized') {
				this.formData.licensePlate = '';
			}
			// 切换车型后人数可能超限（摩托2/小客车7），自动夹紧到上限并同步乘客
			if (this.formData.personCount > this.maxPerson) {
				this.formData.personCount = this.maxPerson;
				this.inputDisplayValue = this.formData.personCount;
				this.syncPassengers(this.formData.personCount);
			}
			// 出行方式/车型变化后重新预览费用（会员免费仅摩托车命中）
			this.fetchPreview();
		},
		// 显示车牌键盘
		showPlateKeyboard() {
			this.$refs.plateKeyboard.toShow(this.formData.licensePlate);
		},
		// 车牌号确认
		onPlateConfirm(value) {
			this.formData.licensePlate = value;
			// 车牌变化后重新预览费用（会员命中需车牌匹配）
			this.fetchPreview();
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
			// 出行方式变化后重新预览费用（会员免费仅自驾+摩托车命中）
			this.fetchPreview();
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
		// 验证身份证号（含 18 位校验码 ISO 7064 MOD-11-2 校验，复用 utils/validator 强校验版本）
		validateIdCard(idCard) {
			return validateIdCardStrict(idCard);
		},
		// 验证车牌号
		validatePlateNumber(plateNumber) {
			const reg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{4,5}[A-Z0-9挂学警港澳]$/;
			return reg.test(plateNumber);
		},
		// 表单验证
		validateForm() {
			if (!this.formData.personCount || this.formData.personCount < 1) {
				uni.showToast({ title: '请输入预约人数', icon: 'none' });
				return false;
			}

			// 验证每位出行人员
			for (let i = 0; i < this.formData.passengers.length; i++) {
				const p = this.formData.passengers[i];
				const label = i === 0 ? '联系人' : `第${i + 1}位出行人`;
				if (!p.name || !p.name.trim()) {
					uni.showToast({ title: `请输入${label}姓名`, icon: 'none' });
					return false;
				}
				if (!p.phone || !this.validatePhone(p.phone)) {
					uni.showToast({ title: `请输入${label}正确的手机号`, icon: 'none' });
					return false;
				}
				if (!p.idCard || !this.validateIdCard(p.idCard)) {
					uni.showToast({ title: `请输入${label}正确的身份证号`, icon: 'none' });
					return false;
				}
			}

			if (!this.formData.bookingDate) {
				uni.showToast({ title: '请选择预约日期', icon: 'none' });
				return false;
			}

			if (this.formData.travelMode === 'selfDriving') {
				if (!this.formData.vehicleType) {
					uni.showToast({ title: '请选择车辆类型', icon: 'none' });
					return false;
				}
				if (this.formData.vehicleType !== 'nonMotorized') {
					if (!this.formData.licensePlate) {
						uni.showToast({ title: '请输入车牌号', icon: 'none' });
						return false;
					}
					if (!this.validatePlateNumber(this.formData.licensePlate)) {
						uni.showToast({ title: '请输入正确的车牌号', icon: 'none' });
						return false;
					}
				}
			}

			return true;
		},
		// 触发指定勾选框闪烁（动画结束后由 warn 常亮接管）
		triggerFlash(field) {
			this[field] = true;
			setTimeout(() => { this[field] = false; }, 1000);
		},
		// 显示预约须知
		showNotice() {
			this.noticeVisible = true;
		},
		goToPrivacy() {
			uni.navigateTo({ url: '/pages/privacy/privacy' });
		},
		goToService() {
			uni.navigateTo({ url: '/pages/service/service' });
		},
		// 提交表单
		handleSubmit() {
			// submitting 或 paymentLaunching 为 true 时直接返回，按钮处于禁用状态
			if (this.submitting || this.paymentLaunching) return;

			// 协议校验（优先级最高）
			if (!this.agreedNotice || !this.agreedPrivacy) {
				this.hasSubmitted = true;
				if (!this.agreedNotice) this.triggerFlash('flashNotice');
				if (!this.agreedPrivacy) this.triggerFlash('flashPrivacy');
				const missing = !this.agreedNotice && !this.agreedPrivacy
					? '请先阅读并同意预约须知、隐私政策及用户协议'
					: !this.agreedNotice
						? '请先阅读并同意预约须知'
						: '请先阅读并同意隐私政策及用户协议';
				uni.showToast({ title: missing, icon: 'none', duration: 2000 });
				return;
			}

			// 验证表单
			if (!this.validateForm()) {
				return;
			}

			// 开始创建订单
			this.submitting = true;

			// 快照提交前的 preview 状态，用于判定是否需要二次确认（preview 免费 vs 创建收费）
			const previewSnapshot = this.previewResult;
			const submitData = {
				passengers: this.formData.passengers,
				bookingDate: this.formData.bookingDate,
				timeSlot: this.formData.timeSlot,
				travelMode: this.formData.travelMode,
				licensePlate: this.formData.licensePlate || undefined,
				vehicleType: this.formData.vehicleType || undefined,
				tourGroupName: this.formData.tourGroupName || undefined,
				tourOrderNumber: this.formData.tourOrderNumber || undefined,
				personCount: this.formData.personCount,
				remarks: this.formData.remarks || '',
				wechatOpenId: uni.getStorageSync('openid'),
				isAdmin: uni.getStorageSync('isAdmin') === true,
			};
			request({
				method: 'POST',
				url: '/bookings',
				data: submitData
			}).then(res => {
				if (res.success) {
					const booking = res.data;
					// 免费订单（月卡会员 / 每日免费名额）直接确认生效，无需支付
					if (booking && booking.isFree) {
						// 保持禁用，等待跳转订单详情
						uni.showToast({ title: '预约成功', icon: 'success' });
						setTimeout(() => {
							uni.reLaunch({ url: `/pages/booking-detail/booking-detail?bookingId=${booking.bookingId}` });
						}, 800);
						return;
					}
					// 收费订单：由 submitting 交接给 paymentLaunching
					// 若提交前 preview 显示免费，说明免费条件已变化，需二次确认
					const wasFreeInPreview = !!(previewSnapshot && previewSnapshot.isFree);
					if (wasFreeInPreview) {
						// 弹出确认框期间保持 submitting=true
						this.confirmPaidBookingAfterFreeChange(booking, previewSnapshot);
					} else {
						// preview 本就收费，金额一致，直接交接给 paymentLaunching
						this.submitting = false;
						this.handlePayment(booking.bookingId, booking.bookingId);
					}
				} else {
					// 创建失败：恢复 submitting
					this.submitting = false;
                                    uni.showModal({
                                        title: "预约失败",
                                        content: res.message || '预约失败，请稍后再试',
                                        showCancel: false,
                                        confirmText: "我知道了",
                                    });
				}
			}).catch(err => {
				// 创建失败：恢复 submitting
				this.submitting = false;
                                uni.showModal({
                                    title: "预约失败",
                                    content: (err.data && err.data.message) || '预约失败，请稍后再试',
                                    showCancel: false,
                                    confirmText: "我知道了",
                                });
			});
		},
		// 二次确认：preview 显示免费但提交后实际收费，弹窗告知用户免费条件已变化
		// 文案按 preview 时的 freeReason 动态生成；确认→交接给 paymentLaunching，取消→直接进入订单详情
		confirmPaidBookingAfterFreeChange(booking, previewSnapshot) {
			const amountYuan = (booking.amount / 100).toFixed(2);
			let content = `免费条件已变化，本次预约需支付 ¥${amountYuan}，是否继续？`;
			if (previewSnapshot.freeReason === 'member') {
				content = `会员免费条件不再满足（可能会员已过期或乘客身份证未匹配），本次预约需支付 ¥${amountYuan}，是否继续？`;
			} else if (previewSnapshot.freeReason === 'dailyQuota') {
				content = `今日免费名额已被抢完，本次预约需支付 ¥${amountYuan}，是否继续？`;
			}
			uni.showModal({
				title: '免费条件已变化',
				content,
				confirmText: '继续支付',
				cancelText: '取消订单',
				success: (modalRes) => {
					if (modalRes.confirm) {
						// 确认支付：submitting 交接给 paymentLaunching
						this.submitting = false;
						this.handlePayment(booking.bookingId, booking.bookingId);
					} else {
						// 用户取消订单，恢复 submitting，跳转到详情页
						this.submitting = false;
						uni.redirectTo({ url: `/pages/booking-detail/booking-detail?bookingId=${booking.bookingId}` });
					}
				}
			});
		},
		// 处理支付（使用公共方法）
		// 微信支付面板关闭后只查一次状态：已支付→onSuccess跳转详情，未支付→catch也进入详情
		handlePayment(bookingId, detailBookingId) {
			if (this.paymentLaunching) return;
			this.paymentLaunching = true;

			const onSuccess = (id) => {
				// 已支付：跳转到订单详情
				uni.reLaunch({ url: `/pages/booking-detail/booking-detail?bookingId=${detailBookingId || id}` });
			};

			handlePayment(bookingId, onSuccess)
				.catch(() => {
					// 未支付/查询失败/准备失败：直接进入订单详情
					uni.reLaunch({ url: `/pages/booking-detail/booking-detail?bookingId=${detailBookingId || bookingId}` });
				})
				.finally(() => {
					this.paymentLaunching = false;
				});
		},
		// 获取预约详情（回显）
		getBookingDetail(bookingId) {
			request({
				method: 'GET',
				url: `/bookings/${bookingId}`
			}).then(res => {
				if (res.success && res.data) {
					const d = res.data;
					this.formData.personCount = d.personCount || 1;
					// 优先使用 passengers 字段回显，否则用兼容字段
					if (d.passengers) {
						try {
							const list = typeof d.passengers === 'string' ? JSON.parse(d.passengers) : d.passengers;
							this.formData.passengers = Array.isArray(list) && list.length > 0 ? list : [{ name: d.name || '', phone: d.phone || '', idCard: d.idCard || '' }];
						} catch(e) {
							this.formData.passengers = [{ name: d.name || '', phone: d.phone || '', idCard: d.idCard || '' }];
						}
					} else {
						this.formData.passengers = [{ name: d.name || '', phone: d.phone || '', idCard: d.idCard || '' }];
					}
					this.syncPassengers(this.formData.personCount);
					this.inputDisplayValue = this.formData.personCount;
					// 切换订单/重新进入页面时清空旧匹配状态
					this.profileMatchesByIndex = this.formData.passengers.map(() => []);
					this.formData.licensePlate = d.licensePlate || '';
					this.formData.vehicleType = d.vehicleType || 'smallCar';
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
	background-color: #f5f8fa;
	padding-bottom: 200rpx;
	box-sizing: border-box;
}

/* ===== 顶部 header ===== */
.page-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	padding: 28rpx 30rpx 20rpx;
	background: #f5f8fa;
}

.header-left {
	display: flex;
	flex-direction: column;
}

.header-title {
	font-size: 36rpx;
	font-weight: 700;
	color: #2F6E8E;
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
	background: #f0f7fb;
	border-radius: 28rpx;
	padding: 8rpx 16rpx;
	gap: 4rpx;
	flex-shrink: 0;
}

.notice-icon {
	font-size: 24rpx;
	color: #3F99F6;
}

.notice-text {
	font-size: 26rpx;
	color: #3F99F6;
	font-weight: 500;
}

.notice-arrow {
	font-size: 24rpx;
	color: #3F99F6;
	font-weight: 300;
}

.form-container {
	padding: 24rpx;
	box-sizing: border-box;
	padding-bottom: 100rpx;
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
	color: #2F6E8E;
}

/* ===== 出行人员卡片 ===== */
.passenger-card {
	margin: 0 24rpx 20rpx;
	background: #f5f8fa;
	border-radius: 16rpx;
	padding: 20rpx 20rpx 24rpx;
	border: 1.5rpx solid #E6E6E6;
	position: relative;
}

.passenger-card .field-block {
	padding: 0;
	margin-bottom: 20rpx;
}

.passenger-card-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 20rpx;
}

.passenger-index {
	font-size: 26rpx;
	font-weight: 700;
	color: #3F99F6;
}

.passenger-quick-btn {
	font-size: 24rpx;
	color: #2F6E8E;
	border: 1.5rpx solid #2F6E8E;
	padding: 8rpx 24rpx;
	border-radius: 8rpx;
}

.passenger-delete-btn {
	position: absolute;
	top: -18rpx;
	right: -18rpx;
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	background: #ff4757;
	color: #fff;
	font-size: 26rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10;
}

/* ===== 选择常用人员弹窗 ===== */
.profile-picker-popup {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	background: #fff;
	border-radius: 32rpx 32rpx 0 0;
	box-shadow: 0 -8rpx 40rpx rgba(0, 0, 0, 0.15);
	z-index: 201;
	transform: translateY(100%);
	transition: transform 0.3s ease;
	max-height: 70vh;
	display: flex;
	flex-direction: column;
	padding-bottom: env(safe-area-inset-bottom);
}

.profile-picker-popup--show {
	transform: translateY(0);
}

.profile-picker-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 36rpx 40rpx 24rpx;
	border-bottom: 1.5rpx solid #f0f0f0;
	flex-shrink: 0;
}

.profile-picker-title {
	font-size: 34rpx;
	font-weight: 700;
	color: #2F6E8E;
}

.profile-picker-close {
	font-size: 36rpx;
	color: #999;
	padding: 8rpx;
}

.profile-picker-body {
	flex: 1;
	overflow: hidden;
	height: 0;
}

.profile-picker-empty {
	padding: 60rpx 40rpx;
	text-align: center;
}

.profile-picker-empty-text {
	font-size: 28rpx;
	color: #bbb;
}

.profile-picker-item {
	padding: 28rpx 40rpx;
	border-bottom: 1.5rpx solid #f5f5f5;
}

.profile-picker-item-main {
	display: flex;
	align-items: center;
	gap: 20rpx;
	margin-bottom: 8rpx;
}

.profile-picker-name {
	font-size: 30rpx;
	font-weight: 700;
	color: #2F6E8E;
}

.profile-picker-phone {
	font-size: 26rpx;
	color: #666;
}

.profile-picker-idcard {
	font-size: 24rpx;
	color: #999;
}

/* ===== 两列行（已弃用，保留避免样式报错） ===== */
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

/* ===== 字段错误提示文字 ===== */
.field-error-text {
	display: block;
	font-size: 26rpx;
	color: #e64340;
	margin-top: 8rpx;
	line-height: 1.4;
}

/* ===== 姓名匹配常用人员弱提示卡片 ===== */
.profile-hint-card {
	display: flex;
	flex-direction: row;
	align-items: center;
	margin-top: 12rpx;
	margin-bottom: 24rpx;
	padding: 20rpx 24rpx;
	background-color: #2F6E8E;
	border-radius: 12rpx;
}
.profile-hint-text {
	font-size: 26rpx;
	color: #ffffff;
	font-weight: 500;
	line-height: 1.4;
	flex: 1;
}

.required-star::before {
	content: '* ';
	color: #e53935;
}

/* ===== 输入框容器 ===== */
.input-box {
	width: 100%;
	height: 80rpx;
	border: 1.5rpx solid #E6E6E6;
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
	color: #2F6E8E;
	background: transparent;
	border: none;
	padding: 0;
}

/* ===== Picker 显示文本 ===== */
.picker-text {
	flex: 1;
	font-size: 28rpx;
	color: #333;
}

.picker-text--filled {
	color: #333;
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

/* ===== 免费预约提示 ===== */
.free-banner {
	display: flex;
	align-items: center;
	margin: 0 24rpx 24rpx;
	padding: 20rpx 26rpx;
	background: linear-gradient(135deg, #eaf4fe 0%, #e7faf5 100%);
	border: 1.5rpx solid #c5e1fb;
	border-radius: 16rpx;
}

.free-banner-icon {
	width: 56rpx;
	height: 56rpx;
	line-height: 56rpx;
	text-align: center;
	border-radius: 12rpx;
	background: linear-gradient(135deg, #3F99F6 0%, #33C5A0 100%);
	color: #fff;
	font-size: 28rpx;
	font-weight: 700;
	margin-right: 20rpx;
	flex-shrink: 0;
}

.free-banner-main {
	display: flex;
	flex-direction: column;
	flex: 1;
}

.free-banner-title {
	font-size: 30rpx;
	font-weight: 700;
	color: #3F99F6;
	margin-bottom: 6rpx;
}

.free-banner-desc {
	font-size: 24rpx;
	color: #7a9ab8;
	line-height: 1.5;
}

.free-tip {
	margin: 0 24rpx 24rpx;
	padding: 22rpx 28rpx;
	border-radius: 12rpx;
}

.free-tip--muted {
	background: #f5f6f8;
	border: 1.5rpx solid #e8e8e8;
}

.free-tip-text {
	font-size: 28rpx;
	color: #999;
	line-height: 1.6;
}

/* ===== 步进器 ===== */
.stepper-box {
	width: 100%;
	height: 80rpx;
	border: 1.5rpx solid #E6E6E6;
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
	color: #3F99F6;
	font-size: 36rpx;
	border: none;
	padding: 0;
	margin: 0;
	flex-shrink: 0;
}

.stepper-btn--plus {
	color: #3F99F6;
}

.stepper-btn--disabled {
	color: #c8c8c8 !important;
	background: #f0f0f0;
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
	color: #2F6E8E;
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
	border: 1.5rpx solid #E6E6E6;
	border-radius: 14rpx;
	background: #fff;
	box-sizing: border-box;
}

.time-item--active {
	border-color: #3F99F6;
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
	color: #3F99F6;
}

.time-item__sub {
	font-size: 26rpx;
	color: #aaa;
}

.time-item__sub--active {
	color: #3F99F6;
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
	background: #3F99F6;
	border-color: #3F99F6;
}

.radio-check {
	font-size: 24rpx;
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
	color: #333;
}

.travel-select-value--filled {
	color: #333;
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
	border: 1.5rpx solid #E6E6E6;
	border-radius: 12rpx;
	font-size: 28rpx;
	color: #2F6E8E;
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

.fee-tip {
	display: block;
	font-size: 26rpx;
	color: #999;
	padding: 0rpx 0 20rpx 0;
	line-height: 40rpx;
}

.fee-tip-link {
	font-size: 24rpx;
	color: #3F99F6;
}

/* 勾选行 */
.agree-row {
	display: flex;
	align-items: center;
	margin-bottom: 10rpx;
	margin-top: 2rpx;
}

.agree-checkbox--warn {
	border-color: #ff4757 !important;
}

@keyframes flash-red {
	0%, 100% { border-color: #ff4757; background: #fff; }
	50%       { border-color: #ff4757; background: rgba(255, 71, 87, 0.15); }
}

.agree-checkbox--flash {
	border-color: #ff4757 !important;
	animation: flash-red 0.5s ease-in-out 2;
}

.agree-checkbox {
	width: 36rpx;
	height: 36rpx;
	border-radius: 8rpx;
	border: 2rpx solid #E6E6E6;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 12rpx;
	flex-shrink: 0;
	background: #fff;
}

.agree-checkbox--checked {
	background: #3F99F6;
	border-color: #3F99F6;
}

.agree-check-icon {
	font-size: 24rpx;
	color: #fff;
	font-weight: bold;
}

.agree-text {
	font-size: 26rpx;
	color: #666;
}

.agree-text--warn {
	color: #e53935;
	font-weight: 500;
	font-size: 24rpx;
}

.agree-link {
	font-size: 26rpx;
	color: #3F99F6;
	font-weight: 500;
}

/* 金额+按钮行 */
.submit-row {
	display: flex;
	align-items: center;
	justify-content: flex-end;
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
	color: #3F99F6;
	font-weight: 600;
	line-height: 1;
}

.price-value {
	font-size: 56rpx;
	color: #3F99F6;
	font-weight: 700;
	line-height: 1;
}

.price-value--free {
	font-size: 44rpx;
	color: #3F99F6;
}

.price-desc {
	font-size: 26rpx;
	color: #999;
	margin-top: 6rpx;
}

.submit-btn {
	width: 280rpx;
	height: 90rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #3F99F6 0%, #33C5A0 100%);
	color: #fff;
	font-size: 32rpx;
	font-weight: bold;
	border-radius: 45rpx;
	border: none;
	flex-shrink: 0;
}

.submit-btn--disabled {
	opacity: 0.6;
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
	height: 75vh;
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
	color: #2F6E8E;
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
	overflow: hidden;
	height: 0;
}

.notice-intro {
	display: block;
	font-size: 26rpx;
	color: #555;
	line-height: 1.7;
	margin-bottom: 32rpx;
}

.notice-group-title {
	display: block;
	font-size: 28rpx;
	font-weight: 700;
	color: #2F6E8E;
	margin-top: 32rpx;
	margin-bottom: 14rpx;
}

.notice-body {
	display: block;
	font-size: 26rpx;
	color: #555;
	line-height: 1.7;
	margin-bottom: 4rpx;
}

.notice-footer {
	display: block;
	font-size: 24rpx;
	color: #999;
	line-height: 1.7;
	margin-top: 40rpx;
	padding-top: 24rpx;
	border-top: 1.5rpx solid #f0f0f0;
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
	font-size: 24rpx;
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
	color: #3F99F6;
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