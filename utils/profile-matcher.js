/**
 * 常用人员姓名匹配（纯函数）
 *
 * 规则（严格按设计文档 1.2）：
 * - 只比较 String(name).trim()，完全相等才匹配；不做模糊匹配。
 * - 不比较手机号、身份证号。
 * - 无效 profile 项（无 name 或无 profileId）忽略，不参与匹配。
 * - 仅依据传入的 profileList 本地匹配，不发起任何后端请求。
 */

/**
 * 在常用人员列表中按完整姓名做精确匹配
 * @param {Array<{name?:string, phone?:string, idCard?:string, profileId?:string|number}>} profiles - 常用人员列表
 * @param {string} name - 出行人姓名（原始输入，可能含首尾空格）
 * @returns {Array<object>} 匹配到的常用人员数组（保持原顺序）；无匹配返回空数组
 */
export function findExactProfileMatches(profiles, name) {
	if (!Array.isArray(profiles)) return [];
	const target = String(name == null ? '' : name).trim();
	if (!target) return [];
	return profiles.filter((item) => {
		if (!item || item.name == null) return false;
		return String(item.name).trim() === target;
	});
}
