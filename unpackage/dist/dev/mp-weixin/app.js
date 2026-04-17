"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/booking/booking.js";
  "./pages/profile/profile.js";
  "./pages/booking-form/booking-form.js";
  "./pages/booking-detail/booking-detail.js";
  "./pages/gallery/gallery.js";
  "./pages/feedback/feedback.js";
}
const _sfc_main = {
  onLaunch: function() {
    common_vendor.index.__f__("log", "at App.vue:4", "App Launch");
  },
  onShow: function() {
  },
  onHide: function() {
    common_vendor.index.__f__("log", "at App.vue:9", "App Hide");
  }
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
