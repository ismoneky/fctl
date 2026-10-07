import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as passengerDisplay from '../utils/passenger-display.js';
import {
	getAgeFreeStatusText,
	getPassengerTypeLabel,
	maskIdCardText,
	normalizePassengerForDisplay,
} from '../utils/passenger-display.js';

// 虚构号码，不含真实用户身份证。
const VALID_CARD = '110101199001011237';

test('旧收费订单：缺字段归一化为 adult + regular + finalCharged=true', () => {
	const p = normalizePassengerForDisplay({ name: '张三', phone: '13800000001', idCard: VALID_CARD }, { isFree: false, freeReason: null });
	assert.equal(p.name, '张三');
	assert.equal(p.phone, '13800000001');
	assert.equal(p.idCard, VALID_CARD);
	assert.equal(p.passengerType, 'adult');
	assert.equal(p.idCardUnavailable, false);
	assert.equal(p.ageValue, null);
	assert.equal(p.ageFree, false);
	assert.equal(p.finalCharged, true);
	assert.equal(p.pricingReason, 'regular');
});

test('旧会员免费订单：finalCharged=false + member_order_free', () => {
	const p = normalizePassengerForDisplay({ name: '张三', phone: '13800000001', idCard: VALID_CARD }, { isFree: true, freeReason: 'member' });
	assert.equal(p.finalCharged, false);
	assert.equal(p.pricingReason, 'member_order_free');
});

test('旧每日免费订单：finalCharged=false + daily_quota_order_free', () => {
	const p = normalizePassengerForDisplay({ name: '张三', phone: '13800000001', idCard: VALID_CARD }, { isFree: true, freeReason: 'dailyQuota' });
	assert.equal(p.finalCharged, false);
	assert.equal(p.pricingReason, 'daily_quota_order_free');
});

test('新年龄免费快照：字段透传', () => {
	const p = normalizePassengerForDisplay(
		{
			name: '儿童',
			phone: '13800000002',
			idCard: VALID_CARD,
			passengerType: 'child',
			idCardUnavailable: false,
			ageValue: 7,
			ageFree: true,
			finalCharged: false,
			pricingReason: 'child_age_free',
		},
		{ isFree: false, freeReason: null },
	);
	assert.equal(p.passengerType, 'child');
	assert.equal(p.ageValue, 7);
	assert.equal(p.ageFree, true);
	assert.equal(p.finalCharged, false);
	assert.equal(p.pricingReason, 'child_age_free');
});

test('无身份证快照：idCardText 为未提供，不显示空字符串', () => {
	const p = normalizePassengerForDisplay(
		{
			name: '儿童',
			phone: '13800000002',
			idCard: '',
			passengerType: 'child',
			idCardUnavailable: true,
			ageValue: null,
			ageFree: false,
			finalCharged: true,
			pricingReason: 'id_card_unavailable',
		},
		{ isFree: false, freeReason: null },
	);
	assert.equal(p.idCard, '');
	assert.equal(p.idCardText, '未提供');
	assert.equal(p.idCardUnavailable, true);
	assert.equal(p.finalCharged, true);
	assert.equal(p.pricingReason, 'id_card_unavailable');
});

test('有身份证时 idCardText 为原值', () => {
	const p = normalizePassengerForDisplay({ name: '张三', phone: '13800000001', idCard: VALID_CARD }, {});
	assert.equal(p.idCardText, VALID_CARD);
});

test('人员类型标签：联系人 / 普通同行人 / 同行儿童 / 同行老人', () => {
	assert.equal(getPassengerTypeLabel('adult', 0), '联系人');
	assert.equal(getPassengerTypeLabel('adult', 1), '普通同行人');
	assert.equal(getPassengerTypeLabel('child', 1), '同行儿童');
	assert.equal(getPassengerTypeLabel('senior', 2), '同行老人');
	// 旧数据缺失类型按普通同行人
	assert.equal(getPassengerTypeLabel(undefined, 1), '普通同行人');
});

test('年龄免费状态：儿童显示13岁及以下，老人规则保持70岁及以上', () => {
	assert.equal(getAgeFreeStatusText({ passengerType: 'child', ageFree: true }), '13岁及以下，年龄免费');
	assert.equal(getAgeFreeStatusText({ passengerType: 'senior', ageFree: true }), '70岁及以上，年龄免费');
});

test('maskIdCardText：掩码与未提供', () => {
	assert.equal(maskIdCardText(VALID_CARD), '1101**********1237');
	assert.equal(maskIdCardText(''), '未提供');
	assert.equal(maskIdCardText(null), '未提供');
	// 短字符串原样返回（防御）
	assert.equal(maskIdCardText('123'), '123');
});

test('订单详情人员列表：一次归一化出模板可直接渲染的字段', () => {
	const list = passengerDisplay.normalizePassengerListForDisplay(
		JSON.stringify([{ name: '张三', phone: '13800000001', idCard: VALID_CARD }]),
		{ isFree: true, freeReason: 'dailyQuota' },
	);

	assert.equal(list.length, 1);
	assert.deepEqual(list[0], {
		name: '张三',
		phone: '13800000001',
		idCard: VALID_CARD,
		idCardText: VALID_CARD,
		passengerType: 'adult',
		idCardUnavailable: false,
		ageValue: null,
		ageFree: false,
		finalCharged: false,
		pricingReason: 'daily_quota_order_free',
		typeLabel: '联系人',
		maskedIdCardText: '1101**********1237',
		ageFreeStatusText: '',
	});
});

test('默认车牌和同行人默认证件同时命中时显示 --，保留联系人和真实同行人证件', () => {
	const passengers = [
		{ name: '联系人', idCard: '410621199908042035' },
		{ name: '同行甲', idCard: '410621199908042035' },
		{ name: '同行乙', idCard: VALID_CARD },
	];
	const original = JSON.stringify(passengers);
	const booking = { licensePlate: '豫F8M100', isFree: false };
	const list = passengerDisplay.normalizePassengerListForDisplay(original, booking);
	assert.equal(list[0].maskedIdCardText, '4106**********2035');
	assert.equal(list[1].maskedIdCardText, '--');
	assert.equal(list[1].idCardText, '--');
	assert.equal(list[1].idCard, '410621199908042035', '仅调整显示，保留原始字段');
	assert.equal(list[2].maskedIdCardText, '1101**********1237');
	assert.equal(typeof passengerDisplay.getBookingLicensePlateText, 'function');
	assert.equal(passengerDisplay.getBookingLicensePlateText(booking, list), '--');
	assert.equal(JSON.stringify(passengers), original);
});

test('仅车牌或仅同行人身份证命中默认值时，保持原有展示', () => {
	for (const [plate, card, expectedCard] of [
		['豫F8M100', VALID_CARD, '1101**********1237'],
		['京A12345', '410621199908042035', '4106**********2035'],
		['', '410621199908042035', '4106**********2035'],
	]) {
		const booking = { licensePlate: plate };
		const list = passengerDisplay.normalizePassengerListForDisplay([
			{ name: '联系人', idCard: VALID_CARD },
			{ name: '同行人', idCard: card },
		], booking);
		assert.equal(list[1].maskedIdCardText, expectedCard);
		assert.equal(typeof passengerDisplay.getBookingLicensePlateText, 'function');
		assert.equal(passengerDisplay.getBookingLicensePlateText(booking, list), plate);
	}
});

test('没有同行人时只按默认车牌显示 --，主联系人真实证件正常展示', () => {
	const booking = { licensePlate: '豫F8M100' };
	for (const passengers of [
		[],
		[{ name: '联系人', idCard: VALID_CARD }],
		[{ name: '联系人', idCard: '410621199908042035' }],
	]) {
		const list = passengerDisplay.normalizePassengerListForDisplay(passengers, booking);
		assert.equal(passengerDisplay.getBookingLicensePlateText(booking, list), '--');
		if (list.length) assert.notEqual(list[0].maskedIdCardText, '--');
		assert.equal(passengerDisplay.getBookingLicensePlateText({ licensePlate: '京A12345' }, list), '京A12345');
	}
});

test('有同行人时仍要双匹配，联系人证件不能替代同行人参与判断', () => {
	const booking = { licensePlate: '豫F8M100' };
	const list = passengerDisplay.normalizePassengerListForDisplay([
		{ name: '联系人', idCard: '410621199908042035' },
		{ name: '同行人', idCard: VALID_CARD },
	], booking);
	assert.equal(passengerDisplay.getBookingLicensePlateText(booking, list), '豫F8M100');
	assert.equal(list[0].maskedIdCardText, '4106**********2035');
	assert.equal(list[1].maskedIdCardText, '1101**********1237');
});
