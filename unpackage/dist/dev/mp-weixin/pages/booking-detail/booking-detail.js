"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const utils_payment = require("../../utils/payment.js");
const _sfc_main = {
  data() {
    return {
      formData: {
        name: "",
        phone: "",
        idCard: "",
        bookingDate: "",
        timeSlot: "",
        travelMode: "",
        licensePlate: "",
        vehicleType: "",
        tourGroupName: "",
        tourOrderNumber: "",
        personCount: 1,
        remarks: "",
        status: "",
        bookingId: "",
        paymentExpiredAt: null
      },
      vehicleTypes: [
        { label: "摩托", value: "wheelMotorcycle" },
        { label: "小型客车", value: "smallCar" }
      ],
      statusConfig: {
        pending: { icon: "⏳", label: "待支付", desc: "请尽快完成支付，超时订单将自动关闭" },
        confirmed: { icon: "✅", label: "待使用", desc: "支付成功，请凭核验码入场" },
        completed: { icon: "🎉", label: "已完成", desc: "感谢您的光临，期待再次相见" },
        cancelled: { icon: "❌", label: "已取消", desc: "订单已取消" },
        refunded: { icon: "💸", label: "已退款", desc: "退款将原路返回，请耐心等待" }
      },
      countdown: 0,
      // 剩余秒数
      countdownTimer: null,
      _lastClickTime: 0
      // 防抖时间戳
    };
  },
  computed: {
    qrCodeUrl() {
      if (!this.formData.bookingId)
        return "";
      const encodedUrl = encodeURIComponent(this.formData.bookingId);
      return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}`;
    },
    countdownDisplay() {
      const total = Math.max(0, this.countdown);
      const mm = String(Math.floor(total / 60)).padStart(2, "0");
      const ss = String(total % 60).padStart(2, "0");
      return { mm, ss };
    }
  },
  onLoad(options) {
    if (options.bookingId) {
      this.getBookingDetail(options.bookingId);
    }
  },
  onUnload() {
    this.clearCountdown();
  },
  methods: {
    formatDateText(dateStr) {
      if (!dateStr)
        return "";
      if (typeof dateStr === "number") {
        const date2 = new Date(dateStr);
        const year = date2.getFullYear();
        const month = (date2.getMonth() + 1).toString().padStart(2, "0");
        const day = date2.getDate().toString().padStart(2, "0");
        return `${year}年${month}月${day}日`;
      }
      const str = String(dateStr);
      const match = str.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
      if (match) {
        return `${match[1]}年${match[2].padStart(2, "0")}月${match[3].padStart(2, "0")}日`;
      }
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        return `${year}年${month}月${day}日`;
      }
      return dateStr;
    },
    // 获取车辆类型标签
    getVehicleTypeLabel() {
      const type = this.vehicleTypes.find((item) => item.value === this.formData.vehicleType);
      return type ? type.label : this.formData.vehicleType;
    },
    // 启动倒计时
    startCountdown() {
      this.clearCountdown();
      if (!this.formData.paymentExpiredAt || this.formData.status !== "pending")
        return;
      const expiredAt = new Date(this.formData.paymentExpiredAt).getTime();
      const calc = () => Math.max(0, Math.floor((expiredAt - Date.now()) / 1e3));
      this.countdown = calc();
      if (this.countdown <= 0) {
        this.getBookingDetail(this.formData.bookingId);
        return;
      }
      this.countdownTimer = setInterval(() => {
        this.countdown = calc();
        if (this.countdown <= 0) {
          this.clearCountdown();
          this.getBookingDetail(this.formData.bookingId);
        }
      }, 1e3);
    },
    clearCountdown() {
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
      }
    },
    _throttle(fn, interval = 2e3) {
      const now = Date.now();
      if (now - this._lastClickTime < interval)
        return;
      this._lastClickTime = now;
      fn();
    },
    onPay() {
      this._throttle(() => {
        utils_payment.handlePayment(this.formData.bookingId);
      });
    },
    onRefund() {
      this._throttle(() => {
        this._doRefund();
      });
    },
    _doRefund() {
      common_vendor.index.showModal({
        title: "申请退款",
        content: "确认申请退款？退款将原路返回，请耐心等待",
        confirmText: "确认退款",
        confirmColor: "#f5515f",
        success: (res) => {
          if (!res.confirm)
            return;
          common_vendor.index.showLoading({ title: "退款申请中..." });
          utils_request.request({
            method: "POST",
            url: `bookings/${this.formData.bookingId}/refund`
          }).then(() => {
            common_vendor.index.showToast({ title: "退款申请已提交", icon: "success" });
            setTimeout(() => {
              common_vendor.index.reLaunch({ url: "/pages/booking/booking" });
            }, 1500);
          }).catch(() => {
            common_vendor.index.showToast({ title: "退款申请失败，请稍后重试", icon: "none" });
          }).finally(() => {
            common_vendor.index.hideLoading();
          });
        }
      });
    },
    // 获取预约详情
    getBookingDetail(bookingId) {
      common_vendor.index.showLoading({
        title: "加载中..."
      });
      utils_request.request({
        method: "GET",
        url: `/bookings/${bookingId}`
      }).then((res) => {
        if (res.success && res.data) {
          this.formData = res.data;
          this.startCountdown();
        } else {
          common_vendor.index.showToast({ title: "加载详情失败", icon: "none" });
        }
      }).catch(() => {
        common_vendor.index.showToast({ title: "加载详情失败", icon: "none" });
      }).finally(() => {
        common_vendor.index.hideLoading();
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.formData.status
  }, $data.formData.status ? {
    b: common_vendor.t($data.statusConfig[$data.formData.status].icon),
    c: common_vendor.t($data.statusConfig[$data.formData.status].label),
    d: common_vendor.t($data.statusConfig[$data.formData.status].desc),
    e: common_vendor.n("status-bar-" + $data.formData.status)
  } : {}, {
    f: $data.formData.status === "pending" && $data.countdown > 0
  }, $data.formData.status === "pending" && $data.countdown > 0 ? {
    g: common_vendor.t($options.countdownDisplay.mm),
    h: common_vendor.t($options.countdownDisplay.ss)
  } : {}, {
    i: common_vendor.t($data.formData.personCount),
    j: common_vendor.t($data.formData.name),
    k: common_vendor.t($data.formData.phone),
    l: common_vendor.t($data.formData.idCard),
    m: common_vendor.t($options.formatDateText($data.formData.bookingDate)),
    n: common_vendor.t($data.formData.timeSlot === "morning" ? "上午 (08:00-12:00)" : "下午 (12:00-18:00)"),
    o: $data.formData.travelMode === "scenicBus"
  }, $data.formData.travelMode === "scenicBus" ? {} : $data.formData.travelMode === "selfDriving" ? {} : $data.formData.travelMode === "tourGroup" ? {} : {
    r: common_vendor.t($data.formData.travelMode)
  }, {
    p: $data.formData.travelMode === "selfDriving",
    q: $data.formData.travelMode === "tourGroup",
    s: $data.formData.travelMode === "selfDriving"
  }, $data.formData.travelMode === "selfDriving" ? {
    t: common_vendor.t($options.getVehicleTypeLabel()),
    v: common_vendor.t($data.formData.licensePlate)
  } : {}, {
    w: $data.formData.travelMode === "tourGroup"
  }, $data.formData.travelMode === "tourGroup" ? {
    x: common_vendor.t($data.formData.tourGroupName),
    y: common_vendor.t($data.formData.tourNumber)
  } : {}, {
    z: $data.formData.remarks
  }, $data.formData.remarks ? {
    A: common_vendor.t($data.formData.remarks)
  } : {}, {
    B: $data.formData.status === "confirmed" && $data.formData.bookingId
  }, $data.formData.status === "confirmed" && $data.formData.bookingId ? {
    C: $options.qrCodeUrl,
    D: common_vendor.t($data.formData.bookingId),
    E: common_vendor.o((...args) => $options.onRefund && $options.onRefund(...args), "b8")
  } : {}, {
    F: $data.formData.status === "pending"
  }, $data.formData.status === "pending" ? {
    G: common_vendor.o((...args) => $options.onPay && $options.onPay(...args), "25")
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-fe20bf6b"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/booking-detail/booking-detail.js.map
