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
				<!-- 核销留痕（bookings.verifiedAt）。只有真核销才有值，缺了就是数据异常。
				     核销人只在解析出姓名时附加——给游客看 openid 没有意义 -->
				<text class="hero-desc hero-desc--deadline" v-if="verifiedAtText">核销时间：{{ verifiedAtText }}</text>
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

			<!-- 已过期 —— 展示态由「订单状态 + 最新一条退款申请」组合而来（§4.3.5）
			     订单在退款全流程中始终保持 expired，所以下面的分支不是订单状态的分支，
			     而是申请单状态的分支。判定只用后端下发的 refundEntry，前端不自己算。 -->
			<view class="status-hero status-hero--expired" v-if="formData.status === 'expired'">
				<!-- 退款审核中 -->
				<template v-if="refundDisplayState === 'pending'">
					<text class="hero-title hero-title--expired">退款审核中</text>
					<text class="hero-desc">退款申请已提交，审核将在 2 个工作日内完成</text>
				</template>

				<!-- 退款处理中 -->
				<template v-else-if="refundDisplayState === 'approved'">
					<text class="hero-title hero-title--refunded">退款处理中</text>
					<text class="hero-desc">审核已通过，款项将在 1–3 个工作日内原路退回</text>
				</template>

				<!-- 已驳回：驳回理由必须原样展示，否则用户只会看到「被拒了」而不知道为什么 -->
				<template v-else-if="refundDisplayState === 'rejected'">
					<text class="hero-title hero-title--cancelled">退款申请未通过</text>
					<text class="hero-desc hero-desc--reason">{{ latestApplyRejectReason }}</text>
					<text class="hero-desc hero-desc--contact" v-if="refundContactPhone">如有疑问请联系管理员 {{ refundContactPhone }}</text>
				</template>

				<!-- 退款失败 -->
				<template v-else-if="refundDisplayState === 'failed'">
					<text class="hero-title hero-title--cancelled">退款未能完成</text>
					<text class="hero-desc">请联系管理员处理</text>
					<text class="hero-desc hero-desc--contact" v-if="refundContactPhone">{{ refundContactPhone }}</text>
				</template>

				<!-- 退款成功 -->
				<template v-else-if="refundDisplayState === 'success'">
					<text class="hero-title hero-title--refunded">退款已到账</text>
					<text class="hero-desc">款项已原路退回，请留意微信账户到账通知</text>
				</template>

				<!-- 不可申请（超期 / 次数用尽）：话术要说清「为什么没按钮」。
				     免费单是唯一例外——它没有款可退，也就没什么可解释的，
				     refundUnavailableText 返回空串，下面那行整个不渲染，只留标题 -->
				<template v-else-if="refundEntry && !refundEntry.visible">
					<text class="hero-title hero-title--expired">订单已过期</text>
					<text class="hero-desc" v-if="refundUnavailableText">{{ refundUnavailableText }}</text>
					<text class="hero-desc hero-desc--contact" v-if="showUnavailableContact">如有疑问请联系管理员 {{ refundContactPhone }}</text>
				</template>

				<!-- 可申请（含被驳回后仍可再次申请） -->
				<template v-else>
					<text class="hero-title hero-title--expired">订单已过期</text>
					<text class="hero-desc">该预约未核销，可申请退款</text>
					<text class="hero-desc hero-desc--deadline" v-if="refundApplyDeadlineText">申请截止：{{ refundApplyDeadlineText }}</text>
				</template>
			</view>

			<!-- 退款申请入口：显隐只认 refundEntry.visible。
			     **被驳回是终态**（2026-09-13 决策）→ 后端不再下发 visible=true，
			     所以这里不会出现「重新申请」，用户改走「联系管理员」那条路。 -->
			<view class="refund-action" v-if="formData.status === 'expired' && refundEntry && refundEntry.visible">
				<view class="refund-btn refund-btn--block" @tap="openRefundModal">申请退款</view>
				<text class="refund-action-hint">提交后由管理员审核，审核通过款项将原路退回</text>
			</view>

			<!-- 核验二维码 - 仅待使用状态显示。
			     前置于详情卡片之前：支付成功跳转回本页时，用户无需下滑即可看到核验码，
			     订单详情属于低频查阅信息，放在下方不影响核销主路径 -->
			<view class="qr-section" v-if="formData.status === 'confirmed' && formData.bookingId">
				<view class="qr-card">
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
				<!-- 导航前往（免费订单不支持退款，仅显示导航按钮） -->
				<view class="action-bar action-bar--row">
					<view class="nav-btn" @tap="onNavTap">
						<image class="nav-btn-icon" src="/static/svg/location-white.svg" mode="aspectFit" />
						<text>导航前往</text>
					</view>
					<view class="refund-btn" v-if="!formData.isFree" @tap="onRefund">申请退款</view>
				</view>
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

			<!-- 待支付 - 支付按钮 -->
			<view class="action-bar" v-if="formData.status === 'pending'">
				<view class="pay-btn" :class="{ 'pay-btn--disabled': paymentLaunching }" @tap="onPay">{{ paymentLaunching ? '正在准备支付…' : '立即支付' }}</view>
			</view>
		</view>

		<!-- 导航目的地选择（地点数据见 utils/scenic-location.js） -->
		<location-picker-popup
			:visible="locationPickerVisible"
			:locations="scenicLocations"
			@select="onLocationPicked"
			@close="locationPickerVisible = false"
		/>

		<!-- 退款申请弹窗：原因必填。
		     用自绘弹窗而不是 uni.showModal，是因为 showModal 只有单行输入（editable），
		     写不下「无法前往的说明」这类必要信息——而审核员正是靠这段文字做判断的。 -->
		<view class="modal" v-if="refundModalVisible" @click="closeRefundModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">申请退款</text>
				</view>
				<view class="modal-body">
					<text class="modal-text">退款金额 ¥{{ refundAmountText }}</text>
					<text class="refund-deadline-tip" v-if="refundApplyDeadlineText">申请截止：{{ refundApplyDeadlineText }}</text>
					<textarea
						class="refund-reason-input"
						v-model="refundReason"
						placeholder="请说明退款原因（必填），例如：行程有变无法前往"
						maxlength="500"
						:disabled="refundSubmitting"
					/>
					<text class="refund-reason-counter">{{ refundReason.length }}/500</text>
				</view>
				<view class="modal-footer">
					<view class="modal-btn" @click="closeRefundModal">再想想</view>
					<view class="modal-btn modal-btn-primary refund-submit-btn" @click="submitRefundApply">
						{{ refundSubmitting ? '提交中…' : '提交申请' }}
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import {
		request
	} from '../../utils/request';
	import { handlePayment } from '../../utils/payment';
	import { SCENIC_LOCATIONS, openScenicLocation } from '../../utils/scenic-location.js';
	import { normalizePassengerListForDisplay } from '../../utils/passenger-display.js';
	import LocationPickerPopup from '../../components/location-picker-popup.vue';

	export default {
		components: {
			LocationPickerPopup,
		},
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
					paymentExpiredAt: null,
					// 退款入口（§4.3.5，后端在 /bookings/:bookingId 下发的派生字段）。
					// **显隐、时限、次数全部来自它**，本页不自己算任何一条规则
					refundEntry: null,
					// 核销留痕（后端在 completed 订单上下发）。
					// ⚠️ 必须在这里显式声明：Vue 2 **检测不到「给响应式对象新增属性」**，
					// 靠 `Object.assign(formData, res.data)` 加进去的 key 不会触发
					// verifiedAtText 重算 —— 表现为核销时间那行永远不出现，且不报错。
					// formData 里把每个下发的字段都列全，就是为了避开这一条。
					verifiedAt: null
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
				timer: null,  // 详情刷新定时器
				// 候选导航地点（来源见 utils/scenic-location.js）——有多个地点，故先弹窗选择
				scenicLocations: SCENIC_LOCATIONS,
				locationPickerVisible: false,
				// 退款申请弹窗
				refundModalVisible: false,
				refundReason: '',
				refundSubmitting: false
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
			},
			/**
			 * 核销时间（后端 `bookings.verifiedAt`，只有 completed 有值）
			 *
			 * ⚠️ 不能把 `formData.verifiedAt` 直接丢给 `formatDateTimeText`：
			 * 实体字段是 Date，经 JSON 序列化出来是 ISO 字符串，而那个方法内部走 `Number(ms)`
			 * —— 喂字符串得到 NaN，返回空串，**静默不渲染**。
			 * （`refundEntry.applyDeadline` 是服务端算好的 epoch 毫秒，两种形状不能混。）
			 * 所以先归一成毫秒再交给它。
			 *
			 * **只显示时间，不显示核销人**：核销员是谁是后台追责用的信息，
			 * 对游客没有意义，后端在小程序这条链路上也就不下发 `verifiedByName`。
			 */
			verifiedAtText() {
				const raw = this.formData.verifiedAt;
				if (!raw) return '';
				const ms = typeof raw === 'number' ? raw : new Date(raw).getTime();
				return isNaN(ms) ? '' : this.formatDateTimeText(ms);
			},
			/**
			 * 退款入口（§4.3.5，后端在 `/bookings/:bookingId` 下发的派生字段）。
			 *
			 * 服务端字段统一挂在 `formData` 下（本页的表单模型也兼作响应容器），
			 * 但**模板读的是裸名**——「可申请 / 不可申请」兜底分支和退款按钮的 `v-if`
			 * 都直接写 `refundEntry.visible`。少了这层 computed，模板里的
			 * `this.refundEntry` 恒为 `undefined`：文案照样显示「该预约未核销，可申请退款」，
			 * 按钮却不渲染，「不可申请」（超期 / 次数用尽）那个分支也永远进不去。
			 */
			refundEntry() {
				return this.formData.refundEntry || null;
			},
			// 最新一条退款申请（无则 null）
			latestApply() {
				return (this.formData.refundEntry && this.formData.refundEntry.latestApply) || null;
			},
			/**
			 * 「订单状态 + 最新申请单状态」组合出的用户可见展示态（§4.3.5 映射表）。
			 *
			 * 只在 expired 分支下使用。没有申请单时返回 ''，由模板落到
			 * 「可申请 / 不可申请」两个兜底分支——那两个分支才看 refundEntry.visible。
			 */
			refundDisplayState() {
				if (this.formData.status !== 'expired') return '';
				const apply = this.latestApply;
				return apply ? apply.status : '';
			},
			// 驳回理由：后端保证 rejected 必有值，这里只做空值兜底，不让界面出现「未通过：」
			latestApplyRejectReason() {
				const apply = this.latestApply;
				if (!apply || apply.status !== 'rejected') return '';
				return apply.rejectReason || '未通过审核';
			},
			refundContactPhone() {
				return (this.formData.refundEntry && this.formData.refundEntry.contactPhone) || '';
			},
			// 电话只在「用户确实需要找人」的两个分支出现，不是到处贴
			showUnavailableContact() {
				return !!this.refundContactPhone
					&& (this.refundUnavailableReason === 'DEADLINE_EXCEEDED'
						|| this.refundUnavailableReason === 'APPLY_LIMIT_REACHED');
			},
			refundUnavailableReason() {
				return (this.formData.refundEntry && this.formData.refundEntry.reason) || '';
			},
			// reason 是文案兜底：接口异常时也说清「为什么不能退」，好过空白操作区
			refundUnavailableText() {
				switch (this.refundUnavailableReason) {
					case 'DEADLINE_EXCEEDED':
						return `退款申请已超期（截止 ${this.refundApplyDeadlineText || '—'}）`;
					case 'APPLY_REJECTED':
						// 驳回是终态（2026-09-13 决策）：不再提供重新申请入口，引导联系管理员
						return '退款申请未通过，如有疑问请联系管理员';
					case 'DEADLINE_UNAVAILABLE':
						return '退款申请入口未开放，如有疑问请联系管理员';
					case 'APPLY_LIMIT_REACHED':
						return '退款申请次数已用完，如需帮助请联系管理员';
					case 'FREE_ORDER':
						// 免费单没有款可退，也就没有「为什么不能退」这回事。套下面那句兜底
						// 文案会平白让人以为出了问题、还得找人联系，而用户其实什么都不用做。
						// 返回空串 = **故意不解释**，模板据此整行不渲染（2026-09-15 反馈）。
						return '';
					default:
						return '该预约未核销，如需帮助请联系管理员';
				}
			},
			// 申请截止时刻（epoch ms）→ 「YYYY-MM-DD HH:mm」
			refundApplyDeadlineText() {
				const entry = this.formData.refundEntry;
				if (!entry || !entry.applyDeadline) return '';
				return this.formatDateTimeText(entry.applyDeadline);
			},
			// 退款金额（元）。以后端下发的申请金额为准，没有申请单时用订单金额
			refundAmountText() {
				const cents = this.latestApply ? this.latestApply.refundAmount : (this.formData.amount || 0);
				return ((cents || 0) / 100).toFixed(2);
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
			/**
			 * epoch 毫秒 → 「YYYY年MM月DD日 HH:mm」
			 *
			 * 单独一个方法而不是复用 formatDateText：后者按字符串处理，
			 * 传 1730000000000 这类毫秒数进去会走 new Date(数字) 分支，
			 * 虽然碰巧能出日期，但拿不到时分（退款截止是精确到分钟的），
			 * 而且两种语义混在一个方法里，下次改动必然踩坑。
			 */
			formatDateTimeText(ms) {
				if (!ms) return '';
				const date = new Date(Number(ms));
				if (isNaN(date.getTime())) return '';
				const p = (n) => String(n).padStart(2, '0');
				return `${date.getFullYear()}年${p(date.getMonth() + 1)}月${p(date.getDate())}日 ${p(date.getHours())}:${p(date.getMinutes())}`;
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
			// 点击导航：有多个目的地，先弹窗选择，不直接跳转
			onNavTap() {
				this.locationPickerVisible = true;
			},
			// 弹窗选中目的地后才打开微信内置地图（导航能力的唯一出口）
			onLocationPicked(location) {
				this.locationPickerVisible = false;
				openScenicLocation(location);
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
			// ── 退款申请（过期订单的唯一资金出口，§4.3.1）──────────────────────────

			openRefundModal() {
				this.refundReason = '';
				this.refundModalVisible = true;
			},
			closeRefundModal() {
				if (this.refundSubmitting) return;
				this.refundModalVisible = false;
			},
			submitRefundApply() {
				if (this.refundSubmitting) return;
				const reason = (this.refundReason || '').trim();
				if (!reason) {
					uni.showToast({ title: '请填写退款原因', icon: 'none' });
					return;
				}

				this.refundSubmitting = true;
				uni.showLoading({ title: '提交中...' });
				request({
					method: 'POST',
					url: `bookings/${this.formData.bookingId}/refund-apply`,
					data: { reason }
				}).then(res => {
					this.refundModalVisible = false;
					uni.showModal({
						title: '申请已提交',
						content: '退款申请已提交，审核将在 2 个工作日内完成。',
						showCancel: false,
						confirmText: '我知道了'
					});
					// 重新拉取详情，让顶部切到「退款审核中」——本地改状态会与服务端漂移
					this.getBookingDetail(this.formData.bookingId);
				}).catch(err => {
					// 服务端才是真正的拦截点（超期 / 次数用尽 / 重复提交都在这里返回稳定错误码）。
					// 前端只负责把后端的话原样转达，不自己编一套判断
					const data = err && err.data;
					uni.showModal({
						title: '提交失败',
						content: (data && data.message) || '退款申请失败，请稍后重试',
						showCancel: false,
						confirmText: '我知道了'
					});
					this.getBookingDetail(this.formData.bookingId);
				}).finally(() => {
					this.refundSubmitting = false;
					uni.hideLoading();
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

	/* 已过期 —— 中性灰，与已取消同族（都是「已结束」而非「出错」），
	   但文案区域独立，避免与已取消的语义混淆 */
	.status-hero--expired {
		background: #f5f6f8;
		border: 1.5rpx solid #e0e0e0;
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
	.hero-title--expired   { color: #666; }

	.status-hero--completed .hero-desc,
	.status-hero--cancelled .hero-desc,
	.status-hero--refunded  .hero-desc,
	.status-hero--expired   .hero-desc {
		color: #aaa;
	}

	/* 副文案 */
	.hero-desc {
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.72);
		text-align: center;
		line-height: 1.6;
	}

	/* 驳回理由：比普通副文案重一档（#666 而非 #aaa），因为它是这一屏里
	   用户唯一需要逐字读的信息，不能和「感谢您的光临」同一种灰度 */
	.hero-desc--reason {
		color: #666;
		margin-top: 4rpx;
	}

	/* 客服电话行：与上一行拉开距离，避免读成同一句话的后半段 */
	.hero-desc--contact {
		margin-top: 10rpx;
	}

	/* 申请截止：贴在「可申请退款」下面，是催促用户尽快操作的那句话 */
	.hero-desc--deadline {
		margin-top: 10rpx;
		color: #8a6d3b;
	}

	/* 退款申请入口（整宽按钮，仅 expired 且 refundEntry.visible 时渲染） */
	.refund-action {
		margin-bottom: 20rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.refund-btn--block {
		width: 100%;
		box-sizing: border-box;
	}

	.refund-action-hint {
		margin-top: 14rpx;
		font-size: 22rpx;
		color: #999;
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

	/* 摩托车会员订单原先另用一套金色主题（#B8860B→#E8B339→#F0C75E）做现场核验区分，
	   现已取消，与普通订单共用上面 .qr-card 的蓝色渐变。
	   原因：金色底太亮（相对亮度 0.27~0.60），其上的白字与浅红字对比度只有 1.1~3.3:1，
	   全部低于门槛；而蓝底（亮度 0.14~0.07）需要浅色文字，两者无法共用一套文字配色。
	   会员身份改由右上角白底「会员」角标体现，不再靠卡片底色区分。 */

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

	/* 二维码上方预约人数，水平居中。已去掉胶囊底色与阴影，文字直接压在卡片渐变上。
	   对齐用 baseline（底线对齐）而非 center：三项字号差一倍以上（72 / 28 / 32rpx），
	   居中对齐会让「预约人数」和「人」浮在红字的腰部，看起来是错位的。
	   本块底色即卡片色（亮蓝→青绿 #3F99F6→#33C5A0，亮度 0.305→0.432）。
	   下面标签/单位用白字（2.18~2.96:1，低于 4.5:1），与卡片上原有一组白字文案
	   （标题 2.96:1、副标题约 1.6:1、订单号更低）保持同一视觉语言，属既有风格。 */
	.qr-person-count {
		display: flex;
		flex-direction: row;
		align-items: baseline;
		justify-content: center;
		gap: 10rpx;
		padding: 12rpx 40rpx;
		margin-bottom: 20rpx;
	}
	.qr-person-count-label {
		font-size: 28rpx;
		color: #ffffff;
		font-weight: 500;
	}
	/* 数字：正红 72rpx（52 → 56 → 64 → 72）。
	   【已知取舍，勿当疏漏改掉】卡片底色亮度 0.305~0.432，而纯红的亮度 0.2126 正好落在
	   这个区间中间，两者对比度只有 1.62~2.20:1，低于大号文字的 3:1 门槛 —— 这是为保留
	   正红观感而有意接受的。深红 #6E1220 能达到 3.98~5.40:1，但观感偏暗，已弃用。
	   若日后要同时满足可读性，必须动卡片底色而非红色本身：红在亮度居中的背景上无解，
	   只有白底（4.00:1）或近黑底（4.36:1）才成立。
	   line-height 保持 1，让数字的行盒紧贴自身，容器高度由它决定而不被小字的行高撑开 */
	.qr-person-count-number {
		font-size: 72rpx;
		color: #E60012;
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

	/* 已确认订单操作栏：导航 + 退款并列 */
	.action-bar--row {
		display: flex;
		gap: 20rpx;
	}

	.nav-btn {
		flex: 1.4;
		height: 90rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10rpx;
		background: linear-gradient(135deg, #3F99F6 0%, #2F6E8E 100%);
		color: #fff;
		font-size: 32rpx;
		font-weight: bold;
		border-radius: 45rpx;
		box-shadow: 0 8rpx 24rpx rgba(63, 153, 246, 0.3);
	}

	.nav-btn-icon {
		width: 34rpx;
		height: 34rpx;
	}

	.action-bar--row .refund-btn {
		flex: 1;
	}

	/* ===== 退款申请弹窗 =====
	   结构沿用 pages/booking/booking.vue 的取消确认弹窗，保持全站观感一致 */
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
		width: 620rpx;
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
		padding: 10rpx 30rpx 24rpx;
	}

	.modal-text {
		font-size: 30rpx;
		color: #333;
		display: block;
		text-align: center;
		margin-bottom: 8rpx;
	}

	.refund-deadline-tip {
		font-size: 24rpx;
		color: #8a6d3b;
		display: block;
		text-align: center;
		margin-bottom: 20rpx;
	}

	.refund-reason-input {
		width: 100%;
		box-sizing: border-box;
		height: 200rpx;
		background: #f5f8fa;
		border: 1.5rpx solid #E6E6E6;
		border-radius: 14rpx;
		padding: 20rpx;
		font-size: 28rpx;
		color: #333;
		line-height: 1.6;
	}

	.refund-reason-counter {
		display: block;
		text-align: right;
		font-size: 22rpx;
		color: #bbb;
		margin-top: 8rpx;
	}

	.modal-footer {
		display: flex;
		border-top: solid 1rpx #f0f0f0;
	}

	.modal-btn {
		flex: 1;
		height: 100rpx;
		line-height: 100rpx;
		text-align: center;
		font-size: 32rpx;
		background: #fff;
		color: #666;
	}

	.modal-btn-primary {
		color: #3F99F6;
		font-weight: bold;
		border-left: 1rpx solid #f0f0f0;
	}

	/* 主操作（提交申请）比「再想想」宽一点：这是个需要用户认真填写的表单，
	   不是二次确认弹窗，默认等分会让取消看起来和提交一样重要 */
	.refund-submit-btn {
		flex: 1.3;
	}
</style>
