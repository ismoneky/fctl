<template>
	<!-- 根节点常驻，避免组件本身参与页面节点切换；未打开时不挂载弹窗内容，规避 iOS 隐藏节点渲染异常。 -->
	<view>
		<!-- 半透明遮罩：仅在打开时挂载，避免透明遮罩拦截页面交互 -->
		<view v-if="visible" class="cs-mask" @click="handleClose"></view>

		<!-- 底部弹窗：仅在打开时挂载，保留组件本身及后续功能代码 -->
		<view v-if="visible" class="cs-popup cs-popup--show">
			<view class="cs-header">
				<text class="cs-title">添加同行儿童/老人</text>
				<text class="cs-close" @click="handleClose">×</text>
			</view>

			<scroll-view class="cs-body" scroll-y>
				<!-- 类型分段按钮：默认都不选，切换保留已填内容并立即重新校验年龄 -->
				<view class="cs-type-row">
					<view
						class="cs-type-btn"
						:class="{ 'cs-type-btn--active': draft.passengerType === 'child' }"
						@click="switchType('child')"
					>13岁及以下儿童</view>
					<view
						class="cs-type-btn"
						:class="{ 'cs-type-btn--active': draft.passengerType === 'senior' }"
						@click="switchType('senior')"
					>70岁及以上老人</view>
				</view>
				<text class="cs-error" v-if="errors.type">{{ errors.type }}</text>
				<text class="cs-error" v-if="errors.age">{{ errors.age }}</text>

				<!-- 姓名 -->
				<view class="cs-field">
					<text class="cs-label">姓名 <text class="cs-required">*</text></text>
					<input
						class="cs-input"
						v-model="draft.name"
						placeholder="请输入真实姓名"
						maxlength="10"
						placeholder-class="cs-placeholder"
						@input="clearError('name')"
					/>
					<text class="cs-error" v-if="errors.name">{{ errors.name }}</text>
				</view>

				<!-- 手机号：新增模式且默认手机号有效时自动带入 -->
				<view class="cs-field">
					<text class="cs-label">手机号码</text>
					<input
						class="cs-input"
						v-model="draft.phone"
						type="number"
						placeholder="默认使用联系人手机号"
						maxlength="11"
						placeholder-class="cs-placeholder"
						@input="clearError('phone')"
					/>
					<text class="cs-error" v-if="errors.phone">{{ errors.phone }}</text>
				</view>

				<!-- 身份证号：复用已落地的归一化与错误分类 -->
				<view class="cs-field">
					<text class="cs-label">身份证号</text>
					<input
						class="cs-input"
						v-model="idCardDraft"
						:disabled="draft.idCardUnavailable"
						placeholder="请输入18位身份证号"
						maxlength="18"
						placeholder-class="cs-placeholder"
					/>
					<text class="cs-error" v-if="errors.idCard">{{ errors.idCard }}</text>
				</view>

				<!-- 暂时无法提供身份证号：普通复选框 + 次要文字，不使用醒目按钮 -->
				<view class="cs-unavailable" @click="toggleUnavailable">
					<view class="cs-checkbox" :class="{ 'cs-checkbox--checked': draft.idCardUnavailable }">
						<text class="cs-checkbox-mark" v-if="draft.idCardUnavailable">✓</text>
					</view>
					<text class="cs-unavailable-text">暂时无法提供身份证号</text>
				</view>

				<!-- 勾选后只展示浅黄色弱提示，不弹二次 Modal -->
				<view class="cs-hint" v-if="draft.idCardUnavailable">
					未提供身份证号时无法核验年龄，不能享受年龄免费，本次按正常价格收费。
				</view>
				<!-- 未选预约日期时只提示，不展示免费结论 -->
				<view class="cs-hint" v-else-if="!bookingDate">选择预约日期后计算年龄优惠</view>
			</scroll-view>

			<!-- 底部操作栏固定，适配安全区 -->
			<view class="cs-footer">
				<button class="cs-btn cs-btn--cancel" @click="handleClose">取消</button>
				<button class="cs-btn cs-btn--confirm" @click="handleConfirm">{{ confirmText }}</button>
			</view>
		</view>
	</view>
</template>

<script>
import { normalizeIdCardInput, getIdCardError } from '../utils/id-card-input.js';
import { validatePhone } from '../utils/validator.js';
import { getPassengerTypeError } from '../utils/passenger-pricing.js';

export default {
	name: 'ChildSeniorPassengerPopup',
	props: {
		visible: Boolean,
		/** 编辑模式时传入原人员对象；新增模式为 null */
		passenger: {
			type: Object,
			default: null,
		},
		/** 预约日期 YYYY-MM-DD，可为空 */
		bookingDate: {
			type: String,
			default: '',
		},
		/** 联系人手机号（仅在有效时带入新增表单） */
		defaultPhone: {
			type: String,
			default: '',
		},
		mode: {
			type: String,
			default: 'add',
		},
	},
	emits: ['confirm', 'close'],
	data() {
		return {
			// 草稿副本：关闭不修改父页面，取消不影响原数据
			draft: {
				name: '',
				phone: '',
				idCard: '',
				passengerType: '',
				idCardUnavailable: false,
			},
			errors: {
				type: '',
				name: '',
				phone: '',
				idCard: '',
				age: '',
			},
		};
	},
	computed: {
		confirmText() {
			return this.mode === 'edit' ? '确认保存' : '确认添加';
		},
		// 身份证输入即时归一化并分类错误
		idCardDraft: {
			get() {
				return this.draft.idCard;
			},
			set(value) {
				this.draft.idCard = normalizeIdCardInput(value);
				this.errors.idCard = getIdCardError(this.draft.idCard);
				this.errors.age = '';
			},
		},
	},
	watch: {
		visible(val) {
			if (val) {
				this.resetDraft();
			}
		},
	},
	methods: {
		// 打开时初始化草稿：编辑回填全部状态；新增只带入有效的联系人手机号
		resetDraft() {
			this.errors = { type: '', name: '', phone: '', idCard: '', age: '' };
			if (this.mode === 'edit' && this.passenger) {
				const p = this.passenger;
				this.draft = {
					name: typeof p.name === 'string' ? p.name : '',
					phone: typeof p.phone === 'string' ? p.phone : '',
					idCard: p.idCardUnavailable ? '' : (typeof p.idCard === 'string' ? p.idCard : ''),
					passengerType: p.passengerType === 'child' || p.passengerType === 'senior' ? p.passengerType : '',
					idCardUnavailable: p.idCardUnavailable === true,
				};
			} else {
				this.draft = {
					name: '',
					phone: validatePhone(this.defaultPhone || '') ? this.defaultPhone : '',
					idCard: '',
					passengerType: '',
					idCardUnavailable: false,
				};
			}
		},
		switchType(type) {
			// 切换类型保留姓名、手机号和身份证，但立即重新校验年龄
			this.draft.passengerType = type;
			this.errors.type = '';
			this.errors.age = this.getAgeError();
		},
		toggleUnavailable() {
			const next = !this.draft.idCardUnavailable;
			this.draft.idCardUnavailable = next;
			if (next) {
				// 勾选后清空并禁用身份证输入框、清除该字段错误
				this.draft.idCard = '';
				this.errors.idCard = '';
				this.errors.age = '';
			}
		},
		clearError(field) {
			if (this.errors[field]) {
				this.errors[field] = '';
			}
		},
		// 年龄与类型一致性（复用纯函数，预约日期未选时返回空）
		getAgeError() {
			return getPassengerTypeError(
				{ passengerType: this.draft.passengerType, idCard: this.draft.idCard, idCardUnavailable: this.draft.idCardUnavailable },
				this.bookingDate || '',
			);
		},
		// 确认校验顺序：类型 → 姓名 → 手机号 → 身份证/暂时无法提供 → 年龄与类型
		validate() {
			this.errors = { type: '', name: '', phone: '', idCard: '', age: '' };
			const d = this.draft;

			if (d.passengerType !== 'child' && d.passengerType !== 'senior') {
				this.errors.type = '请选择出行人类型';
				return false;
			}

			const name = (d.name || '').trim();
			if (!name) {
				this.errors.name = '请输入真实姓名';
				return false;
			}

			const phone = (d.phone || '').trim();
			if (!phone) {
				this.errors.phone = '请输入手机号码';
				return false;
			}
			if (!validatePhone(phone)) {
				this.errors.phone = '请输入正确的手机号码';
				return false;
			}

			if (!d.idCardUnavailable) {
				if (!d.idCard) {
					this.errors.idCard = '请输入18位身份证号或勾选暂时无法提供';
					return false;
				}
				const idErr = getIdCardError(d.idCard);
				if (idErr) {
					this.errors.idCard = idErr;
					return false;
				}
				if (this.bookingDate) {
					const ageErr = this.getAgeError();
					if (ageErr) {
						this.errors.age = ageErr;
						return false;
					}
				}
			}

			return true;
		},
		handleConfirm() {
			if (!this.validate()) {
				return;
			}
			const d = this.draft;
			// 确认事件只返回人员字段，不返回 ageFree/ageValue/amount 等计费字段
			this.$emit('confirm', {
				name: (d.name || '').trim(),
				phone: (d.phone || '').trim(),
				idCard: d.idCardUnavailable ? '' : d.idCard,
				passengerType: d.passengerType,
				idCardUnavailable: d.idCardUnavailable,
			});
		},
		handleClose() {
			this.$emit('close');
		},
	},
};
</script>

<style scoped>
.cs-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 200;
}

.cs-popup {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	background: #fff;
	border-radius: 32rpx 32rpx 0 0;
	box-shadow: 0 -8rpx 40rpx rgba(0, 0, 0, 0.15);
	z-index: 201;
	transform: translateY(0);
	/* 固定高度：iOS WKWebView 对不定高 flex 子项撑开计算为 0，导致弹窗中间内容空白 */
	height: 80vh;
	display: flex;
	flex-direction: column;
	padding-bottom: env(safe-area-inset-bottom);
	box-sizing: border-box;
}

.cs-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 36rpx 40rpx 24rpx;
	border-bottom: 1.5rpx solid #f0f0f0;
	flex-shrink: 0;
}

.cs-title {
	font-size: 34rpx;
	font-weight: 700;
	color: #2f6e8e;
}

.cs-close {
	font-size: 36rpx;
	color: #999;
	padding: 8rpx;
}

.cs-body {
	flex: 1;
	overflow: hidden;
	/* flex 撑开写法：父容器已有固定高度，此处的 height:0 让 flex:1 接管实际高度 */
	height: 0;
	padding: 0 40rpx;
	box-sizing: border-box;
}

.cs-type-row {
	display: flex;
	gap: 20rpx;
	margin-top: 32rpx;
}

.cs-type-btn {
	flex: 1;
	height: 80rpx;
	line-height: 80rpx;
	text-align: center;
	font-size: 28rpx;
	color: #555;
	background: #f4f6f8;
	border-radius: 16rpx;
	border: 2rpx solid transparent;
	transition: all 0.2s ease;
}

.cs-type-btn--active {
	color: #2f6e8e;
	font-weight: 700;
	background: #eaf4fe;
	border-color: #3f99f6;
}

.cs-field {
	margin-top: 28rpx;
}

.cs-label {
	display: block;
	font-size: 28rpx;
	color: #555;
	margin-bottom: 12rpx;
}

.cs-required {
	color: #e64545;
}

.cs-input {
	height: 88rpx;
	line-height: 88rpx;
	padding: 0 24rpx;
	font-size: 30rpx;
	color: #333;
	background: #f7f9fa;
	border-radius: 16rpx;
}

.cs-placeholder {
	color: #bbb;
}

.cs-unavailable {
	display: flex;
	align-items: center;
	margin-top: 28rpx;
}

.cs-checkbox {
	width: 40rpx;
	height: 40rpx;
	border-radius: 8rpx;
	border: 2rpx solid #bbb;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 16rpx;
	box-sizing: border-box;
}

.cs-checkbox--checked {
	background: #3f99f6;
	border-color: #3f99f6;
}

.cs-checkbox-mark {
	color: #fff;
	font-size: 26rpx;
	line-height: 1;
}

.cs-unavailable-text {
	font-size: 28rpx;
	color: #777;
}

.cs-hint {
	margin-top: 20rpx;
	padding: 16rpx 20rpx;
	background: #fff8e1;
	border-radius: 12rpx;
	font-size: 24rpx;
	line-height: 1.6;
	color: #a0761a;
}

.cs-error {
	display: block;
	margin-top: 10rpx;
	font-size: 24rpx;
	color: #e64545;
}

.cs-footer {
	display: flex;
	gap: 20rpx;
	padding: 24rpx 40rpx;
	border-top: 1.5rpx solid #f0f0f0;
	flex-shrink: 0;
}

.cs-btn {
	flex: 1;
	height: 88rpx;
	line-height: 88rpx;
	font-size: 30rpx;
	border-radius: 44rpx;
	border: none;
	margin: 0;
	padding: 0;
}

.cs-btn::after {
	border: none;
}

.cs-btn--cancel {
	background: #f2f3f5;
	color: #666;
}

.cs-btn--confirm {
	background: linear-gradient(135deg, #3f99f6 0%, #33c5a0 100%);
	color: #fff;
}
</style>
