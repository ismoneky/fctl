// utils/passenger-pricing.js

// 前端人员类型、年龄与汇总纯函数。
// 结果仅用于即时 UI 反馈（类型错误提示、人数汇总、旧数据补全），
// 不生成可信金额或免费字段提交后端——计费以后端返回为准。

import { getIdCardError } from './id-card-input.js';

export const PASSENGER_TYPES = {
	ADULT: 'adult',
	CHILD: 'child',
	SENIOR: 'senior',
};

/** 儿童年龄免费边界：年龄值 <= 7 */
export const CHILD_MAX_AGE = 7;
/** 老人年龄免费边界：年龄值 >= 70 */
export const SENIOR_MIN_AGE = 70;

/**
 * 车型人数上限口径：自驾摩托 2 人、自驾小型客车 7 人、非机动车/摆渡车及其他出行方式 10 人。
 * 与后端 nest/src/modules/booking/passenger-pricing.ts 的 getPassengerLimit 保持完全一致；
 * 前端只用于交互提示，后端才是安全边界。
 * @param {String} travelMode
 * @param {String} vehicleType
 * @returns {Number}
 */
export function getPassengerLimit(travelMode, vehicleType) {
	if (travelMode === 'selfDriving' && vehicleType === 'wheelMotorcycle') {
		return 2;
	}
	if (travelMode === 'selfDriving' && vehicleType === 'smallCar') {
		return 7;
	}
	return 10;
}

/**
 * 新建联系人（首位、强制 adult）。
 * @param {Object} [seed] - 预填 name/phone/idCard（如从常用人员带入）
 * @returns {{name: string, phone: string, idCard: string, passengerType: 'adult', idCardUnavailable: boolean}}
 */
export function createAdultPassenger(seed = {}) {
	const s = seed || {};
	return {
		name: typeof s.name === 'string' ? s.name : '',
		phone: typeof s.phone === 'string' ? s.phone : '',
		idCard: typeof s.idCard === 'string' ? s.idCard : '',
		passengerType: 'adult',
		idCardUnavailable: false,
	};
}

/**
 * 归一化人员对象：旧数据缺失字段补默认值，新快照字段透传。
 * @param {Object} passenger - 旧订单人员或新快照人员
 * @param {Boolean} [bookingIsFree] - 旧订单 isFree（缺失 finalCharged 时的兜底）
 */
export function normalizePassenger(passenger, bookingIsFree = false) {
	const p = passenger || {};
	return {
		name: typeof p.name === 'string' ? p.name : '',
		phone: typeof p.phone === 'string' ? p.phone : '',
		idCard: typeof p.idCard === 'string' ? p.idCard : '',
		passengerType:
			p.passengerType === PASSENGER_TYPES.CHILD || p.passengerType === PASSENGER_TYPES.SENIOR
				? p.passengerType
				: PASSENGER_TYPES.ADULT,
		idCardUnavailable: p.idCardUnavailable === true,
		ageValue: typeof p.ageValue === 'number' ? p.ageValue : null,
		ageFree: p.ageFree === true,
		finalCharged: typeof p.finalCharged === 'boolean' ? p.finalCharged : !bookingIsFree,
		pricingReason: typeof p.pricingReason === 'string' && p.pricingReason ? p.pricingReason : null,
	};
}

/**
 * 年龄值 = 预约游玩年份 - 身份证出生年份（按年份粗略计算）。
 * 身份证不合法（未通过已落地的输入校验）或预约日期无有效年份时返回 null。
 * @param {String} idCard
 * @param {String} bookingDate - YYYY-MM-DD
 * @returns {Number|null}
 */
export function calculateYearAge(idCard, bookingDate) {
	const card = idCard == null ? '' : String(idCard);
	const date = bookingDate == null ? '' : String(bookingDate);
	if (!card || getIdCardError(card) !== '') {
		return null;
	}
	const match = date.match(/^(\d{4})-/);
	if (!match) {
		return null;
	}
	return parseInt(match[1], 10) - parseInt(card.substring(6, 10), 10);
}

/**
 * 人员类型与年龄一致性错误（即时 UI 提示）。
 * 预约日期未选、成人、无身份证或身份证未通过校验时不产生类型错误；
 * 类型与年龄不符时返回对应提示，由页面阻止提交，不静默改为普通收费。
 * @param {Object} passenger - { passengerType, idCard, idCardUnavailable }
 * @param {String} bookingDate - YYYY-MM-DD，可为空
 * @returns {string} 错误文案或 ''
 */
export function getPassengerTypeError(passenger, bookingDate) {
	const p = passenger || {};
	const type = p.passengerType;
	if ((type !== PASSENGER_TYPES.CHILD && type !== PASSENGER_TYPES.SENIOR) || p.idCardUnavailable === true) {
		return '';
	}
	const card = typeof p.idCard === 'string' ? p.idCard : '';
	if (!card || getIdCardError(card) !== '') {
		return '';
	}
	const age = calculateYearAge(card, bookingDate);
	if (age === null) {
		// 预约日期未选：只提示选择日期后计算，不产生类型错误
		return '';
	}
	// 年龄值为负（出生年份晚于预约年份）属于无效身份/类型组合，必须报类型不符
	if (type === PASSENGER_TYPES.CHILD && (age < 0 || age > CHILD_MAX_AGE)) {
		return '身份证年龄不符合7岁及以下儿童条件';
	}
	if (type === PASSENGER_TYPES.SENIOR && age < SENIOR_MIN_AGE) {
		return '身份证年龄不符合70岁及以上老人条件';
	}
	return '';
}

/**
 * 人员列表汇总（人数区域只读展示用）。
 * @param {Array} passengers
 * @returns {{total: number, adult: number, child: number, senior: number, idCardUnavailable: number}}
 */
export function summarizePassengers(passengers) {
	const list = Array.isArray(passengers) ? passengers : [];
	const summary = { total: list.length, adult: 0, child: 0, senior: 0, idCardUnavailable: 0 };
	for (const raw of list) {
		const p = normalizePassenger(raw);
		if (p.passengerType === PASSENGER_TYPES.CHILD) {
			summary.child += 1;
		} else if (p.passengerType === PASSENGER_TYPES.SENIOR) {
			summary.senior += 1;
		} else {
			summary.adult += 1;
		}
		if (p.idCardUnavailable) {
			summary.idCardUnavailable += 1;
		}
	}
	return summary;
}
