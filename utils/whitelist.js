// 预约白名单判断
// 规则：后台管理员（isAdmin=true）不受「关闭预约」开关限制，可正常进入预约页并下单
// C 端在首页登录后存 isAdmin（后台审核通过的管理员），提交订单时随 body 传给后端
// 后端 createBooking 收到 isAdmin=true 即跳过「预约开关」关闭校验
export function isWhitelistedUser() {
	return uni.getStorageSync('isAdmin') === true;
}
