"use strict";
const common_vendor = require("../../../../common/vendor.js");
const _sfc_main = {
  name: "xm-keyboard-v2",
  emits: ["confirm", "cancel"],
  props: {
    title: {
      type: String,
      default: ""
    },
    cursor: {
      type: Boolean,
      default: false
    },
    vibration: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: "plate"
    },
    max: {
      type: Number,
      default: 8
    },
    showContent: {
      type: Boolean,
      default: false
    },
    // 是否加入动画效果
    anim: {
      type: Boolean,
      default: true
    },
    // 禁用某些按钮
    disable: {
      required: false,
      default: () => ""
    }
  },
  data() {
    return {
      isShow: false,
      value: ""
    };
  },
  methods: {
    toShow(value, pos) {
      this.value = value || "";
      this.isShow = true;
      this.$refs.keyboardInput.changeValue(this.value, pos);
    },
    toConfirm() {
      this.isShow = false;
      let value = this.$refs.keyboardInput.values.join("");
      this.$emit("confirm", value);
    },
    toCancel() {
      this.isShow = false;
      this.$emit("cancel");
    },
    inputChange(index) {
      if (this.type == "plate") {
        this.$refs.keyboardBox.changeMode(index == 0 ? 0 : 1);
      } else {
        this.$refs.keyboardBox.changeMode(1);
      }
    },
    inputAdd(v) {
      this.$refs.keyboardInput.toAdd(v);
    },
    inputDel() {
      this.$refs.keyboardInput.toDel();
    },
    inputClear() {
      this.$refs.keyboardInput.toClear();
    }
  }
};
if (!Array) {
  const _easycom_xm_keyboard_input2 = common_vendor.resolveComponent("xm-keyboard-input");
  const _easycom_xm_keyboard_box2 = common_vendor.resolveComponent("xm-keyboard-box");
  const _easycom_xm_popup2 = common_vendor.resolveComponent("xm-popup");
  (_easycom_xm_keyboard_input2 + _easycom_xm_keyboard_box2 + _easycom_xm_popup2)();
}
const _easycom_xm_keyboard_input = () => "../xm-keyboard-input/xm-keyboard-input.js";
const _easycom_xm_keyboard_box = () => "../xm-keyboard-box/xm-keyboard-box.js";
const _easycom_xm_popup = () => "../xm-popup/xm-popup.js";
if (!Math) {
  (_easycom_xm_keyboard_input + _easycom_xm_keyboard_box + _easycom_xm_popup)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $props.title
  }, $props.title ? {
    b: common_vendor.t($props.title)
  } : {}, {
    c: common_vendor.sr("keyboardInput", "221ef847-1,221ef847-0"),
    d: common_vendor.o($options.inputChange, "6e"),
    e: common_vendor.p({
      cursor: $props.cursor,
      ["show-pointer"]: $props.type == "plate",
      max: $props.max
    }),
    f: common_vendor.sr("keyboardBox", "221ef847-2,221ef847-0"),
    g: common_vendor.o($options.inputAdd, "5d"),
    h: common_vendor.o($options.inputDel, "1c"),
    i: common_vendor.o($options.inputClear, "74"),
    j: common_vendor.o($options.toCancel, "a8"),
    k: common_vendor.o($options.toConfirm, "cd"),
    l: common_vendor.p({
      ["show-change-btn"]: $props.type == "plate",
      ["show-cancel-btn"]: !$props.showContent,
      vibration: $props.vibration,
      disable: $props.disable
    }),
    m: common_vendor.o($options.toCancel, "5e"),
    n: common_vendor.p({
      show: $data.isShow,
      background: "#d4d5d9",
      showContent: $props.showContent,
      anim: $props.anim
    })
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-221ef847"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../../../.sourcemap/mp-weixin/uni_modules/xm-keyboard/components/xm-keyboard-v2/xm-keyboard-v2.js.map
