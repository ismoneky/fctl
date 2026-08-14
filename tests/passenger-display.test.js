import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
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

test('maskIdCardText：掩码与未提供', () => {
	assert.equal(maskIdCardText(VALID_CARD), '1101**********1237');
	assert.equal(maskIdCardText(''), '未提供');
	assert.equal(maskIdCardText(null), '未提供');
	// 短字符串原样返回（防御）
	assert.equal(maskIdCardText('123'), '123');
});
