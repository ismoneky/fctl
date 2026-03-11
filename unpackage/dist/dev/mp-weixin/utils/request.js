"use strict";const d=require("../common/vendor.js"),r=t=>{const u="http://localhost:3000";return new Promise((s,a)=>{d.index.request({url:u+t.url,method:t.method||"GET",data:t.data||{},header:t.header||{},timeout:t.timeout||6e4,success:e=>{e.statusCode>=200&&e.statusCode<300?s(e.data):a(e)},fail:e=>{a(e)}})})};exports.request=r;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/request.js.map
