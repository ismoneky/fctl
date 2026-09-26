<script>
import { request } from './utils/request.js';

// 重新登录的节流窗口：用户频繁切换前后台时不必反复打登录接口
const LOGIN_THROTTLE_MS = 5 * 60 * 1000;

// 上次登录时刻。用模块级变量而不是 data：这个值不需要响应式，而且小程序被销毁后
// 重新求值天然归零 —— 冷启动必然登录一次，正是我们要的。
let lastLoginAt = 0;

	export default {
		onLaunch: function() {
			this.checkPrivacyAuth();
		},
		// 冷启动（onLaunch 之后必然触发一次 onShow）与从后台恢复都会走到这里
		onShow: function() {
			this.refreshLogin();
		},
		onHide: function() {
		},
		methods: {
			/**
			 * 刷新登录态。
			 *
			 * 为什么要挂在 App 的 onShow 上：从后台恢复到某个页面时，页面栈是保留的，
			 * 页面的 onLoad 不会重跑。而"写 token"此前只发生在首页 onLoad（`uni.login`
			 * 的无条件调用）——用户停在预约页时从后台切回来，首页的 onLoad / onShow 都
			 * 不会执行，token 就在没人察觉的情况下一直用旧的，直到某个请求撞上 401。
			 * 预约页底部结算栏曾因此把后端原文「token 无效或已过期」当成金额显示。
			 *
			 * 放 App 而不是页面 onShow：页面 onShow 只在当前页触发，覆盖不到"恢复到的
			 * 不是那个页面"的情况。
			 *
			 * 节流 5 分钟：切换前后台是高频动作，不该每次都打一次登录接口。
			 * 重新登录无副作用：后端 findOrCreateUser 按 openid 找用户（不会重复建号），
			 * 旧 token 也不会失效（JWT 无状态，服务端不做吊销）。
			 */
			refreshLogin() {
				if (Date.now() - lastLoginAt < LOGIN_THROTTLE_MS) return;
				lastLoginAt = Date.now();
				uni.login({
					provider: 'weixin',
					success: async (loginRes) => {
						try {
							console.log('微信登录成功，code:', loginRes.code);
							const res = await request({
								url: '/users/wx-login', // 后端登录接口
								method: 'POST',
								data: {
									code: loginRes.code,
								},
							});
							// 适配后端返回格式
							if (res.success && res.data) {
								uni.setStorageSync('token', res.data.token);
								uni.setStorageSync('isAdmin', res.data.admin === true);
							} else {
								uni.showToast({
									title: '微信登录失败',
									icon: 'none',
								});
							}
						} catch (err) {
							uni.showToast({
								title: '微信登录异常',
								icon: 'none',
							});
						}
					},
					fail: (err) => {
						uni.showToast({
							title: '微信授权失败',
							icon: 'none',
						});
						console.log('微信登录失败:', err);
					},
				});
			},
			checkPrivacyAuth() {
				// 微信隐私授权 API，基础库 2.33.0+
				// 需在微信公众平台后台"账号设置-基础设置-服务内容声明"中
				// 配置《用户隐私保护指引》后，此处才会触发弹窗
				if (typeof wx === 'undefined' || !wx.getPrivacySetting) return;

				wx.getPrivacySetting({
					success: (res) => {
						if (res.needAuthorization) {
							wx.onNeedPrivacyAuthorization((resolve) => {
								uni.showModal({
									title: '隐私保护提示',
									content: '在您使用本小程序前，请阅读《隐私政策》和《用户服务协议》。我们将依据相关法规收集您的姓名、手机号、身份证号等信息，仅用于景区实名制预约及入园核验，不会用于其他用途。',
									confirmText: '同意',
									cancelText: '不同意',
									success: (modalRes) => {
										if (modalRes.confirm) {
											resolve({ buttonId: 'agree-btn', event: 'agree' });
										} else {
											resolve({ buttonId: 'disagree-btn', event: 'disagree' });
											uni.showToast({
												title: '需同意隐私政策才能使用预约功能',
												icon: 'none',
												duration: 2500
											});
										}
									}
								});
							});
						}
					}
				});
			}
		}
	}
</script>

<style>
	/*每个页面公共css */
@import '/static/iconfont.css';
page, view, text, image, button, input, textarea {
	box-sizing: border-box;
	margin: 0;
	padding: 0;
	font-family: "PingFang SC", "苹方", "Helvetica Neue", Arial, sans-serif;
}
</style>
