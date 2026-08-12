import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findExactProfileMatches } from '../utils/profile-matcher.js';

// 虚构常用人员夹具（不含真实用户数据）
const PROFILES = [
	{ profileId: 'p1', name: '张三', phone: '13800001111', idCard: '110101199001011237' },
	{ profileId: 'p2', name: '李四', phone: '13800002222', idCard: '110101199002022230' },
	{ profileId: 'p3', name: '张三', phone: '13800003333', idCard: '110101199003031237' }, // 同名
	{ profileId: 'p4', name: '王五', phone: '13800004444', idCard: '110101199004041234' },
];

test('findExactProfileMatches: 姓名首尾空格不影响匹配', () => {
	const r = findExactProfileMatches(PROFILES, '  张三  ');
	assert.equal(r.length, 2);
	assert.deepEqual(r.map((x) => x.profileId), ['p1', 'p3']);
});

test('findExactProfileMatches: 完全相等匹配', () => {
	const r = findExactProfileMatches(PROFILES, '李四');
	assert.equal(r.length, 1);
	assert.equal(r[0].profileId, 'p2');
});

test('findExactProfileMatches: 部分姓名不匹配（不模糊匹配）', () => {
	assert.equal(findExactProfileMatches(PROFILES, '张').length, 0);
	assert.equal(findExactProfileMatches(PROFILES, '张三三').length, 0);
	assert.equal(findExactProfileMatches(PROFILES, '张').length, 0);
});

test('findExactProfileMatches: 空姓名不匹配', () => {
	assert.equal(findExactProfileMatches(PROFILES, '').length, 0);
	assert.equal(findExactProfileMatches(PROFILES, '   ').length, 0);
	assert.equal(findExactProfileMatches(PROFILES, null).length, 0);
	assert.equal(findExactProfileMatches(PROFILES, undefined).length, 0);
});

test('findExactProfileMatches: 同名多人全部返回', () => {
	const r = findExactProfileMatches(PROFILES, '张三');
	assert.equal(r.length, 2);
	assert.deepEqual(r.map((x) => x.name), ['张三', '张三']);
});

test('findExactProfileMatches: 无效 profile 项忽略', () => {
	const mixed = [
		{ profileId: 'a1', name: '赵六', phone: '13800005555' },
		null,
		undefined,
		{ profileId: 'a2', name: '', phone: '13800006666' }, // 空姓名
		{ profileId: 'a3', phone: '13800007777' }, // 缺 name
		{ name: '赵六', phone: '13800008888' }, // 缺 profileId 但有 name —— 仍应参与姓名匹配
	];
	const r = findExactProfileMatches(mixed, '赵六');
	// 两条有效：a1 和最后一条（缺 profileId 但有 name）
	assert.equal(r.length, 2);
});

test('findExactProfileMatches: profiles 非数组返回空', () => {
	assert.deepEqual(findExactProfileMatches(null, '张三'), []);
	assert.deepEqual(findExactProfileMatches(undefined, '张三'), []);
	assert.deepEqual(findExactProfileMatches({}, '张三'), []);
});

test('findExactProfileMatches: 不比较手机号或身份证', () => {
	// 仅凭姓名匹配，不要求手机/身份证一致
	const r = findExactProfileMatches(
		[{ profileId: 'x1', name: '钱七', phone: '13900000000', idCard: '110101199005051234' }],
		'钱七',
	);
	assert.equal(r.length, 1);
});
