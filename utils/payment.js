import { request } from './request.js';

/**
 * 正在进行的支付准备任务（按 bookingId 去重）
 * Promise 覆盖"请求支付参数 → 拉起微信支付 → 面板关闭后查一次状态"全过程。
 */
const paymentLaunchingTasks = new Map();

/**
 * 发起支付：请求支付参数 → 拉起微信支付 → 查一次状态确认
 *
 * 同一订单在准备阶段重复调用时直接返回已有 Promise，避免并发创建支付参数。
 * 支付准备 Promise 在微信面板关闭且查单完成后释放（或准备失败且状态复查完成后释放）。
 *
 * @param {string} bookingId - 订单ID
 * @param {function} [onSuccess] - 支付成功回调（可选，默认跳转订单列表）
 * @returns {Promise<void>}
 */
export function handlePayment(bookingId, onSuccess) {
    const existing = paymentLaunchingTasks.get(bookingId);
    if (existing) return existing;

    const task = prepareAndOpenPayment(bookingId, onSuccess)
        .finally(() => {
            if (paymentLaunchingTasks.get(bookingId) === task) {
                paymentLaunchingTasks.delete(bookingId);
            }
        });

    paymentLaunchingTasks.set(bookingId, task);
    return task;
}

/**
 * 请求支付参数并拉起微信支付。
 *
 * 支付准备任务覆盖以下步骤：
 * 1. 请求支付参数（25 秒超时）。
 * 2. 支付参数成功时拉起 uni.requestPayment。
 * 3. 微信支付面板关闭后（无论 success 还是 fail），查一次服务端 pay-status。
 *    已支付 → resolve；未支付/PAYING/查询失败 → reject。
 * 4. 支付参数请求发生超时、结果未知或已支付响应时，等待一次状态查询完成。
 *
 * Promise 等到微信面板关闭且查单完成后才 resolve/reject。
 */
function prepareAndOpenPayment(bookingId, onSuccess) {
    return new Promise((resolve, reject) => {
        uni.showLoading({ title: '准备支付...', mask: true });

        request({
            method: 'POST',
            url: `bookings/${bookingId}/pay`,
            data: {
                wechatOpenId: uni.getStorageSync('openid')
            },
            timeout: 25000
        }).then(res => {
            if (res.success) {
                const payParams = res.data;
                uni.hideLoading();
                uni.requestPayment({
                    provider: 'wxpay',
                    appId: payParams.appId,
                    timeStamp: payParams.timeStamp,
                    nonceStr: payParams.nonceStr,
                    package: payParams.package,
                    signType: payParams.signType,
                    paySign: payParams.paySign,
                    success: () => {
                        // 微信支付面板成功关闭，查一次服务端状态确认
                        checkPayStatusOnce(bookingId, onSuccess)
                            .then(resolve)
                            .catch(reject);
                    },
                    fail: () => {
                        // 微信支付面板失败/取消关闭，仍查一次服务端状态确认
                        checkPayStatusOnce(bookingId, onSuccess)
                            .then(resolve)
                            .catch(reject);
                    }
                });
            } else {
                uni.hideLoading();
                // 后端返回了业务错误，按 errorCode 分发处理
                // 等待状态复查完成后才 reject
                handlePayPrepError(bookingId, res, onSuccess).then(() => {
                    resolve();
                }).catch(() => {
                    reject(new Error(res.data && res.data.error || res.message || '获取支付参数失败'));
                });
            }
        }).catch(err => {
            uni.hideLoading();
            // 网络超时或后端返回非 2xx
            // 等待状态复查完成后才 reject
            handlePayPrepError(bookingId, err, onSuccess).then(() => {
                resolve();
            }).catch(() => {
                reject(err);
            });
        });
    });
}

/**
 * 处理支付准备阶段的错误（后端业务错误 / 网络异常）
 *
 * 必须返回 Promise，禁止 fire-and-forget。
 *
 * 错误处理结果分为两类：
 * - 状态查询确认 paid：显示支付成功，执行 onSuccess，Promise 按成功结束（resolve）。
 * - 未确认已支付或状态查询失败：显示对应提示，Promise 在提示完成后 reject。
 *
 * @returns {Promise<void>}
 */
function handlePayPrepError(bookingId, err, onSuccess) {
    const errorCode = (err && err.data && err.data.errorCode) || (err && err.errorCode) || '';

    switch (errorCode) {
        case 'ORDER_ALREADY_PAID':
            // 订单已支付，查一次状态确认
            return checkPayStatusOnce(bookingId, onSuccess);

        case 'PAYMENT_PREPARATION_TIMEOUT':
            // 支付准备超时，查一次状态
            return checkPayStatusOnce(bookingId, onSuccess, {
                unknownText: '支付准备超时，可在订单详情重试'
            });

        case 'PAYMENT_RESULT_UNKNOWN':
        case 'CLOSE_ORDER_UNKNOWN':
        case 'QUERY_ORDER_UNKNOWN':
            // 结果未知，查一次状态，不提示失败
            return checkPayStatusOnce(bookingId, onSuccess, {
                unknownText: '支付结果确认中，请稍后在订单详情查看'
            });

        case 'PAYMENT_START_REJECTED':
            // 后端明确拒绝，不查单；优先显示 err.data.error
            return new Promise((resolve, reject) => {
                uni.showToast({
                    title: (err && err.data && err.data.error) || '支付失败，请重试',
                    icon: 'none',
                    duration: 3000
                });
                reject(new Error('PAYMENT_START_REJECTED'));
            });

        default:
            // 网络超时或其他未知错误，按结果未知处理，先查一次状态
            return checkPayStatusOnce(bookingId, onSuccess, {
                unknownText: '支付结果确认中，请稍后在订单详情查看'
            });
    }
}

/**
 * 查一次支付状态，根据结果决定是否触发成功回调。
 *
 * 只查一次，不轮询。
 *
 * 返回 Promise：
 * - 确认 paid：显示成功提示，执行 onSuccess，resolve。
 * - 未支付、PAYING、查询失败：显示对应提示，reject。
 *
 * @param {string} bookingId
 * @param {function} onSuccess
 * @param {object} [opts] - { unknownText: 未支付时的提示文案 }
 * @returns {Promise<void>}
 */
function checkPayStatusOnce(bookingId, onSuccess, opts = {}) {
    return new Promise((resolve, reject) => {
        request({
            method: 'GET',
            url: `bookings/${bookingId}/pay-status`,
            timeout: 8000
        }).then(res => {
            if (res.success && res.data && res.data.status === 'paid') {
                uni.showToast({ title: '支付成功', icon: 'success' });
                if (typeof onSuccess === 'function') {
                    onSuccess(bookingId);
                } else {
                    uni.reLaunch({ url: '/pages/booking/booking' });
                }
                resolve();
            } else {
                // 未支付 / PAYING / 其他非 paid 状态：不判断取消，不继续查
                uni.showToast({
                    title: opts.unknownText || '支付结果确认中，请稍后在订单详情查看',
                    icon: 'none',
                    duration: 3000
                });
                reject(new Error('PAYMENT_STATUS_NOT_PAID'));
            }
        }).catch(() => {
            // 查询失败：不继续查
            uni.showToast({
                title: opts.unknownText || '支付结果确认中，请稍后在订单详情查看',
                icon: 'none',
                duration: 3000
            });
            reject(new Error('PAYMENT_STATUS_QUERY_FAILED'));
        });
    });
}
