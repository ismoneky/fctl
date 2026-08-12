import { validateIdCard } from './validator.js';

/**
 * 身份证输入归一化与错误分类（纯函数，无副作用）
 *
 * 归一化顺序固定为：字符串化 → 全角数字转半角 → 全角 X 转半角 → 去除全部空白 → 转大写。
 * 错误分类先判长度，再判基础格式，最后调用 utils/validator 的校验码函数。
 *
 * 注意：不得把身份证明文写入 console.log、埋点或错误上报。
 */

// 全角数字 ０-９ (０-９) → 半角 0-9
// 全角大写 Ｘ (Ｘ) / 小写 ｘ (ｘ) → 半角 X
// 全角空格 　、普通空格、制表符等一律视为空白
const FULLWIDTH_DIGIT_RE = /[０-９]/g;
const FULLWIDTH_X_RE = /[Ｘｘ]/g;
const WHITESPACE_RE = /\s+/g;

/**
 * 归一化身份证输入值
 * @param {unknown} value - 原始输入值
 * @returns {string} 归一化后的字符串（可能为空，可能不足 18 位）
 */
export function normalizeIdCardInput(value) {
	// 1. 字符串化：null/undefined/数字统一转字符串；非字符串先 String() 兜底
	let s = value == null ? '' : String(value);
	// 2. 全角数字转半角（０ U+FF10 → 0 U+0030，偏移 0xFEE0）
	s = s.replace(FULLWIDTH_DIGIT_RE, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0));
	// 3. 全角 X / 全角 x 转半角 X
	s = s.replace(FULLWIDTH_X_RE, 'X');
	// 4. 去除全部空白（半角空格、全角空格、制表符、换行等）
	s = s.replace(WHITESPACE_RE, '');
	// 5. 转大写（小写 x → X）
	s = s.toUpperCase();
	return s;
}

/**
 * 身份证号错误分类
 * @param {string} value - 归一化后的身份证号
 * @returns {'' | '请输入完整的18位身份证号' | '身份证号格式不正确，请检查出生日期等信息' | '身份证号末位校验不正确'}
 */
export function getIdCardError(value) {
	const v = value == null ? '' : String(value);
	// 为空：不显示字段级错误，提交时由必填校验提示
	if (v.length === 0) {
		return '';
	}
	// 长度不足 18 位
	if (v.length < 18) {
		return '请输入完整的18位身份证号';
	}
	// 超过 18 位直接判格式错误（归一化后不应出现，兜底）
	if (v.length > 18) {
		return '身份证号格式不正确，请检查出生日期等信息';
	}
	// 长度正确但基础格式不符（前 17 位数字 + 末位数字/X）
	const formatReg = /^\d{17}[\dX]$/;
	if (!formatReg.test(v)) {
		return '身份证号格式不正确，请检查出生日期等信息';
	}
	// 进一步校验出生日期段合理性（YYYYMMDD），避免明显脏数据误判为“校验码错误”
	const year = Number(v.substring(6, 10));
	const month = Number(v.substring(10, 12));
	const day = Number(v.substring(12, 14));
	if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) {
		return '身份证号格式不正确，请检查出生日期等信息';
	}
	// 格式正确但校验码错误
	if (!validateIdCard(v)) {
		return '身份证号末位校验不正确';
	}
	return '';
}
