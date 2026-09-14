import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveJumpPath, setUnreadCount, getCachedUnreadCount } from '../utils/message-center.js';

// 内存版 uni：被测代码只用到同步读写 storage 这两个 API
const store = new Map();
globalThis.uni = {
	getStorageSync: (key) => store.get(key),
	setStorageSync: (key, value) => store.set(key, value),
};

// ─────────────────────────────────────────────────────────────────────────────
// 跳转白名单
//
// 这是**唯一**能防住「旧消息里的路径指向一个已改名的页面」的地方：
// 后端 `messages.jumpPath` 是落库时的历史字符串，小程序本地无法知道它是否还有效，
// 只能白名单式放行。放行错了是跳崩，拒掉错了是点了没反应——取后者。
// ─────────────────────────────────────────────────────────────────────────────

test('resolveJumpPath: 订单详情的路径放行，query 原样保留', () => {
	const r = resolveJumpPath('/pages/booking-detail/booking-detail?bookingId=TL-20260901-001&focus=refund');
	assert.deepEqual(r, {
		type: 'navigate',
		url: '/pages/booking-detail/booking-detail?bookingId=TL-20260901-001&focus=refund',
	});
});

test('resolveJumpPath: 不带 query 的订单详情路径同样放行', () => {
	const r = resolveJumpPath('/pages/booking-detail/booking-detail');
	assert.deepEqual(r, { type: 'navigate', url: '/pages/booking-detail/booking-detail' });
});

test('resolveJumpPath: tabBar 页面走 switchTab，且丢掉 query（switchTab 不接受参数）', () => {
	const r = resolveJumpPath('/pages/booking/booking?tab=2');
	assert.deepEqual(r, { type: 'switchTab', url: '/pages/booking/booking' });
});

test('resolveJumpPath: 白名单外的页面一律不跳', () => {
	// 页面改名后的历史路径
	assert.equal(resolveJumpPath('/pages/order-detail/order-detail?bookingId=TL-1'), null);
	// 站外/非本小程序路径
	assert.equal(resolveJumpPath('/pages/../../etc/passwd'), null);
	assert.equal(resolveJumpPath('http://evil.example.com'), null);
	// 前缀相同但不是白名单项（防止用 startsWith 这类写法的实现混进来）
	assert.equal(resolveJumpPath('/pages/booking-detail/booking-detail-evil'), null);
});

test('resolveJumpPath: 空值与非法类型不跳（反馈类消息的 jumpPath 就是 null）', () => {
	assert.equal(resolveJumpPath(null), null);
	assert.equal(resolveJumpPath(undefined), null);
	assert.equal(resolveJumpPath(''), null);
	assert.equal(resolveJumpPath({ url: '/pages/booking-detail/booking-detail' }), null);
});

// ─────────────────────────────────────────────────────────────────────────────
// 未读数缓存
//
// `fetchUnreadCount`（真实请求 + 节流）属小程序运行时，由真机联调覆盖；
// 这里锁的是「写进去的一定读得出来」这条——三个 tab 页各自 `data()` 里
// 读同一个 storage 键，写读口径不一致就会出现「同一个红点在不同页显示不同数字」。
// ─────────────────────────────────────────────────────────────────────────────

test('setUnreadCount: 写入后 getCachedUnreadCount 读到同一个数', () => {
	setUnreadCount(7);
	assert.equal(getCachedUnreadCount(), 7);
});

test('setUnreadCount: 负数与非法值归零，不把 -1 传给角标', () => {
	assert.equal(setUnreadCount(-1), 0);
	assert.equal(getCachedUnreadCount(), 0);
	assert.equal(setUnreadCount(undefined), 0);
	assert.equal(setUnreadCount('abc'), 0);
	assert.equal(setUnreadCount('3'), 3);
});

test('getCachedUnreadCount: 没存过 / 存了脏值时按 0 处理，不渲染出 "NaN" 或负数气泡', () => {
	store.clear();
	assert.equal(getCachedUnreadCount(), 0);
	store.set('unreadCount', 'oops');
	assert.equal(getCachedUnreadCount(), 0);
	store.set('unreadCount', -5);
	assert.equal(getCachedUnreadCount(), 0);
	// 小数（历史上若有别处直接写过 storage）向下去整，气泡里不出现 "3.5"
	store.set('unreadCount', 3.9);
	assert.equal(getCachedUnreadCount(), 3);
});

test('setUnreadCount: 同时写下节流时刻（节流窗口跨页面、跨切 tab 都有效）', () => {
	store.clear();
	setUnreadCount(2);
	const at = Number(store.get('unreadCountFetchedAt'));
	assert.ok(Number.isFinite(at) && at > 0, '节流时刻必须落 storage，页面 data 存不住它');
});
