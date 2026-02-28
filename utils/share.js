/**
 * 微信小程序分享配置工具
 *
 * 使用方法：
 * 1. 在页面的 onLoad 或 onShow 中调用 setShareConfig()
 * 2. 微信会自动在右上角胶囊菜单中显示"转发"按钮
 */

/**
 * 设置页面分享配置
 * @param {Object} options - 分享配置
 * @param {String} options.title - 分享标题
 * @param {String} options.path - 分享路径
 * @param {String} options.imageUrl - 分享图片
 */
export function setShareConfig(options = {}) {
	return {
		title: options.title || '景区预约 - 轻松预约，畅游无忧',
		path: options.path || '/pages/index/index',
		imageUrl: options.imageUrl || '' // 可以设置分享图片
	}
}

/**
 * 分享到朋友圈配置（仅支持企业版小程序）
 * @param {Object} options - 分享配置
 */
export function setShareTimelineConfig(options = {}) {
	return {
		title: options.title || '景区预约 - 轻松预约，畅游无忧',
		query: options.query || '',
		imageUrl: options.imageUrl || ''
	}
}
