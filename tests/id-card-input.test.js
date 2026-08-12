import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeIdCardInput, getIdCardError } from '../utils/id-card-input.js';

// 测试数据均为按校验算法生成的虚构号码，不含任何真实用户身份证。
// 合法号码（出生日期 1990-01-01，地区 110101，顺序号 1234，末位校验码 7）
const VALID_18 = '110101199001011237';
// 同前 17 位但末位校验码错误（应为 7，实际填 0）
const WRONG_CHECK = '110101199001011230';
// 出生月份非法（13 月），前 17 位格式正确但日期不合理
const BAD_MONTH = '110101199013011234';
// 17 位（长度不足）
const LEN_17 = '11010119900101123';

test('normalizeIdCardInput: 空值归一化为空字符串', () => {
	assert.equal(normalizeIdCardInput(''), '');
	assert.equal(normalizeIdCardInput(null), '');
	assert.equal(normalizeIdCardInput(undefined), '');
});

test('normalizeIdCardInput: null / undefined / 数字 安全字符串化', () => {
	assert.equal(normalizeIdCardInput(null), '');
	assert.equal(normalizeIdCardInput(undefined), '');
	assert.equal(normalizeIdCardInput(123), '123');
});

test('normalizeIdCardInput: 去除首尾空格与字符串中间空格', () => {
	assert.equal(normalizeIdCardInput('  ' + VALID_18 + '  '), VALID_18);
	assert.equal(normalizeIdCardInput('110101 1990 0101 1237'), VALID_18);
	assert.equal(normalizeIdCardInput('110101\t1990\n0101 1237'), VALID_18);
});

test('normalizeIdCardInput: 全角数字 ０-９ 转半角', () => {
	// VALID_18 的全角版本
	const fullwidth = '１１０１０１１９９００１０１１２３７';
	assert.equal(normalizeIdCardInput(fullwidth), VALID_18);
});

test('normalizeIdCardInput: 小写 x / 全角 Ｘｘ 统一转大写半角 X', () => {
	// 构造一个末位为 X 的 18 位字符串（前 17 位沿用 VALID_18 的前缀）
	const prefix17 = VALID_18.substring(0, 17);
	assert.equal(normalizeIdCardInput(prefix17 + 'x'), prefix17 + 'X');
	assert.equal(normalizeIdCardInput(prefix17 + 'ｘ'), prefix17 + 'X');
	assert.equal(normalizeIdCardInput(prefix17 + 'Ｘ'), prefix17 + 'X');
});

test('normalizeIdCardInput: 全角空格也去除', () => {
	// 全角空格 U+3000
	assert.equal(normalizeIdCardInput('110101　199001011237'), VALID_18);
});

test('normalizeIdCardInput: 混合脏数据一次性归一化', () => {
	// 全角数字 + 全角空格 + 小写 x（前 17 位全角，末位小写 x）
	const prefix17 = VALID_18.substring(0, 17);
	const fullwidthPrefix = '１１０１０１１９９００１０１１２３';
	assert.equal(normalizeIdCardInput('　' + fullwidthPrefix + '　x'), prefix17 + 'X');
});

test('getIdCardError: 空值返回空串（交由必填校验）', () => {
	assert.equal(getIdCardError(''), '');
	assert.equal(getIdCardError(normalizeIdCardInput('   ')), '');
});

test('getIdCardError: 17 位返回长度不足提示', () => {
	assert.equal(getIdCardError(LEN_17), '请输入完整的18位身份证号');
	assert.equal(getIdCardError('123'), '请输入完整的18位身份证号');
});

test('getIdCardError: 错误出生月份返回格式错误', () => {
	assert.equal(getIdCardError(BAD_MONTH), '身份证号格式不正确，请检查出生日期等信息');
});

test('getIdCardError: 末位校验码错误返回校验不正确', () => {
	assert.equal(getIdCardError(WRONG_CHECK), '身份证号末位校验不正确');
});

test('getIdCardError: 合法号码返回空串', () => {
	assert.equal(getIdCardError(VALID_18), '');
	// 归一化后合法
	assert.equal(getIdCardError(normalizeIdCardInput('  ' + VALID_18 + '  ')), '');
	assert.equal(getIdCardError(normalizeIdCardInput('１１０１０１１９９００１０１１２３７')), '');
});

test('getIdCardError: 前缀含字母等非数字字符判格式错误', () => {
	assert.equal(getIdCardError('A10101199001011234X'), '身份证号格式不正确，请检查出生日期等信息');
});
