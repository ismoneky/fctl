import { request } from './request.js';

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
                        uni.showToast({ title: '已取消支付', icon: 'none' });
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
