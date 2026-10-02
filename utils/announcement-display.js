/**
 * 将后台公告正文整理为页面可直接逐段展示的文本。
 * 空行不会占据版面，段落内部的连续空白收拢为一个空格。
 *
 * @param {unknown} content
 * @returns {string[]}
 */
export function splitAnnouncementParagraphs(content) {
	return String(content == null ? '' : content)
		.split(/\r?\n/)
		.map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
		.filter(Boolean);
}

/**
 * 估算公告在首页正文宽度下占用的行数，并判断是否需要三行预览。
 * 中文与全角符号按一个字宽计算，ASCII 按约半个字宽计算；后台换行始终另起一行。
 * 这只决定是否展示展开入口，正文是否真正裁切仍由 CSS line-clamp 负责。
 *
 * @param {unknown} content
 * @returns {boolean}
 */
export function shouldCollapseAnnouncement(content) {
	const paragraphs = splitAnnouncementParagraphs(content);
	const estimatedLines = paragraphs.reduce((total, paragraph) => {
		const width = Array.from(paragraph).reduce((sum, char) => {
			if (/\s/.test(char)) return sum + 0.25;
			if (/[\u2E80-\u9FFF\uF900-\uFAFF\uFF01-\uFF60]/.test(char)) return sum + 1;
			return sum + 0.55;
		}, 0);
		return total + Math.max(1, Math.ceil(width / 22));
	}, 0);
	return estimatedLines > 3;
}
