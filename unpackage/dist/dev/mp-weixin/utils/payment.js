"use strict";
const common_vendor = require("../common/vendor.js");
const utils_request = require("./request.js");
function handlePayment(bookingId, onSuccess) {
  common_vendor.index.showLoading({ title: "准备支付..." });
  utils_request.request({
    method: "POST",
    url: `bookings/${bookingId}/pay`,
    data: {
      wechatOpenId: common_vendor.index.getStorageSync("openid")
    }
  }).then((res) => {
    if (res.success) {
      const payParams = res.data;
      common_vendor.index.requestPayment({
        provider: "wxpay",
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
          if (err.errMsg && err.errMsg.includes("cancel")) {
            common_vendor.index.showToast({ title: "已取消支付", icon: "none" });
          } else {
            pollPaymentStatus(bookingId, onSuccess);
          }
        }
      });
    } else {
      common_vendor.index.showToast({ title: "获取支付参数失败", icon: "error" });
    }
  }).catch(() => {
    common_vendor.index.showToast({ title: "获取支付参数失败，请稍后再试", icon: "error" });
  }).finally(() => {
    common_vendor.index.hideLoading();
  });
}
function pollPaymentStatus(bookingId, onSuccess) {
  const MAX_RETRIES = 5;
  const INTERVAL = 3e3;
  let retries = 0;
  const timer = setInterval(() => {
    retries++;
    utils_request.request({
      method: "GET",
      url: `bookings/${bookingId}/pay-status`
    }).then((res) => {
      if (res.success) {
        const status = res.data.status;
        if (status === "paid") {
          clearInterval(timer);
          common_vendor.index.showToast({ title: "支付成功", icon: "success" });
          if (typeof onSuccess === "function") {
            onSuccess(bookingId);
          } else {
            common_vendor.index.reLaunch({ url: "/pages/booking/booking" });
          }
        } else if (retries >= MAX_RETRIES) {
          clearInterval(timer);
          common_vendor.index.showToast({
            title: "支付状态确认中，请稍后刷新订单页面查看",
            icon: "none",
            duration: 3e3
          });
        }
      } else if (retries >= MAX_RETRIES) {
        clearInterval(timer);
        common_vendor.index.showToast({
          title: "支付状态确认中，请稍后刷新订单页面查看",
          icon: "none",
          duration: 3e3
        });
      }
    }).catch(() => {
      if (retries >= MAX_RETRIES) {
        clearInterval(timer);
        common_vendor.index.showToast({
          title: "支付状态确认中，请稍后刷新订单页面查看",
          icon: "none",
          duration: 3e3
        });
      }
    });
  }, INTERVAL);
}
exports.handlePayment = handlePayment;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/payment.js.map
