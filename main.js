import App from './App'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
export function createApp() {
  const app = createSSRApp(App)
  return {
    app
  }
}
// #endif

	// "tabBar": {
	// 	"color": "#7A7E83",
	// 	"selectedColor": "#667eea",
	// 	"borderStyle": "white",
	// 	"backgroundColor": "#ffffff",
	// 	"fontSize": "16px",
	// 	"height": "50px",
	// 	"iconfontSrc": "static/iconfont.ttf",
	// 	"list": [
	// 		{
	// 			"pagePath": "pages/index/index",
	// 			"text": "首页",
	// 			"iconfont": {
	// 				"text": "\ue600",
	// 				"selectedText": "\ue600",
	// 				"color": "#7A7E83",
	// 				"selectedColor": "#667eea"
	// 			}
	// 		},
	// 		{
	// 			"pagePath": "pages/booking/booking",
	// 			"text": "预约",
	// 			"iconfont": {
	// 				"text": "\ue62a",
	// 				"selectedText": "\ue62a",
	// 				"color": "#7A7E83",
	// 				"selectedColor": "#667eea"
	// 			}
	// 		},
	// 		{
	// 			"pagePath": "pages/profile/profile",
	// 			"text": "我的",
	// 			"iconfont": {
	// 				"text": "\ue601",
	// 				"selectedText": "\ue601",
	// 				"color": "#7A7E83",
	// 				"selectedColor": "#667eea"
	// 			}
	// 		}
	// 	]
	// },