"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const _sfc_main = {
  data() {
    return {
      form: {
        content: "",
        phone: ""
      }
    };
  },
  methods: {
    submitFeedback() {
      const content = this.form.content.trim();
      const phone = this.form.phone.trim();
      if (!content) {
        common_vendor.index.showToast({ title: "请填写反馈内容", icon: "none" });
        return;
      }
      if (!phone) {
        common_vendor.index.showToast({ title: "请填写手机号", icon: "none" });
        return;
      }
      if (!/^1\d{10}$/.test(phone)) {
        common_vendor.index.showToast({ title: "请输入正确的手机号", icon: "none" });
        return;
      }
      common_vendor.index.showLoading({ title: "提交中..." });
      utils_request.request({
        method: "POST",
        url: "feedbacks",
        data: { content, phone }
      }).then(() => {
        common_vendor.index.showToast({ title: "反馈已提交，感谢您的建议！", icon: "none", duration: 2500 });
        setTimeout(() => common_vendor.index.navigateBack(), 1500);
      }).catch(() => {
        common_vendor.index.showToast({ title: "提交失败，请稍后重试", icon: "none" });
      }).finally(() => {
        common_vendor.index.hideLoading();
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.form.content,
    b: common_vendor.o(($event) => $data.form.content = $event.detail.value, "4a"),
    c: common_vendor.t($data.form.content.length),
    d: $data.form.phone,
    e: common_vendor.o(($event) => $data.form.phone = $event.detail.value, "ff"),
    f: common_vendor.o((...args) => $options.submitFeedback && $options.submitFeedback(...args), "6d")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-a24b82f2"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/feedback/feedback.js.map
