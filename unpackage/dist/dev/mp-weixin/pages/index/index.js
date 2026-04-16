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
      bannerList: [
        {
          image: "https://cdn.hbfctl.com.cn/index/1.jpg"
        },
        {
          image: "https://cdn.hbfctl.com.cn/index/2.jpg"
        },
        {
          image: "https://cdn.hbfctl.com.cn/index/3.jpg"
        },
        {
          image: "https://cdn.hbfctl.com.cn/index/4.jpg"
        },
        {
          image: "https://cdn.hbfctl.com.cn/index/5.jpg"
        },
        {
          image: "https://cdn.hbfctl.com.cn/index/6.jpg"
        }
      ],
      featureList: [
        {
          icon: "icon-Energy-",
          name: "风车奇观",
          desc: "百余座风力发电机",
          image: "https://cdn.hbfctl.com.cn/index/7.jpg"
        },
        {
          icon: "🏔️",
          name: "天路美景",
          desc: "蜿蜒曲折的山路风光",
          image: "https://cdn.hbfctl.com.cn/index/3.jpg"
        },
        {
          icon: "📸",
          name: "打卡圣地",
          desc: "网红拍照取景地",
          image: "https://cdn.hbfctl.com.cn/index/8.jpg"
        },
        {
          icon: "🌤️",
          name: "四季皆宜",
          desc: "一年四季风景各异",
          image: "https://cdn.hbfctl.com.cn/index/9.jpg"
        }
      ],
      scenicList: [
        {
          id: 2,
          name: "天路盘山道",
          image: "https://cdn.hbfctl.com.cn/index/7.jpg",
          desc: "自驾天堂"
        },
        {
          id: 3,
          name: "日落观景点",
          image: "https://cdn.hbfctl.com.cn/index/3.jpg",
          desc: "观日出最佳位置"
        },
        {
          id: 4,
          name: "云海平台",
          image: "https://cdn.hbfctl.com.cn/index/8.jpg",
          desc: "云雾缭绕仙境"
        },
        {
          id: 1,
          name: "风车观景台",
          image: "https://cdn.hbfctl.com.cn/index/9.jpg",
          desc: "最佳观赏点"
        }
      ],
      noticeList: []
    };
  },
  async onLoad() {
    this.loadAnnouncements();
    common_vendor.index.login({
      provider: "weixin",
      success: async (loginRes) => {
        try {
          common_vendor.index.__f__("log", "at pages/index/index.vue:178", "微信登录成功，code:", loginRes.code);
          const res = await utils_request.request({
            url: "/users/wx-login",
            // 后端登录接口
            method: "POST",
            data: {
              code: loginRes.code
            }
          });
          if (res.success && res.data) {
            common_vendor.index.setStorageSync("token", res.data.token);
            common_vendor.index.setStorageSync("isAdmin", res.data.admin === true);
          } else {
            common_vendor.index.showToast({
              title: "微信登录失败",
              icon: "none"
            });
          }
        } catch (err) {
          common_vendor.index.showToast({
            title: "微信登录异常",
            icon: "none"
          });
        }
      },
      fail: (err) => {
        common_vendor.index.showToast({
          title: "微信授权失败",
          icon: "none"
        });
        common_vendor.index.__f__("log", "at pages/index/index.vue:208", "微信登录失败:", err);
      }
    });
  },
  // 分享给好友
  onShareAppMessage() {
    return {
      title: "风车天路 - 浪漫风车之旅等你来",
      path: "/pages/index/index",
      imageUrl: ""
      // 可以设置分享图片
    };
  },
  // 分享到朋友圈（需要在 app.json 中配置）
  onShareTimeline() {
    return {
      title: "风车天路 - 浪漫风车之旅等你来",
      query: "",
      imageUrl: ""
    };
  },
  methods: {
    // 获取公告列表
    loadAnnouncements() {
      utils_request.request({ method: "GET", url: "/announcements" }).then((res) => {
        if (res.success && Array.isArray(res.data)) {
          this.noticeList = res.data.map((item) => ({
            content: item.content,
            time: this.formatNoticeDate(item.updatedAt)
          }));
        }
      }).catch(() => {
      });
    },
    // 格式化公告日期为 MM-DD
    formatNoticeDate(dateStr) {
      if (!dateStr)
        return "";
      const d = new Date(dateStr);
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${mm}-${dd}`;
    },
    // 跳转到预约页面
    goToBooking() {
      common_vendor.index.navigateTo({
        url: "/pages/booking-form/booking-form"
      });
    },
    // 跳转到美景画廊
    goToGallery(item, mode) {
      let url = "/pages/gallery/gallery?mode=" + mode + (item ? "&image=" + encodeURIComponent(item.image) : "");
      common_vendor.index.navigateTo({
        url
      });
    }
  }
};
if (!Array) {
  const _component_my_tab_bar = common_vendor.resolveComponent("my-tab-bar");
  _component_my_tab_bar();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.f($data.bannerList, (item, index, i0) => {
      return {
        a: item.image,
        b: index
      };
    }),
    b: common_vendor.o((...args) => $options.goToBooking && $options.goToBooking(...args), "34"),
    c: common_vendor.o(($event) => $options.goToGallery(null, "all"), "66"),
    d: common_vendor.f($data.scenicList, (item, index, i0) => {
      return {
        a: item.image,
        b: common_vendor.t(item.name),
        c: common_vendor.t(item.desc),
        d: index,
        e: common_vendor.o(($event) => $options.goToGallery(item, index), index)
      };
    }),
    e: common_vendor.f($data.noticeList, (item, index, i0) => {
      return {
        a: common_vendor.t(item.content),
        b: common_vendor.t(item.time),
        c: index
      };
    }),
    f: common_vendor.p({
      current: 0
    })
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-1cf27b2a"]]);
_sfc_main.__runtimeHooks = 6;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
