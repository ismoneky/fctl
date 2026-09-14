/**
 * 景区导航地点配置（首页导航条 / 订单详情「导航前往」共用）
 *
 * 有多个地点，故点击导航不能直接跳转 —— 先由 location-picker-popup 弹出选择，
 * 选中后才调 openScenicLocation 打开微信内置地图。
 *
 * ⚠️ 坐标必须为 GCJ-02（腾讯/高德），切勿使用 GPS（WGS-84）或百度地图（BD-09）坐标，会偏移数百米。
 * 获取方式：打开腾讯位置服务坐标拾取器 https://lbs.qq.com/getPoint/
 * 搜索或点选目标位置，复制「纬度,经度」填入下方（顺序为 latitude 在前、longitude 在后）。
 */
export const SCENIC_LOCATIONS = [
	{
		name: '风车天路·鲍庄出入口',
		address: '鹤壁风车天路游客服务中心(鲍庄入口)',
		latitude: 35.77794175,
		longitude: 114.14446553,
		scale: 15
	},
	{
		name: '淇林岩十八盘',
		// 该地点没有单独的地址，就与名称一致（地图页会显示成上下两行同样的字，是有意的，勿当重复删掉）
		address: '淇林岩十八盘',
		latitude: 35.745443,
		longitude: 114.043167,
		scale: 15
	}
];

/**
 * 打开微信内置地图（支持导航）
 * @param {Object} location SCENIC_LOCATIONS 中的一项
 */
export function openScenicLocation(location) {
	const params = {
		latitude: location.latitude,
		longitude: location.longitude,
		name: location.name,
		scale: location.scale || 15
	};
	// address 可选：传空串会让地图页出现一行空白地址，故缺省时整个字段不传
	if (location.address) {
		params.address = location.address;
	}
	uni.openLocation(params);
}
