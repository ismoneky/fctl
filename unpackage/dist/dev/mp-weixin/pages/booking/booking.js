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
      currentTab: 0,
      showCancel: false,
      currentCancelItem: null,
      bookingList: []
    };
  },
  computed: {},
  // // 分享给好友
  // onShareAppMessage() {
  // 	return {
  // 		title: '风车天路 - 浪漫风车之旅等你来',
  // 		path: '/pages/index/index',
  // 		imageUrl: ''
  // 	}
  // },
  // // 分享到朋友圈
  // onShareTimeline() {
  // 	return {
  // 		title: '风车天路 - 浪漫风车之旅等你来',
  // 		query: '',
  // 		imageUrl: ''
  // 	}
  // },
  onLoad(options) {
    if (options.tab !== void 0) {
      this.currentTab = parseInt(options.tab) || 0;
    }
    this.getList();
  },
  onShow() {
    const tab = common_vendor.index.getStorageSync("bookingInitTab");
    if (tab !== "" && tab !== void 0) {
      this.currentTab = parseInt(tab);
      common_vendor.index.removeStorageSync("bookingInitTab");
    }
    this.getList();
  },
  methods: {
    getList() {
      common_vendor.index.getStorageSync("openid");
      let status = null;
      switch (this.currentTab) {
        case 1:
          status = "pending";
          break;
        case 2:
          status = "confirmed";
          break;
        case 3:
          status = "completed";
          break;
        case 4:
          status = "cancelled";
          break;
        default:
          status = "";
      }
      const parmas = {
        page: 1,
        pageSize: 99
      };
      if (status) {
        parmas.status = status;
      }
      utils_request.request({
        method: "GET",
        url: "/bookings",
        data: parmas
      }).then((res) => {
        common_vendor.index.__f__("log", "at pages/booking/booking.vue:186", "订单列表", res);
        if (res.success && res.data) {
          this.bookingList = res.data;
        } else {
          this.bookingList = [];
        }
      }).catch((err) => {
        common_vendor.index.showToast({ title: "订单获取失败，请稍后再试", icon: "none" });
        this.bookingList = [];
      });
    },
    switchTab(index) {
      this.currentTab = index;
      this.getList();
    },
    getStatusText(status) {
      const statusMap = {
        pending: "待支付",
        confirmed: "待使用",
        completed: "已完成",
        cancelled: "已取消",
        refunded: "已退款"
      };
      return statusMap[status] || "";
    },
    showCancelDialog(item) {
      this.currentCancelItem = item;
      this.showCancel = true;
    },
    confirmCancel() {
      if (this.currentCancelItem) {
        this.currentCancelItem.status = "cancelled";
        utils_request.request({
          url: "/bookings/" + this.currentCancelItem.bookingId,
          method: "PUT",
          data: {
            status: "cancelled"
          }
        }).then((res) => {
          if (res.success) {
            common_vendor.index.showToast({ title: "预约已取消", icon: "success" });
            this.getList();
          } else {
            common_vendor.index.showToast({ title: "取消预约失败，请稍后再试", icon: "none" });
          }
          this.currentCancelItem = null;
        }).catch((err) => {
          common_vendor.index.showToast({ title: "取消预约失败，请稍后再试", icon: "none" });
          this.currentCancelItem = null;
        });
      }
      this.showCancel = false;
    },
    viewDetail(item) {
      common_vendor.index.navigateTo({
        url: `/pages/booking-detail/booking-detail?bookingId=${item.bookingId}`
      });
    },
    bookAgain(item) {
      common_vendor.index.showToast({
        title: "再次预约",
        icon: "none"
      });
    },
    goToHome() {
      common_vendor.index.reLaunch({
        url: "/pages/index/index"
      });
    },
    formatDate(dateString, format = "YYYY/MM/DD") {
      const options = { year: "numeric", month: "2-digit", day: "2-digit" };
      const date = new Date(dateString);
      if (format === "YYYY年MM月DD日") {
        return `${date.getFullYear()}年${(date.getMonth() + 1).toString().padStart(2, "0")}月${date.getDate().toString().padStart(2, "0")}日`;
      }
      return date.toLocaleDateString("zh-CN", options);
    }
  }
};
if (!Array) {
  const _component_my_tab_bar = common_vendor.resolveComponent("my-tab-bar");
  _component_my_tab_bar();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.currentTab === 0
  }, $data.currentTab === 0 ? {} : {}, {
    b: $data.currentTab === 0 ? 1 : "",
    c: common_vendor.o(($event) => $options.switchTab(0), "ff"),
    d: $data.currentTab === 1
  }, $data.currentTab === 1 ? {} : {}, {
    e: $data.currentTab === 1 ? 1 : "",
    f: common_vendor.o(($event) => $options.switchTab(1), "34"),
    g: $data.currentTab === 2
  }, $data.currentTab === 2 ? {} : {}, {
    h: $data.currentTab === 2 ? 1 : "",
    i: common_vendor.o(($event) => $options.switchTab(2), "3b"),
    j: $data.currentTab === 3
  }, $data.currentTab === 3 ? {} : {}, {
    k: $data.currentTab === 3 ? 1 : "",
    l: common_vendor.o(($event) => $options.switchTab(3), "2e"),
    m: $data.currentTab === 4
  }, $data.currentTab === 4 ? {} : {}, {
    n: $data.currentTab === 4 ? 1 : "",
    o: common_vendor.o(($event) => $options.switchTab(4), "9b"),
    p: $data.bookingList.length > 0
  }, $data.bookingList.length > 0 ? {
    q: common_vendor.f($data.bookingList, (item, index, i0) => {
      return common_vendor.e({
        a: common_vendor.t($options.getStatusText(item.status)),
        b: common_vendor.n("status-" + item.status),
        c: common_vendor.t($options.formatDate(item.bookingDate, "YYYY年MM月DD日")),
        d: common_vendor.t(item.timeSlot === "morning" ? "上午" : "下午"),
        e: common_vendor.t(item.personCount),
        f: item.plateNumber
      }, item.plateNumber ? {
        g: common_vendor.t(item.plateNumber)
      } : {}, {
        h: common_vendor.t(item.bookingId),
        i: item.status === "pending"
      }, item.status === "pending" ? {
        j: common_vendor.o(($event) => $options.showCancelDialog(item), item.id),
        k: common_vendor.o(($event) => $options.viewDetail(item), item.id)
      } : item.status === "confirmed" ? {
        m: common_vendor.o(($event) => $options.viewDetail(item), item.id)
      } : item.status === "completed" ? {
        o: common_vendor.o(($event) => $options.viewDetail(item), item.id),
        p: common_vendor.o(($event) => $options.bookAgain(item), item.id)
      } : {
        q: common_vendor.o(($event) => $options.viewDetail(item), item.id)
      }, {
        l: item.status === "confirmed",
        n: item.status === "completed",
        r: item.id
      });
    })
  } : {
    r: common_vendor.o((...args) => $options.goToHome && $options.goToHome(...args), "03")
  }, {
    s: $data.showCancel
  }, $data.showCancel ? {
    t: common_vendor.o(($event) => $data.showCancel = false, "6d"),
    v: common_vendor.o((...args) => $options.confirmCancel && $options.confirmCancel(...args), "ab"),
    w: common_vendor.o(() => {
    }, "da"),
    x: common_vendor.o(($event) => $data.showCancel = false, "0d")
  } : {}, {
    y: common_vendor.p({
      current: 1
    })
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-d331dabb"]]);
_sfc_main.__runtimeHooks = 6;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/booking/booking.js.map
