"use strict";
const common_vendor = require("../../../../common/vendor.js");
const _sfc_main = {
  name: "xm-keyboard-input",
  emits: ["change"],
  props: {
    initValue: {
      type: String,
      default: ""
    },
    cursor: {
      type: Boolean,
      default: false
    },
    max: {
      type: Number,
      default: 8
    },
    showPointer: {
      type: Boolean,
      default: true
    },
    maxSize: {
      type: Number,
      default: 40
    },
    align: {
      type: String,
      default: "center"
      // default: 'space-between',
    }
  },
  data() {
    return {
      cur: 0,
      values: []
    };
  },
  methods: {
    changeCur(index) {
      this.cur = index;
      this.toChange();
    },
    toChange() {
      this.$emit("change", this.cur);
    },
    toAdd(v) {
      this.values[this.cur] = v;
      if (this.cur < this.max - 1) {
        this.cur++;
        this.toChange();
      }
    },
    toDel() {
      if (this.cur == this.max - 1 && this.values[this.cur] || this.values[this.cur]) {
        this.resetCurValue();
        return;
      }
      if (this.cur <= 0) {
        this.cur = 0;
      } else {
        this.cur--;
        this.resetCurValue();
        this.toChange();
      }
    },
    resetCurValue() {
      this.values[this.cur] = "";
      this.$forceUpdate();
      this.toChange();
    },
    toClear() {
      this.cur = 0;
      this.initValues();
      this.toChange();
    },
    changeValue(v, pos, skipEmit) {
      let max = Math.max(v.length, this.max);
      for (let i = 0; i < max; i++) {
        this.values[i] = v.charAt(i);
      }
      this.$forceUpdate();
      let cur = this.values.findIndex((x) => !x);
      this.cur = cur === -1 ? this.max - 1 : cur;
      if (pos != void 0) {
        this.cur = pos;
      }
      if (skipEmit) {
        return;
      }
      this.toChange();
    },
    initValues() {
      let vs = [];
      vs.length = this.max;
      vs.fill("");
      this.values = vs;
    }
  },
  mounted() {
    this.initValues();
    this.changeValue(this.initValue || "", null, true);
  }
};
if (!Array) {
  const _easycom_xm_square2 = common_vendor.resolveComponent("xm-square");
  _easycom_xm_square2();
}
const _easycom_xm_square = () => "../xm-square/xm-square.js";
if (!Math) {
  _easycom_xm_square();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.f($data.values, (item, index, i0) => {
      return {
        a: common_vendor.t(item),
        b: $props.cursor && $data.cur === index && !item ? 1 : "",
        c: "22096f45-0-" + i0,
        d: index,
        e: $data.cur === index ? 1 : "",
        f: (index == 0 ? 0 : 18 - $props.max) + "px",
        g: common_vendor.o(($event) => $options.changeCur(index), index)
      };
    }),
    b: $props.maxSize + "px",
    c: $props.maxSize + "px",
    d: common_vendor.p({
      height: "120%"
    }),
    e: $props.showPointer ? 1 : "",
    f: $props.maxSize + "px",
    g: $props.maxSize + "px",
    h: $props.align
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-22096f45"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../../../.sourcemap/mp-weixin/uni_modules/xm-keyboard/components/xm-keyboard-input/xm-keyboard-input.js.map
