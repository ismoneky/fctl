"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const utils_payment = require("../../utils/payment.js");
const _sfc_main = {
  data() {
    return {
      id: "",
      // 景区ID，从路由参数获取
      formData: {
        name: "zhang",
        // 联系人姓名
        phone: "13261732722",
        // 联系人手机号
        idCard: "410621200008210019",
        // 联系人身份证号
        bookingDate: "",
        // 预约日期
        timeSlot: "morning",
        // 预约时间段（morning/afternoon）
        travelMode: "selfDriving",
        // 出行方式（scenicBus/selfDriving/tour_group）
        licensePlate: "京A12345",
        // 车牌号（自驾时必填）
        vehicleType: "wheelMotorcycle",
        // 车辆类型（自驾时必填）
        tourGroupName: "",
        // 旅游团名称（旅游团时必填）
        tourOrderNumber: "",
        // 旅游团订单编号（旅游团时必填）
        personCount: 1,
        // 预约人数
        remarks: ""
        // 备注信息
      },
      travelModeList: [
        {
          label: "景区摆渡车",
          value: "scenicBus",
          icon: "🚌"
        },
        {
          label: "自驾出行",
          value: "selfDriving",
          icon: "🚗"
        }
        // {
        // 	label: '观光团',
        // 	value: 'tourGroup',
        // 	icon: '👥'
        // }
      ],
      vehicleTypes: [
        {
          label: "小型客车",
          value: "smallCar"
        },
        {
          label: "摩托",
          value: "wheelMotorcycle"
        }
      ],
      minDate: "",
      maxDate: "",
      _lastClickTime: 0
      // 防抖时间戳
    };
  },
  onLoad(options) {
    if (options.bookingId) {
      this.getBookingDetail(options.bookingId);
    } else {
      const today = /* @__PURE__ */ new Date();
      const maxDay = /* @__PURE__ */ new Date();
      maxDay.setMonth(maxDay.getMonth() + 3);
      this.minDate = this.formatDate(today);
      this.maxDate = this.formatDate(maxDay);
    }
  },
  // 分享配置
  onShareAppMessage() {
    return {
      title: "风车天路 - 浪漫风车之旅等你来",
      path: "/pages/index/index"
    };
  },
  methods: {
    // 人数增加
    increasePerson() {
      if (this.formData.personCount < 99) {
        this.formData.personCount++;
      }
    },
    // 人数减少
    decreasePerson() {
      if (this.formData.personCount > 1) {
        this.formData.personCount--;
      }
    },
    // 人数输入
    onPersonCountInput(e) {
      let value = parseInt(e.detail.value) || 1;
      if (value < 1)
        value = 1;
      if (value > 99)
        value = 99;
      this.formData.personCount = value;
    },
    // 年龄段选择
    onAgeRangeChange(e) {
      this.formData.ageRange = this.ageRanges[e.detail.value];
    },
    // 日期选择
    onDateChange(e) {
      this.formData.bookingDate = e.detail.value;
    },
    // 时间段选择
    onTimePeriodChange(period) {
      this.formData.timeSlot = period;
    },
    // 出行方式选择
    onTravelTypeChange(value) {
      this.formData.travelMode = value;
    },
    // 车辆类型选择
    onVehicleTypeChange(e) {
      this.formData.vehicleType = this.vehicleTypes[e.detail.value].value;
    },
    // 显示车牌键盘
    showPlateKeyboard() {
      this.$refs.plateKeyboard.toShow(this.formData.licensePlate);
    },
    // 车牌号确认
    onPlateConfirm(value) {
      this.formData.licensePlate = value;
    },
    // 车牌号格式化显示（省份·号码）
    formatPlate(value) {
      if (!value)
        return "";
      return [value.substring(0, 2), value.substring(2)].filter((x) => x).join("·");
    },
    // 获取车辆类型标签
    getVehicleTypeLabel() {
      const type = this.vehicleTypes.find((item) => item.value === this.formData.vehicleType);
      return type ? type.label : "";
    },
    // 格式化日期
    formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    },
    // 验证手机号
    validatePhone(phone) {
      const reg = /^1[3-9]\d{9}$/;
      return reg.test(phone);
    },
    // 验证身份证号
    validateIdCard(idCard) {
      const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
      return reg.test(idCard);
    },
    // 验证车牌号
    validatePlateNumber(plateNumber) {
      const reg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{4,5}[A-Z0-9挂学警港澳]$/;
      return reg.test(plateNumber);
    },
    // 表单验证
    validateForm() {
      if (!this.formData.personCount || this.formData.personCount < 1) {
        common_vendor.index.showToast({
          title: "请输入预约人数",
          icon: "none"
        });
        return false;
      }
      if (!this.formData.name.trim()) {
        common_vendor.index.showToast({
          title: "请输入联系人姓名",
          icon: "none"
        });
        return false;
      }
      if (!this.formData.phone) {
        common_vendor.index.showToast({
          title: "请输入手机号码",
          icon: "none"
        });
        return false;
      }
      if (!this.validatePhone(this.formData.phone)) {
        common_vendor.index.showToast({
          title: "请输入正确的手机号码",
          icon: "none"
        });
        return false;
      }
      if (!this.formData.idCard) {
        common_vendor.index.showToast({
          title: "请输入身份证号码",
          icon: "none"
        });
        return false;
      }
      if (!this.validateIdCard(this.formData.idCard)) {
        common_vendor.index.showToast({
          title: "请输入正确的身份证号码",
          icon: "none"
        });
        return false;
      }
      if (!this.formData.bookingDate) {
        common_vendor.index.showToast({
          title: "请选择预约日期",
          icon: "none"
        });
        return false;
      }
      if (!this.formData.timeSlot) {
        common_vendor.index.showToast({
          title: "请选择预约时间段",
          icon: "none"
        });
        return false;
      }
      if (this.formData.travelMode === "selfDriving") {
        if (!this.formData.vehicleType) {
          common_vendor.index.showToast({
            title: "请选择车辆类型",
            icon: "none"
          });
          return false;
        }
        if (!this.formData.licensePlate) {
          common_vendor.index.showToast({
            title: "请输入车牌号",
            icon: "none"
          });
          return false;
        }
        if (!this.validatePlateNumber(this.formData.licensePlate)) {
          common_vendor.index.showToast({
            title: "请输入正确的车牌号",
            icon: "none"
          });
          return false;
        }
      }
      return true;
    },
    // 提交表单
    handleSubmit() {
      const now = Date.now();
      if (now - this._lastClickTime < 2e3)
        return;
      this._lastClickTime = now;
      if (!this.validateForm()) {
        return;
      }
      common_vendor.index.showLoading({
        title: "提交中..."
      });
      const submitData = {
        ...this.formData,
        wechatOpenId: common_vendor.index.getStorageSync("openid")
      };
      utils_request.request({
        method: "POST",
        url: "/bookings",
        data: submitData
      }).then((res) => {
        if (res.success) {
          const bookingId = res.data.bookingId;
          this.handlePayment(bookingId);
        } else {
          common_vendor.index.showToast({
            title: "预约失败，请稍后再试",
            icon: "error"
          });
        }
      }).catch((err) => {
        var _a;
        common_vendor.index.__f__("log", "at pages/booking-form/booking-form.vue:506", "预约提交失败:", err);
        common_vendor.index.showToast({
          title: ((_a = err.data) == null ? void 0 : _a.message) || "预约失败，请稍后再试",
          icon: "error"
        });
      }).finally(() => {
        common_vendor.index.hideLoading();
      });
    },
    // 处理支付（使用公共方法）
    handlePayment(bookingId) {
      utils_payment.handlePayment(bookingId);
    },
    // 获取预约详情
    getBookingDetail(bookingId) {
      utils_request.request({
        method: "GET",
        url: `/bookings/${bookingId}`
      }).then((res) => {
        if (res.success && res.data) {
          this.formData = res.data;
        } else {
          common_vendor.index.showToast({ title: "加载详情失败", icon: "none" });
        }
      }).catch((err) => {
        common_vendor.index.showToast({ title: "加载详情失败", icon: "none" });
      });
    }
  }
};
if (!Array) {
  const _easycom_xm_keyboard_v22 = common_vendor.resolveComponent("xm-keyboard-v2");
  _easycom_xm_keyboard_v22();
}
const _easycom_xm_keyboard_v2 = () => "../../uni_modules/xm-keyboard/components/xm-keyboard-v2/xm-keyboard-v2.js";
if (!Math) {
  _easycom_xm_keyboard_v2();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o((...args) => $options.decreasePerson && $options.decreasePerson(...args), "bd"),
    b: common_vendor.o([common_vendor.m(($event) => $data.formData.personCount = $event.detail.value, {
      number: true
    }), (...args) => $options.onPersonCountInput && $options.onPersonCountInput(...args)], "f5"),
    c: $data.formData.personCount,
    d: common_vendor.o((...args) => $options.increasePerson && $options.increasePerson(...args), "b6"),
    e: $data.formData.name,
    f: common_vendor.o(($event) => $data.formData.name = $event.detail.value, "38"),
    g: $data.formData.phone,
    h: common_vendor.o(($event) => $data.formData.phone = $event.detail.value, "a7"),
    i: $data.formData.idCard,
    j: common_vendor.o(($event) => $data.formData.idCard = $event.detail.value, "1e"),
    k: common_vendor.t($data.formData.bookingDate || "请选择预约日期"),
    l: $data.minDate,
    m: $data.maxDate,
    n: common_vendor.o((...args) => $options.onDateChange && $options.onDateChange(...args), "3d"),
    o: $data.formData.timeSlot === "morning"
  }, $data.formData.timeSlot === "morning" ? {} : {}, {
    p: $data.formData.timeSlot === "morning" ? 1 : "",
    q: common_vendor.o(($event) => $options.onTimePeriodChange("morning"), "73"),
    r: $data.formData.timeSlot === "afternoon"
  }, $data.formData.timeSlot === "afternoon" ? {} : {}, {
    s: $data.formData.timeSlot === "afternoon" ? 1 : "",
    t: common_vendor.o(($event) => $options.onTimePeriodChange("afternoon"), "c8"),
    v: common_vendor.f($data.travelModeList, (item, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(item.icon),
        b: common_vendor.t(item.label),
        c: $data.formData.travelMode === item.value
      }, $data.formData.travelMode === item.value ? {} : {}, {
        d: $data.formData.travelMode === item.value ? 1 : "",
        e: item.value,
        f: common_vendor.o(($event) => $options.onTravelTypeChange(item.value), item.value)
      });
    }),
    w: $data.formData.travelMode === "selfDriving"
  }, $data.formData.travelMode === "selfDriving" ? {
    x: common_vendor.t($options.getVehicleTypeLabel() || "请选择车辆类型"),
    y: $data.vehicleTypes,
    z: common_vendor.o((...args) => $options.onVehicleTypeChange && $options.onVehicleTypeChange(...args), "5c"),
    A: common_vendor.t($data.formData.licensePlate ? $options.formatPlate($data.formData.licensePlate) : "请选择/输入车牌号"),
    B: common_vendor.n($data.formData.licensePlate ? "plate-value--filled" : "plate-value--placeholder"),
    C: common_vendor.o((...args) => $options.showPlateKeyboard && $options.showPlateKeyboard(...args), "aa"),
    D: common_vendor.sr("plateKeyboard", "802e1f99-0"),
    E: common_vendor.o($options.onPlateConfirm, "b2"),
    F: common_vendor.p({
      title: "请输入车牌号",
      type: "plate",
      max: 8,
      cursor: true
    })
  } : {}, {
    G: $data.formData.travelMode === "tourGroup"
  }, $data.formData.travelMode === "tourGroup" ? {
    H: $data.formData.tourGroupName,
    I: common_vendor.o(($event) => $data.formData.tourGroupName = $event.detail.value, "08"),
    J: $data.formData.tourNumber,
    K: common_vendor.o(($event) => $data.formData.tourNumber = $event.detail.value, "f3")
  } : {}, {
    L: $data.formData.remarks,
    M: common_vendor.o(($event) => $data.formData.remarks = $event.detail.value, "fb"),
    N: common_vendor.t($data.formData.remarks.length),
    O: !$data.formData.bookingId
  }, !$data.formData.bookingId ? {
    P: common_vendor.o((...args) => $options.handleSubmit && $options.handleSubmit(...args), "95")
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-802e1f99"]]);
_sfc_main.__runtimeHooks = 2;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/booking-form/booking-form.js.map
