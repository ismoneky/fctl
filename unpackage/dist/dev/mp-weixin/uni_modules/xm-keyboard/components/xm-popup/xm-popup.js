"use strict";
const common_vendor = require("../../../../common/vendor.js");
const _sfc_main = {
  name: "xm-popup",
  emits: ["close"],
  props: {
    // 是否显示弹出层
    show: {
      type: Boolean,
      default: false
    },
    // 弹出层内容背景颜色
    background: {
      type: String,
      default: "#FFFFFF"
    },
    // 弹出层内容圆角
    radius: {
      type: [Number, String],
      default: 0
    },
    // 弹出层的z-index
    zIndex: {
      type: [Number, String],
      default: 1992
    },
    // 点击遮罩, 是否可关闭
    maskClosable: {
      type: Boolean,
      default: true
    },
    // 遮罩的背景色
    maskBackground: {
      type: String,
      default: "rgba(0,0,0,0.6)"
    },
    // 是否直接显示键盘
    showContent: {
      type: Boolean,
      default: false
    },
    // 是否加入动画效果
    anim: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      isShow: false,
      animation: {},
      animationData: {}
    };
  },
  methods: {
    toClose(e) {
      if (!this.maskClosable)
        return;
      this.$emit("close", {});
    },
    stop(e) {
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $props.showContent ? 1 : "",
    b: $props.anim ? 1 : "",
    c: $props.radius + "px",
    d: $props.radius + "px",
    e: $props.background,
    f: common_vendor.o((...args) => $options.stop && $options.stop(...args), "dd"),
    g: $props.show ? 1 : "",
    h: $props.showContent ? 1 : "",
    i: $props.zIndex,
    j: $props.maskBackground,
    k: common_vendor.o((...args) => $options.toClose && $options.toClose(...args), "af"),
    l: common_vendor.o((...args) => $options.stop && $options.stop(...args), "0c"),
    m: $data.animationData
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-4856398f"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../../../.sourcemap/mp-weixin/uni_modules/xm-keyboard/components/xm-popup/xm-popup.js.map
