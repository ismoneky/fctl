import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as pricing from '../utils/passenger-pricing.js';
import * as idCardInput from '../utils/id-card-input.js';
import { validateIdCard } from '../utils/validator.js';
import { findExactProfileMatches } from '../utils/profile-matcher.js';
import { getPassengerErrorMessage } from '../utils/passenger-error-messages.js';

// 预约页：车牌号与同行人证件都由用户真实填写，预览与下单提交同一份数据。
//
// 背景：曾经有一版「临时简化」——车牌号固定为占位值、同行人只填姓名（证件与手机号取系统占位），
// 现已恢复为真实采集。占位值只剩详情页展示层的 `--` 判断（utils/booking-defaults.js +
// utils/passenger-display.js），本文件不覆盖那部分（见 passenger-display.test.js）。
//
// 这里执行预约页的真实方法；只替换网络、小程序 API 和定时器，不创建真实订单。
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
		validateIdCardStrict: validateIdCard,
		findExactProfileMatches,
		getPassengerErrorMessage,
		// 下单成功分支才会用到（本文件的 request 桩一律失败），补齐以免 VM 里读到 undefined
		handlePayment: () => Promise.resolve(),
		ChildSeniorPassengerPopup: {},
		BookingDatePicker: {},
		setTimeout(callback) { timers.set(++timerId, callback); return timerId; },
		clearTimeout(id) { timers.delete(id); },
		uni: {
			showToast: (notice) => notices.push(notice),
			showModal: (notice) => notices.push(notice),
			hideKeyboard: () => {},
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
	page.formData.licensePlate = '京A12345';
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

test('同行人真实证件与手填车牌：预览与下单提交同一份数据', async () => {
	const { page, requests, flushPreview } = bookingForm();
	page.addAdultPassenger();
	const companion = page.formData.passengers[1];
	companion.name = ' 同行甲 ';
	companion.idCard = '110101199002022237';
	page.fetchPreview();
	await flushPreview();
	assert.equal(page.previewState, 'success');

	const preview = requests.find((request) => request.url === '/bookings/preview');
	assert.equal(preview.data.licensePlate, '京A12345');
	assert.equal(preview.data.passengers[0].idCard, '110101199001011237');
	// 同行人证件不再被系统占位替换
	assert.equal(preview.data.passengers[1].idCard, '110101199002022237');
	assert.equal(preview.data.passengers[1].name, ' 同行甲 ');

	page.handleSubmit();
	const submitted = requests.find((request) => request.url === '/bookings');
	assert.ok(submitted, '信息完整时应能提交订单');
	// 提交净化：同行人手机号补主出行人的号码，证件取各自真实填写值
	assert.deepEqual(submitted.data.passengers, [
		{ name: '联系人', phone: '13800000001', idCard: '110101199001011237', passengerType: 'adult', idCardUnavailable: false },
		{ name: '同行甲', phone: '13800000001', idCard: '110101199002022237', passengerType: 'adult', idCardUnavailable: false },
	]);
	assert.equal(submitted.data.licensePlate, '京A12345');
	assert.equal(submitted.data.personCount, 2);
	// 备注只提交用户自己写的，不再拼接「系统占位」说明
	assert.equal(submitted.data.remarks, '');
});

test('同行人身份证必填：缺失或校验位错误都在提交前被拦截', () => {
	const { page } = bookingForm();
	page.addAdultPassenger();
	const companion = page.formData.passengers[1];
	companion.name = '同行甲';
	assert.equal(page.validateForm(), false, '同行人只有姓名不能通过校验');

	companion.idCard = '410621199908042030'; // 校验位错误
	assert.equal(page.validateForm(), false);

	companion.idCard = '110101199003031231';
	assert.equal(page.validateForm(), true);

	// 联系人同样严格：身份证缺失或校验位错误都拦截
	for (const idCard of ['', '110101199001011230']) {
		page.formData.passengers[0].idCard = idCard;
		assert.equal(page.validateForm(), false);
	}
});

test('儿童同行人可勾选「暂时无法提供身份证」，类型与年龄不符仍禁止提交', () => {
	const { page } = bookingForm();
	page.addAdultPassenger();
	const companion = page.formData.passengers[1];
	Object.assign(companion, { name: '小童', passengerType: 'child', idCardUnavailable: true, idCard: '' });
	assert.equal(page.validateForm(), true, '儿童允许暂时无法提供身份证');
	assert.equal(page.personSummary.child, 1);

	// 换成成年人证件后类型不符（13 岁以上不再算儿童），标红并阻止提交
	companion.idCardUnavailable = false;
	companion.idCard = '110101199001011237';
	assert.equal(page.ageMismatchMap[companion._key], '身份证年龄不符合13岁及以下儿童条件');
	assert.equal(page.validateForm(), false);
});

test('再次预约回填旧车牌与真实证件，且不修改原订单对象', async () => {
	const original = {
		licensePlate: '京A12345', vehicleType: 'smallCar',
		passengers: [
			{ name: '旧联系人', phone: '13800000001', idCard: '110101199001011237', passengerType: 'adult' },
			{ name: '旧同行人', phone: '13900000002', idCard: '110101199002022237', passengerType: 'adult' },
		],
	};
	const snapshot = JSON.stringify(original);
	const { page, requests, flushPreview } = bookingForm(original);
	page.getBookingDetail('old-booking');
	await new Promise(setImmediate);
	assert.equal(page.formData.licensePlate, '京A12345');
	assert.equal(page.formData.passengers[1].idCard, '110101199002022237');

	page.fetchPreview();
	await flushPreview();
	assert.equal(page.previewState, 'success');
	page.handleSubmit();
	const submitted = requests.find((request) => request.url === '/bookings');
	assert.ok(submitted);
	assert.equal(submitted.data.licensePlate, '京A12345');
	assert.equal(submitted.data.passengers[1].idCard, '110101199002022237');
	assert.equal(JSON.stringify(original), snapshot);
});

test('车牌号校验：未填或格式错误拦截，非机动车不要求也不提交车牌', async () => {
	const { page, requests } = bookingForm();

	page.formData.licensePlate = '';
	assert.equal(page.validateForm(), false, '自驾不填车牌不能提交');

	page.formData.licensePlate = '京A123';
	assert.equal(page.validateForm(), false, '车牌格式错误不能提交');

	page.formData.licensePlate = '京A12345';
	assert.equal(page.validateForm(), true);

	// 非机动车入口在 picker 里注释着，这条分支仍保留：切换后清空车牌且不再要求车牌
	page.vehicleTypes.push({ label: '非机动车', value: 'nonMotorized' });
	page.onVehicleTypeChange({ detail: { value: page.vehicleTypes.length - 1 } });
	assert.equal(page.formData.vehicleType, 'nonMotorized');
	assert.equal(page.formData.licensePlate, '');
	assert.equal(page.validateForm(), true, '非机动车不需要车牌');

	page.runPreview();
	await new Promise(setImmediate);
	assert.equal(requests.at(-1).url, '/bookings/preview');
	assert.equal(requests.at(-1).data.licensePlate, undefined, '没有车牌时不提交车牌字段');
});

test('备注原样提交，姓名改动立即使旧价格预览失效', async () => {
	const { page, requests, flushPreview } = bookingForm();
	page.addAdultPassenger();
	const companion = page.formData.passengers[1];
	companion.name = '同行甲';
	companion.idCard = '110101199003031231';
	page.fetchPreview();
	await flushPreview();
	assert.equal(page.previewState, 'success');

	page.formData.remarks = '用户原备注';
	page.handleSubmit();
	const submitted = requests.find((request) => request.url === '/bookings');
	assert.ok(submitted);
	assert.equal(submitted.data.remarks, '用户原备注');

	// 姓名清空后表单不再完整，旧预览结果必须作废
	companion.name = '';
	page.fetchPreview();
	assert.equal(page.previewState, 'incomplete');
	assert.equal(page.previewResult, null);
});
