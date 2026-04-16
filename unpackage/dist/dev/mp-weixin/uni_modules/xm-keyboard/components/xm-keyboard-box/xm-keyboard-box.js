"use strict";
const common_vendor = require("../../../../common/vendor.js");
const _sfc_main = {
  name: "xm-keyboard-box",
  emits: ["add", "del", "confirm", "cancel", "clear"],
  props: {
    // 是否开启震动效果
    vibration: {
      type: Boolean,
      default: false
    },
    // 是否显示切换按钮
    showChangeBtn: {
      type: Boolean,
      default: true
    },
    // 是否显示取消按钮
    showCancelBtn: {
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
      mode: 0,
      ratio: 7,
      max: 10,
      gutter: 10,
      btnWidth: 10,
      btnHeight: 10,
      handlerWidth: 10,
      lines: [
        [
          {
            list: ["京", "沪", "浙", "苏", "粤", "鲁", "晋", "冀", "豫", "川"],
            diff: 0
          },
          {
            list: ["渝", "辽", "吉", "黑", "皖", "鄂", "津", "贵", "云", "桂"],
            diff: 0
          },
          {
            list: ["琼", "青", "新", "藏", "蒙", "宁", "甘", "陕", "闽", "赣"],
            diff: 0
          },
          {
            list: ["湘", "使", "领", "警", "学", "挂", "...", "", "", ""],
            diff: 3
          }
        ],
        [
          {
            list: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
            diff: 0
          },
          {
            list: ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
            diff: 0
          },
          {
            list: ["A", "S", "D", "F", "G", "H", "J", "K", "L", ""],
            diff: 1
          },
          {
            list: ["Z", "X", "C", "V", "B", "N", "M", "", "", ""],
            diff: 3
          }
        ],
        [
          {
            list: ["港", "澳", "台", "临", "试", "", "", "", "", ""],
            diff: 0
          },
          {
            list: ["", "", "", "", "", "", "", "", "", ""],
            diff: 0
          },
          {
            list: ["", "", "", "", "", "", "", "", "", ""],
            diff: 0
          },
          {
            list: ["", "", "", "", "", "", "...", "", "", ""],
            diff: 3
          }
        ]
      ]
    };
  },
  methods: {
    diffSize(pos) {
      if (pos == 0) {
        return 0;
      }
      return (pos * this.btnWidth + pos * this.btnWidth / this.ratio) / 2;
    },
    changeMode(v) {
      this.mode = v == void 0 ? this.mode == 0 ? 1 : 0 : v;
    },
    toClick(item) {
      if (item === "") {
        return;
      }
      if (item === "...") {
        this.mode = this.mode == 2 ? 0 : 2;
        return;
      }
      if (this.disable && this.disable.indexOf && this.disable.indexOf(item) !== -1) {
        return;
      }
      this.toEmit("add", item);
    },
    toDel() {
      this.toEmit("del");
    },
    toCancel() {
      this.toEmit("cancel");
    },
    toConfirm() {
      this.toEmit("confirm");
    },
    toClear() {
      this.toEmit("clear");
    },
    toEmit(type, params) {
      this.toVibration();
      this.$emit(type, params);
    },
    toVibration() {
      if (this.vibration && common_vendor.index.vibrateShort) {
        common_vendor.index.vibrateShort();
      }
    }
  },
  mounted() {
    const {
      windowWidth
    } = common_vendor.index.getSystemInfoSync();
    let _width = (windowWidth - this.gutter * 2) * this.ratio / (this.max * this.ratio + this.max - 1);
    this.btnWidth = _width.toFixed(2);
    this.btnHeight = (_width / 3 * 4).toFixed(2);
    this.handlerWidth = (_width * 1.5 + _width / (this.ratio * 2)).toFixed(2);
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.f($data.lines[$data.mode], (line, li, i0) => {
      return {
        a: common_vendor.f(line.list, (item, index, i1) => {
          return {
            a: common_vendor.t(item),
            b: index,
            c: item == "" ? 1 : "",
            d: ($data.mode == 2 || $props.disable) && $props.disable.indexOf(item) != -1 ? 1 : "",
            e: common_vendor.o(($event) => $options.toClick(item), index)
          };
        }),
        b: li,
        c: $options.diffSize(line.diff) + "px",
        d: $options.diffSize(line.diff) / -1 + "px"
      };
    }),
    b: $data.btnWidth + "px",
    c: $data.btnHeight + "px",
    d: $props.showCancelBtn
  }, $props.showCancelBtn ? {
    e: $data.btnWidth / $data.ratio + "px",
    f: $data.btnHeight + "px",
    g: common_vendor.o(($event) => $options.toCancel(), "47")
  } : {}, {
    h: $data.btnWidth / $data.ratio + "px",
    i: $data.btnHeight + "px",
    j: common_vendor.o(($event) => $options.toClear(), "51"),
    k: $data.btnWidth / $data.ratio + "px",
    l: $data.btnHeight + "px",
    m: common_vendor.o(($event) => $options.toConfirm(), "4a"),
    n: $props.showChangeBtn
  }, $props.showChangeBtn ? {
    o: $data.handlerWidth + "px",
    p: $data.btnHeight + "px",
    q: "calc(20px + " + $data.btnHeight + "px)",
    r: common_vendor.o(($event) => $options.changeMode(), "60")
  } : {}, {
    s: $data.handlerWidth + "px",
    t: $data.btnHeight + "px",
    v: "calc(20px + " + $data.btnHeight + "px)",
    w: common_vendor.o(($event) => $options.toDel(), "a2")
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-59f1915b"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../../../.sourcemap/mp-weixin/uni_modules/xm-keyboard/components/xm-keyboard-box/xm-keyboard-box.js.map
