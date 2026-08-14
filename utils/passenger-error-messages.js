// utils/passenger-error-messages.js

// 乘客业务错误码中文映射，与 nest/src/common/passenger-business.exception.ts 的
// PassengerErrorCode 一一对应。码值属于接口契约，后端改动须同步此处。
const PASSENGER_ERROR_MESSAGES = {
	PASSENGER_ID_CARD_REQUIRED: '请填写身份证号',
	PASSENGER_ID_CARD_INVALID: '身份证号格式不正确，请检查后重试',
	PASSENGER_TYPE_AGE_MISMATCH: '身份证年龄与所选人员类型不符，请检查或切换类型',
	PASSENGER_COUNT_MISMATCH: '预约人数与人员列表不一致，请刷新后重试',
	PASSENGER_LIMIT_EXCEEDED: '当前车型最多可预约该人数，请删除多余出行人',
	PASSENGER_CONTACT_INVALID: '联系人必须填写有效身份证号',
	PASSENGER_ID_CARD_UNAVAILABLE_NOT_ALLOWED: '该人员类型必须填写身份证号',
};

/**
 * 将后端稳定乘客错误码映射为中文提示。
 * request.js 原样 reject uni.request 响应，调用方通过 err.data.code 读取。
 * @param {String} code - 后端 err.data.code
 * @param {String} fallback - 未知 code 时返回的文案，一般传后端 message
 * @returns {String}
 */
export function getPassengerErrorMessage(code, fallback = '预约信息校验失败，请检查') {
	if (typeof code === 'string' && PASSENGER_ERROR_MESSAGES[code]) {
		return PASSENGER_ERROR_MESSAGES[code];
	}
	return fallback || '预约信息校验失败，请检查';
}
