"use strict";
const common_vendor = require("../common/vendor.js");
const _sfc_main = {
  name: "my-tab-bar",
  props: {
    current: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      list: [
        {
          pagePath: "/pages/index/index",
          text: "首页",
          icon: "icon-shouye1"
        },
        {
          pagePath: "/pages/booking/booking",
          text: "预约",
          icon: "icon-dingdan"
        },
        {
          pagePath: "/pages/profile/profile",
          text: "我的",
          icon: "icon-wode"
        }
      ]
    };
  },
  methods: {
    switchTab(item, index) {
      if (this.current === index)
        return;
      common_vendor.index.reLaunch({
        url: item.pagePath
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.f($data.list, (item, index, i0) => {
      return {
        a: common_vendor.n($props.current === index ? "active" : ""),
        b: common_vendor.n(item.icon),
        c: common_vendor.t(item.text),
        d: $props.current === index ? 1 : "",
        e: index,
        f: common_vendor.o(($event) => $options.switchTab(item, index), index)
      };
    })
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-f5611098"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/my-tab-bar.js.map
