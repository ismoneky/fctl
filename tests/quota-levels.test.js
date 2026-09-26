import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 今日名额四档的消费点自检。
 *
 * 为什么用源码文本断言而不是跑组件：本仓没有 package.json / 测试渲染器，
 * 既有的 .vue 断言（icon-system / template-refs）也都是文本级扫描。
 *
 * 为什么值得单独锁：`capacity.level` 的两个消费点【都是静默失败】——
 *   · todayQuotaItems 里没写的档位 → 不 push 任何 item → 整行不渲染，无报错；
 *   · pollTodayQuota 的白名单里没写的档位 → 丢掉 remaining → 模板渲染出
 *     「今日剩余 undefined 个名额」。
 * 后端加档位时漏改任何一处，用户侧都只是「东西不见了」或「出现残句」，
 * 开发环境看不出任何异常。
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FORM_PATH = path.join(ROOT, 'pages/booking-form/booking-form.vue');

/** 后端 dto/today-quota.dto.ts 声明过的全部档位，加档时这里必须同步 */
const LEVELS = ['plenty', 'ample', 'limited', 'full'];

/** 带 remaining 的档位：模板会把这几个字面量取出来拼进文案 */
const LEVELS_WITH_REMAINING = ['ample', 'limited'];

const readForm = () => fs.readFileSync(FORM_PATH, 'utf8');

/** 取一个方法的源码体（从 `name(` 起，按花括号配平到闭合） */
const methodBody = (source, name) => {
  const start = source.indexOf(`\t\t${name}(`);
  assert.ok(start >= 0, `${name} 必须存在且为 depth-1 方法`);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  throw new Error(`${name} 的花括号没有配平`);
};

test('名额四档在模板侧都有对应文案，不存在静默漏渲染的档位', () => {
  const source = readForm();
  const body = methodBody(source, 'todayQuotaItems');

  for (const level of LEVELS) {
    // plenty 是刻意的「不显示」，没有分支可加，但必须在方法上方被点名说明
    // ——「文档里没提」和「漏写」是同一个后果，不能靠沉默表达意图
    if (level === 'plenty') {
      assert.match(source, /plenty\s+充裕/, 'plenty 必须被显式说明为「不渲染」，不能是漏写');
      continue;
    }
    assert.match(body, new RegExp(`c\\.level === '${level}'`), `todayQuotaItems 缺少 ${level} 分支`);
  }
});

test('带 remaining 的档位在轮询归一化里都被保留，不会有档位丢掉数字', () => {
  const body = methodBody(readForm(), 'pollTodayQuota');

  for (const level of LEVELS_WITH_REMAINING) {
    assert.match(
      body,
      new RegExp(`d\\.capacity\\.level === '${level}'`),
      `pollTodayQuota 对 ${level} 不保留 remaining → 模板会渲染出「今日剩余 undefined 个名额」`,
    );
  }

  // 刻意不下发数字的档位不应该被误加进去（加了就会把 undefined 当数字渲染）
  assert.doesNotMatch(body, /d\.capacity\.level === 'plenty'/);
  assert.doesNotMatch(body, /d\.capacity\.level === 'full'/);
});

test('紧张档与宽裕档的措辞/配色必须分开，宽裕不能复用告急样式', () => {
  const source = readForm();
  const body = methodBody(source, 'todayQuotaItems');

  assert.match(body, /'alert', text: `今日仅剩 \$\{c\.remaining\} 个名额`/, 'limited 应为红色「仅剩」');
  assert.match(body, /'info', text: `今日剩余 \$\{c\.remaining\} 个名额`/, 'ample 应为中性「今日剩余」');
  // 两者的字面量不能混用：ample 一旦用 alert，展示阈值调到 100% 后整页告急
  assert.doesNotMatch(body, /'alert', text: `今日剩余/, 'ample 不得使用 alert 配色');
  assert.doesNotMatch(body, /今日仅剩.*\n[\s\S]{0,80}'info'/, 'limited 不得退化为 info 配色');
});
