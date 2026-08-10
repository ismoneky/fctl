import { request } from './request.js';

/**
 * 取消支付后删除待支付订单
 * 用户主动取消微信支付弹窗时调用，避免遗留待支付单（30 分钟超时前都占着名额）
 * @param {string} bookingId - 订单ID
 */
export function cancelPendingBooking(bookingId) {
    uni.showToast({ title: '已取消支付', icon: 'none' });
    request({
        method: 'DELETE',
        url: `bookings/${bookingId}`,
    }).catch(() => {}).finally(() => {
        setTimeout(() => {
            uni.redirectTo({ url: '/pages/booking/booking' });
        }, 800);
    });
}

/**
 * 发起支付并轮询支付结果
 * @param {string} bookingId - 订单ID
 * @param {function} onSuccess - 支付成功回调（可选，默认跳转订单列表）
 */
export function handlePayment(bookingId, onSuccess) {
    uni.showLoading({ title: '准备支付...' });
    request({
        method: 'POST',
        url: `bookings/${bookingId}/pay`,
        data: {
            wechatOpenId: uni.getStorageSync('openid')
        }
    }).then(res => {
        if (res.success) {
            const payParams = res.data;
            uni.requestPayment({
                provider: 'wxpay',
                appId: payParams.appId,
                timeStamp: payParams.timeStamp,
                nonceStr: payParams.nonceStr,
                package: payParams.package,
                signType: payParams.signType,
                paySign: payParams.paySign,
                success: () => {
                    pollPaymentStatus(bookingId, onSuccess);
                },
                fail: (err) => {
                    if (err.errMsg && err.errMsg.includes('cancel')) {
                        // 用户主动取消支付：删除已创建的待支付订单，避免遗留待支付单占名额
                        cancelPendingBooking(bookingId);
                    } else {
                        // 其他失败也需查单确认实际状态
                        pollPaymentStatus(bookingId, onSuccess);
                    }
                }
            });
        } else {
            uni.showToast({ title: '获取支付参数失败', icon: 'error' });
        }
    }).catch(() => {
        uni.showToast({ title: '获取支付参数失败，请稍后再试', icon: 'error' });
    }).finally(() => {
        uni.hideLoading();
    });
}

/**
 * 轮询支付状态
 * @param {string} bookingId - 订单ID
 * @param {function} onSuccess - 支付成功回调（可选，默认跳转订单列表）
 */
export function pollPaymentStatus(bookingId, onSuccess) {
    const MAX_RETRIES = 5;
    const INTERVAL = 1500;
    let retries = 0;
    let timer = null;

    uni.showLoading({ title: '支付确认中...', mask: true });

    function done(success) {
        clearInterval(timer);
        uni.hideLoading();
        if (success) {
            uni.showToast({ title: '支付成功', icon: 'success' });
            if (typeof onSuccess === 'function') {
                onSuccess(bookingId);
            } else {
                uni.reLaunch({ url: '/pages/booking/booking' });
            }
        } else {
            uni.showToast({
                title: '支付状态确认中，请稍后刷新订单页面查看',
                icon: 'none',
                duration: 3000
            });
        }
    }

    function check() {
        retries++;
        request({
            method: 'GET',
            url: `bookings/${bookingId}/pay-status`
        }).then(res => {
            if (res.success && res.data.status === 'paid') {
                done(true);
            } else if (retries >= MAX_RETRIES) {
                done(false);
            }
        }).catch(() => {
            if (retries >= MAX_RETRIES) {
                done(false);
            }
        });
    }

    // 立即查一次，再按间隔轮询
    check();
    timer = setInterval(check, INTERVAL);
}
