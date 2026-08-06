// 预约白名单判断
// 规则：后台管理员（isAdmin=true）视为白名单用户，不受「关闭预约」开关限制
// 可正常进入预约页并下单（后端 createBooking 也会跳过关闭校验作为双保险）
export function isWhitelistedUser() {
	return uni.getStorageSync('isAdmin') === true;
}
