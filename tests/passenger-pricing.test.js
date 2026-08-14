import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as passengerPricing from '../utils/passenger-pricing.js';
import {
	calculateYearAge,
	createAdultPassenger,
	getPassengerLimit,
	getPassengerTypeError,
	normalizePassenger,
	summarizePassengers,
} from '../utils/passenger-pricing.js';

// 测试数据均为按 MOD 11-2 校验算法生成的虚构号码，不含任何真实用户身份证。
function makeIdCard(birth, seq = '001') {
	const prefix = '110101' + birth + seq;
	const factors = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
	const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
	let sum = 0;
	for (let i = 0; i < 17; i++) {
		sum += parseInt(prefix[i], 10) * factors[i];
	}
	return prefix + checkCodes[sum % 11];
}

// 预约 2026 年时：2013 年生 → 13 岁，2012 年生 → 14 岁，1956 年生 → 70 岁，1957 年生 → 69 岁
const CHILD_13 = makeIdCard('20130101');
const CHILD_14 = makeIdCard('20120101');
const SENIOR_70 = makeIdCard('19560101');
const SENIOR_69 = makeIdCard('19570101');

test('calculateYearAge: 年龄边界 13/14/69/70', () => {
	assert.equal(calculateYearAge(CHILD_13, '2026-08-13'), 13);
	assert.equal(calculateYearAge(CHILD_14, '2026-08-13'), 14);
	assert.equal(calculateYearAge(SENIOR_70, '2026-08-13'), 70);
	assert.equal(calculateYearAge(SENIOR_69, '2026-08-13'), 69);
});

test('calculateYearAge: 跨年预约日期按年份重算', () => {
	assert.equal(calculateYearAge(CHILD_13, '2026-12-31'), 13);
	assert.equal(calculateYearAge(CHILD_13, '2027-01-01'), 14);
});

test('calculateYearAge: 日期为空或非法身份证返回 null', () => {
	assert.equal(calculateYearAge(CHILD_13, ''), null);
	assert.equal(calculateYearAge(CHILD_13, null), null);
	assert.equal(calculateYearAge(CHILD_13, 'abc'), null);
	assert.equal(calculateYearAge('110101199013011234', '2026-08-13'), null);
	assert.equal(calculateYearAge('', '2026-08-13'), null);
});

test('resolveEffectivePassengerType: 普通联系人/同行人按身份证年龄自动分类，显式类型保持不变', () => {
	const childContact = { passengerType: 'adult', idCard: CHILD_13 };
	const seniorCompanion = { passengerType: 'adult', idCard: SENIOR_70 };

	assert.equal(passengerPricing.resolveEffectivePassengerType(childContact, '2026-08-13'), 'child');
	assert.equal(passengerPricing.resolveEffectivePassengerType(seniorCompanion, '2026-08-13'), 'senior');
	assert.equal(passengerPricing.resolveEffectivePassengerType({ passengerType: 'adult', idCard: CHILD_14 }, '2026-08-13'), 'adult');
	assert.equal(passengerPricing.resolveEffectivePassengerType({ passengerType: 'child', idCard: CHILD_14 }, '2026-08-13'), 'child');
	assert.equal(passengerPricing.resolveEffectivePassengerType({ passengerType: 'senior', idCard: SENIOR_69 }, '2026-08-13'), 'senior');
	assert.equal(childContact.passengerType, 'adult');
	assert.equal(seniorCompanion.passengerType, 'adult');
});

test('summarizePassengers: 有预约日期时按有效年龄类型汇总普通联系人和同行人', () => {
	assert.deepEqual(
		summarizePassengers(
			[
				{ passengerType: 'adult', idCard: CHILD_13 },
				{ passengerType: 'adult', idCard: SENIOR_70 },
				{ passengerType: 'adult', idCard: CHILD_14 },
			],
			'2026-08-13',
		),
		{ total: 3, adult: 1, child: 1, senior: 1, idCardUnavailable: 0 },
	);
});

test('createAdultPassenger: 默认联系人结构', () => {
	const p = createAdultPassenger();
	assert.equal(p.name, '');
	assert.equal(p.phone, '');
	assert.equal(p.idCard, '');
	assert.equal(p.passengerType, 'adult');
	assert.equal(p.idCardUnavailable, false);
});

test('createAdultPassenger: seed 预填姓名/手机号/身份证，但类型强制为 adult', () => {
	const p = createAdultPassenger({ name: '张三', phone: '13800000001', idCard: CHILD_13, passengerType: 'child', idCardUnavailable: true });
	assert.equal(p.name, '张三');
	assert.equal(p.phone, '13800000001');
	assert.equal(p.idCard, CHILD_13);
	assert.equal(p.passengerType, 'adult');
	assert.equal(p.idCardUnavailable, false);
});

test('normalizePassenger: 旧乘客补 adult 字段与 finalCharged 默认值', () => {
	const old = normalizePassenger({ name: '张三', phone: '13800000001', idCard: CHILD_13 });
	assert.equal(old.passengerType, 'adult');
	assert.equal(old.idCardUnavailable, false);
	assert.equal(old.ageValue, null);
	assert.equal(old.ageFree, false);
	assert.equal(old.finalCharged, true); // 旧收费订单
});

test('normalizePassenger: 旧会员/每日免费订单 finalCharged=false', () => {
	const free = normalizePassenger({ name: '张三', phone: '13800000001', idCard: CHILD_13 }, true);
	assert.equal(free.finalCharged, false);
});

test('normalizePassenger: 新快照字段透传', () => {
	const snap = normalizePassenger({
		name: '儿童',
		phone: '13800000002',
		idCard: CHILD_13,
		passengerType: 'child',
		idCardUnavailable: false,
		ageValue: 13,
		ageFree: true,
		finalCharged: false,
		pricingReason: 'child_age_free',
	});
	assert.equal(snap.passengerType, 'child');
	assert.equal(snap.ageValue, 13);
	assert.equal(snap.ageFree, true);
	assert.equal(snap.finalCharged, false);
	assert.equal(snap.pricingReason, 'child_age_free');
});

test('normalizePassenger: 无身份证人员状态保留', () => {
	const noId = normalizePassenger({
		name: '儿童',
		phone: '13800000002',
		idCard: '',
		passengerType: 'child',
		idCardUnavailable: true,
		ageValue: null,
		ageFree: false,
		finalCharged: true,
		pricingReason: 'id_card_unavailable',
	});
	assert.equal(noId.passengerType, 'child');
	assert.equal(noId.idCardUnavailable, true);
	assert.equal(noId.finalCharged, true);
	assert.equal(noId.pricingReason, 'id_card_unavailable');
});

test('normalizePassenger: 空对象与 undefined 兜底', () => {
	const p = normalizePassenger(undefined);
	assert.equal(p.name, '');
	assert.equal(p.phone, '');
	assert.equal(p.idCard, '');
	assert.equal(p.passengerType, 'adult');
	assert.equal(p.idCardUnavailable, false);
});

test('getPassengerTypeError: 儿童 13 岁通过、14 岁报类型不符', () => {
	assert.equal(getPassengerTypeError({ passengerType: 'child', idCard: CHILD_13 }, '2026-08-13'), '');
	assert.equal(
		getPassengerTypeError({ passengerType: 'child', idCard: CHILD_14 }, '2026-08-13'),
		'身份证年龄不符合13岁及以下儿童条件',
	);
});

test('getPassengerTypeError: 未来出生年份（校验码正确）报类型不符', () => {
	const future = makeIdCard('20300101');
	assert.equal(calculateYearAge(future, '2026-08-13'), -4);
	assert.equal(
		getPassengerTypeError({ passengerType: 'child', idCard: future }, '2026-08-13'),
		'身份证年龄不符合13岁及以下儿童条件',
	);
	assert.equal(
		getPassengerTypeError({ passengerType: 'senior', idCard: future }, '2026-08-13'),
		'身份证年龄不符合70岁及以上老人条件',
	);
});

test('getPassengerTypeError: 老人 70 岁通过、69 岁报类型不符', () => {
	assert.equal(getPassengerTypeError({ passengerType: 'senior', idCard: SENIOR_70 }, '2026-08-13'), '');
	assert.equal(
		getPassengerTypeError({ passengerType: 'senior', idCard: SENIOR_69 }, '2026-08-13'),
		'身份证年龄不符合70岁及以上老人条件',
	);
});

test('getPassengerTypeError: 预约日期为空时不产生类型错误', () => {
	assert.equal(getPassengerTypeError({ passengerType: 'child', idCard: CHILD_14 }, ''), '');
	assert.equal(getPassengerTypeError({ passengerType: 'senior', idCard: SENIOR_69 }, ''), '');
});

test('getPassengerTypeError: 成人、无身份证、身份证不合法均不报类型错误', () => {
	assert.equal(getPassengerTypeError({ passengerType: 'adult', idCard: CHILD_13 }, '2026-08-13'), '');
	assert.equal(
		getPassengerTypeError({ passengerType: 'child', idCard: '', idCardUnavailable: true }, '2026-08-13'),
		'',
	);
	assert.equal(getPassengerTypeError({ passengerType: 'child', idCard: '110101199013011234' }, '2026-08-13'), '');
	assert.equal(getPassengerTypeError({ passengerType: 'child', idCard: '' }, '2026-08-13'), '');
});

test('getPassengerLimit: 与后端一致的 2/7/10 口径（摆渡车等不受 vehicleType 影响）', () => {
	assert.equal(getPassengerLimit('selfDriving', 'wheelMotorcycle'), 2);
	assert.equal(getPassengerLimit('selfDriving', 'smallCar'), 7);
	assert.equal(getPassengerLimit('selfDriving', 'nonMotorized'), 10);
	assert.equal(getPassengerLimit('scenicBus', 'smallCar'), 10);
	assert.equal(getPassengerLimit('scenicBus', undefined), 10);
	assert.equal(getPassengerLimit('tourGroup', null), 10);
	assert.equal(getPassengerLimit(undefined, undefined), 10);
});

test('summarizePassengers: 各类人员汇总与无身份证计数', () => {
	const summary = summarizePassengers([
		{ name: '张三', passengerType: 'adult' },
		{ name: '儿童', passengerType: 'child', idCard: CHILD_13 },
		{ name: '儿童乙', passengerType: 'child', idCardUnavailable: true },
		{ name: '老人', passengerType: 'senior', idCard: SENIOR_70 },
	]);
	assert.deepEqual(summary, { total: 4, adult: 1, child: 2, senior: 1, idCardUnavailable: 1 });
});

test('summarizePassengers: 旧数据缺失类型按 adult 汇总', () => {
	const summary = summarizePassengers([{ name: '旧数据' }, { name: '旧数据2', passengerType: 'child' }]);
	assert.deepEqual(summary, { total: 2, adult: 1, child: 1, senior: 0, idCardUnavailable: 0 });
});

test('summarizePassengers: 空数组与非数组兜底', () => {
	assert.deepEqual(summarizePassengers([]), { total: 0, adult: 0, child: 0, senior: 0, idCardUnavailable: 0 });
	assert.deepEqual(summarizePassengers(null), { total: 0, adult: 0, child: 0, senior: 0, idCardUnavailable: 0 });
});

test('removePassengerByKey: 删除同行人并清理该人员的匹配状态', () => {
	assert.equal(typeof passengerPricing.removePassengerByKey, 'function');
	const passengers = [
		{ _key: 'contact', name: '联系人' },
		{ _key: 'companion', name: '同行人' },
	];
	const profileMatchesByKey = {
		contact: [{ profileId: 'profile-contact' }],
		companion: [{ profileId: 'profile-companion' }],
	};

	const removed = passengerPricing.removePassengerByKey(passengers, profileMatchesByKey, 'companion');

	assert.equal(removed, true);
	assert.deepEqual(passengers, [{ _key: 'contact', name: '联系人' }]);
	assert.deepEqual(profileMatchesByKey, {
		contact: [{ profileId: 'profile-contact' }],
	});
});
