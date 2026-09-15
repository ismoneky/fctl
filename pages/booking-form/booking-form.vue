<template>
	<view class="container">
		<view class="form-container">
			<!-- 预约日期（前置：日期决定当日免费名额与年龄口径，故先选日期） -->
			<view class="form-section">
				<view class="section-title">
					<view class="title-icon-wrap">
						<image class="title-icon-svg rili" src="/static/svg/rili.svg" mode="aspectFit" />
					</view>
					<text class="title-text required-star">预约日期</text>
				</view>

				<view class="field-block">
					<picker mode="date" :start="minDate" :end="maxDate" @change="onDateChange">
						<view class="input-box input-box--picker">
							<text class="picker-text" :class="formData.bookingDate ? 'picker-text--filled' : ''">
								{{ formData.bookingDate || '请选择预约日期' }}
							</text>
							<image class="picker-icon-svg" src="/static/svg/rili.svg" mode="aspectFit" />
						</view>
					</picker>
				</view>

				<!-- 预约日期的信息卡：preview 的免费提示与 today-quota 的今日名额合成一张。
				     两个数据源、两种到达时间，所以是「谁有内容谁进来」，不是谁替代谁；
				     三样都没有时整张卡不渲染 -->
				<view
					class="free-banner"
					:class="{ 'free-banner--plain': !freeBanner }"
					v-if="freeBanner || showFreeTip || todayQuotaItems.length"
				>
					<text class="free-banner-icon" v-if="freeBanner">免</text>
					<view class="free-banner-main">
						<template v-if="freeBanner">
							<text class="free-banner-title">{{ freeBanner.title }}</text>
							<text class="free-banner-desc">{{ freeBanner.desc }}</text>
						</template>
						<text class="free-banner-tip" v-else-if="showFreeTip">{{ freeTipText }}</text>

						<!-- 今日名额：与上面的说明文字同处一张卡，所以用与 .free-banner-desc 同级的字号，
						     数字也不再放大加粗 —— 它是补充信息，抢眼就会把这张卡顶得突兀 -->
						<view
							class="quota-line"
							:class="{ 'quota-line--divided': freeBanner || showFreeTip }"
							v-if="todayQuotaItems.length"
						>
							<text
								v-for="(item, i) in todayQuotaItems"
								:key="i"
								class="quota-line-text"
								:class="'quota-line-text--' + item.tone"
							>{{ item.text }}</text>
						</view>
					</view>
				</view>
			</view>

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
							<input class="field-input" v-model="formData.tourGroupName" placeholder="请输入旅行社名称" placeholder-style="color:#98A2A8" />
						</view>
					</view>
					<view class="field-block">
						<text class="field-label required-star">团队编号</text>
						<view class="input-box">
							<input class="field-input" v-model="formData.tourNumber" placeholder="请输入团队编号" placeholder-style="color:#98A2A8" />
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

				<!-- 动态出行人员列表 -->
				<block v-if="formData.passengers && formData.passengers.length">
				<view class="passenger-card" v-for="(p, idx) in formData.passengers" :key="p._key">
					<!-- 操作区：仅在确有按钮时渲染（第一位没有按钮，不留空行） -->
					<view class="passenger-card-header" v-if="idx > 0">
						<text class="passenger-card-label">同行人</text>
						<view class="passenger-card-actions">
							<!-- 儿童/老人：编辑（重开弹窗原位替换） -->
							<text v-if="p.passengerType === 'child' || p.passengerType === 'senior'" class="passenger-edit-btn" @click="openChildSeniorPopup('edit', p._key)">编辑</text>
							<text class="passenger-delete-btn" @click="removePassenger(p._key)">删除</text>
						</view>
					</view>
					<!-- 身份证与年龄状态标签（人员类型标签不在页面展示） -->
					<view class="passenger-tags" v-if="getAgeFreeLabel(p) || p.idCardUnavailable || ageMismatchMap[p._key]">
						<text v-if="getAgeFreeLabel(p)" class="passenger-age-free-tag">{{ getAgeFreeLabel(p) }}</text>
						<text v-if="p.idCardUnavailable" class="passenger-unavailable-tag">未提供身份证号 · 按正常价格收费 · 暂时无法投保</text>
						<!-- 类型与年龄不符（含预约日期变化后的重算）：标红并阻止提交 -->
						<text v-if="ageMismatchMap[p._key]" class="passenger-age-mismatch-tag">{{ ageMismatchMap[p._key] }}</text>
					</view>
					<view class="field-block">
						<text class="field-label required-star">姓名</text>
						<view class="input-box input-box--name">
							<input class="field-input" :value="p.name" placeholder="请输入姓名" placeholder-style="color:#98A2A8" maxlength="20" @input="onPassengerNameInput($event, p._key)" @blur="onPassengerNameBlur(p._key)" />
							<!-- 常用人员内嵌下拉入口：仅当存在常用人员时显示；不填也能直接手输 -->
							<view v-if="profileList.length > 0" class="name-picker-trigger" @click="openProfilePanel(p._key)">
								<text class="name-picker-text">选择常用</text>
								<image class="name-picker-chevron" src="/static/svg/chevron-down-primary.svg" mode="aspectFit"></image>
							</view>
							<!-- 常用人员下拉：absolute 锚定在姓名输入框下方，随页面滚动自然跟随，无需 JS 实测几何 -->
							<view v-if="profilePanelKey === p._key" class="profile-panel" @touchmove.stop>
								<scroll-view class="profile-panel-body" scroll-y :style="{ height: profilePanelHeight + 'rpx' }">
									<view class="profile-panel-item" v-for="(item, pIdx) in profilePanelItems" :key="item.profileId || pIdx" @click="onPickProfile(item)">
										<text class="profile-panel-item-name">{{ item.name }}</text>
										<text class="profile-panel-item-phone">{{ maskPhone(item.phone) }}</text>
									</view>
								</scroll-view>
							</view>
						</view>
					</view>
					<!-- 姓名匹配常用人员弱提示卡片（仅展示掩码手机号，绝不展示身份证明文） -->
					<view v-if="getProfileMatchesForKey(p._key).length === 1" class="profile-hint-card" @click="applyProfileToPassenger(getProfileMatchesForKey(p._key)[0], p._key)">
						<text class="profile-hint-text">找到常用人员：{{ getProfileMatchesForKey(p._key)[0].name }} {{ maskPhone(getProfileMatchesForKey(p._key)[0].phone) }}　点击填入</text>
					</view>
					<view v-else-if="getProfileMatchesForKey(p._key).length > 1" class="profile-hint-card" @click="openProfilePanel(p._key)">
						<text class="profile-hint-text">找到 {{ getProfileMatchesForKey(p._key).length }} 位同名常用人员，点击选择</text>
					</view>
					<!-- 手机号仅主出行人填写；同行人不填，提交时自动使用主出行人的号码 -->
					<view class="field-block" v-if="idx === 0">
						<text class="field-label required-star">手机号码</text>
						<view class="input-box" v-if="!profilePanelKey">
							<input class="field-input" type="number" maxlength="11" v-model="p.phone" placeholder="请输入手机号码" placeholder-style="color:#98A2A8" />
						</view>
						<!-- 内嵌下拉展开期间降级为静态文本：让浮层下方不存在原生组件，规避遮挡 -->
						<view class="input-box" v-else>
							<text class="field-input field-input--static">{{ p.phone }}</text>
						</view>
					</view>
					<view class="field-block" style="margin-bottom:0">
						<text class="field-label required-star">身份证号</text>
						<view class="input-box" v-if="!profilePanelKey">
							<input class="field-input" maxlength="18" :value="p.idCard" :disabled="p.idCardUnavailable === true" placeholder="请输入18位身份证号码" placeholder-style="color:#98A2A8" @input="onIdCardInput($event, p._key)" @blur="onIdCardBlur($event, p._key)" />
						</view>
						<view class="input-box" v-else>
							<text class="field-input field-input--static">{{ p.idCard }}</text>
						</view>
						<text v-if="p.idCardError" class="field-error-text">{{ p.idCardError }}</text>
					</view>
				</view>
				</block>

				<!-- 添加入口：普通同行人 + 次要入口（儿童/老人） -->
				<view class="add-entry-row">
					<button class="add-entry-btn" :class="{ 'add-entry-btn--disabled': atMaxPerson }" :disabled="atMaxPerson" @click="addAdultPassenger">
						<image class="add-entry-icon" :src="atMaxPerson ? '/static/svg/plus-disabled.svg' : '/static/svg/plus-primary.svg'" mode="aspectFit"></image>
						<text>添加同行人</text>
					</button>
					<!-- <button class="add-entry-btn add-entry-btn--secondary" :class="{ 'add-entry-btn--disabled': atMaxPerson }" :disabled="atMaxPerson" @click="openChildSeniorPopup('add')">＋ 添加同行儿童/老人</button> -->
				</view>

				<!-- 人数汇总：只读，由出行人员列表驱动 -->
				<view class="count-summary">
					<text class="count-text">预约人数 <text class="count-number">{{ personSummary.total }}</text><text class="count-unit">人</text></text>
					<text class="count-breakdown" v-if="personSummary.child || personSummary.senior">成人 {{ personSummary.adult }} · 儿童 {{ personSummary.child }} · 老人 {{ personSummary.senior }}</text>
					<text class="count-limit">最多可预约 {{ maxPerson }} 人</text>
				</view>

				<!-- 预约时间段（隐藏展示，字段保留） -->
			</view>

			<!-- 儿童/老人新增与编辑底部弹窗（独立于常用人员选择） -->
			<child-senior-passenger-popup
				:visible="childSeniorPopupVisible"
				:passenger="childSeniorEditingPassenger"
				:booking-date="formData.bookingDate"
				:default-phone="contactPhone"
				:mode="childSeniorEditingKey ? 'edit' : 'add'"
				@confirm="onChildSeniorConfirm"
				@close="onChildSeniorClose"
			/>
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
				</view>
				<view class="price-info" v-else-if="isDailyQuotaFree">
					<view class="price-row">
						<text class="price-value price-value--free">免费预约</text>
					</view>
				</view>
				<view class="price-info" v-else-if="isAgeFree">
					<view class="price-row">
						<text class="price-value price-value--free">年龄免费</text>
					</view>
				</view>
				<view class="price-info" v-else-if="previewState === 'success' && previewResult && previewResult.amount != null">
					<!-- 付费原因贴身展示在金额上方：滚到底部填写完信息后，这里依然能看到为何收费 -->
					<text class="price-reason" v-if="priceReasonShort">{{ priceReasonShort }}</text>
					<view class="price-row">
						<text class="price-symbol">¥</text>
						<text class="price-value">
							{{ (previewResult.amount / 100).toFixed(2) }}
						</text>
						<text class="price-tips">
							（意外伤害险）
						</text>
					</view>
				</view>
				<view class="price-info" v-else-if="previewState === 'loading'">
					<text class="price-status-text">价格计算中…</text>
				</view>
				<view class="price-info" v-else-if="previewState === 'error'">
					<text class="price-status-text price-status-text--error">{{ previewError }}</text>
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
				<text class="notice-body">· 预约及票务咨询：15670077072，0392-6878889（工作时间 09:00-18:00）{{ '\n' }}· 投诉建议：15670077072，0392-6878889</text>

				<text class="notice-footer">感谢您的配合与理解。让我们一起守护风车天路的纯净与壮美，平安出行，尽兴而归！</text>
			</scroll-view>
		</view>

		<!-- 点击面板外部收起；不再拦截 touchmove，面板已随页面滚动跟随，允许滚动才能把靠下的面板滚进视口 -->
		<!-- 展开期间同卡片内的手机号/身份证 input 已降级为静态文本，面板下方不存在原生组件，故不会被穿透遮挡 -->
		<view class="profile-panel-mask" v-if="profilePanelKey" @click="closeProfilePanel"></view>
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
import {
	AGE_FREE_ENABLED,
	CHILD_MAX_AGE,
	createAdultPassenger,
	normalizePassenger,
	summarizePassengers,
	resolveEffectivePassengerType,
	removePassengerByKey,
	calculateYearAge,
	getPassengerTypeError,
	getPassengerLimit,
} from '../../utils/passenger-pricing.js';
import { getPassengerErrorMessage } from '../../utils/passenger-error-messages.js';
import ChildSeniorPassengerPopup from '../../components/child-senior-passenger-popup.vue';

// UI 稳定标识自增序号：保证同页新增人员 _key 唯一（仅前端列表渲染用，不提交后端）
let passengerKeySeq = 0;
function newPassengerKey() {
	passengerKeySeq += 1;
	return `p${passengerKeySeq}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

// 旧订单/常用人员 → 表单人员结构：归一化字段 + UI 专用 _key，不携带计费快照字段
function toFormPassenger(raw) {
	const n = normalizePassenger(raw, false);
	return {
		name: n.name,
		phone: n.phone,
		idCard: n.idCard,
		passengerType: n.passengerType,
		idCardUnavailable: n.idCardUnavailable,
		idCardError: '',
		_key: newPassengerKey(),
	};
}

// 今日名额轮询间隔（用自链 setTimeout，见 pollTodayQuota）。
// 页面不再写「数据 90 秒更新一次」的小字：这是内部节流，不是用户要看的信息
const TODAY_QUOTA_POLL_MS = 90 * 1000;

// 价格预览在**传输层失败**后的重试阶梯（毫秒），取完最后一档后一直按最后一档重复。
// 只对网络失败与 5xx 生效——4xx 是确定性结论，重发必然还是 4xx，见 runPreview。
// 前两次（300/800ms）在 utils/request.js 里已经试过，所以这里从 2 秒起。
const PREVIEW_RETRY_DELAYS_MS = [2000, 5000, 10000];

// 不能免费时的提示文案（由后端 preview 的 reason 驱动），双端同源：
//   tip   预约日期区块下的完整说明，面向“选日期时判断要不要花钱”的决策场景
//   short 底部结算栏用，金额就在旁边，重复“本次预约需支付”反而啰嗦
const FREE_REASON_TEXT = {
	member_idcard_not_matched: {
		tip: '乘客身份证与会员记录不一致，本次预约需支付',
		short: '身份证与会员记录不一致',
	},
	member_plate_not_matched: {
		tip: '车牌号与会员记录不一致，本次预约需支付',
		short: '车牌与会员记录不一致',
	},
	daily_quota_used: {
		tip: '您今日已享受过免费预约，本次预约需支付',
		short: '今日已享受过免费预约',
	},
	daily_quota_full: {
		tip: '今日免费名额已用完，本次预约需支付',
		short: '今日免费名额已用完',
	},
	not_today: {
		tip: '每日免费名额仅限预约当天有效，选择其他日期需正常支付',
		short: '免费名额仅限预约当天',
	},
};

// 会员类原因码：仅当后端确实返回了会员记录（memberInfo 非空）时才允许展示，
// 避免非会员被误报为“与会员记录不一致”
const MEMBER_REASONS = ['member_idcard_not_matched', 'member_plate_not_matched'];

export default {
	components: {
		ChildSeniorPassengerPopup,
	},
	data() {
		return {
			id: '',
			formData: {
				// 出行人员列表：人数唯一来源，首位固定为联系人（adult）
				passengers: [Object.assign(createAdultPassenger(), { idCardError: '', _key: newPassengerKey() })],
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
			profileList: [], // 常用人员列表（全部，姓名栏下拉浮层展示）
			profileMatchesByKey: {}, // 每位出行人按姓名匹配到的常用人员数组（key 为 _key，删除/插位不串位）
			profilePanelKey: null, // 姓名栏内嵌下拉面板展开中的出行人 _key；null 为收起
			childSeniorPopupVisible: false, // 儿童/老人底部弹窗
			childSeniorEditingKey: null, // 编辑中人员的 _key；null 为新增
			travelModeList: [
				{
					label: '自驾出行',
					value: 'selfDriving',
					icon: '🚗'
				},
					{
					label: '景区摆渡车',
					value: 'scenicBus',
					icon: '🚌'
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
				// { label: '非机动车', value: 'nonMotorized' },
			],
			minDate: '',
			maxDate: '',
			_lastClickTime: 0,  // 防抖时间戳
			_previewSeq: 0,     // preview 竞态序号，回调比对丢弃过期请求
			_previewTimer: null, // preview 的定时器：正常时是 debounce，失败后是重试的等待
			_previewAttempt: 0,  // 本轮已重试次数，用于取 PREVIEW_RETRY_DELAYS_MS 的档位
			previewResult: null, // 后端费用预览结果（isFree/freeReason/reason/amount/freeQuotaInfo/memberInfo）
			previewState: 'incomplete', // preview 状态机：incomplete | loading | success | error（不再使用本地金额兜底）
			previewError: '', // preview 失败时的稳定错误码中文文案
			// —— 今日名额（GET /bookings/today-quota，匿名接口，与 preview 完全独立）——
			todayQuota: null,      // { date, capacity:{level,remaining?}, freeQuota:{enabled,limit,remaining} }；null = 尚未取到，整行不渲染
			_quotaTimer: null,     // 自链 setTimeout 句柄
			_quotaInFlight: false, // 请求单飞锁：防止定时器与 onShow 叠加出并发请求
			_quotaActive: false,   // 轮询开关：onHide/onUnload 置 false，在途请求的回调据此不再续期
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
		// 人数区域只读汇总（人数唯一来源为 passengers.length）
		personSummary() {
			return summarizePassengers(this.formData.passengers, this.formData.bookingDate);
		},
		// 姓名栏下拉浮层的列表：同名匹配项排在最前，其余常用人员依次跟在后面；
		// 匹配项与列表同源（引用相等），无需额外去重键
		profilePanelItems() {
			const list = this.profileList || [];
			if (!this.profilePanelKey) return list;
			const matches = this.getProfileMatchesForKey(this.profilePanelKey);
			if (!matches.length) return list;
			const rest = list.filter((item) => !matches.includes(item));
			return matches.concat(rest);
		},
		// 下拉列表高度：单条 86rpx（上下内边距 22rpx×2 + 文字行高约 40rpx + 分隔线），最多 5 条后内部滚动
		// 高度是确定值，直接由条数算出，不再依赖 createSelectorQuery 实测
		profilePanelHeight() {
			const count = (this.profilePanelItems || []).length;
			return Math.min(count * 86, 430);
		},
		// 是否已达到当前车型人数上限（两个添加入口同时禁用）
		atMaxPerson() {
			return this.formData.passengers.length >= this.maxPerson;
		},
		// 主出行人有效手机号（同行人提交时统一采用该号码；亦作弹窗默认带入值，无效值不自动填入）
		contactPhone() {
			const first = this.formData.passengers[0];
			if (first && this.validatePhone(first.phone)) {
				return first.phone;
			}
			return '';
		},
		// 弹窗编辑对象（按 _key 定位；新增模式为 null）
		childSeniorEditingPassenger() {
			if (!this.childSeniorEditingKey) return null;
			return this.findPassengerByKey(this.childSeniorEditingKey);
		},
		// 会员免费：preview 判定为会员免费
		isMemberFree() {
			return !!(this.previewResult && this.previewResult.isFree && this.previewResult.freeReason === 'member');
		},
		// 每日名额免费：preview 判定为每日免费名额命中
		isDailyQuotaFree() {
			return !!(this.previewResult && this.previewResult.isFree && this.previewResult.freeReason === 'dailyQuota');
		},
		// 年龄免费：preview 判定为所有人员均因年龄免费（创建时直接确认，不调微信支付）
		isAgeFree() {
			return !!(this.previewResult && this.previewResult.isFree && this.previewResult.freeReason === 'age');
		},
		// 各人员类型与年龄一致性错误（随人员/日期变化自动重算，不会保留过期错误）
		ageMismatchMap() {
			const map = {};
			for (const p of this.formData.passengers) {
				if (!p._key) continue;
				const err = getPassengerTypeError(p, this.formData.bookingDate);
				if (err) {
					map[p._key] = err;
				}
			}
			return map;
		},
		// 是否存在类型与年龄不符的人员（阻止提交）
		hasAgeMismatch() {
			return Object.keys(this.ageMismatchMap).length > 0;
		},
		// 当前出行方式+车型允许的最大人数：自驾摩托2 / 自驾小客车7 / 非机动车、摆渡车及其他10
		// 与后端同一口径；摆渡车等非自驾方式不受隐藏 vehicleType 影响
		maxPerson() {
			return getPassengerLimit(this.formData.travelMode, this.formData.vehicleType);
		},
		// 当前 reason 对应的文案项；返回 null 表示本次不展示任何原因提示
		// 上下两处提示（顶部 freeTipText / 底部 priceReasonShort）都从这里取，保证同时出现、同时消失
		freeReasonItem() {
			const r = this.previewResult;
			if (!r || r.isFree) return null;
			// 会员类原因必须在确有会员记录时才展示：非会员根本不存在可比对的会员记录，
			// 后端此时也会返回 member_idcard_not_matched（实为“查无会员”），照译会误导用户
			if (MEMBER_REASONS.includes(r.reason) && !r.memberInfo) return null;
			// no_free_activity（免费活动未开启）、not_member（非会员，会员免费不适用）均不展示提示，
			// 表内查不到 key 即自动返回 null，仅由价格区展示应付金额
			return FREE_REASON_TEXT[r.reason] || null;
		},
		// 日期区块下的完整原因提示
		freeTipText() {
			const item = this.freeReasonItem;
			return item ? item.tip : '';
		},
		// 底部结算栏的付费原因：金额就在旁边，故用短文案，省略“本次预约需支付”
		priceReasonShort() {
			const item = this.freeReasonItem;
			return item ? item.short : '';
		},
		// 信息卡上半部分：preview 判定的免费提示，命中才有（两种免费共用一套版式，只有文案不同）。
		// 返回 null 表示本次不免费或还没判定出来，此时卡片由下面两段之一接管
		freeBanner() {
			if (this.isMemberFree) {
				return { title: '会员免费', desc: '月卡会员免费预约，不限次数，不占每日免费名额' };
			}
			if (this.isDailyQuotaFree) {
				const q = (this.previewResult && this.previewResult.freeQuotaInfo) || {};
				return {
					title: '免费预约',
					desc: `今日前 ${q.limit || 0} 名预约免费，剩余 ${q.remaining || 0} 个名额，本次预约免费`,
				};
			}
			return null;
		},
		// 不能免费时的原因提示。freeTipText 非空已蕴含「有 preview 结果且不是免费」，无需再判
		showFreeTip() {
			return !this.freeBanner && !!this.freeTipText;
		},
		// —— 今日名额（数据源 GET /bookings/today-quota）——
		// 「今天」以后端返回的 date 为权威，前端不做本地日期运算 —— 后端 beijingDateStr()
		// 与设备时区可能不一致。要求已选日期：没选日期时整块不出现（此时也还没发过请求）；
		// 选了未来日期同样不出现，接口只返回今天的数据，拿今天的余量去解释别的日期会误导
		// （每日免费名额也仅限预约当天有效）
		showTodayQuota() {
			return !!(this.formData.bookingDate && this.todayQuota && this.formData.bookingDate === this.todayQuota.date);
		},
		// 信息卡下半部分：今日名额，0~2 条，每条就是一句话（数字不再单独拆出来做强调）。
		// 名额充足时【刻意不提「充足」】：后端在 plenty 时刻意不下发 remaining（安全边界见
		// 后端 dto/today-quota.dto.ts 顶部），没有数字可报的「充足」对用户也没有信息量；
		// 免费名额用完也不提 —— preview 结算时会以「本次预约需支付」的口径讲同一件事，
		// 在这里提前说一遍只是噪音。
		// full 命中即止：都约不上了，再说免费名额没有意义
		todayQuotaItems() {
			const items = [];
			const c = this.todayQuota && this.todayQuota.capacity;
			if (!this.showTodayQuota || !c) return items;

			if (c.level === 'full') {
				items.push({ tone: 'alert', text: '今日名额已满，请选择其他日期' });
				return items;
			}
			if (c.level === 'limited') {
				items.push({ tone: 'alert', text: `今日仅剩 ${c.remaining} 个名额` });
			}

			// 免费名额项：preview 已就同一件事表过态时一律让位，否则同一张卡里会出现两种结论
			// （例：上面的提示写「今日免费名额已用完」，这里却写「还可免费预约 1 人」）。
			// 不排除 isMemberFree：会员免费不占每日额度，此时这里是补充信息而非重复
			const fq = this.todayQuota.freeQuota;
			if (!fq || !fq.enabled || fq.remaining <= 0) return items;
			if (this.isDailyQuotaFree) return items;
			const r = this.previewResult;
			if (r && !r.isFree && (r.reason === 'daily_quota_full' || r.reason === 'daily_quota_used')) return items;

			items.push({ tone: 'free', text: `还可免费预约 ${fq.remaining} 人` });
			return items;
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
		// 费用预览（后端为唯一事实来源，统一替代 /member/status + /member/verify + /bookings/free-quota/status）
		this.fetchPreview();
		// 预加载常用人员列表
		this.fetchProfiles();
		// 今日名额不在这里取：接口只认「今天」，而进页面时用户还没选日期，
		// 按当天默认发一次请求纯属凭空多出来的一次。启动点见 onDateChange
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

	onShow() {
		// 从其他页返回 / 支付返回后立即刷新一次，而不是干等下一个 90 秒。
		// 必须调 startQuotaPolling() 而不是「if (_quotaActive) pollTodayQuota()」：
		// onHide 已把 _quotaActive 置 false，受它保护的写法在「离开过一次再回来」时
		// 永远进不去 —— 轮询会永久停摆，且不报错，极难发现。
		// 门禁是「这块真在展示」：选了未来日期时整块不出现，回页也就没必要白刷一次。
		// startQuotaPolling 先 stop 再启是幂等的，不会叠出两个请求
		if (this.showTodayQuota) this.startQuotaPolling();
		// 隐藏期间被停掉的价格请求在这里续上（判据就是 loading：成功/报错/表单不完整
		// 都不是 loading，不会白刷一次）。少了这一段，用户切出去回个消息再回来，
		// 「价格计算中…」会永远停在那儿 —— 既不再试，也不报错，提交按钮还一直是禁的
		if (this.previewState === 'loading') {
			this._previewSeq += 1;
			this.runPreview();
		}
	},
	onHide() {
		// 页面被覆盖后必须停表：小程序隐藏页面不会销毁 JS 定时器，
		// 只写 onUnload 会让被覆盖的实例一直空转
		this.stopQuotaPolling();
		// 价格重试同理。与 _quotaActive 的作用相同：++seq 让在途请求的回调不再续期，
		// 否则它回来时又会排一个新定时器，等于没停
		this.cancelPreviewRetry();
		this._previewSeq += 1;
	},
	onUnload() {
		this.stopQuotaPolling();
		// 顺带补齐的既有清理（本页原先没有任何 cleanup 钩子）
		this.cancelPreviewRetry();
		this._previewSeq += 1; // 作废在途 preview 响应，避免回调给已销毁实例赋值
	},

	// 分享配置
	onShareAppMessage() {
		return {
			title: '风车天路 - 浪漫风车之旅等你来',
			path: '/pages/index/index'
		}
	},
	methods: {
		// 人数唯一来源为乘客数组长度，任何增删后同步
		syncPersonCount() {
			this.formData.personCount = this.formData.passengers.length;
		},
		findPassengerByKey(key) {
			return this.formData.passengers.find((p) => p._key === key) || null;
		},
		findPassengerIndexByKey(key) {
			return this.formData.passengers.findIndex((p) => p._key === key);
		},
		// 添加普通同行人：写入数组前再校验一次上限
		addAdultPassenger() {
			if (this.atMaxPerson) {
				uni.showToast({ title: `当前车型最多可预约 ${this.maxPerson} 人`, icon: 'none' });
				return;
			}
			this.formData.passengers.push(Object.assign(createAdultPassenger(), { idCardError: '', _key: newPassengerKey() }));
			this.syncPersonCount();
			// 乘客变化后重新预览费用
			this.fetchPreview();
		},
		// 删除出行人：联系人不可删除，其余先确认（含姓名）
		removePassenger(key) {
			const idx = this.findPassengerIndexByKey(key);
			if (idx === 0) {
				return; // 联系人固定为第一人且不可删除
			}
			const p = this.formData.passengers[idx];
			if (!p) return;
			const name = String(p.name || '').trim() || '该出行人';
			uni.showModal({
				title: '删除出行人',
				content: `确认删除出行人“${name}”吗？删除后人数与费用将同步更新。`,
				confirmText: '删除',
				cancelText: '取消',
				success: (res) => {
					if (!res.confirm) return;
					if (!removePassengerByKey(this.formData.passengers, this.profileMatchesByKey, key)) return;
					this.syncPersonCount();
					// 乘客变化后重新预览费用
					this.fetchPreview();
				},
			});
		},
		// 打开儿童/老人弹窗：add 新增；edit 按 _key 原位替换
		openChildSeniorPopup(mode, key) {
			if (this.atMaxPerson && mode === 'add') {
				uni.showToast({ title: `当前车型最多可预约 ${this.maxPerson} 人`, icon: 'none' });
				return;
			}
			// iOS clickCheckTask：点击检测任务异步执行，若在 tap 事件内同步变更节点树，
			// 检测任务醒来时节点链已变化会抛 t[0] null。推迟到下一轮再改状态，让检测先完成。
			setTimeout(() => {
				this.childSeniorEditingKey = mode === 'edit' ? key : null;
				this.childSeniorPopupVisible = true;
			}, 60);
		},
		// 关闭儿童/老人弹窗（同样推迟状态变更，规避 iOS clickCheckTask）
		onChildSeniorClose() {
			setTimeout(() => {
				this.childSeniorPopupVisible = false;
			}, 60);
		},
		// 弹窗确认：新增 append；编辑原位替换。成功后关闭、刷新费用预览
		onChildSeniorConfirm(payload) {
			if (!this.childSeniorEditingKey) {
				// 真正写入数组前再校验一次上限
				if (this.atMaxPerson) {
					uni.showToast({ title: `当前车型最多可预约 ${this.maxPerson} 人`, icon: 'none' });
					return;
				}
				this.formData.passengers.push(Object.assign({}, payload, { idCardError: '', _key: newPassengerKey() }));
				// 关闭动作推迟到点击检测之后（规避 iOS clickCheckTask）
				setTimeout(() => { this.childSeniorPopupVisible = false; }, 60);
				// 非阻塞 Toast 提示（成功后关闭并重置弹窗、刷新费用预览）
				uni.showToast({ title: '已添加同行儿童/老人', icon: 'none', duration: 1500 });
			} else {
				const idx = this.findPassengerIndexByKey(this.childSeniorEditingKey);
				if (idx >= 0) {
					const p = this.formData.passengers[idx];
					p.name = payload.name;
					p.phone = payload.phone;
					p.idCard = payload.idCard;
					p.passengerType = payload.passengerType;
					p.idCardUnavailable = payload.idCardUnavailable;
					p.idCardError = '';
				}
				setTimeout(() => { this.childSeniorPopupVisible = false; }, 60);
			}
			this.syncPersonCount();
			this.fetchPreview();
		},
		// 获取常用人员列表
		async fetchProfiles() {
			try {
				const res = await request({ method: 'GET', url: '/users/profiles' });
				if (res.success) this.profileList = Array.isArray(res.data) ? res.data : [];
			} catch (e) {}
		},
		// 统一填入函数：主动“选择常用”与同名匹配弱提示都走这里
		// 仅写入 item 的字段；不自动覆盖用户已手动填写的手机号或身份证号（弱提示仅在两者均空时出现，故此处安全）
		applyProfileToPassenger(item, key) {
			const p = this.findPassengerByKey(key);
			if (!p || !item) return;
			p.name = item.name || p.name;
			p.phone = item.phone || p.phone;
			p.idCard = item.idCard || p.idCard;
			p.idCardError = getIdCardError(normalizeIdCardInput(p.idCard || ''));
			// 填入后清理该出行人匹配状态
			delete this.profileMatchesByKey[key];
			// 非阻塞 Toast 提示已填入（不超过 1.5 秒）
			uni.showToast({ title: '已填入常用信息', icon: 'none', duration: 1500 });
			// 乘客信息变化后重新预览费用
			this.fetchPreview();
		},
		// 打开姓名栏的常用人员内嵌下拉面板
		// 面板用 absolute 锚定在姓名输入框下方（见 .profile-panel），随页面滚动自然跟随，无需实测几何
		openProfilePanel(key) {
			// 再次点击同一入口视为收起
			if (this.profilePanelKey === key) {
				this.closeProfilePanel();
				return;
			}
			if (!(this.profileList || []).length) {
				uni.showToast({ title: '暂无常用人员，请先在个人中心添加', icon: 'none', duration: 2000 });
				return;
			}
			// 先收起键盘：避免软键盘与面板同时存在把页面顶起
			uni.hideKeyboard();
			this.profilePanelKey = key;
		},
		closeProfilePanel() {
			this.profilePanelKey = null;
		},
		// 点选常用人员：复用统一填入函数，不重复写填入逻辑
		onPickProfile(item) {
			const key = this.profilePanelKey;
			this.closeProfilePanel();
			if (item && key) this.applyProfileToPassenger(item, key);
		},
		// 姓名输入：更新姓名并立即清除该出行人匹配结果
		onPassengerNameInput(e, key) {
			const p = this.findPassengerByKey(key);
			if (!p) return;
			const raw = (e && e.detail && e.detail.value != null) ? e.detail.value : '';
			p.name = raw;
			// 姓名变化后立即清除该出行人上一轮匹配结果
			if (this.profileMatchesByKey[key] && this.profileMatchesByKey[key].length) {
				delete this.profileMatchesByKey[key];
			}
		},
		// 姓名失焦：仅在手机号与身份证号均为空时建立匹配结果，避免覆盖用户已手动填写的内容
		onPassengerNameBlur(key) {
			const p = this.findPassengerByKey(key);
			if (!p) return;
			const nameTrimmed = String(p.name || '').trim();
			// 只输入一个字或空姓名不提示（设计要求不做单字匹配提示；这里用 trim 后非空即尝试，纯函数内已做完全相等判断）
			if (!nameTrimmed) {
				delete this.profileMatchesByKey[key];
				return;
			}
			// 手机号或身份证号已有手动内容时不出现弱提示
			if ((p.phone && String(p.phone).trim()) || (p.idCard && String(p.idCard).trim())) {
				delete this.profileMatchesByKey[key];
				return;
			}
			const matches = findExactProfileMatches(this.profileList, p.name);
			this.profileMatchesByKey[key] = matches;
		},
		// 取某位出行人的匹配结果（模板用）
		getProfileMatchesForKey(key) {
			const m = this.profileMatchesByKey[key];
			return Array.isArray(m) ? m : [];
		},
		// 遮罩手机号：138****1234
		maskPhone(phone) {
			if (!phone) return '';
			const s = String(phone);
			if (s.length < 7) return s;
			return s.substring(0, 3) + '****' + s.substring(s.length - 4);
		},
		// 人员卡片绿色弱状态：有身份证且符合年龄时显示（仅即时展示，计费以后端为准）
		getAgeFreeLabel(p) {
			if (!AGE_FREE_ENABLED) return '';
			if (!p) return '';
			if (p.idCardUnavailable === true) return '';
			const card = p.idCard || '';
			if (!card || getIdCardError(card) !== '') return '';
			if (!this.formData.bookingDate) return '';
			const age = calculateYearAge(card, this.formData.bookingDate);
			if (age === null) return '';
			const effectiveType = resolveEffectivePassengerType(p, this.formData.bookingDate);
			// 年龄值为负（未来出生年份）不显示免费标签
			if (effectiveType === 'child' && age >= 0 && age <= CHILD_MAX_AGE) return '13岁及以下，年龄免费';
			if (effectiveType === 'senior' && age >= 70) return '70岁及以上，年龄免费';
			return '';
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
			// 今日名额的唯一启动点：选完日期才发第一次请求，之后由自链维持 90 秒。
			// 选了非今天时，响应回来会自行停表（见 pollTodayQuota）
			this.startQuotaPolling();
		},
		// 单名乘客是否满足 preview 完整条件：姓名必填；手机号仅主出行人（首位）必填，
		// 同行人不填手机号、提交时统一采用主出行人的号码，故不参与完整性判断；
		// 无身份证儿童/老人可预览（正常收费）；其余人员身份证必须通过已落地的严格校验
		isPassengerCompleteForPreview(p, isMain) {
			if (!p || !p.name || !p.name.trim()) return false;
			if (isMain && (!p.phone || !this.validatePhone(p.phone))) return false;
			if (p.idCardUnavailable === true) {
				return p.passengerType === 'child' || p.passengerType === 'senior';
			}
			const card = p.idCard || '';
			return card.length > 0 && getIdCardError(card) === '';
		},
		// 费用预览：后端为唯一事实来源，传入当前乘客与预约日期，返回完整费用与免费判定
		// 竞态锁：序号法（每次自增，回调比对丢弃过期请求）+ 100ms debounce 合并连续输入
		// 未完整时不请求后端（半成品身份证只有前端即时提示）；失败时展示稳定错误码文案并禁止提交
		fetchPreview() {
			const ps = this.formData.passengers || [];
			const allComplete = ps.length > 0 && ps.every((p, i) => this.isPassengerCompleteForPreview(p, i === 0));
			if (!allComplete || !this.formData.bookingDate) {
				this.previewResult = null;
				this.previewState = 'incomplete';
				this.previewError = '';
				// 作废在途请求与待发的重试。原先这里直接 return，导致「表单填完发了一次
				// preview → 用户把日期清掉」时，那个响应回来会把状态置成 success，
				// 于是一个连完整都算不上的表单上挂着一个属于旧输入的金额
				this._previewSeq += 1;
				this.cancelPreviewRetry();
				return;
			}
			this._previewSeq += 1;
			this.previewState = 'loading';
			this._previewAttempt = 0;
			this.cancelPreviewRetry();
			this._previewTimer = setTimeout(() => this.runPreview(), 100);
		},

		// 价格预览的一次尝试。
		//
		// 失败分两类，这是本方法唯一需要读懂的地方：
		//   · 4xx：确定性结论（车牌格式、年龄与类型不符、超员…），同样的参数再发一次
		//     必然还是 4xx。立即报错收手，**不许继续重试** —— 否则就是按秒往
		//     SQLite 单写者上砸必然失败的请求。
		//   · 网络失败 / 5xx：请求可能根本没到后端，或后端瞬时不稳。**保留「价格计算中…」**，
		//     按 schedulePreviewRetry 的阶梯一直试到成功 —— 价格是下单的唯一金额来源，
		//     提交按钮又被 previewState==='success' 把着，卡在这里等于用户下不了单，
		//     能自愈就不要让他手动重来。
		runPreview() {
			const seq = this._previewSeq;
			const ps = this.formData.passengers || [];
			request({
				method: 'POST',
				url: '/bookings/preview',
				// 幂等请求（纯读、无副作用），允许连接层失败与 5xx 快速重试两次（300/800ms）。
				// 本仓所有写接口都不得开启它：重发等于重复下单 / 重复发起退款
				retry: true,
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
				this.previewState = this.previewResult ? 'success' : 'error';
				this.previewError = this.previewResult ? '' : '价格计算失败，请重试';
				this._previewAttempt = 0;
			}).catch(err => {
				if (seq !== this._previewSeq) return;
				const httpStatus = err && typeof err.statusCode === 'number' ? err.statusCode : 0;
				if (httpStatus >= 400 && httpStatus < 500) {
					this.previewResult = null;
					this.previewState = 'error';
					// 优先读稳定业务错误码映射；未知 code 回退后端 message / 通用文案
					const raw = err && err.data ? err.data : null;
					if (raw && raw.code) {
						this.previewError = getPassengerErrorMessage(raw.code, raw.message);
					} else {
						this.previewError = (raw && raw.message) || '价格计算失败，请重试';
					}
					return;
				}
				this.schedulePreviewRetry(seq);
			});
		},

		// 传输层失败后的重试阶梯：2s → 5s → 10s，之后每 10s 一次，直到成功。
		//
		// 三个终止条件，缺一不可：
		//   1. 成功 —— .then 分支复位 _previewAttempt 并停表；
		//   2. 被新输入取代 —— fetchPreview 每次都 ++_previewSeq 并 clearTimeout，
		//      在途回调与待发定时器都会发现 seq 变了而收手；
		//   3. 页面隐藏/销毁 —— onHide / onUnload 调 cancelPreviewRetry 并 ++_previewSeq。
		// 少了第 3 条，被覆盖的页面会留下一个永不停止的定时器空转（与 _quotaActive 同一课）。
		schedulePreviewRetry(seq) {
			const delays = PREVIEW_RETRY_DELAYS_MS;
			const delay = delays[Math.min(this._previewAttempt, delays.length - 1)];
			this._previewAttempt += 1;
			this.cancelPreviewRetry();
			this._previewTimer = setTimeout(() => {
				if (seq !== this._previewSeq) return;
				this.runPreview();
			}, delay);
		},

		// 停掉待发的重试定时器。在途请求取消不了，靠回调里的 seq 比对自行作废
		cancelPreviewRetry() {
			if (this._previewTimer) {
				clearTimeout(this._previewTimer);
				this._previewTimer = null;
			}
		},
		// ===== 今日名额轮询（90 秒，匿名接口 /bookings/today-quota）=====
		// 完全独立的一条链，不碰 _previewSeq / _previewTimer / preview* 任何字段，
		// 因此不会让底部结算栏在 loading/success 之间跳。
		// 不复用 fetchPreview()：① 它要求表单填完，而名额要尽早可见；② 它走竞态锁，
		// 复用会让结算栏跟着轮询闪；③ 它带登录态与乘客信息，名额是纯公开信息。
		// 用自链 setTimeout 而非 setInterval：上一轮结束才起下一轮计时，在途请求恒为 1，
		// 弱网下（utils/request.js 默认超时 60 秒）不会叠加出并发请求。
		// 生命周期：onDateChange 启动（选了日期才发第一次），所选日期不是今天时响应里自停；
		// onHide / onUnload 停表，onShow 在这块真在展示时重启
		pollTodayQuota() {
			if (this._quotaInFlight) return;
			this._quotaInFlight = true;
			request({ method: 'GET', url: '/bookings/today-quota' })
				.then(res => {
					// 白名单校验后再赋值：小程序模板对 undefined 会渲染成空白，
					// 不校验会出现「今日仅剩 个名额」这种残句
					const d = res && res.success ? res.data : null;
					if (!d || !d.capacity || !d.capacity.level) return;
					const fq = d.freeQuota;
					const free = (fq && fq.enabled)
						? { enabled: true, limit: Number(fq.limit) || 0, remaining: Number(fq.remaining) || 0 }
						: { enabled: false, limit: 0, remaining: 0 };
					// 收敛成前端自己的形状：后端改字段名时只在这里崩一处，不散落到模板
					this.todayQuota = {
						date: d.date || '',
						// 只有 limited 才带 remaining，充足/已满时刻意不带（后端就不下发）
						capacity: d.capacity.level === 'limited'
							? { level: 'limited', remaining: Number(d.capacity.remaining) || 0 }
							: { level: d.capacity.level },
						freeQuota: free
					};
					// 选中的不是今天：接口只认今天，这块不会展示，继续轮询没有意义。
					// 自停在赋值之后 —— 用户改回今天时能立刻看到上一次的值，不必等新请求
					if (d.date !== this.formData.bookingDate) {
						this.stopQuotaPolling();
					}
				})
				.catch(() => {
					// 静默降级：名额是辅助信息。不弹 toast、不写 previewError、不清空旧值，
					// 绝不能因为轮询失败打断用户的下单主路径
				})
				.finally(() => {
					this._quotaInFlight = false;
					this.scheduleQuotaPoll(); // 成败都续期：失败也要能自愈，否则一次抖动就永久停更
				});
		},
		scheduleQuotaPoll() {
			if (!this._quotaActive) return; // onHide / onUnload 之后不再续期
			this._quotaTimer = setTimeout(() => {
				this._quotaTimer = null; // 先置空再请求（同 booking-detail 的 loopDetail 约定）
				this.pollTodayQuota();
			}, TODAY_QUOTA_POLL_MS);
		},
		startQuotaPolling() {
			this.stopQuotaPolling();  // 先停旧链（会置 _quotaActive = false）
			this._quotaActive = true; // 再开启，顺序不可颠倒
			this.pollTodayQuota();    // 首次立即拉一次，不留 90 秒空窗
		},
		stopQuotaPolling() {
			this._quotaActive = false;
			// _quotaActive 不是可选项：onHide 停表时若正好有在途请求，它的 .finally
			// 会重新武装出一个新定时器 —— 页面已隐藏却继续空转。
			// scheduleQuotaPoll 里判 _quotaActive 才能堵住这个洞
			if (this._quotaTimer) {
				clearTimeout(this._quotaTimer);
				this._quotaTimer = null;
			}
		},
		// 身份证输入：归一化（去空格/全角数字/全角X）并立即清除上一轮红色错误状态
		// 使用 :value + @input 显式写回，避免 v-model 与事件回调时序不一致
		onIdCardInput(e, key) {
			const p = this.findPassengerByKey(key);
			if (!p) return;
			const raw = (e && e.detail && e.detail.value != null) ? e.detail.value : '';
			const normalized = normalizeIdCardInput(raw);
			p.idCard = normalized;
			// 输入值变化后立即清除上一轮错误，不能让用户改对后仍看到旧错误
			if (p.idCardError) {
				p.idCardError = '';
			}
		},
		// 身份证失焦：按错误分类设置提示；通过时清空错误并调用 fetchPreview()
		onIdCardBlur(e, key) {
			const p = this.findPassengerByKey(key);
			if (!p) return;
			const normalized = normalizeIdCardInput(p.idCard || '');
			p.idCard = normalized;
			const err = getIdCardError(normalized);
			p.idCardError = err;
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
		// 车辆类型选择：新上限小于当前人数时不修改车型、不删除已填人员，仅提示
		onVehicleTypeChange(e) {
			const newType = this.vehicleTypes[e.detail.value].value;
			const prevType = this.formData.vehicleType;
			const count = this.formData.passengers.length;
			// 用纯函数直接试算新上限，不临时改写 formData 来读 computed
			const newMax = getPassengerLimit(this.formData.travelMode, newType);
			if (count > newMax) {
				// 超出新上限：回退车型、保留已填人员
				this.formData.vehicleType = prevType;
				const targetLabel = (this.vehicleTypes.find((i) => i.value === newType) || {}).label || newType;
				uni.showModal({
					title: '人数超限',
					content: `当前已添加${count}位出行人，${targetLabel}最多${newMax}人，请先删除多余人员。`,
					showCancel: false,
					confirmText: '我知道了',
				});
				return;
			}
			this.formData.vehicleType = newType;
			if (newType === 'nonMotorized') {
				this.formData.licensePlate = '';
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
		// 出行方式picker选择：新上限小于当前人数时回退原出行方式并提示，不删除人员
		onTravelPickerChange(e) {
			const newMode = this.travelModeList[e.detail.value].value;
			const prevMode = this.formData.travelMode;
			const count = this.formData.passengers.length;
			// 用纯函数直接试算新上限（摆渡车等非自驾方式为 10，不受隐藏 vehicleType 影响）
			const newMax = getPassengerLimit(newMode, this.formData.vehicleType);
			if (count > newMax) {
				this.formData.travelMode = prevMode;
				const targetLabel = (this.travelModeList.find((i) => i.value === newMode) || {}).label || newMode;
				uni.showModal({
					title: '人数超限',
					content: `当前已添加${count}位出行人，${targetLabel}最多${newMax}人，请先删除多余人员。`,
					showCancel: false,
					confirmText: '我知道了',
				});
				return;
			}
			this.formData.travelMode = newMode;
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
			if (!this.formData.passengers || this.formData.passengers.length < 1) {
				uni.showToast({ title: '请至少添加一名出行人', icon: 'none' });
				return false;
			}

			// 验证每位出行人员（主出行人手机号与身份证必填；同行人只需姓名+身份证，手机号提交时补主出行人的；
			// 儿童/老人按身份证或暂时无法提供二选一）
			for (let i = 0; i < this.formData.passengers.length; i++) {
				const p = this.formData.passengers[i];
				const label = `第${i + 1}位出行人`;
				if (!p.name || !p.name.trim()) {
					uni.showToast({ title: `请输入${label}姓名`, icon: 'none' });
					return false;
				}
				// 手机号仅主出行人填写并校验
				if (i === 0 && (!p.phone || !this.validatePhone(p.phone))) {
					uni.showToast({ title: '请输入手机号码', icon: 'none' });
					return false;
				}
				if (p.idCardUnavailable === true) {
					// 只有儿童/老人允许暂时无法提供身份证；主出行人与成人必须填写
					if (i === 0 || p.passengerType !== 'child' && p.passengerType !== 'senior') {
						uni.showToast({ title: `${label}必须填写身份证号`, icon: 'none' });
						return false;
					}
				} else {
					if (!p.idCard || !this.validateIdCard(p.idCard)) {
						uni.showToast({ title: `请输入${label}正确的身份证号`, icon: 'none' });
						return false;
					}
					// 类型与年龄不符（含日期变化后的重算结果）时禁止提交，要求修改身份证或切换类型
					const typeErr = this.ageMismatchMap[p._key];
					if (typeErr) {
						uni.showToast({ title: typeErr, icon: 'none', duration: 2000 });
						return false;
					}
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

			// 金额唯一来源为后端 preview：失败/未完成时禁止提交，不得按本地金额直接下单
			if (this.previewState === 'error') {
				uni.showToast({ title: this.previewError || '价格计算失败，请重试', icon: 'none', duration: 2000 });
				return;
			}
			if (this.previewState !== 'success') {
				uni.showToast({ title: '请完善信息', icon: 'none' });
				return;
			}

			// 开始创建订单
			this.submitting = true;

			// 快照提交前的 preview 状态，用于判定是否需要二次确认（preview 免费 vs 创建收费）
			const previewSnapshot = this.previewResult;
			// 提交净化：白名单字段，不提交 _key、idCardError 等 UI 状态；人数始终为净化后数组长度
			// 同行人不填写手机号，统一补充主出行人的号码（contactPhone 即主出行人的有效号码）
			const mainPhone = this.contactPhone || '';
			const sanitizedPassengers = this.formData.passengers.map((p, i) => ({
				name: String(p.name || '').trim(),
				phone: i === 0 ? String(p.phone || '').trim() : mainPhone,
				idCard: p.idCard || '',
				passengerType: p.passengerType === 'child' || p.passengerType === 'senior' ? p.passengerType : 'adult',
				idCardUnavailable: p.idCardUnavailable === true,
			}));
			const submitData = {
				passengers: sanitizedPassengers,
				bookingDate: this.formData.bookingDate,
				timeSlot: this.formData.timeSlot,
				travelMode: this.formData.travelMode,
				licensePlate: this.formData.licensePlate || undefined,
				vehicleType: this.formData.vehicleType || undefined,
				tourGroupName: this.formData.tourGroupName || undefined,
				tourOrderNumber: this.formData.tourOrderNumber || undefined,
				personCount: sanitizedPassengers.length,
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
					// 创建失败：恢复 submitting；优先稳定业务错误码映射，未知 code 回退后端 message
					this.submitting = false;
					const failMessage = res.code
						? getPassengerErrorMessage(res.code, res.message)
						: (res.message || '预约失败，请稍后再试');
                                    uni.showModal({
                                        title: "预约失败",
                                        content: failMessage,
                                        showCancel: false,
                                        confirmText: "我知道了",
                                    });
				}
			}).catch(err => {
				// 创建失败：恢复 submitting；优先稳定业务错误码映射，未知 code 回退后端 message
				this.submitting = false;
				const raw = err && err.data ? err.data : null;
				const failMessage = raw && raw.code
					? getPassengerErrorMessage(raw.code, raw.message)
					: ((raw && raw.message) || '预约失败，请稍后再试');
                                uni.showModal({
                                    title: "预约失败",
                                    content: failMessage,
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
		// 获取预约详情（回显）：旧乘客逐项归一化，联系人强制 adult，人数以数组长度为准
		getBookingDetail(bookingId) {
			request({
				method: 'GET',
				url: `/bookings/${bookingId}`
			}).then(res => {
				if (res.success && res.data) {
					const d = res.data;
					let rawList = [];
					if (d.passengers) {
						try {
							const list = typeof d.passengers === 'string' ? JSON.parse(d.passengers) : d.passengers;
							rawList = Array.isArray(list) && list.length > 0 ? list : [];
						} catch (e) {
							rawList = [];
						}
					}
					if (rawList.length === 0) {
						rawList = [{ name: d.name || '', phone: d.phone || '', idCard: d.idCard || '' }];
					}
					// 逐项归一化（补 adult 等缺省字段，不保留历史计费快照），联系人强制 adult
					const list = rawList.map((raw, i) => {
						const fp = toFormPassenger(raw);
						if (i === 0) {
							fp.passengerType = 'adult';
							fp.idCardUnavailable = false;
						}
						return fp;
					});
					this.formData.passengers = list;
					// 以数组长度覆盖历史 personCount（人数唯一来源为人员列表）
					this.syncPersonCount();
					// 切换订单/重新进入页面时清空旧匹配状态
					this.profileMatchesByKey = {};
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
	background-color: #F5F8FA;
	padding-bottom: 200rpx;
	box-sizing: border-box;
}

/* ===== 顶部 header ===== */
.page-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	padding: 28rpx 30rpx 20rpx;
	background: #F5F8FA;
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
	color: #98A2A8;
	margin-top: 6rpx;
}

.header-notice {
	display: flex;
	align-items: center;
	background: #F7F9FA;
	border-radius: 28rpx;
	padding: 8rpx 16rpx;
	gap: 4rpx;
	flex-shrink: 0;
}

.notice-icon {
	font-size: 24rpx;
	color: #2F6E8E;
}

.notice-text {
	font-size: 26rpx;
	color: #2F6E8E;
	font-weight: 500;
}

.notice-arrow {
	font-size: 24rpx;
	color: #2F6E8E;
	font-weight: 300;
}

.form-container {
	padding: 24rpx;
	box-sizing: border-box;
	padding-bottom: 100rpx;
}

/* ===== 卡片区块 ===== */
.form-section {
	background: #FFFFFF;
	border-radius: 20rpx;
	margin-bottom: 24rpx;
	/* 必须建立 BFC（flow-root），否则末位子元素的 margin-bottom 会穿透本卡片，
	   与这里的 margin-bottom 合并到卡片外侧，导致免费横幅/预约人数贴着卡片底边。
	   不能用 overflow: hidden 替代：姓名栏的常用人员下拉是 absolute 定位，会被裁掉 */
	display: flow-root;
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

.rili {
	width: 34rpx;
	height: 34rpx;
}
.title-text {
	font-size: 28rpx;
	font-weight: 700;
	color: #2F6E8E;
}

/* ===== 出行人员卡片 ===== */
.passenger-card {
	margin: 0 24rpx 20rpx;
	background: #F5F8FA;
	border-radius: 16rpx;
	padding: 20rpx 20rpx 24rpx;
	border: 1.5rpx solid #DDE4E8;
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
	margin-bottom: 16rpx;
}

/* 同行人标识：仅在可删除的卡片（第 2 位起）显示，填补操作按钮左侧的空白 */
.passenger-card-label {
	font-size: 24rpx;
	color: #98A2A8;
	letter-spacing: 1rpx;
	padding-left: 14rpx;
	border-left: 4rpx solid #CAD6DC;
}

.passenger-delete-btn {
	font-size: 24rpx;
	color: #D94C4C;
	border: 1.5rpx solid #D94C4C;
	padding: 8rpx 24rpx;
	border-radius: 8rpx;
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
	color: #263238;
	font-weight: 500;
	margin-bottom: 14rpx;
}

/* ===== 字段错误提示文字 ===== */
.field-error-text {
	display: block;
	font-size: 26rpx;
	color: #D94C4C;
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
	color: #FFFFFF;
	font-weight: 500;
	line-height: 1.4;
	flex: 1;
}

.required-star::before {
	content: '* ';
	color: #D94C4C;
}

/* ===== 输入框容器 ===== */
.input-box {
	width: 100%;
	height: 80rpx;
	border: 1.5rpx solid #DDE4E8;
	border-radius: 12rpx;
	padding: 0 20rpx;
	box-sizing: border-box;
	display: flex;
	align-items: center;
	background: #FFFFFF;
}

.input-box--picker {
	justify-content: space-between;
}

/* 姓名输入框：作为常用人员下拉的定位锚点 */
.input-box--name {
	position: relative;
}

.field-input {
	flex: 1;
	height: 80rpx;
	line-height: 80rpx;
	font-size: 28rpx;
	color: #263238;
	background: transparent;
	border: none;
	padding: 0;
}

/* ===== Picker 显示文本 ===== */
.picker-text {
	flex: 1;
	font-size: 28rpx;
	color: #263238;
}

.picker-text--filled {
	color: #263238;
}

.picker-icon {
	font-size: 32rpx;
	color: #98A2A8;
}

.picker-icon-svg {
	width: 38rpx;
	height: 38rpx;
	flex-shrink: 0;
}

.picker-arrow {
	font-size: 36rpx;
	color: #98A2A8;
	font-weight: 300;
}

/* ===== 预约日期信息卡（免费提示 + 今日名额合成同一张，见模板） ===== */
.free-banner {
	display: flex;
	align-items: center;
	margin: 0 24rpx 24rpx;
	padding: 20rpx 26rpx;
	background: #F7F9FA;
	border: 1.5rpx solid #CAD6DC;
	border-radius: 16rpx;
}

.free-banner-icon {
	width: 56rpx;
	height: 56rpx;
	line-height: 56rpx;
	text-align: center;
	border-radius: 12rpx;
	background: #2F9275;
	color: #FFFFFF;
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
	color: #2F9275;
	margin-bottom: 6rpx;
}

.free-banner-desc {
	font-size: 24rpx;
	color: #5F6B73;
	line-height: 1.5;
}

/* 没有免费提示、只剩名额信息时转中性色，不蹭「免费」的蓝绿 ——
   否则「今日名额已满」会顶着一张渐变绿的卡 */
.free-banner--plain {
	background: #F7F9FA;
	border-color: #CAD6DC;
}

/* 付费原因（preview 驱动），收进同一张卡后与名额行同一层级 */
.free-banner-tip {
	font-size: 26rpx;
	color: #98A2A8;
	line-height: 1.6;
}

/* ===== 人数只读汇总（由人员列表驱动，展示在添加入口下方） ===== */
.count-summary {
	margin: 20rpx 24rpx 32rpx;
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8rpx 16rpx;
	font-size: 24rpx;
	color: #5F6B73;
}

.count-text {
	color: #5F6B73;
}

.count-number {
	font-size: 34rpx;
	font-weight: 800;
	color: #2F6E8E;
	margin: 0 4rpx;
}

.count-unit {
	font-size: 24rpx;
	color: #5F6B73;
}

.count-breakdown {
	font-size: 22rpx;
	color: #98A2A8;
}

.count-limit {
	margin-left: auto;
	font-size: 22rpx;
	color: #98A2A8;
}

/* ===== 今日名额（信息卡下半部分；文案与展示条件见 todayQuotaItems）
       与 .free-banner-desc 同级的小字，不再占一行大字：
       它和上面的免费提示同处一张卡，字号抢过说明文字就会把这张卡顶得突兀 ===== */
.quota-line {
	display: flex;
	flex-wrap: wrap;
	gap: 6rpx 20rpx;
	font-size: 26rpx;
	line-height: 1.5;
}

/* 上面还有免费提示时用分隔线断开；单独成条时不需要 */
.quota-line--divided {
	margin-top: 14rpx;
	padding-top: 14rpx;
	border-top: 1.5rpx solid rgba(47, 110, 142, 0.10);
}

/* 两态：alert 名额不够了（红）/ free 还能免费（绿）。
   绿色由 .free-banner-icon 的 #33C5A0 压深一档 —— 那是给色块用的，
   这个字号下直接当正文色偏浅 */
.quota-line-text--alert {
	color: #D94C4C;
}

.quota-line-text--free {
	color: #2F9275;
}

/* ===== 添加入口 ===== */
.add-entry-row {
	display: flex;
	/* gap: 20rpx; */
	margin-top: 20rpx;
}

.add-entry-btn {
	flex: 1;
	height: 76rpx;
	line-height: 1;
	font-size: 28rpx;
	font-weight: 600;
	border-radius: 16rpx;
	border: 1.5rpx solid #CAD6DC;
	background: linear-gradient(135deg, #E2EFF8 0%, #E2F2EC 100%);
	color: #263238;
	box-shadow: 0 6rpx 16rpx rgba(31, 55, 68, 0.08);
	margin:0 24rpx;
	padding: 0;
	display: flex;
	align-items: center;
	justify-content: center;
}

.add-entry-icon {
	width: 28rpx;
	height: 28rpx;
	display: block;
	flex-shrink: 0;
	margin-right: 10rpx;
}

.add-entry-btn--secondary {
	border-color: #DDE4E8;
	background: #F7F9FA;
	color: #5F6B73;
}

.add-entry-btn--disabled {
	border-color: #DDE4E8;
	background: #F5F8FA;
	color: #98A2A8;
	box-shadow: none;
}

.add-entry-btn::after {
	border: none;
}

/* ===== 人员卡片：操作区与类型标签 ===== */
.passenger-card-actions {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.passenger-edit-btn {
	font-size: 24rpx;
	color: #2F6E8E;
	border: 1.5rpx solid #2F6E8E;
	padding: 8rpx 24rpx;
	border-radius: 8rpx;
}

.passenger-tags {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-bottom: 16rpx;
}

.passenger-age-free-tag {
	font-size: 22rpx;
	color: #2F9275;
	background: #E8F4EF;
	border-radius: 8rpx;
	padding: 6rpx 16rpx;
}

.passenger-unavailable-tag {
	font-size: 22rpx;
	color: #9A7424;
	background: #FFF6E3;
	border-radius: 8rpx;
	padding: 6rpx 16rpx;
}

.passenger-age-mismatch-tag {
	font-size: 22rpx;
	color: #D94C4C;
	background: #FCECEC;
	border-radius: 8rpx;
	padding: 6rpx 16rpx;
}

/* ===== 底部价格状态文字 ===== */
.price-status-text {
	font-size: 26rpx;
	color: #98A2A8;
	line-height: 72rpx;
}

.price-status-text--error {
	color: #D94C4C;
	font-size: 24rpx;
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
	border: 1.5rpx solid #DDE4E8;
	border-radius: 14rpx;
	background: #FFFFFF;
	box-sizing: border-box;
}

.time-item--active {
	border-color: #2F6E8E;
	background: #F7F9FA;
}

.time-item__info {
	display: flex;
	flex-direction: column;
}

.time-item__title {
	font-size: 30rpx;
	font-weight: 600;
	color: #263238;
	margin-bottom: 6rpx;
}

.time-item__title--active {
	color: #2F6E8E;
}

.time-item__sub {
	font-size: 26rpx;
	color: #98A2A8;
}

.time-item__sub--active {
	color: #2F6E8E;
}

/* 单选圆圈 */
.radio-circle {
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	border: 2rpx solid #CAD6DC;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.radio-circle--checked {
	background: #2F6E8E;
	border-color: #2F6E8E;
}

.radio-check {
	font-size: 24rpx;
	color: #FFFFFF;
	font-weight: bold;
}

/* ===== 卡片内分隔线 ===== */
.section-divider {
	height: 1.5rpx;
	background: #E9EEF1;
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
	color: #263238;
}

.travel-select-value--filled {
	color: #263238;
}

.travel-arrow {
	font-size: 36rpx;
	color: #98A2A8;
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
	border: 1.5rpx solid #DDE4E8;
	border-radius: 12rpx;
	font-size: 28rpx;
	color: #263238;
	box-sizing: border-box;
	background: #FFFFFF;
}

.char-count {
	display: block;
	text-align: right;
	font-size: 24rpx;
	color: #98A2A8;
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
	background: #FFFFFF;
	box-shadow: 0 -2rpx 20rpx rgba(31, 55, 68, 0.08);
	z-index: 100;
}

.fee-tip {
	display: block;
	font-size: 26rpx;
	color: #98A2A8;
	padding: 0rpx 0 20rpx 0;
	line-height: 40rpx;
}

.fee-tip-link {
	font-size: 24rpx;
	color: #2F6E8E;
}

/* 勾选行 */
.agree-row {
	display: flex;
	align-items: center;
	margin-bottom: 10rpx;
	margin-top: 2rpx;
}

.agree-checkbox--warn {
	border-color: #D94C4C !important;
}

@keyframes flash-red {
	0%, 100% { border-color: #D94C4C; background: #FFFFFF; }
	50%       { border-color: #D94C4C; background: rgba(217, 76, 76, 0.14); }
}

.agree-checkbox--flash {
	border-color: #D94C4C !important;
	animation: flash-red 0.5s ease-in-out 2;
}

.agree-checkbox {
	width: 36rpx;
	height: 36rpx;
	border-radius: 8rpx;
	border: 2rpx solid #DDE4E8;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 12rpx;
	flex-shrink: 0;
	background: #FFFFFF;
}

.agree-checkbox--checked {
	background: #2F6E8E;
	border-color: #2F6E8E;
}

.agree-check-icon {
	font-size: 24rpx;
	color: #FFFFFF;
	font-weight: bold;
}

.agree-text {
	font-size: 26rpx;
	color: #5F6B73;
}

.agree-text--warn {
	color: #D94C4C;
	font-weight: 500;
	font-size: 24rpx;
}

.agree-link {
	font-size: 26rpx;
	color: #2F6E8E;
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
	color: #2F6E8E;
	font-weight: 600;
	line-height: 1;
}

.price-value {
	font-size: 56rpx;
	color: #2F6E8E;
	font-weight: 700;
	line-height: 1;
}
/* 底部结算栏的付费原因：单行省略，避免长文案换行把结算栏撑高（行高由 90rpx 的按钮决定，此处仍在预算内） */
.price-reason {
	max-width: 100%;
	font-size: 22rpx;
	color: #9A7424;
	line-height: 1.3;
	margin-bottom: 4rpx;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.price-tips {
	font-size: 28rpx;
	color: #5F6B73;
	font-weight: 400;
	line-height: 1;
}

.price-value--free {
	font-size: 44rpx;
	color: #2F9275;
}

.submit-btn {
	width: 280rpx;
	height: 90rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #3F99F6 0%, #33C5A0 100%);
	color: #FFFFFF;
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
	background: #FFFFFF;
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
	border-bottom: 1.5rpx solid #E9EEF1;
	flex-shrink: 0;
}

.notice-popup__title {
	font-size: 34rpx;
	font-weight: 700;
	color: #2F6E8E;
}

.notice-popup__close {
	font-size: 36rpx;
	color: #98A2A8;
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
	color: #5F6B73;
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
	color: #5F6B73;
	line-height: 1.7;
	margin-bottom: 4rpx;
}

.notice-footer {
	display: block;
	font-size: 24rpx;
	color: #98A2A8;
	line-height: 1.7;
	margin-top: 40rpx;
	padding-top: 24rpx;
	border-top: 1.5rpx solid #E9EEF1;
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
	background: #F7F9FA;
	color: #2F6E8E;
}

.notice-row__label {
	flex-shrink: 0;
	font-size: 26rpx;
	font-weight: 600;
	color: #263238;
	min-width: 120rpx;
}

.notice-row__text {
	flex: 1;
	font-size: 26rpx;
	color: #5F6B73;
	line-height: 1.6;
}

/* ===== 姓名栏常用人员内嵌下拉 ===== */
.name-picker-trigger {
	flex-shrink: 0;
	height: 80rpx;
	min-width: 168rpx;
	margin-left: 12rpx;
	padding-left: 20rpx;
	border-left: 1.5rpx solid #DDE4E8;
	display: flex;
	align-items: center;
	justify-content: flex-end;
}

.name-picker-text {
	font-size: 28rpx;
	color: #2F6E8E;
	line-height: 1;
}

.name-picker-chevron {
	width: 28rpx;
	height: 28rpx;
	display: block;
	flex-shrink: 0;
	margin-left: 6rpx;
}

/* 浮层展开期间 input 的降级占位：与 input 同高同字号，保证卡片高度不跳动 */
.field-input--static {
	display: block;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.profile-panel-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: transparent;
	z-index: 190;
}

/* 锚定在姓名输入框下方：absolute 定位使其随页面滚动自然跟随，无需监听滚动或重算几何 */
.profile-panel {
	position: absolute;
	top: calc(100% + 8rpx);
	left: 0;
	right: 0;
	background: #FFFFFF;
	border: 1.5rpx solid #DDE4E8;
	border-radius: 12rpx;
	box-shadow: 0 8rpx 32rpx rgba(31, 55, 68, 0.16);
	box-sizing: border-box;
	overflow: hidden;
	z-index: 195;
}

.profile-panel-item {
	display: flex;
	align-items: center;
	padding: 22rpx 24rpx;
	border-bottom: 1.5rpx solid #E9EEF1;
	box-sizing: border-box;
}

.profile-panel-item:last-child {
	border-bottom: none;
}

.profile-panel-item-name {
	flex: 1;
	font-size: 28rpx;
	font-weight: 500;
	color: #263238;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.profile-panel-item-phone {
	flex-shrink: 0;
	margin-left: 20rpx;
	font-size: 26rpx;
	color: #98A2A8;
}
</style>
