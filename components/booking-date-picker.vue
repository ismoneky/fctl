<template>
	<view class="booking-date-picker">
		<view class="quick-date-grid">
			<view
				v-for="item in quickDates"
				:key="item.value"
				class="date-card"
				:class="{ 'date-card--selected': value === item.value }"
				hover-class="date-card--pressed"
				@click="selectDate(item.value)"
			>
				<text class="date-card__weekday">{{ item.weekday }}</text>
				<text class="date-card__date">{{ item.shortDate }}</text>
			</view>

			<view
				class="date-card date-card--more"
				:class="{ 'date-card--selected': moreDateSelected }"
				hover-class="date-card--pressed"
				@click="openCalendar"
			>
				<template v-if="selectedMoreDate">
					<text class="date-card__weekday">{{ selectedMoreDate.weekday }}</text>
					<text class="date-card__date">{{ selectedMoreDate.shortDate }}</text>
					<text class="date-card__hint">更换</text>
				</template>
				<template v-else>
					<image class="date-card__icon" src="/static/svg/rili.svg" mode="aspectFit" />
					<text class="date-card__more-label">更多日期</text>
				</template>
			</view>
		</view>

		<view v-if="calendarVisible" class="calendar-mask" @click="closeCalendar" @touchmove.stop.prevent></view>
		<view class="calendar-sheet" :class="{ 'calendar-sheet--show': calendarVisible }" @touchmove.stop>
			<view class="calendar-sheet__handle"></view>
			<view class="calendar-sheet__header">
				<view>
					<text class="calendar-sheet__title">选择预约日期</text>
					<text class="calendar-sheet__range">可预约 {{ minDate }} 至 {{ maxDate }}</text>
				</view>
				<view class="calendar-sheet__close" hover-class="calendar-sheet__close--pressed" @click="closeCalendar">×</view>
			</view>

			<view class="calendar-month-bar">
				<view
					class="calendar-month-button"
					:class="{ 'calendar-month-button--disabled': !canPreviousMonth }"
					hover-class="calendar-month-button--pressed"
					@click="changeMonth(-1)"
				>‹</view>
				<text class="calendar-month-title">{{ calendarMonthLabel }}</text>
				<view
					class="calendar-month-button"
					:class="{ 'calendar-month-button--disabled': !canNextMonth }"
					hover-class="calendar-month-button--pressed"
					@click="changeMonth(1)"
				>›</view>
			</view>

			<view class="calendar-weekdays">
				<text v-for="weekday in weekdayLabels" :key="weekday" class="calendar-weekday">{{ weekday }}</text>
			</view>
			<view class="calendar-grid">
				<view
					v-for="day in calendarDays"
					:key="day.value"
					class="calendar-day"
					:class="{
						'calendar-day--muted': !day.inCurrentMonth,
						'calendar-day--disabled': day.disabled,
						'calendar-day--selected': value === day.value,
						'calendar-day--today': day.isToday && value !== day.value,
					}"
					hover-class="calendar-day--pressed"
					@click="selectCalendarDate(day)"
				>
					<text class="calendar-day__number">{{ day.day }}</text>
					<view v-if="day.isToday" class="calendar-day__dot"></view>
				</view>
			</view>

			<view class="calendar-sheet__footer">
				<text class="calendar-sheet__tip">点击日期即可完成选择</text>
			</view>
		</view>
	</view>
</template>

<script>
import {
	buildCalendarDays,
	buildQuickDateOptions,
	formatDateOption,
	shiftCalendarMonth,
} from '../utils/booking-date-picker.js';

export default {
	name: 'BookingDatePicker',
	props: {
		value: {
			type: String,
			default: '',
		},
		minDate: {
			type: String,
			default: '',
		},
		maxDate: {
			type: String,
			default: '',
		},
	},
	data() {
		return {
			calendarVisible: false,
			calendarMonth: '',
			todayValue: (() => {
				const now = new Date();
				const year = now.getFullYear();
				const month = String(now.getMonth() + 1).padStart(2, '0');
				const day = String(now.getDate()).padStart(2, '0');
				return `${year}-${month}-${day}`;
			})(),
			weekdayLabels: ['一', '二', '三', '四', '五', '六', '日'],
		};
	},
	computed: {
		quickDates() {
			return buildQuickDateOptions(this.minDate, 3);
		},
		selectedMoreDate() {
			if (!this.value || this.quickDates.some((item) => item.value === this.value)) return null;
			return formatDateOption(this.value);
		},
		moreDateSelected() {
			return !!this.selectedMoreDate;
		},
		calendarDays() {
			return buildCalendarDays(this.calendarMonth, this.minDate, this.maxDate, this.todayValue);
		},
		calendarMonthLabel() {
			const parts = this.calendarMonth.split('-');
			if (parts.length !== 2) return '';
			return `${parts[0]}年${Number(parts[1])}月`;
		},
		previousMonth() {
			return shiftCalendarMonth(this.calendarMonth, -1, this.minDate, this.maxDate);
		},
		nextMonth() {
			return shiftCalendarMonth(this.calendarMonth, 1, this.minDate, this.maxDate);
		},
		canPreviousMonth() {
			return !!this.calendarMonth && this.previousMonth !== this.calendarMonth;
		},
		canNextMonth() {
			return !!this.calendarMonth && this.nextMonth !== this.calendarMonth;
		},
	},
	methods: {
		selectDate(value) {
			if (!value || value === this.value) return;
			this.$emit('change', { detail: { value } });
		},
		openCalendar() {
			const selected = this.value >= this.minDate && this.value <= this.maxDate ? this.value : this.minDate;
			this.calendarMonth = selected ? selected.slice(0, 7) : '';
			this.calendarVisible = true;
		},
		closeCalendar() {
			this.calendarVisible = false;
		},
		changeMonth(delta) {
			this.calendarMonth = shiftCalendarMonth(this.calendarMonth, delta, this.minDate, this.maxDate);
		},
		selectCalendarDate(day) {
			if (!day || day.disabled) return;
			this.selectDate(day.value);
			this.closeCalendar();
		},
	},
};
</script>

<style scoped>
.booking-date-picker {
	position: relative;
}

.quick-date-grid {
	display: flex;
	gap: 12rpx;
}

.date-card {
	flex: 1;
	min-width: 0;
	height: 126rpx;
	border: 2rpx solid #DDE4E8;
	border-radius: 16rpx;
	background: #FFFFFF;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	transition: background-color 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
}

.date-card--selected {
	border-color: #2F6E8E;
	background: #EDF5F8;
	box-shadow: inset 0 0 0 1rpx rgba(47, 110, 142, 0.08);
}

.date-card--pressed {
	transform: scale(0.97);
	background: #F0F6F8;
}

.date-card__weekday {
	font-size: 24rpx;
	line-height: 1.2;
	color: #5F6B73;
}

.date-card__date {
	font-size: 30rpx;
	line-height: 1.25;
	font-weight: 700;
	color: #263238;
	margin-top: 8rpx;
}

.date-card--selected .date-card__weekday,
.date-card--selected .date-card__date,
.date-card--selected .date-card__hint {
	color: #2F6E8E;
}

.date-card--more {
	background: #F7F9FA;
}

.date-card__icon {
	width: 34rpx;
	height: 34rpx;
	margin-bottom: 8rpx;
}

.date-card__more-label {
	font-size: 23rpx;
	line-height: 1.2;
	color: #5F6B73;
	font-weight: 500;
}

.date-card__hint {
	font-size: 20rpx;
	line-height: 1.1;
	color: #98A2A8;
	margin-top: 2rpx;
}

.calendar-mask {
	position: fixed;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	background: rgba(24, 39, 48, 0.48);
	z-index: 300;
}

.calendar-sheet {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 301;
	background: #FFFFFF;
	border-radius: 32rpx 32rpx 0 0;
	padding: 14rpx 30rpx calc(24rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
	transform: translateY(105%);
	transition: transform 0.26s ease-out;
	box-shadow: 0 -16rpx 48rpx rgba(31, 55, 68, 0.14);
}

.calendar-sheet--show {
	transform: translateY(0);
}

.calendar-sheet__handle {
	width: 72rpx;
	height: 8rpx;
	border-radius: 8rpx;
	background: #DDE4E8;
	margin: 0 auto 20rpx;
}

.calendar-sheet__header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	padding: 0 8rpx 22rpx;
}

.calendar-sheet__title {
	display: block;
	font-size: 34rpx;
	font-weight: 700;
	color: #263238;
	line-height: 1.25;
}

.calendar-sheet__range {
	display: block;
	font-size: 22rpx;
	color: #98A2A8;
	line-height: 1.3;
	margin-top: 8rpx;
}

.calendar-sheet__close {
	width: 56rpx;
	height: 56rpx;
	border-radius: 50%;
	background: #F5F8FA;
	color: #5F6B73;
	font-size: 38rpx;
	line-height: 52rpx;
	text-align: center;
}

.calendar-sheet__close--pressed {
	background: #E9EEF1;
}

.calendar-month-bar {
	height: 72rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: #F7F9FA;
	border-radius: 16rpx;
	padding: 0 10rpx;
	margin-bottom: 18rpx;
}

.calendar-month-button {
	width: 56rpx;
	height: 52rpx;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 46rpx;
	font-weight: 300;
	line-height: 1;
	color: #2F6E8E;
}

.calendar-month-button--pressed {
	background: #E4EFF3;
}

.calendar-month-button--disabled {
	color: #CAD6DC;
}

.calendar-month-title {
	font-size: 29rpx;
	font-weight: 700;
	color: #263238;
}

.calendar-weekdays,
.calendar-grid {
	display: flex;
	flex-wrap: wrap;
}

.calendar-weekday {
	width: 14.2857%;
	text-align: center;
	font-size: 22rpx;
	line-height: 52rpx;
	color: #98A2A8;
}

.calendar-day {
	width: 14.2857%;
	height: 78rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	position: relative;
	border-radius: 18rpx;
	color: #263238;
}

.calendar-day__number {
	font-size: 27rpx;
	font-weight: 500;
	line-height: 1;
}

.calendar-day--muted {
	color: #AEBAC0;
}

.calendar-day--disabled {
	color: #D9E0E4;
}

.calendar-day--selected {
	background: #2F6E8E;
	color: #FFFFFF;
	box-shadow: 0 8rpx 20rpx rgba(47, 110, 142, 0.22);
}

.calendar-day--today:not(.calendar-day--selected) {
	color: #2F6E8E;
	font-weight: 700;
}

.calendar-day--pressed:not(.calendar-day--disabled) {
	background: #EDF5F8;
}

.calendar-day--selected.calendar-day--pressed {
	background: #2F6E8E;
}

.calendar-day__dot {
	width: 6rpx;
	height: 6rpx;
	border-radius: 50%;
	background: #2F6E8E;
	position: absolute;
	bottom: 9rpx;
}

.calendar-day--selected .calendar-day__dot {
	background: #FFFFFF;
}

.calendar-sheet__footer {
	padding: 14rpx 0 0;
	text-align: center;
}

.calendar-sheet__tip {
	font-size: 22rpx;
	color: #98A2A8;
}
</style>
