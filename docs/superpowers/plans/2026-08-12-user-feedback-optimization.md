# 小程序用户反馈优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成小程序字体与录入体验优化，并为管理后台增加按预约游玩日期统计的经营看板；明确排除尚未确定收费规则的儿童/老人免证件预约。

**Architecture:** 工作区由三个独立 Git 仓库组成：`fctl` 是 uni-app 小程序，`nest` 是 NestJS + TypeORM + SQLite 后端，`admin` 是 React + Ant Design 管理后台。小程序优化尽量复用现有常用人员和车牌键盘，不改变预约、支付和后端身份证校验规则；经营统计由后端提供单一聚合接口，后台只负责筛选和展示。

**Tech Stack:** uni-app/Vue、NestJS 10、TypeORM、SQLite、React 19、TypeScript、Ant Design 6、dayjs。

## Global Constraints

- 需求 4“儿童/老人免填身份证”本期不实现，不新增人员类型、不修改数据库字段、不改变计费。
- 后端现有身份证校验规则本期不修改；需求 9 仅优化小程序输入和提示。
- 统计看板所有日期筛选均以 `booking.bookingDate`（预约游玩日期）为准，不以 `createdAt`、`paidAt` 为准。
- 统计金额单位在接口中保持“分”，仅在管理后台显示时转换为“元”。
- 不记录、不打印、不上报姓名、手机号、身份证号等敏感数据。
- 常用人员匹配只在当前登录微信账号的 `GET /users/profiles` 返回结果内进行，不跨用户搜索。
- 姓名匹配提示不得自动覆盖用户已手动填写的手机号或身份证号。
- 修改本地 `xm-keyboard` 插件后必须加“项目定制”注释，防止插件升级时定制丢失。
- 三个目录是独立 Git 仓库；提交时分别在 `fctl`、`nest`、`admin` 中提交，不能在 `/Users/lufy/Desktop/ff` 根目录执行统一提交。

---

## 1. 已确认需求与范围

### 1.1 字体整体放大（反馈 2、12）

小程序所有页面的主要文字整体放大，不只修改订单详情页。订单详情中的“预约人数”必须比其他字段更醒目。

目标字号层级：

| 类型 | 目标字号 | 说明 |
| --- | ---: | --- |
| 极小辅助文字 | 最低 `24rpx` | 标签角标、协议辅助信息、订单号等；不得再出现 `20rpx`、`22rpx` |
| 次要说明文字 | `26rpx` | 提示、副标题、遮罩后的证件号 |
| 普通正文/字段标签 | `28rpx`–`30rpx` | 姓名、电话、身份证、表单标签、列表正文 |
| 区块标题/按钮 | `32rpx`–`36rpx` | 卡片标题、主要按钮、弹窗标题 |
| 订单详情预约人数 | 数字 `48rpx`，单位 `32rpx` | 数字加粗、主题色；独立于普通详情值 |

字体放大不得导致：

- 身份证号超出卡片；允许合理换行或缩小字段左右固定宽度，但不能回退到小字号。
- 底部提交栏、隐私协议或按钮互相覆盖。
- 小屏设备出现横向滚动。
- 二维码尺寸、倒计时主数字、图标尺寸被机械放大。

需要检查的文件：

- `fctl/pages/index/index.vue`
- `fctl/pages/booking-form/booking-form.vue`
- `fctl/pages/booking/booking.vue`
- `fctl/pages/booking-detail/booking-detail.vue`
- `fctl/pages/profile/profile.vue`
- `fctl/pages/profiles/profiles.vue`
- `fctl/pages/feedback/feedback.vue`
- `fctl/pages/privacy/privacy.vue`
- `fctl/pages/service/service.vue`
- `fctl/pages/gallery/gallery.vue`
- `fctl/components/my-tab-bar.vue`

### 1.2 输入姓名后提示填入常用人员（反馈 3）

后端已经在预约后自动保存每位出行人的姓名、手机号、身份证号为常用人员。本期不改自动保存逻辑，只优化预约表单的使用方式。

确认后的交互：

1. 预约页加载时继续调用 `GET /users/profiles`，一次性获取当前微信用户的常用人员。
2. 用户填写某位出行人的完整姓名并离开姓名输入框后，使用去除首尾空格后的姓名做“完全相等”匹配；不做模糊匹配，不在只输入一个字时提示。
3. 未匹配时不显示任何提示。
4. 只匹配到一人时，在姓名输入框下方显示弱提示卡片：`找到常用人员：张三 138****1234　点击填入`。
5. 用户点击卡片后才填入手机号和身份证号；不弹强制 Modal。
6. 如果手机号或身份证号已经有手动内容，不得覆盖；此时弱提示卡片不出现。
7. 匹配到多人时显示：`找到 N 位同名常用人员，点击选择`；点击后复用现有底部“选择常用人员”弹层，但列表只展示这些同名记录。
8. 现有“选择常用”按钮继续保留，点击后仍展示全部常用人员。
9. 填入成功后隐藏弱提示，并用不超过 1.5 秒的非阻塞 Toast 显示“已填入常用信息”。
10. 弱提示只展示掩码手机号；身份证号只在现有选择弹层中以掩码形式展示，绝不在弱提示中明文显示。

边界情况：

- 每位出行人独立匹配，第一位联系人的匹配结果不能影响第二位。
- 删除出行人、减少人数、切换订单或重新进入页面时清空旧匹配状态。
- 选择常用人员后继续执行现有 `fetchPreview()`。
- 姓名变化后立即清除该出行人上一轮匹配结果。
- 仅依据当前账号的 `profileList` 本地匹配，不增加按姓名查询后端接口。

### 1.3 后台经营统计看板（反馈 6）

新增独立菜单“经营统计”，页面路由为 `/dashboard`，并将后台登录后的默认首页从公告管理调整为经营统计。

日期快捷项：

- 今日：`startDate = today`，`endDate = today`
- 明日：`startDate = tomorrow`，`endDate = tomorrow`
- 最近 7 天：含今天在内向前 7 个自然日
- 本月：当月 1 日至当月最后一天
- 自定义：日期范围选择，起止日期均包含

所有统计都以预约游玩日期 `bookingDate` 为筛选条件。

#### 统计口径

为避免“待支付订单”和“已退款订单”虚增经营数据，定义如下：

- **有效预约状态：** `confirmed`、`completed`。
- **有效预约订单数：** 日期范围内状态为 `confirmed` 或 `completed` 的订单数。
- **预约总人数：** 有效预约订单的 `personCount` 之和。
- **自驾车辆数：** 有效预约订单中，`travelMode = selfDriving` 且存在非空 `licensePlate` 的订单数；一张订单按一辆车计算。非机动车没有车牌，不计入该卡片。
- **实收金额：** 日期范围内同时满足 `paymentStatus = paid` 且订单状态为 `confirmed` 或 `completed` 的 `amount` 之和；免费订单、退款订单、取消订单、待支付订单计 0。
- **免费预约人数：** 有效预约订单中 `isFree = true` 的 `personCount` 之和。
- **收费预约人数：** 有效预约订单中 `isFree = false` 的 `personCount` 之和。
- **状态分布：** 日期范围内全部订单按 `pending`、`confirmed`、`completed`、`cancelled`、`refunded` 计数，不排除任何状态。
- **出行方式分布：** 仅统计有效预约订单，分别返回自驾、景区摆渡车、观光团的订单数与人数。
- **每日趋势：** 日期范围内按 `bookingDate` 分组，返回每天的有效预约订单数、预约人数、自驾车辆数和实收金额；没有数据的日期也必须返回 0，保证折线图日期连续。

#### 看板展示

第一行核心卡片：

1. 有效预约订单
2. 预约总人数
3. 自驾车辆数
4. 实收金额

第二行：

- 免费预约人数
- 收费预约人数
- 免费人数占比

下方区域：

- 每日趋势折线图：至少展示预约人数与有效预约订单数。
- 订单状态分布：柱状图或横向进度条。
- 出行方式分布：展示每种方式的订单数和人数。
- 明细表：按日期展示订单数、人数、车辆数、实收金额，作为图表的可核对数据源。

空数据时卡片显示 `0`/`¥0.00`，图表区域显示 Ant Design `Empty`，不得报错或显示 `NaN`。

### 1.4 身份证输入体验（反馈 9）

后端校验保持不动。本期只修改 `fctl`。

输入归一化：

- 去除所有半角/全角空白。
- 将全角数字 `０-９` 转为半角数字 `0-9`。
- 将末位 `x`、`ｘ`、`Ｘ` 统一转为大写半角 `X`。
- 输入值变化后立即清除上一轮红色错误状态，不能让用户改对后仍看到旧错误。
- 输入框使用 `:value` + `@input` 显式写回归一化结果，避免 `v-model` 和事件回调时序不一致。

提示规则：

- 输入过程中不频繁报错。
- 失去焦点时为空：不显示字段级错误，提交时由现有必填校验提示。
- 失去焦点时长度不足 18 位：`请输入完整的18位身份证号`。
- 长度正确但格式不符合：`身份证号格式不正确，请检查出生日期等信息`。
- 格式正确但校验码错误：`身份证号末位校验不正确`。
- 校验通过：清空错误提示并调用现有 `fetchPreview()`。

不得把身份证明文写入 `console.log`、埋点、错误上报或测试快照。

### 1.5 车牌键盘“豫”前置（反馈 11）

当前预约页使用 `xm-keyboard-v2`，其省份键盘实际由 `fctl/uni_modules/xm-keyboard/components/xm-keyboard-box/xm-keyboard-box.vue` 提供。

修改要求：

- 第一行省份顺序改为：`豫、京、沪、浙、苏、粤、鲁、晋、冀、川`。
- 其余省份保持原有顺序和完整性，不得遗漏或重复。
- 当且仅当 `mode === 0` 且按键为“豫”时，加轻微主题色边框/浅背景。
- 不自动把“豫”写入车牌号；用户仍需主动点击。
- 在省份数组和样式旁增加注释：`// 项目定制：河南用户较多，将“豫”前置；升级 xm-keyboard 时保留`。
- 不修改后端车牌正则，不修改当前 `onPlateConfirm()` 数据结构。

### 1.6 明确排除项（反馈 4）

本期不得实现以下内容：

- 儿童、老人人员类型。
- 儿童、老人免填身份证。
- 儿童票、老人票、免费或优惠金额。
- 订单表新增人员类型字段。
- 以联系人代替儿童/老人证件的核验逻辑。

原因：儿童、老人是否收费尚未确定。身份录入与收费规则相互影响，提前实现会产生用户预期和历史订单兼容问题。

---

## 2. 后端统计接口设计

### 2.1 新增文件与修改文件

**Create:**

- `nest/src/modules/admin/dto/get-booking-dashboard.dto.ts`：统计日期范围 DTO。
- `nest/src/modules/admin/interfaces/booking-dashboard.interface.ts`：统计响应类型。
- `nest/src/repositories/booking.repository.spec.ts`：SQLite 聚合口径测试。

**Modify:**

- `nest/src/repositories/booking.repository.ts`：增加经营统计聚合查询。
- `nest/src/modules/booking/booking.service.ts`：暴露统计服务方法。
- `nest/src/modules/admin/admin.controller.ts`：增加管理员统计接口。

不需要修改实体和数据库结构，`bookings.bookingDate` 已有索引。

### 2.2 请求接口

```http
GET /admin/bookings/dashboard?startDate=2026-08-01&endDate=2026-08-12
Authorization: Bearer <admin-token>
```

DTO：

```ts
export class GetBookingDashboardDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
```

Controller 或 Service 进入查询前必须把日期截取为 `YYYY-MM-DD`，并验证：

- `startDate <= endDate`，否则返回 400，文案“开始日期不能晚于结束日期”。
- 最长范围 366 天，超过时返回 400，文案“统计日期范围不能超过366天”。
- 接口必须使用 `AdminAuthGuard`。

### 2.3 响应结构

```ts
export interface BookingDashboardResponse {
  range: {
    startDate: string;
    endDate: string;
  };
  summary: {
    validOrderCount: number;
    totalPeople: number;
    selfDrivingVehicleCount: number;
    receivedAmount: number; // 分
    freePeople: number;
    paidPeople: number;
  };
  statusDistribution: Array<{
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'refunded';
    orderCount: number;
  }>;
  travelModeDistribution: Array<{
    travelMode: 'scenicBus' | 'selfDriving' | 'tourGroup';
    orderCount: number;
    peopleCount: number;
  }>;
  dailyTrend: Array<{
    date: string;
    validOrderCount: number;
    peopleCount: number;
    selfDrivingVehicleCount: number;
    receivedAmount: number; // 分
  }>;
}
```

HTTP 响应外层沿用现有规范：

```json
{
  "success": true,
  "data": {
    "range": { "startDate": "2026-08-01", "endDate": "2026-08-12" },
    "summary": {
      "validOrderCount": 18,
      "totalPeople": 53,
      "selfDrivingVehicleCount": 14,
      "receivedAmount": 126000,
      "freePeople": 8,
      "paidPeople": 45
    },
    "statusDistribution": [],
    "travelModeDistribution": [],
    "dailyTrend": []
  }
}
```

### 2.4 查询实现约束

- Repository 提供 `getBookingDashboard(startDate: string, endDate: string): Promise<BookingDashboardResponse>`。
- 使用 TypeORM QueryBuilder 的聚合查询，不把范围内全部订单读入 Node.js 后再统计。
- 至少分为 summary、status、travelMode、dailyTrend 四个聚合查询；禁止按每一天循环发 SQL，避免 N+1。
- SQLite `date` 字段按纯字符串比较：`booking.bookingDate >= :startDate AND booking.bookingDate <= :endDate`，不要转换成带时区的 JavaScript `Date` 后比较。
- SQL 的 `SUM`、`COUNT` 原始结果可能是字符串或 `null`，统一用安全转换函数变成有限 number；`null` 返回 0。
- `dailyTrend` 查询后在 Service/Repository 中补齐没有数据的自然日。
- 固定返回五种订单状态和三种出行方式，即使某项为 0，也要有数组元素，前端无需猜测缺失项。

---

## 3. 管理后台页面设计

### 3.1 文件变更

**Create:**

- `admin/src/pages/dashboard/index.tsx`：统计页面容器、日期筛选、加载和错误状态。
- `admin/src/pages/dashboard/components/SummaryCards.tsx`：核心指标卡片。
- `admin/src/pages/dashboard/components/DailyTrendChart.tsx`：每日趋势图。
- `admin/src/pages/dashboard/components/DistributionPanels.tsx`：状态和出行方式分布。
- `admin/src/pages/dashboard/components/DailyDetailTable.tsx`：每日明细表。
- `admin/src/api/dashboard.ts`：统计接口调用。

**Modify:**

- `admin/src/types/index.ts`：加入统计接口类型。
- `admin/src/App.tsx`：注册 `/dashboard` 路由并设为默认首页。
- `admin/src/layouts/MainLayout.tsx`：菜单顶部增加“经营统计”。
- `admin/package.json`、`admin/package-lock.json`：安装 `@ant-design/charts`。

### 3.2 页面行为

- 默认选择“今日”，页面首次加载立即请求统计接口。
- 日期切换使用一个统一函数生成 `YYYY-MM-DD`，不得把时间戳传给后端。
- 自定义范围只在起止日期都选择后请求。
- 每次请求使用当前范围；快速切换时，旧请求结果不得覆盖新范围结果。使用 `AbortController`/axios signal 或请求序号实现。
- 请求中显示 Skeleton/Spin，但保留筛选栏可操作。
- 请求失败显示 `message.error('统计数据加载失败，请重试')`，保留上一次成功数据或显示明确空态，不能把旧数据伪装成新日期数据。
- 金额统一通过 `formatAmount(cents)` 转为 `¥1,260.00`。
- 免费占比：`totalPeople === 0` 时为 `0%`，否则 `freePeople / totalPeople * 100`，保留一位小数。
- 图表 Tooltip 和表格金额均显示元；接口和 TypeScript 类型仍使用分。
- 页面在 1280px 桌面宽度下四张核心卡片同排；窄屏时允许响应式换行。

推荐颜色语义：

- 有效预约：蓝色
- 人数：青色
- 车辆：紫色
- 实收：绿色
- 待支付：橙色
- 已取消/已退款：灰红/紫色

不得用颜色作为唯一信息来源；图表和进度条旁必须有文字标签与数值。

---

## 4. Implementation Tasks

### Task 1: 建立小程序身份证输入纯函数与回归测试

**Files:**

- Create: `fctl/utils/id-card-input.js`
- Create: `fctl/tests/id-card-input.test.js`
- Modify: `fctl/pages/booking-form/booking-form.vue`

**Interfaces:**

- Produces: `normalizeIdCardInput(value: unknown): string`
- Produces: `getIdCardError(value: string): '' | '请输入完整的18位身份证号' | '身份证号格式不正确，请检查出生日期等信息' | '身份证号末位校验不正确'`
- Consumes: existing `validateIdCard` from `fctl/utils/validator.js`

- [ ] **Step 1: 写归一化与错误分类测试**

测试必须覆盖：空值、首尾空格、字符串中间空格、全角数字、小写/全角 X、17 位、错误出生月份、错误校验码、合法号码。测试数据使用按校验算法生成的虚构号码，不得使用真实用户身份证。

Run:

```bash
cd /Users/lufy/Desktop/ff/fctl
node --experimental-default-type=module --test tests/id-card-input.test.js
```

Expected: 新模块尚不存在，测试失败。

- [ ] **Step 2: 实现纯函数并使测试通过**

归一化顺序固定为：字符串化 → 全角数字转半角 → 全角 X 转半角 → 去除全部空白 → 转大写。错误分类先判长度，再判后端同等基础格式，最后调用现有校验码函数。

- [ ] **Step 3: 接入预约表单**

身份证输入框改为：

```vue
<input
  class="field-input"
  maxlength="18"
  :value="p.idCard"
  placeholder="请输入18位身份证号码"
  placeholder-style="color:#c8c8c8"
  @input="onIdCardInput($event, idx)"
  @blur="onIdCardBlur($event, idx)"
/>
```

`onIdCardInput` 写回归一化值并立即清空 `idCardError`；`onIdCardBlur` 使用 `getIdCardError` 设置提示，通过时调用 `fetchPreview()`。提交前仍保留现有 `validateForm()` 总校验。

- [ ] **Step 4: 验证**

重新运行 Node 测试，并在微信开发者工具手动验证“先输错产生红色提示 → 改成正确号码 → 旧提示立即消失 → 离开输入框后不再报错”。

- [ ] **Step 5: 提交 fctl**

```bash
git add utils/id-card-input.js tests/id-card-input.test.js pages/booking-form/booking-form.vue
git commit -m "fix: improve id card input feedback"
```

### Task 2: 增加姓名匹配常用人员弱提示

**Files:**

- Create: `fctl/utils/profile-matcher.js`
- Create: `fctl/tests/profile-matcher.test.js`
- Modify: `fctl/pages/booking-form/booking-form.vue`

**Interfaces:**

- Produces: `findExactProfileMatches(profiles, name): UserProfile[]`
- Produces component state: `profileMatchesByIndex: Record<number, UserProfile[]>`
- Produces component state: `profilePickerOptions: UserProfile[]`

- [ ] **Step 1: 写匹配测试**

覆盖：姓名首尾空格、完全相等、部分姓名不匹配、空姓名不匹配、同名多人、无效 profile 项忽略。Run:

```bash
cd /Users/lufy/Desktop/ff/fctl
node --experimental-default-type=module --test tests/profile-matcher.test.js
```

- [ ] **Step 2: 实现完全匹配纯函数**

只比较 `String(name).trim()`，不得比较手机号或身份证，不得模糊匹配。

- [ ] **Step 3: 增加姓名事件和弱提示卡片**

姓名输入改为显式 `@input="onPassengerNameInput($event, idx)"` 和 `@blur="onPassengerNameBlur(idx)"`。输入时更新姓名并清除该索引匹配；失焦时仅在手机号与身份证均为空时建立匹配结果。

单人匹配卡片显示掩码手机号；多人匹配卡片只显示人数。点击单人卡片调用统一 `applyProfileToPassenger(item, idx)`；点击多人卡片打开筛选后的现有底部弹层。

- [ ] **Step 4: 统一主动选择与自动匹配的填入函数**

把现有 `selectProfile(item)` 的写入逻辑收敛到 `applyProfileToPassenger(item, idx)`。主动“选择常用”传全部 `profileList`；同名匹配传 `profileMatchesByIndex[idx]`。填入后清理匹配状态、关闭弹层、调用 `fetchPreview()`。

- [ ] **Step 5: 手动验收**

验证无匹配、单匹配、同名双匹配、已有手机号时不提示、多位出行人互不干扰、删除中间出行人后不串位、主动“选择常用”仍可使用。

- [ ] **Step 6: 提交 fctl**

```bash
git add utils/profile-matcher.js tests/profile-matcher.test.js pages/booking-form/booking-form.vue
git commit -m "feat: suggest saved passenger profiles by name"
```

### Task 3: 调整本地车牌键盘

**Files:**

- Modify: `fctl/uni_modules/xm-keyboard/components/xm-keyboard-box/xm-keyboard-box.vue`

- [ ] **Step 1: 调整省份数组**

将“豫”移动到第一项，确保省份总数、集合内容和原来完全一致。

- [ ] **Step 2: 增加项目定制样式**

模板 class 条件仅在省份模式命中“豫”，样式使用浅蓝背景和主题色边框；按下态、禁用态和其他模式保持原行为。

- [ ] **Step 3: 手动验收**

打开空车牌输入，确认“豫”在第一位且没有自动写入；分别输入普通蓝牌与 8 位新能源牌，确认删除、清空、确认按钮仍工作。

- [ ] **Step 4: 提交 fctl**

```bash
git add uni_modules/xm-keyboard/components/xm-keyboard-box/xm-keyboard-box.vue
git commit -m "feat: prioritize Henan plate prefix"
```

### Task 4: 放大小程序字体并突出预约人数

**Files:**

- Modify: 本文 1.1 列出的全部小程序页面与 `fctl/components/my-tab-bar.vue`

- [ ] **Step 1: 建立字号审计清单**

Run:

```bash
cd /Users/lufy/Desktop/ff/fctl
rg -n "font-size:\\s*(20|21|22)rpx" pages components
```

Expected: 修改前列出所有低于 24rpx 的字号；修改后无结果。第三方 `uni_modules` 不参与全局字体放大，只执行 Task 3 的定制。

- [ ] **Step 2: 按 1.1 的字号层级逐页调整**

不要简单全局乘比例。正文、字段、说明、角标分别映射到对应字号，并同步检查 `line-height`、固定高度、左右 padding 和换行。

- [ ] **Step 3: 突出订单详情人数**

在 `booking-detail.vue` 中把人数数字和单位拆开：

```vue
<view class="detail-value person-count-value">
  <text class="person-count-number">{{ formData.personCount }}</text>
  <text class="person-count-unit">人</text>
</view>
```

数字使用 `48rpx`、`font-weight: 800`、现有主题蓝色；单位使用 `32rpx`、`font-weight: 600`。普通 `.detail-value` 使用 `30rpx`。

- [ ] **Step 4: 设备验收**

至少检查 320px 等效窄屏和常规 iPhone 屏幕：预约表单底栏、订单列表、订单详情长身份证号、常用人员弹层、隐私政策长文本、底部 Tab。不得出现横向滚动和按钮文字截断。

- [ ] **Step 5: 提交 fctl**

```bash
git add pages components/my-tab-bar.vue
git commit -m "style: improve miniprogram text readability"
```

### Task 5: 后端经营统计聚合与测试

**Files:** 使用第 2.1 节列出的 `nest` 文件。

- [ ] **Step 1: 写 SQLite 聚合回归测试**

测试夹具至少包含：不同 `bookingDate`、五种订单状态、免费/收费、三种出行方式、有无车牌、已支付与退款订单。断言：

- 日期边界包含 start/end 两天。
- pending 只进入状态分布，不进入有效订单、人数、车辆和实收。
- cancelled/refunded 不进入有效指标。
- confirmed/completed 进入有效指标。
- 只有 paid 且 confirmed/completed 的金额进入实收。
- 免费/收费人数相加等于有效总人数。
- 无数据日期补 0。

Run:

```bash
cd /Users/lufy/Desktop/ff/nest
npx jest src/repositories/booking.repository.spec.ts --runInBand
```

Expected: 新方法不存在，测试失败。

- [ ] **Step 2: 添加接口类型和 DTO**

严格使用第 2.3 节字段名，不自行改成其他命名。日期范围错误抛 `BadRequestException`。

- [ ] **Step 3: 实现 Repository 聚合**

使用四组聚合 SQL，所有状态与出行方式使用参数绑定。日期补齐使用从 `startDate` 到 `endDate` 的纯日期迭代，输出升序。

- [ ] **Step 4: 接入 Service 和 Controller**

新增：

```ts
@Get('bookings/dashboard')
@UseGuards(AdminAuthGuard)
async getBookingDashboard(@Query() query: GetBookingDashboardDto, @Res() res: Response)
```

返回 `{ success: true, data }`，不得返回用户敏感字段。

- [ ] **Step 5: 运行验证**

```bash
cd /Users/lufy/Desktop/ff/nest
npx jest src/repositories/booking.repository.spec.ts --runInBand
npm test
npm run build
```

Expected: tests PASS；Nest build 成功。

- [ ] **Step 6: 提交 nest**

```bash
git add src/modules/admin src/modules/booking/booking.service.ts src/repositories/booking.repository.ts src/repositories/booking.repository.spec.ts
git commit -m "feat: add booking operations dashboard statistics"
```

### Task 6: 管理后台经营统计页面

**Files:** 使用第 3.1 节列出的 `admin` 文件。

- [ ] **Step 1: 安装图表依赖**

```bash
cd /Users/lufy/Desktop/ff/admin
npm install @ant-design/charts
```

- [ ] **Step 2: 增加类型与 API**

在 `types/index.ts` 完整定义第 2.3 节接口，在 `api/dashboard.ts` 实现：

```ts
export const getBookingDashboard = (params: { startDate: string; endDate: string }) =>
  request.get<never, ApiResponse<BookingDashboardResponse>>('/admin/bookings/dashboard', { params });
```

- [ ] **Step 3: 实现页面状态与日期筛选**

页面状态只保留 `range`、`data`、`loading`、`requestSeq`/abort signal。快捷日期和自定义日期最终都调用同一个 `loadDashboard(startDate, endDate)`。

- [ ] **Step 4: 实现展示组件**

组件只接收类型化数据，不自行请求接口。所有中文映射集中定义，金额格式化集中为一个函数。图表数据直接来自 `dailyTrend`，明细表与图表共享同一数组。

- [ ] **Step 5: 注册路由和菜单**

`/` 默认跳转 `/dashboard`；菜单“经营统计”排在第一位，使用 Ant Design 合适的统计图标。现有路由和菜单不得丢失。

- [ ] **Step 6: 构建和静态检查**

```bash
cd /Users/lufy/Desktop/ff/admin
npm run lint
npm run build
```

Expected: lint 无 error；TypeScript 和 Vite build 成功。

- [ ] **Step 7: 联调验收**

使用管理员登录态检查：默认今日、明日、最近 7 天、本月、自定义范围、空数据、接口 400、接口 500、快速切换日期。抽取一个单日，与订单查询页按同一预约日期筛选后的有效订单逐单核对人数、车辆和金额。

- [ ] **Step 8: 提交 admin**

```bash
git add package.json package-lock.json src/App.tsx src/layouts/MainLayout.tsx src/types/index.ts src/api/dashboard.ts src/pages/dashboard
git commit -m "feat: add booking operations dashboard"
```

### Task 7: 全链路回归与交付检查

- [ ] **Step 1: 后端回归**

```bash
cd /Users/lufy/Desktop/ff/nest
npm test
npm run build
```

- [ ] **Step 2: 后台回归**

```bash
cd /Users/lufy/Desktop/ff/admin
npm run lint
npm run build
```

- [ ] **Step 3: 小程序回归**

在微信开发者工具执行完整路径：进入预约页 → 多人填写 → 姓名匹配常用人员 → 身份证先错后改对 → 选择日期 → 输入豫牌 → 费用预览 → 提交 → 支付/免费订单 → 订单详情。确认字体放大后所有步骤可操作。

- [ ] **Step 4: 敏感信息检查**

```bash
cd /Users/lufy/Desktop/ff
rg -n "console\\.(log|debug|info).*?(idCard|身份证|phone|手机号|passengers)" fctl nest/src admin/src
```

对命中项逐条检查；不得新增敏感信息日志。

- [ ] **Step 5: 范围检查**

确认三个仓库 diff 中没有儿童/老人、人员类型、优惠计费、数据库迁移或后端身份证校验改动。

---

## 5. 验收标准

### 小程序

- 所有业务页面不再出现小于 `24rpx` 的自有文字样式。
- 订单详情的预约人数明显高于其他信息层级，数字为 `48rpx` 加粗。
- 输入已保存人员的完整姓名并失焦后出现非阻塞弱提示；不匹配时无干扰。
- 同名人员可选择，且不会误填到其他出行人。
- 手动填写过手机号或身份证时不被自动覆盖。
- 身份证复制粘贴产生的空格、全角数字、小写/全角 X 被自动归一化。
- 用户修改身份证内容后，旧红色错误立即消失；失焦后显示具体错误原因。
- “豫”位于省份键盘第一位并轻微突出，但打开键盘时不会自动写入。
- 原有预约、费用预览、支付、免费订单、订单详情流程不回归。

### 后端

- 统计接口需要管理员鉴权。
- 统计范围严格使用 `bookingDate`，包含起止日期。
- 数据口径与第 1.3 节完全一致。
- 空范围返回全 0 和连续日期，不返回 `null`/`NaN`。
- 不返回任何姓名、手机号、身份证号、OpenID。
- 不修改数据库表结构和后端身份证校验。

### 管理后台

- 登录后默认进入经营统计。
- 今日、明日、最近 7 天、本月和自定义日期可正常切换。
- 核心卡片、趋势、状态分布、出行方式、每日明细使用同一接口数据且相互一致。
- 实收金额以元显示，接口值仍为分。
- 空数据、加载、错误状态均有明确界面。
- `npm run lint` 与 `npm run build` 通过。

---

## 6. 风险、发布与回滚

- **本地插件覆盖风险：** 以后升级 `xm-keyboard` 前先比较 `xm-keyboard-box.vue`，保留“豫前置”定制。
- **字体布局风险：** 发布前必须用至少一个窄屏模拟器检查长身份证号和底部固定栏。
- **统计口径争议：** 页面指标名称使用“有效预约订单”“实收金额”，并在页面 Tooltip 说明仅统计 `confirmed/completed`，防止将待支付理解为有效预约。
- **历史数据兼容：** 统计只依赖现有字段；`amount = null`、`licensePlate = null`、旧订单 `passengers = null` 都按 0/不计处理。
- **发布顺序：** 先发布 `nest` 统计接口，再发布 `admin` 看板；`fctl` 优化可独立发布。
- **回滚：** 后台页面回滚不影响订单数据；统计接口为只读接口，可单独回滚。小程序回滚到上一个版本不会影响已保存常用人员或历史订单。

## 7. 最终交付物

- `fctl`：字体优化、预约人数突出、姓名弱提示、身份证输入优化、豫牌前置及相关测试。
- `nest`：只读经营统计接口、DTO、响应类型、聚合测试；无实体/迁移/身份证校验变更。
- `admin`：经营统计菜单、页面、图表/分布/明细、日期范围筛选。
- 三个仓库各自通过对应测试和构建，并提供一份联调截图或录屏供人工确认。
