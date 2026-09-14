import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ─────────────────────────────────────────────────────────────────────────────
// 模板引用的名字，在 <script> 里到底有没有声明
//
// ── 为什么需要这个 ──────────────────────────────────────────────────────────
// 2026-09-15：`booking-detail.vue` 的模板写了 `v-if="refundEntry && refundEntry.visible"`
// 来决定退款按钮，但 `refundEntry` 只存在于 `formData` 下（`formData: { refundEntry: null }），
// 没有同名 computed。Vue 2 里 `this.refundEntry` 恒为 `undefined`：
//
//   · 按钮**永远不渲染** —— 整个「已过期 → 申请退款 → 后台审核」入口在小程序端是死的
//   · 而且**不报任何错**：模板只是把表达式求值成 undefined，不抛异常、不 warn
//     （Vue 2 只对「渲染时读取了未定义的属性」告警，`undefined && x` 连告警都没有）
//
// 更隐蔽的是它还改了文案：`v-else-if="refundEntry && !refundEntry.visible"` 同样恒假，
// 于是「不可申请」（超期 / 次数用尽）那个分支也永远进不去，用户一律看到
// 「该预约未核销，可申请退款」然后找不到按钮。**看起来像没做，其实是读错了变量。**
//
// 这类 bug 编译期、运行期、后端测试全都拦不住，所以在这里静态扫一遍。
//
// ── 难点全在「顶层」两个字 ──────────────────────────────────────────────────
// 第一版用正则扫 `name:`，结果把 data 返回对象里的**嵌套键**
// （`formData: { refundEntry: null }`）也算成已声明——它抓不到它要抓的那个 bug，
// 给的是虚假的安心。所以这里老老实实做括号配对，只取
// data() 返回对象 / computed / methods / props / watch / filters 各自**深度 1** 的键。
// 下面两个「自检」用例就是钉死这一点的：把 computed 摘掉必须报出来。
//
// ── 已知会漏（都不在项目代码里出现过，出现了再补）────────────────────────────
// v-for 解构、slot-scope、mixin / 全局注入的成员、`<script setup>`。
// 漏报的后果是「本该报警却没报」，不会误伤正常代码；误报的后果才是挡住提交。
// ─────────────────────────────────────────────────────────────────────────────

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** 只扫项目自己的代码。uni_modules/ 是第三方插件，不按本仓的规范走 */
const SCAN_DIRS = ['pages', 'components'];
const SKIP_DIRS = new Set(['unpackage', 'node_modules', 'uni_modules']);

/** JS 字面量与全局对象，不是组件成员 */
const IGNORE = new Set([
	'true', 'false', 'null', 'undefined', 'NaN', 'Infinity',
	'in', 'of', 'typeof', 'instanceof', 'new', 'return', 'void', 'delete',
	'Math', 'Date', 'JSON', 'String', 'Number', 'Boolean', 'Array', 'Object',
	'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'RegExp', 'Error', 'Promise',
	'$event', '$refs', '$slots', '$attrs', '$index', '$root', '$parent', '$emit',
]);

/** 从 openIdx（`{` 或 `[`）开始配对，返回里面的内容；跳过字符串与注释 */
function sliceBlock(src, openIdx) {
	const open = src[openIdx];
	const close = open === '{' ? '}' : ']';
	let depth = 0;
	for (let i = openIdx; i < src.length; i++) {
		const c = src[i];
		if (c === "'" || c === '"' || c === '`') {
			const q = c;
			i++;
			while (i < src.length && src[i] !== q) {
				if (src[i] === '\\') i++;
				i++;
			}
			continue;
		}
		if (c === '/' && src[i + 1] === '/') {
			while (i < src.length && src[i] !== '\n') i++;
			continue;
		}
		if (c === '/' && src[i + 1] === '*') {
			i += 2;
			while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++;
			i++;
			continue;
		}
		if (c === open) depth++;
		else if (c === close) {
			depth--;
			if (depth === 0) return src.slice(openIdx + 1, i);
		}
	}
	return '';
}

/** 对象字面量里「深度 1」的键名 */
function topKeys(objSrc) {
	const keys = new Set();
	let depth = 0;
	for (let i = 0; i < objSrc.length; i++) {
		const c = objSrc[i];
		if (c === "'" || c === '"' || c === '`') {
			const q = c;
			i++;
			while (i < objSrc.length && objSrc[i] !== q) {
				if (objSrc[i] === '\\') i++;
				i++;
			}
			continue;
		}
		if (c === '/' && objSrc[i + 1] === '/') {
			while (i < objSrc.length && objSrc[i] !== '\n') i++;
			continue;
		}
		if (c === '{' || c === '[' || c === '(') { depth++; continue; }
		if (c === '}' || c === ']' || c === ')') { depth--; continue; }
		if (depth !== 0) continue;
		// 深度 0 处，标识符后跟 `:`（键值）/ `(`（方法）/ `,`（简写）即为一个键。
		// 末尾的 -1：让循环的 i++ 正好落在标识符后面那个字符上（`(` 或 `:`）。
		// 少了它，`(` 会被跳过，后面配对的 `)` 就把 depth 减成 -1，
		// 函数体全被当成深度 0 —— 扫描器会"通过"，因为它什么都没在扫。
		const m = /^([A-Za-z_$][\w$]*)\s*(?=[:(,])/.exec(objSrc.slice(i));
		if (m) {
			keys.add(m[1]);
			i += m[1].length - 1;
		}
	}
	return keys;
}

/** <script> 里**顶层**声明了哪些名字 */
function declaredNames(script) {
	const names = new Set();

	// data() { return { ... } } → 只取 return 那个对象深度 1 的键。
	// 这一步是全部意义所在：嵌套在 formData 下的 refundEntry 不能算已声明。
	const dataM = /(?:^|\s)data\s*\(\s*\)\s*\{\s*return\s*/m.exec(script);
	if (dataM) {
		const braceIdx = script.indexOf('{', dataM.index + dataM[0].length - 1);
		if (braceIdx >= 0) for (const k of topKeys(sliceBlock(script, braceIdx))) names.add(k);
	}

	// 组件选项对象。computed / methods 是重点，其余几个一并收进来避免误报
	for (const opt of ['computed', 'methods', 'props', 'watch', 'filters']) {
		for (const m of script.matchAll(new RegExp(`(?:^|[\\s{,])${opt}\\s*:\\s*\\{`, 'g'))) {
			const braceIdx = script.indexOf('{', m.index + m[0].length - 1);
			if (braceIdx >= 0) for (const k of topKeys(sliceBlock(script, braceIdx))) names.add(k);
		}
	}

	for (const m of script.matchAll(/^\s*(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)/gm)) names.add(m[1]);
	for (const m of script.matchAll(/import\s+([\s\S]+?)\s+from\s+['"]/g)) {
		for (const n of m[1].replace(/[{}*]/g, ' ').split(/[\s,]+/)) {
			if (n) names.add(n);
		}
	}
	return names;
}

function splitSFC(src) {
	const t = src.indexOf('<template>');
	const tEnd = src.lastIndexOf('</template>');
	const s = src.indexOf('<script');
	const sEnd = src.lastIndexOf('</script>');
	return {
		template: t >= 0 && tEnd > t ? src.slice(t + 10, tEnd) : '',
		script: s >= 0 && sEnd > s ? src.slice(src.indexOf('>', s) + 1, sEnd) : '',
	};
}

/** 模板里所有会求值的表达式 → 裸标识符（`a.b` 里的 b 不算，它是属性） */
function bareRefs(template) {
	// v-for 引入的局部别名不是组件成员
	const locals = new Set();
	for (const m of template.matchAll(/v-for\s*=\s*"\(?([^)"]*)\)?\s+(?:in|of)\s/g)) {
		for (const part of m[1].split(',')) {
			const name = part.trim();
			if (name) locals.add(name);
		}
	}

	const exprs = [];
	for (const m of template.matchAll(/\{\{([\s\S]*?)\}\}/g)) exprs.push(m[1]);
	for (const m of template.matchAll(/\s(?:v-if|v-else-if|v-show|v-model(?::[\w-]+)?)\s*=\s*"([^"]*)"/g)) exprs.push(m[1]);
	for (const m of template.matchAll(/\s(?::|v-bind:)[\w-]+\s*=\s*"([^"]*)"/g)) exprs.push(m[1]);
	for (const m of template.matchAll(/\s(?:@|v-on:)[\w.-]+\s*=\s*"([^"]*)"/g)) exprs.push(m[1]);

	const refs = new Map();
	for (const expr of exprs) {
		// 先抹掉字符串字面量，免得 'abc' 里的词被当成标识符
		const cleaned = expr.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""');
		for (const m of cleaned.matchAll(/(^|[^.\w$])([A-Za-z_$][\w$]*)/g)) {
			const name = m[2];
			if (IGNORE.has(name) || locals.has(name)) continue;
			// `{ key: ... }` 的对象键不是引用。三元 `a ? b : c` 的 b 后面是空格，不会误伤
			if (/^:/.test(cleaned.slice(m.index + m[0].length))) continue;
			if (!refs.has(name)) refs.set(name, expr.trim().replace(/\s+/g, ' ').slice(0, 70));
		}
	}
	return refs;
}

/** 返回 [名字, 出处] 列表；空数组表示模板引用的名字都有声明 */
function findUndefinedRefs(sfcSource) {
	const { template, script } = splitSFC(sfcSource);
	if (!template || !script) return [];
	const declared = declaredNames(script);
	return [...bareRefs(template)].filter(([name]) => !declared.has(name));
}

function walkVue(dir, out = []) {
	let entries;
	try {
		entries = fs.readdirSync(dir, { withFileTypes: true });
	} catch {
		return out; // 目录不存在（比如 components/ 被删空）不算失败
	}
	for (const e of entries) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) {
			if (SKIP_DIRS.has(e.name)) continue;
			walkVue(p, out);
		} else if (e.name.endsWith('.vue')) {
			out.push(p);
		}
	}
	return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// 自检：扫描器必须先证明自己抓得到
//
// 这两个用例是本次新增的全部理由。少了它们，扫描器哪怕退化成"永远返回空数组"
// 也照样绿 —— 上面两个函数各有一个能让它静默失效的坑（嵌套键、括号深度 off-by-one），
// 我在写的时候两个都踩了。
// ─────────────────────────────────────────────────────────────────────────────

/** 和出错那版 structure 一致：refundEntry 只挂在 formData 下，没有同名 computed */
const BROKEN_SFC = `
<template>
	<view class="status-hero" v-if="formData.status === 'expired'">
		<template v-else-if="refundEntry && !refundEntry.visible">不可申请</template>
		<template v-else>该预约未核销，可申请退款</template>
	</view>
	<view class="refund-action" v-if="formData.status === 'expired' && refundEntry && refundEntry.visible">
		<view @tap="openRefundModal">申请退款</view>
	</view>
</template>
<script>
export default {
	data() {
		return {
			formData: {
				status: '',
				refundEntry: null
			},
			refundModalVisible: false
		};
	},
	computed: {
		latestApply() {
			return (this.formData.refundEntry && this.formData.refundEntry.latestApply) || null;
		}
	},
	methods: {
		openRefundModal() {}
	}
};
</script>
`;

test('自检：模板裸用了只存在于 formData 下的 refundEntry —— 必须报出来', () => {
	const found = findUndefinedRefs(BROKEN_SFC).map(([name]) => name);
	assert.deepEqual(found, ['refundEntry'],
		'data() 返回对象里的**嵌套**键不算顶层声明。报不出来说明这个扫描器在空转');
});

test('自检：补上同名 computed 之后必须为绿', () => {
	// 与 2026-09-15 的修复一致：加一层 computed 把 formData 下的字段架到顶层
	const fixed = BROKEN_SFC.replace(
		'computed: {',
		'computed: {\n\t\trefundEntry() { return this.formData.refundEntry || null; },',
	);
	assert.deepEqual(findUndefinedRefs(fixed), []);
});

// ─────────────────────────────────────────────────────────────────────────────
// 真扫：项目自己的 pages/ 与 components/
// ─────────────────────────────────────────────────────────────────────────────

test('pages/ 与 components/ 里没有引用了未声明标识符的模板', () => {
	const files = SCAN_DIRS.flatMap((d) => walkVue(path.join(HERE, '..', d)));
	assert.ok(files.length > 0, '一个 .vue 都没扫到，说明路径写错了——这本身就是失败');

	const broken = [];
	for (const file of files) {
		for (const [name, where] of findUndefinedRefs(fs.readFileSync(file, 'utf8'))) {
			broken.push(`${path.relative(path.join(HERE, '..'), file)}: ${name}  ←  ${where}`);
		}
	}

	assert.deepEqual(broken, [],
		'模板引用了 <script> 里没有声明的名字。Vue 2 会把它求值成 undefined 而不报错，'
		+ '表现为「条件恒假 / 文案照常显示但按钮不出现」。\n'
		+ '若是 mixin 或全局注入的成员导致的误报，在 IGNORE / declaredNames 里补白名单。\n'
		+ broken.join('\n'));
});
