// 站内信：角标未读数 + 消息跳转路径解析
//
// 为什么放在 utils 而不是写进消息中心页：
//   1. 未读数被三个 tab 页 + 个人中心入口共用。写进任一页面，另外三处就得复制一份
//      节流逻辑，四个副本迟早出现「同一个红点在不同页显示不同数字」；
//   2. `resolveJumpPath` 是**跳转白名单**的落点，必须能被单元测试覆盖
//      （`tests/message-center.test.js`），页面里的私有方法测不到。

import { request } from './request.js';

/**
 * 角标刷新节流窗口（毫秒）
 *
 * 三个 tab 页的每次 `onShow` 都会拉一次未读数，用户来回切 tab 会形成
 * 「一次点击一个请求」的尖峰。30 秒内的重复刷新直接用缓存值。
 * 读消息（点击已读 / 全部已读）后会写缓存并重置计时，所以「刚读完返回」
 * 不会看到旧数字。
 */
const THROTTLE_MS = 30 * 1000;

/**
 * 未读数的缓存位置
 *
 * 存 storage 而不是模块变量：三个 tab 页之间用 `uni.reLaunch` 跳转（见
 * `my-tab-bar.vue` 的 `switchTab`），页面会被销毁重建；冷启动时模块变量也没了。
 * 存在 storage 里，三个页面在 `data()` 里同步读到的就是**上一次的真实数字**，
 * 而不是先渲染成 0、两百毫秒后再跳一下。
 */
const STORAGE_KEY = 'unreadCount';

/**
 * 上次拉取时刻（epoch ms），与未读数一样放 storage
 *
 * **不能放在页面 data 里**（§4.4）：切 tab 走 `uni.reLaunch`，每次都是全新页面实例，
 * 页面级的节流形同虚设——那正是「每次切 tab 都请求一次」的来源。
 */
const FETCHED_AT_KEY = 'unreadCountFetchedAt';

/** 同一个数字别并发拉两遍（内存即可：在飞请求天然只存在于本次运行） */
let inflight = null;

function getLastFetchAt() {
	const raw = Number(uni.getStorageSync(FETCHED_AT_KEY));
	return Number.isFinite(raw) ? raw : 0;
}

function markFetchedAt() {
	uni.setStorageSync(FETCHED_AT_KEY, Date.now());
}

/** 上次已知的未读数（不发请求、不改写）。页面 `data()` 里用它作初始值 */
export function getCachedUnreadCount() {
	const raw = Number(uni.getStorageSync(STORAGE_KEY));
	return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
}

/**
 * 写入未读数（拉取成功后 / 读消息后），同时重置节流窗口
 *
 * 重置窗口是必须的：用户在消息中心把消息读了，返回「我的」页时如果还落在
 * 30 秒窗口内，节流会把这个**已经不准的**数字继续发回去。
 */
export function setUnreadCount(count) {
	const next = Math.max(0, Math.floor(Number(count) || 0));
	uni.setStorageSync(STORAGE_KEY, next);
	markFetchedAt();
	return next;
}

/**
 * 拉取未读数
 *
 * 失败**不抛异常也不弹提示**：角标是锦上添花，网络抖动时弹一个红字提示
 * 比红点晚一秒到更烦人。失败同样记时刻，避免后端不可用时每次切 tab 都重试一遍。
 *
 * @param {boolean} force 跳过节流（登录成功后、消息中心里读完之后用）
 * @returns {Promise<number>} 缓存值（失败时是上一次的值，不是 0）
 */
export function fetchUnreadCount(force = false) {
	// 未登录：没有消息，也不该发请求（`request` 会带一个空 token 出去，纯浪费）
	if (!uni.getStorageSync('token')) return Promise.resolve(setUnreadCount(0));
	// 已有请求在飞：复用它，别并发拉同一个数字
	if (inflight) return inflight;
	if (!force && Date.now() - getLastFetchAt() < THROTTLE_MS) {
		return Promise.resolve(getCachedUnreadCount());
	}

	markFetchedAt();
	inflight = request({ url: 'messages/unread-count' })
		.then((res) => setUnreadCount(res && res.data ? res.data.count : 0))
		// 失败保持上一次的值（不是 0）：一次网络抖动把角标清空，比晚一点显示更糟
		.catch(() => getCachedUnreadCount())
		.finally(() => {
			inflight = null;
		});
	return inflight;
}

/**
 * 可直接 `uni.navigateTo` 的页面白名单
 *
 * `jumpPath` 是**消息落库时写下的历史字符串**：页面改名、路由调整之后，
 * 半年前那条消息里的路径就指向了一个不存在的页面。`navigateTo` 对不存在的路径
 * 会走 fail 回调（部分基础库版本还会弹一个英文报错），所以这里白名单式放行，
 * 不认识的一律不跳——**宁可点了没反应，也不能让一条旧消息把页面跳崩**。
 *
 * 新增可跳转页面时在这里登记。阶段 5 的反馈详情页落地后同样要加进来，
 * 与后端 `message-templates.ts` 里把 `FEEDBACK_REPLIED.jumpPath` 从 null 改成真实路径同步。
 */
const NAVIGABLE_PAGES = ['/pages/booking-detail/booking-detail'];

/** tabBar 页面不能 `navigateTo`，只能 `switchTab`（且 switchTab 不接受 query） */
const TABBAR_PAGES = ['/pages/index/index', '/pages/booking/booking', '/pages/profile/profile'];

/**
 * 解析一条消息的跳转目标
 *
 * 只校验**路径部分**，query 原样透传：`?bookingId=TL-xxx&focus=refund` 是业务参数，
 * 是否合法由目标页面自己容错（详情页对未知 query 必须忽略而不是报错）。
 *
 * @param {string|null} jumpPath 消息里的跳转路径
 * @returns {{type: 'navigate'|'switchTab', url: string}|null} null = 不跳（可能是路径失效，也可能本来就没有链接）
 */
export function resolveJumpPath(jumpPath) {
	if (!jumpPath || typeof jumpPath !== 'string') return null;
	const path = jumpPath.split('?')[0];
	if (NAVIGABLE_PAGES.indexOf(path) >= 0) return { type: 'navigate', url: jumpPath };
	if (TABBAR_PAGES.indexOf(path) >= 0) return { type: 'switchTab', url: path };
	return null;
}
