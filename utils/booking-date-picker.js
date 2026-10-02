const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function parseDateValue(value) {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
	if (!match) return null;
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const date = new Date(year, month - 1, day);
	if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
	return date;
}

function formatDateValue(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function parseMonthValue(value) {
	const match = /^(\d{4})-(\d{2})$/.exec(String(value || ''));
	if (!match) return null;
	const year = Number(match[1]);
	const month = Number(match[2]);
	if (month < 1 || month > 12) return null;
	return new Date(year, month - 1, 1);
}

function formatMonthValue(date) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function formatDateOption(value) {
	const date = parseDateValue(value);
	if (!date) return null;
	return {
		value: formatDateValue(date),
		weekday: WEEKDAY_LABELS[date.getDay()],
		shortDate: `${date.getMonth() + 1}.${date.getDate()}`,
	};
}

export function buildQuickDateOptions(minDate, count = 3) {
	const start = parseDateValue(minDate);
	if (!start || count <= 0) return [];
	const options = [];
	for (let offset = 0; offset < count; offset += 1) {
		const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + offset);
		options.push(formatDateOption(formatDateValue(date)));
	}
	return options;
}

/**
 * 预约页首次进入时始终选中当前可预约范围的第一天。
 * “再次预约”不会沿用旧订单日期，避免历史日期落到当前范围之外。
 */
export function resolveInitialBookingDate(minDate, maxDate) {
	if (!parseDateValue(minDate) || !parseDateValue(maxDate) || minDate > maxDate) return '';
	return minDate;
}

export function buildCalendarDays(monthValue, minDate, maxDate, todayValue = '') {
	const monthStart = parseMonthValue(monthValue);
	if (!monthStart || !parseDateValue(minDate) || !parseDateValue(maxDate)) return [];
	const mondayOffset = (monthStart.getDay() + 6) % 7;
	const gridStart = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1 - mondayOffset);
	const days = [];

	for (let index = 0; index < 42; index += 1) {
		const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
		const value = formatDateValue(date);
		days.push({
			value,
			day: date.getDate(),
			inCurrentMonth: date.getMonth() === monthStart.getMonth(),
			disabled: value < minDate || value > maxDate,
			isToday: value === todayValue,
		});
	}
	return days;
}

export function shiftCalendarMonth(monthValue, delta, minDate, maxDate) {
	const current = parseMonthValue(monthValue);
	if (!current || !Number.isInteger(delta)) return monthValue;
	const target = new Date(current.getFullYear(), current.getMonth() + delta, 1);
	const targetValue = formatMonthValue(target);
	const minMonth = String(minDate || '').slice(0, 7);
	const maxMonth = String(maxDate || '').slice(0, 7);
	if (!/^\d{4}-\d{2}$/.test(minMonth) || !/^\d{4}-\d{2}$/.test(maxMonth)) return monthValue;
	if (targetValue < minMonth || targetValue > maxMonth) return monthValue;
	return targetValue;
}
