import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getPassengerErrorMessage } from '../utils/passenger-error-messages.js';

test('全部契约错误码均映射为非空中文提示', () => {
    const codes = [
        'PASSENGER_ID_CARD_REQUIRED',
        'PASSENGER_ID_CARD_INVALID',
        'PASSENGER_TYPE_AGE_MISMATCH',
        'PASSENGER_COUNT_MISMATCH',
        'PASSENGER_LIMIT_EXCEEDED',
        'PASSENGER_CONTACT_INVALID',
        'PASSENGER_ID_CARD_UNAVAILABLE_NOT_ALLOWED',
    ];
    for (const code of codes) {
        const message = getPassengerErrorMessage(code);
        assert.equal(typeof message, 'string');
        assert.ok(message.length > 0, `${code} 不应返回空提示`);
        // 中文文案
        assert.ok(/[一-龥]/.test(message), `${code} 应包含中文文案`);
    }
});

test('不同错误码映射为不同文案', () => {
    const set = new Set(
        [
            'PASSENGER_ID_CARD_REQUIRED',
            'PASSENGER_ID_CARD_INVALID',
            'PASSENGER_TYPE_AGE_MISMATCH',
            'PASSENGER_COUNT_MISMATCH',
            'PASSENGER_LIMIT_EXCEEDED',
            'PASSENGER_CONTACT_INVALID',
            'PASSENGER_ID_CARD_UNAVAILABLE_NOT_ALLOWED',
        ].map((code) => getPassengerErrorMessage(code)),
    );
    assert.equal(set.size, 7);
});

test('联系人错误不再包含成年人限制', () => {
    assert.equal(getPassengerErrorMessage('PASSENGER_CONTACT_INVALID'), '联系人必须填写有效身份证号');
});

test('未知 code 返回后端 message fallback', () => {
    assert.equal(getPassengerErrorMessage('UNKNOWN_CODE', '后端原始错误文案'), '后端原始错误文案');
});

test('未知 code 且无后端 message 时返回通用兜底', () => {
    assert.equal(getPassengerErrorMessage('UNKNOWN_CODE'), '预约信息校验失败，请检查');
});

test('code 缺失或非字符串时返回兜底', () => {
    assert.equal(getPassengerErrorMessage(undefined, '后端原始错误文案'), '后端原始错误文案');
    assert.equal(getPassengerErrorMessage(null), '预约信息校验失败，请检查');
    assert.equal(getPassengerErrorMessage(123, '后端原始错误文案'), '后端原始错误文案');
});

test('后端 message 为空串时返回通用兜底', () => {
    assert.equal(getPassengerErrorMessage('UNKNOWN_CODE', ''), '预约信息校验失败，请检查');
});
