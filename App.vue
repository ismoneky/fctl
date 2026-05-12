<script>
	export default {
		onLaunch: function() {
			this.checkPrivacyAuth();
		},
		onShow: function() {
		},
		onHide: function() {
		},
		methods: {
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
