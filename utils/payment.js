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
    const INTERVAL = 3000;
    let retries = 0;

    const timer = setInterval(() => {
        retries++;
        request({
            method: 'GET',
            url: `bookings/${bookingId}/pay-status`
        }).then(res => {
            if (res.success) {
                const status = res.data.status;
                if (status === 'paid') {
                    clearInterval(timer);
                    uni.showToast({ title: '支付成功', icon: 'success' });
                    if (typeof onSuccess === 'function') {
                        onSuccess(bookingId);
                    } else {
                        uni.reLaunch({ url: '/pages/booking/booking' });
                    }
                } else if (retries >= MAX_RETRIES) {
                    clearInterval(timer);
                    uni.showToast({
                        title: '支付状态确认中，请稍后刷新订单页面查看',
                        icon: 'none',
                        duration: 3000
                    });
                }
            } else if (retries >= MAX_RETRIES) {
                clearInterval(timer);
                uni.showToast({
                    title: '支付状态确认中，请稍后刷新订单页面查看',
                    icon: 'none',
                    duration: 3000
                });
            }
        }).catch(() => {
            if (retries >= MAX_RETRIES) {
                clearInterval(timer);
                uni.showToast({
                    title: '支付状态确认中，请稍后刷新订单页面查看',
                    icon: 'none',
                    duration: 3000
                });
            }
        });
    }, INTERVAL);
}
