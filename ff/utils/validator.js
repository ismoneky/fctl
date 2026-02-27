/**
 * 表单验证工具类
 */

/**
 * 验证手机号
 * @param {String} phone - 手机号
 * @returns {Boolean}
 */
export function validatePhone(phone) {
	const reg = /^1[3-9]\d{9}$/;
	return reg.test(phone);
}

/**
 * 验证身份证号
 * @param {String} idCard - 身份证号
 * @returns {Boolean}
 */
export function validateIdCard(idCard) {
	// 15位或18位身份证号
	const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
	if (!reg.test(idCard)) {
		return false;
	}

	// 验证18位身份证号的校验码
	if (idCard.length === 18) {
		const factors = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
		const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
		let sum = 0;

		for (let i = 0; i < 17; i++) {
			sum += parseInt(idCard[i]) * factors[i];
		}

		const checkCode = checkCodes[sum % 11];
		return idCard[17].toUpperCase() === checkCode;
	}

	return true;
}

/**
 * 验证车牌号
 * @param {String} plateNumber - 车牌号
 * @returns {Boolean}
 */
export function validatePlateNumber(plateNumber) {
	// 普通车牌：省份简称 + 字母 + 5位数字/字母
	// 新能源车牌：省份简称 + 字母 + 6位数字/字母
	const reg =
		/^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{4,5}[A-Z0-9挂学警港澳]$/;
	return reg.test(plateNumber);
}

/**
 * 验证邮箱
 * @param {String} email - 邮箱
 * @returns {Boolean}
 */
export function validateEmail(email) {
	const reg = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
	return reg.test(email);
}

/**
 * 验证中文姓名
 * @param {String} name - 姓名
 * @returns {Boolean}
 */
export function validateChineseName(name) {
	const reg = /^[\u4e00-\u9fa5]{2,10}$/;
	return reg.test(name);
}

/**
 * 验证数字范围
 * @param {Number} value - 值
 * @param {Number} min - 最小值
 * @param {Number} max - 最大值
 * @returns {Boolean}
 */
export function validateRange(value, min, max) {
	return value >= min && value <= max;
}
