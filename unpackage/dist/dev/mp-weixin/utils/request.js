"use strict";
const common_vendor = require("../common/vendor.js");
const request = (options) => {
  const baseURL = "https://www.hbfctl.com.cn/";
  const header = options.header || {};
  header.Authorization = `Bearer ${common_vendor.index.getStorageSync("token")}`;
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: baseURL + "api/" + options.url,
      // 请求地址
      method: options.method || "GET",
      // 请求方法，默认为 GET
      data: options.data || {},
      // 请求数据
      header,
      // 请求头
      timeout: options.timeout || 6e4,
      // 超时时间，默认 60 秒
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(res);
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};
exports.request = request;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/request.js.map
