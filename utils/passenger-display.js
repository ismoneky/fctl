// utils/passenger-display.js

// 订单详情人员快照归一化与展示辅助（小程序表单与详情共用口径）。
// 历史详情使用订单保存的计费快照，绝不按当前年份重新计算年龄。

/**
 * 身份证展示文本：有值原样，空值显示「未提供」。
 * @param {String} idCard
 * @returns {String}
 */
export function maskIdCardText(idCard) {
	const card = idCard == null ? '' : String(idCard);
	if (!card) {
		return '未提供';
	}
	if (card.length < 8) {
		return card;
	}
	return card.substring(0, 4) + '**********' + card.substring(card.length - 4);
}

/**
 * 订单人员快照归一化（严格按实施计划 2.2 的旧订单默认值）。
 * 新快照字段透传；旧订单缺字段时按 booking.isFree / freeReason 推导。
 * @param {Object} passenger - passengers JSON 中的一名人员
 * @param {Object} booking - 订单对象（取 isFree / freeReason）
 */
export function normalizePassengerForDisplay(passenger, booking) {
	const p = passenger || {};
	const b = booking || {};
	const idCard = typeof p.idCard === 'string' ? p.idCard : '';
	return {
		name: typeof p.name === 'string' ? p.name : '',
		phone: typeof p.phone === 'string' ? p.phone : '',
		idCard,
		// 空身份证显示「未提供」，不显示空字符串
		idCardText: idCard ? idCard : '未提供',
		passengerType: p.passengerType === 'child' || p.passengerType === 'senior' ? p.passengerType : 'adult',
		idCardUnavailable: p.idCardUnavailable === true,
		ageValue: typeof p.ageValue === 'number' ? p.ageValue : null,
		ageFree: p.ageFree === true,
		finalCharged: typeof p.finalCharged === 'boolean' ? p.finalCharged : !(b.isFree === true),
		pricingReason:
			typeof p.pricingReason === 'string' && p.pricingReason
				? p.pricingReason
				: b.freeReason === 'member'
					? 'member_order_free'
					: b.freeReason === 'dailyQuota'
						? 'daily_quota_order_free'
						: 'regular',
	};
}

/**
 * 人员类型展示标签。
 * @param {String} passengerType
 * @param {Number} index - 在列表中的位置（0 为联系人）
 * @returns {String}
 */
export function getPassengerTypeLabel(passengerType, index) {
	if (index === 0) {
		return '联系人';
	}
	if (passengerType === 'child') {
		return '同行儿童';
	}
	if (passengerType === 'senior') {
		return '同行老人';
	}
	return '普通同行人';
}

/**
 * 年龄免费状态文案（仅 child/senior 且 ageFree 为 true 时有值）。
 * @param {Object} p - normalizePassengerForDisplay 结果
 * @returns {String}
 */
export function getAgeFreeStatusText(p) {
	if (!p || p.ageFree !== true) {
		return '';
	}
	if (p.passengerType === 'child') {
		return '7岁及以下，年龄免费';
	}
	if (p.passengerType === 'senior') {
		return '70岁及以上，年龄免费';
	}
	return '';
}
