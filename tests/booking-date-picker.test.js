import { test } from 'node:test';
import assert from 'node:assert/strict';

import * as bookingDatePicker from '../utils/booking-date-picker.js';

const {
	buildCalendarDays,
	buildQuickDateOptions,
	formatDateOption,
	shiftCalendarMonth,
} = bookingDatePicker;

test('预约页默认选择当前第一个可预约日期', () => {
	assert.equal(typeof bookingDatePicker.resolveInitialBookingDate, 'function');
	assert.equal(bookingDatePicker.resolveInitialBookingDate('2026-09-28', '2026-12-28'), '2026-09-28');
	assert.equal(bookingDatePicker.resolveInitialBookingDate('', '2026-12-28'), '');
	assert.equal(bookingDatePicker.resolveInitialBookingDate('2026-09-28', '2026-09-27'), '');
});

test('快捷日期从最小可预约日开始连续生成，并使用中文星期与短日期', () => {
	assert.deepEqual(buildQuickDateOptions('2026-09-28', 3), [
		{ value: '2026-09-28', weekday: '周一', shortDate: '9.28' },
		{ value: '2026-09-29', weekday: '周二', shortDate: '9.29' },
		{ value: '2026-09-30', weekday: '周三', shortDate: '9.30' },
	]);
});

test('快捷日期跨年时仍保持连续且不会受 UTC 时区偏移影响', () => {
	assert.deepEqual(buildQuickDateOptions('2026-12-31', 3), [
		{ value: '2026-12-31', weekday: '周四', shortDate: '12.31' },
		{ value: '2027-01-01', weekday: '周五', shortDate: '1.1' },
		{ value: '2027-01-02', weekday: '周六', shortDate: '1.2' },
	]);
});

test('月历固定生成六周，范围外日期禁用且今天有独立标记', () => {
	const days = buildCalendarDays('2026-09', '2026-09-28', '2026-12-28', '2026-09-28');

	assert.equal(days.length, 42);
	assert.equal(days[0].value, '2026-08-31');
	assert.equal(days[0].inCurrentMonth, false);
	assert.equal(days[27].value, '2026-09-27');
	assert.equal(days[27].disabled, true);
	assert.deepEqual(days[28], {
		value: '2026-09-28',
		day: 28,
		inCurrentMonth: true,
		disabled: false,
		isToday: true,
	});
});

test('月份切换被限制在可预约日期所在月份内', () => {
	assert.equal(shiftCalendarMonth('2026-09', -1, '2026-09-28', '2026-12-28'), '2026-09');
	assert.equal(shiftCalendarMonth('2026-09', 1, '2026-09-28', '2026-12-28'), '2026-10');
	assert.equal(shiftCalendarMonth('2026-12', 1, '2026-09-28', '2026-12-28'), '2026-12');
});

test('更多日期选中后可生成与快捷卡一致的可读信息', () => {
	assert.deepEqual(formatDateOption('2026-10-08'), {
		value: '2026-10-08',
		weekday: '周四',
		shortDate: '10.8',
	});
});
