"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const myTabBar = () => "../../components/my-tab-bar.js";
const _sfc_main = {
  components: {
    myTabBar
  },
  data() {
    return {
      isAdmin: false,
      avatarTapCount: 0,
      avatarTapTimer: null,
      applyModal: {
        show: false
      },
      applyForm: {
        name: "",
        phone: ""
      },
      verifyModal: {
        show: false,
        success: false,
        message: ""
      },
      userInfo: {
        avatar: "/static/avatar.svg",
        name: "微信用户",
        phone: "138****8888",
        vipLevel: "黄金会员",
        points: 1580
      },
      userStats: {
        pending: 0,
        completed: 0,
        collection: 8
      },
      couponCount: 3
    };
  },
  onShow() {
    this.isAdmin = common_vendor.index.getStorageSync("isAdmin") === true;
    this.refreshData();
  },
  // 分享给好友
  onShareAppMessage() {
    return {
      title: "风车天路 - 浪漫风车之旅等你来",
      path: "/pages/index/index",
      imageUrl: ""
    };
  },
  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: "风车天路 - 浪漫风车之旅等你来",
      query: "",
      imageUrl: ""
    };
  },
  methods: {
    refreshData() {
      utils_request.request({ url: "bookings/count", data: { status: "confirmed" } }).then((res) => {
        this.userStats.pending = res.data ?? res.count ?? 0;
      }).catch(() => {
      });
      utils_request.request({ url: "bookings/count", data: { status: "pending" } }).then((res) => {
        this.userStats.completed = res.data ?? res.count ?? 0;
      }).catch(() => {
      });
    },
    onAvatarTap() {
      this.avatarTapCount++;
      clearTimeout(this.avatarTapTimer);
      if (this.avatarTapCount >= 10) {
        this.avatarTapCount = 0;
        this.applyForm = { name: "", phone: "" };
        this.applyModal.show = true;
        return;
      }
      this.avatarTapTimer = setTimeout(() => {
        this.avatarTapCount = 0;
      }, 3e3);
    },
    closeApplyModal() {
      this.applyModal.show = false;
    },
    submitApply() {
      const name = this.applyForm.name.trim();
      const phone = this.applyForm.phone.trim();
      if (!name) {
        common_vendor.index.showToast({ title: "请输入姓名", icon: "none" });
        return;
      }
      if (!/^1\d{10}$/.test(phone)) {
        common_vendor.index.showToast({ title: "请输入正确的手机号", icon: "none" });
        return;
      }
      common_vendor.index.showLoading({ title: "提交中..." });
      utils_request.request({
        method: "POST",
        url: "admin-application/apply",
        data: { name, phone }
      }).then(() => {
        this.applyModal.show = false;
        common_vendor.index.showToast({ title: "申请已提交，请等待审核", icon: "none", duration: 2500 });
      }).catch(() => {
        common_vendor.index.showToast({ title: "提交失败，请稍后重试", icon: "none" });
      }).finally(() => {
        common_vendor.index.hideLoading();
      });
    },
    closeVerifyModal() {
      this.verifyModal.show = false;
    },
    handleScan() {
      common_vendor.wx$1.scanCode({
        onlyFromCamera: false,
        scanType: ["qrCode"],
        success: (res) => {
          const bookingId = res.result;
          common_vendor.index.showLoading({ title: "核验中..." });
          utils_request.request({
            method: "POST",
            url: `bookings/${bookingId}/verify`
          }).then(() => {
            this.verifyModal = { show: true, success: true, message: "订单核验通过，祝您游玩愉快！" };
          }).catch(() => {
            this.verifyModal = { show: true, success: false, message: "订单核验失败，请检查订单状态" };
          }).finally(() => {
            common_vendor.index.hideLoading();
          });
        },
        fail: (err) => {
          if (err.errMsg && err.errMsg.includes("cancel"))
            return;
          common_vendor.index.showToast({ title: "扫码失败", icon: "none" });
        }
      });
    },
    editProfile() {
      common_vendor.index.showToast({
        title: "编辑个人资料",
        icon: "none"
      });
    },
    goToBooking(tabIndex) {
      common_vendor.index.setStorageSync("bookingInitTab", tabIndex);
      common_vendor.index.switchTab({
        url: "/pages/booking/booking",
        fail: () => {
          common_vendor.index.reLaunch({ url: "/pages/booking/booking?tab=" + tabIndex });
        }
      });
    },
    goToFeedback() {
      common_vendor.index.navigateTo({ url: "/pages/feedback/feedback" });
    },
    goToCollection() {
      common_vendor.index.showToast({
        title: "我的收藏",
        icon: "none"
      });
    },
    goToVip() {
      common_vendor.index.showToast({
        title: "会员中心",
        icon: "none"
      });
    },
    handleMenuClick(type) {
      const menuMap = {
        "orders": "我的订单",
        "collection": "我的收藏",
        "coupon": "优惠券",
        "id-card": "常用证件",
        "address": "地址管理",
        "help": "帮助中心",
        "feedback": "意见反馈",
        "about": "关于我们",
        "settings": "设置"
      };
      common_vendor.index.showToast({
        title: menuMap[type] || "功能开发中",
        icon: "none"
      });
    },
    handleLogout() {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要退出登录吗?",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.showToast({
              title: "已退出登录",
              icon: "success"
            });
          }
        }
      });
    }
  }
};
if (!Array) {
  const _component_my_tab_bar = common_vendor.resolveComponent("my-tab-bar");
  _component_my_tab_bar();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.applyModal.show
  }, $data.applyModal.show ? {
    b: $data.applyForm.name,
    c: common_vendor.o(($event) => $data.applyForm.name = $event.detail.value, "41"),
    d: $data.applyForm.phone,
    e: common_vendor.o(($event) => $data.applyForm.phone = $event.detail.value, "f2"),
    f: common_vendor.o((...args) => $options.closeApplyModal && $options.closeApplyModal(...args), "c4"),
    g: common_vendor.o((...args) => $options.submitApply && $options.submitApply(...args), "15"),
    h: common_vendor.o(() => {
    }, "f9"),
    i: common_vendor.o((...args) => $options.closeApplyModal && $options.closeApplyModal(...args), "bd")
  } : {}, {
    j: $data.verifyModal.show
  }, $data.verifyModal.show ? {
    k: common_vendor.t($data.verifyModal.success ? "✓" : "✕"),
    l: common_vendor.n($data.verifyModal.success ? "icon-success" : "icon-fail"),
    m: common_vendor.t($data.verifyModal.success ? "核验成功" : "核验失败"),
    n: common_vendor.n($data.verifyModal.success ? "title-success" : "title-fail"),
    o: common_vendor.t($data.verifyModal.message),
    p: common_vendor.n($data.verifyModal.success ? "btn-success" : "btn-fail"),
    q: common_vendor.o((...args) => $options.closeVerifyModal && $options.closeVerifyModal(...args), "40"),
    r: common_vendor.o(() => {
    }, "bf"),
    s: common_vendor.o((...args) => $options.closeVerifyModal && $options.closeVerifyModal(...args), "c1")
  } : {}, {
    t: $data.userInfo.avatar,
    v: common_vendor.o((...args) => $options.onAvatarTap && $options.onAvatarTap(...args), "73"),
    w: common_vendor.t($data.userInfo.name),
    x: common_vendor.t($data.userStats.pending),
    y: common_vendor.o(($event) => $options.goToBooking(2), "97"),
    z: common_vendor.t($data.userStats.completed),
    A: common_vendor.o(($event) => $options.goToBooking(1), "bd"),
    B: $data.isAdmin
  }, $data.isAdmin ? {
    C: common_vendor.o((...args) => $options.handleScan && $options.handleScan(...args), "e4")
  } : {}, {
    D: common_vendor.o(($event) => $options.goToBooking(0), "3a"),
    E: common_vendor.o((...args) => $options.goToFeedback && $options.goToFeedback(...args), "d8"),
    F: common_vendor.p({
      current: 2
    })
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-dd383ca2"]]);
_sfc_main.__runtimeHooks = 6;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/profile/profile.js.map
