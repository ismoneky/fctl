import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as pricing from '../utils/passenger-pricing.js';
import * as idCardInput from '../utils/id-card-input.js';
import { validateIdCard } from '../utils/validator.js';
import { findExactProfileMatches } from '../utils/profile-matcher.js';
import { getPassengerErrorMessage } from '../utils/passenger-error-messages.js';
import * as bookingDefaults from '../utils/booking-defaults.js';

// 执行预约页的真实方法；只替换网络、小程序 API 和定时器，不创建真实订单。
function bookingForm(booking) {
	const source = fs.readFileSync(new URL('../pages/booking-form/booking-form.vue', import.meta.url), 'utf8');
	const script = source.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1]
		.replace(/import[\s\S]*?from\s*['"][^'"]+['"];?/g, '')
		.replace('export default', 'module.exports =');
	const requests = [];
	const notices = [];
	const timers = new Map();
	let timerId = 0;
	const context = {
		module: { exports: {} },
		...pricing,
		...idCardInput,
		...bookingDefaults,
		validateIdCardStrict: validateIdCard,
		findExactProfileMatches,
		getPassengerErrorMessage,
		ChildSeniorPassengerPopup: {},
		BookingDatePicker: {},
		setTimeout(callback) { timers.set(++timerId, callback); return timerId; },
		clearTimeout(id) { timers.delete(id); },
		uni: {
			showToast: (notice) => notices.push(notice),
			showModal: (notice) => notices.push(notice),
			getStorageSync: (key) => key === 'openid' ? 'test-openid' : false,
		},
		request(options) {
			requests.push(JSON.parse(JSON.stringify(options)));
			if (options.method === 'GET') return Promise.resolve({ success: true, data: booking });
			if (options.url === '/bookings/preview') {
				return Promise.resolve({ success: true, data: { isFree: false, amount: 2000 } });
			}
			return Promise.resolve({ success: false, message: '测试不创建订单' });
		},
	};
	vm.runInNewContext(script, context);
	const component = context.module.exports;
	const page = component.data();
	for (const [key, method] of Object.entries(component.methods)) page[key] = method.bind(page);
	for (const [key, getter] of Object.entries(component.computed)) {
		Object.defineProperty(page, key, { get: getter.bind(page) });
	}
	Object.assign(page.formData.passengers[0], {
		name: '联系人', phone: '13800000001', idCard: '110101199001011237',
	});
	page.formData.bookingDate = '2026-10-03';
	page.agreedNotice = true;
	page.agreedPrivacy = true;
	return {
		page, requests, notices,
		async flushPreview() {
			const pending = [...timers.values()];
			timers.clear();
			for (const callback of pending) callback();
			await new Promise(setImmediate);
		},
	};
}

test('只填写同行人姓名即可预览，预览和下单使用同一默认证件及车牌', async () => {
	const { page, requests, flushPreview } = bookingForm();
	page.addAdultPassenger();
	const companion = page.formData.passengers[1];
	page.onPassengerNameInput({ detail: { value: ' 同行甲 ' } }, companion._key);
	await flushPreview();
	assert.equal(page.previewState, 'success');
	const preview = requests.find((request) => request.url === '/bookings/preview');
	assert.deepEqual(preview.data.passengers, [
		{ name: '联系人', phone: '13800000001', idCard: '110101199001011237', passengerType: 'adult', idCardUnavailable: false },
		{ name: '同行甲', phone: '13800000001', idCard: '410621199908042035', passengerType: 'adult', idCardUnavailable: false },
	]);
	assert.equal(preview.data.licensePlate, '豫F8M100');
	page.handleSubmit();
	const submitted = requests.find((request) => request.url === '/bookings');
	assert.ok(submitted, '不能因已隐藏的身份证或车牌输入阻止下单');
	assert.deepEqual(submitted.data.passengers, preview.data.passengers);
	assert.equal(submitted.data.licensePlate, '豫F8M100');
	assert.equal(submitted.data.personCount, 2);
	assert.match(submitted.data.remarks, /系统占位/);
});

test('主联系人缺失或无效身份证仍被拦截，同行人姓名仍然必填', () => {
	const { page } = bookingForm();
	page.addAdultPassenger();
	page.formData.passengers[1].name = '同行甲';
	assert.equal(page.validateForm(), true);
	for (const idCard of ['', '410621199908042030']) {
		page.formData.passengers[0].idCard = idCard;
		assert.equal(page.validateForm(), false);
	}
	page.formData.passengers[0].idCard = '110101199001011237';
	page.formData.passengers[1].name = '  ';
	assert.equal(page.validateForm(), false);
});

test('选择儿童常用人员只取同行人姓名，不误用真实证件触发年龄优惠', async () => {
	const { page, requests, flushPreview } = bookingForm();
	page.addAdultPassenger();
	page.applyProfileToPassenger({ name: '同行儿童', phone: '13900000002', idCard: '11010120200101001X' }, page.formData.passengers[1]._key);
	await flushPreview();
	assert.equal(page.previewState, 'success');
	const companion = requests.find((request) => request.url === '/bookings/preview').data.passengers[1];
	assert.equal(companion.idCard, '410621199908042035');
	assert.equal(companion.phone, '13800000001');
	assert.equal(companion.passengerType, 'adult');
	assert.equal(page.personSummary.child, 0);
});

test('再次预约替换旧车牌和特殊同行人证件，主联系人及原订单保持不变', async () => {
	const original = {
		licensePlate: '京A12345', vehicleType: 'smallCar',
		passengers: [
			{ name: '旧联系人', phone: '13800000001', idCard: '110101199001011237', passengerType: 'adult' },
			{ name: '旧同行人', phone: '13900000002', idCard: '', passengerType: 'child', idCardUnavailable: true },
		],
	};
	const snapshot = JSON.stringify(original);
	const { page, requests, flushPreview } = bookingForm(original);
	page.getBookingDetail('old-booking');
	await new Promise(setImmediate);
	await flushPreview();
	assert.equal(page.previewState, 'success');
	assert.equal(page.personSummary.child, 0);
	page.handleSubmit();
	const submitted = requests.find((request) => request.url === '/bookings');
	assert.ok(submitted);
	assert.equal(submitted.data.licensePlate, '豫F8M100');
	assert.equal(submitted.data.passengers[0].idCard, '110101199001011237');
	assert.deepEqual(submitted.data.passengers[1], {
		name: '旧同行人', phone: '13800000001', idCard: '410621199908042035', passengerType: 'adult', idCardUnavailable: false,
	});
	assert.equal(JSON.stringify(original), snapshot);
});

test('非机动车和摆渡车不带占位车牌，切回汽车或摩托车恢复默认车牌', () => {
	const { page, requests } = bookingForm();
	for (const [travelMode, vehicleType, expected] of [
		['selfDriving', 'nonMotorized', undefined],
		['scenicBus', 'smallCar', undefined],
		['selfDriving', 'smallCar', '豫F8M100'],
		['selfDriving', 'wheelMotorcycle', '豫F8M100'],
	]) {
		Object.assign(page.formData, { travelMode, vehicleType });
		page.runPreview();
		assert.equal(requests.at(-1).data.licensePlate, expected);
		assert.equal(page.validateForm(), true);
	}
});

test('占位数据提交保留已有备注，姓名变化立即使旧价格预览失效', async () => {
	const { page, requests, flushPreview } = bookingForm();
	page.addAdultPassenger();
	page.onPassengerNameInput({ detail: { value: '同行甲' } }, page.formData.passengers[1]._key);
	await flushPreview();
	page.formData.remarks = '用户原备注';
	page.handleSubmit();
	const submitted = requests.find((request) => request.url === '/bookings');
	assert.ok(submitted);
	assert.match(submitted.data.remarks, /用户原备注/);
	page.onPassengerNameInput({ detail: { value: '' } }, page.formData.passengers[1]._key);
	assert.equal(page.previewState, 'incomplete');
	assert.equal(page.previewResult, null);
});
