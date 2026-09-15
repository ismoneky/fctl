import { test } from 'node:test';
import assert from 'node:assert/strict';
import { request } from '../utils/request.js';

/**
 * 内存版 uni：被测代码只用到 storage 同步读写与 request
 *
 * `responses` 按调用顺序消费，每项要么 `{ statusCode, data }`（走 success），
 * 要么 `{ fail: {...} }`（走 fail，即没拿到响应）。用完后默认返回 200。
 */
const storage = new Map();
let responses = [];
let calls = [];

globalThis.uni = {
	getStorageSync: (key) => storage.get(key),
	setStorageSync: (key, value) => storage.set(key, value),
	request: (opts) => {
		calls.push(opts);
		const r = responses.shift() || { statusCode: 200, data: { success: true } };
		// 保持异步：真实 uni.request 不会同步回调，同步回调会掩盖调用方的时序假设
		setTimeout(() => {
			if (r.fail) opts.fail(r.fail);
			else opts.success(r);
		}, 0);
	},
};

const reset = (list = []) => {
	calls = [];
	responses = list;
	storage.set('token', 'T');
};

// ─────────────────────────────────────────────────────────────────────────────
// 安全属性：**默认不重试**
//
// 这是整个重试机制里最重要的一条。下单（POST /bookings）、发起支付（/pay）、
// 退款申请一旦被自动重发，就是重复下单、重复发起退款 —— 都是钱的副作用。
// 所以开关必须默认关闭，只有显式传 `retry: true` 的幂等调用点才启用。
// ─────────────────────────────────────────────────────────────────────────────

test('默认不重试：未传 retry 时 5xx 只请求一次', async () => {
	reset([{ statusCode: 500, data: { message: 'boom' } }]);
	await assert.rejects(() => request({ method: 'POST', url: '/bookings' }));
	assert.equal(calls.length, 1);
});

test('默认不重试：未传 retry 时网络失败也只请求一次', async () => {
	reset([{ fail: { errMsg: 'request:fail timeout' } }]);
	await assert.rejects(() => request({ method: 'POST', url: '/bookings' }));
	assert.equal(calls.length, 1);
});

// ─────────────────────────────────────────────────────────────────────────────
// 开启后的重试条件
// ─────────────────────────────────────────────────────────────────────────────

test('retry:true 时 5xx 会重试，直到成功', async () => {
	reset([
		{ statusCode: 500, data: { message: 'boom' } },
		{ statusCode: 200, data: { success: true, data: { amount: 100 } } },
	]);
	const res = await request({ method: 'POST', url: '/bookings/preview', retry: true });
	assert.equal(res.data.amount, 100);
	assert.equal(calls.length, 2);
});

test('retry:true 时网络失败（fail）会重试', async () => {
	reset([
		{ fail: { errMsg: 'request:fail interrupted' } },
		{ statusCode: 200, data: { success: true } },
	]);
	await request({ method: 'POST', url: '/bookings/preview', retry: true });
	assert.equal(calls.length, 2);
});

test('4xx 一律不重试：同样的参数再发一次必然还是 4xx', async () => {
	reset([{ statusCode: 400, data: { message: '请检查车牌号' } }]);
	await assert.rejects(
		() => request({ method: 'POST', url: '/bookings/preview', retry: true }),
		(err) => {
			// 非 2xx 时 reject 的是整个 uni 响应，调用方靠 err.data 读 message/code
			assert.equal(err.statusCode, 400);
			assert.equal(err.data.message, '请检查车牌号');
			return true;
		},
	);
	assert.equal(calls.length, 1);
});

test('401 不重试（属于 4xx，重发不会变好）', async () => {
	reset([{ statusCode: 401, data: { message: '缺少认证 token' } }]);
	await assert.rejects(() => request({ method: 'POST', url: '/bookings/preview', retry: true }));
	assert.equal(calls.length, 1);
});

test('重试次数有上限：一直 500 时总共请求 1 + 2 = 3 次后放弃', async () => {
	reset([
		{ statusCode: 500, data: { message: 'a' } },
		{ statusCode: 502, data: { message: 'b' } },
		{ statusCode: 504, data: { message: 'c' } },
		{ statusCode: 200, data: { success: true } },
	]);
	await assert.rejects(() => request({ method: 'POST', url: '/bookings/preview', retry: true }));
	assert.equal(calls.length, 3, '必须是 1 次首发 + 2 次重试，不能无限重试');
});

// ─────────────────────────────────────────────────────────────────────────────
// 重试时重读 token
//
// 冷启动时 token 可能还没落盘，首次请求会带着空 token 出去。重试顺带重新读一次
// 存储，就能在 token 到达后自然恢复 —— 不需要为它单独做一套登录重放。
// ─────────────────────────────────────────────────────────────────────────────

test('每次重试都重新读取 token，不缓存首次的空 token', async () => {
	reset([{ statusCode: 500, data: {} }, { statusCode: 200, data: { success: true } }]);
	storage.set('token', '');
	// 第一次请求发出后 token 才落盘（模拟冷启动时序）
	setTimeout(() => storage.set('token', 'FRESH'), 0);

	await request({ method: 'POST', url: '/bookings/preview', retry: true });

	assert.equal(calls[0].header.Authorization, 'Bearer ');
	assert.equal(calls[1].header.Authorization, 'Bearer FRESH');
});
