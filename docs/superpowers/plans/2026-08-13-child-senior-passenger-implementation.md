# 儿童、老人同行人员与年龄免费 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不向普通人员暴露免填身份证能力的前提下，通过底部弹窗添加同行儿童/老人，实现人员驱动人数、按预约年份判定年龄免费、无身份证正常收费但明确暂时无法投保，以及订单详情和后台的兼容展示。

**Architecture:** 后端新增纯函数年龄计费模块，费用预览和创建订单共用同一套人员校验、年龄计算及优惠优先级；每位人员的类型和下单时年龄优惠快照继续保存在现有 `bookings.passengers` JSON 中，不新增数据库表或列。小程序以 `passengers` 为人数唯一来源，普通同行人直接添加，儿童/老人通过独立底部弹窗添加；管理后台只展示后端保存的历史快照，不根据当前年份重新计算。

**Tech Stack:** uni-app/Vue、JavaScript、NestJS 10、TypeScript、class-validator、TypeORM、SQLite、React 19、Ant Design 6、Jest、Node test runner。

## Global Constraints

- 本文是儿童/老人同行人功能的唯一需求与实施依据；不得再引用已删除的旧设计稿或旧用户反馈计划。
- 优惠顺序固定为：月卡会员整单免费 → 每日免费名额整单免费 → 儿童/老人人员级年龄免费。
- 年龄值固定为 `预约游玩年份 - 身份证出生年份`；`0 <= 年龄值 <= 7` 儿童免费，`>= 70` 老人免费。出生年份晚于预约年份必须拒绝。
- 用于年龄优惠的身份证必须在后端通过 18 位格式、真实公历出生日期和 MOD 11-2 校验码验证；不能只靠正则读取出生年份。
- 用户选择儿童/老人只决定录入方式，不能直接决定免费；后端必须根据身份证重新计算。
- 联系人与普通同行人身份证必填；只有儿童/老人弹窗允许选择暂时无法提供身份证。
- 无身份证儿童/老人正常收费，不能标记为年龄免费、已核验或已投保。业务已明确接受这类人员暂时无法投保，不再作为上线阻塞项。
- 人数唯一来源为 `passengers.length`；后端拒绝 `personCount` 与数组长度不一致的请求。
- 不使用联系人身份证替代儿童/老人身份证。
- 无身份证人员不写入常用人员。
- 不在日志、错误响应、预览响应中输出身份证明文。
- 历史订单展示保存的计费快照，不能使用当前年份重新计算历史年龄。
- 不改变 `bookings` 数据库 schema；新字段保存在现有 `passengers` JSON 中。
- `fctl`、`nest`、`admin` 是三个独立 Git 仓库，分别测试、分别提交。
- 保留各仓库现有未提交修改；不得覆盖无关用户改动。

## Current Implementation Status

- Task 0–9 已经实现并提交，是已有实现记录，**不得重做或回退**。
- `fctl` 已实现提交：`29708ff`、`a8f4e93`、`65b7008`、`84a42fe`、`2d8249a`。
- `nest` 已实现提交：`96daa1e`、`4cf2751`、`69442f6`、`9a45f48`、`eec8578`。
- `admin` 已实现提交：`53e7e16`。
- 2026-08-13 代码验证发现的剩余问题统一放在 Task 10–16。AI 修复时只执行 Task 10–16，不得借机重构已通过的年龄定价、支付或历史订单逻辑。

---

## 1. 已确认产品与交互方案

### 1.1 功能边界

- 联系人和普通同行人继续必填身份证，普通表单不显示“暂时无法提供身份证号”。
- 普通同行人通过“添加普通同行人”直接增加；只有点击次要入口“添加同行儿童/老人”后，才在底部弹窗中显示暂时无法提供身份证的复选框。
- 入口文案不出现“免费”“免身份证”，不主动放大免填能力。
- 选择儿童或老人只决定录入方式，不直接获得免费；免费必须由后端根据有效身份证和预约日期重新计算。
- 无身份证的儿童/老人可以预约，但无法验证年龄，本次按正常价格收费。

### 1.2 年龄、类型与费用

```text
年龄值 = 预约游玩年份 - 身份证出生年份
```

- `0 <= 年龄值 <= 7`：符合“7 岁及以下儿童”，该人员年龄免费。
- `年龄值 >= 70`：符合“70 岁及以上老人”，该人员年龄免费。
- `年龄值 < 0`：出生年份晚于预约年份，属于无效身份/类型组合，禁止添加、预览和提交。
- 边界按年份粗略计算，允许生日临界点的误差；更换跨年预约日期后必须重算。
- 选择儿童却计算为 8 岁及以上，提示“身份证年龄不符合7岁及以下儿童条件”并禁止确认。
- 选择老人却计算为 69 岁及以下，提示“身份证年龄不符合70岁及以上老人条件”并禁止确认。
- 类型与年龄不符时不得静默改为普通收费，必须要求用户修改身份证或切换类型。
- 预约日期未选时，可以校验身份证格式和保存人员，但只显示“选择预约日期后计算年龄优惠”，不展示最终免费结论。

优惠顺序固定为：

1. 月卡会员命中时整单免费。
2. 否则，命中每日免费名额时整单免费。
3. 否则，符合年龄的儿童/老人单人免费，其余人员按单价收费。

### 1.3 人数与人员列表

- `personCount = passengers.length`，人员列表是人数的唯一事实来源；移除人数加减步进器。
- 预约人数区域只读显示总人数、各类人员汇总和当前车型上限；人数数字继续使用已落地的醒目字号和主题色。
- 人数上限保持现有规则：摩托车 2 人，小型客车 7 人，其他出行方式 10 人。
- 达到上限时两个添加入口同时禁用，并显示“当前车型最多可预约 N 人”；真正写入数组前再校验一次。
- 切换到小容量车型时，如当前人数超出新上限，不修改车型、不删除已填人员，提示：`当前已添加N位出行人，摩托车最多2人，请先删除多余人员。`
- 联系人固定为第一人且不可删除；其他人员删除前使用包含姓名的轻量确认，删除后同步人数和费用预览。

### 1.4 儿童/老人底部弹窗

弹窗必须复用现有“选择常用人员”的设计语言：底部滑入、半透明遮罩、白色背景、顶部圆角 `32rpx`、标题 `34rpx` 加粗、字段标签 `28rpx`、输入内容 `30rpx`、现有蓝绿渐变主按钮。小屏和键盘弹出时主体可滚动，操作栏固定在弹窗底部并适配安全区。

```text
添加同行儿童/老人                                      ×

[ 7岁及以下儿童 ]    [ 70岁及以上老人 ]

姓名 *
[ 请输入真实姓名 ]

手机号码
[ 默认使用联系人手机号 ]

身份证号
[ 请输入18位身份证号 ]

□ 暂时无法提供身份证号

                              [取消] [确认添加]
```

- 儿童/老人两个等宽分段按钮默认都不选；切换类型保留姓名、手机号和身份证，但立即重新校验年龄。
- 姓名必填并使用现有长度与去首尾空格规则。
- 手机号默认复制有效的联系人手机号，允许修改，并使用现有手机号校验；不得自动填入无效值。
- 身份证默认展示并建议填写，复用已实现的输入归一化和明确错误提示。
- “暂时无法提供”使用普通复选框和次要文字，不使用醒目按钮。勾选后清空并禁用身份证输入框、清除该字段错误，取消勾选后由用户重新填写。
- 勾选后只展示浅黄色弱提示，不再弹出二次 Modal：`未提供身份证号时无法核验年龄，不能享受年龄免费，本次按正常价格收费，且暂时无法投保。`
- 确认时按“类型 → 姓名 → 手机号 → 身份证/暂时无法提供 → 年龄与类型 → 人数上限”顺序校验。
- 每次只添加一人；成功后关闭并重置弹窗、刷新费用预览，使用非阻塞 Toast 提示“已添加同行儿童/老人”。
- 编辑时重新打开同一弹窗并回填全部状态；确认后原位替换，取消不影响原数据。

### 1.5 人员卡片、费用与详情展示

- 普通人员卡片沿用现有风格，只增加类型标签和编辑/删除操作。
- 有身份证且符合年龄的人员显示掩码身份证和绿色弱状态“7岁及以下，年龄免费”或“70岁及以上，年龄免费”；不使用过大的免费徽章。
- 无身份证人员显示黄色弱状态“未提供身份证号”“按正常价格收费·暂时无法投保”，不显示已核验或已投保。
- 后端预览成功后，底部显示总人数、年龄免费人数、收费人数和应付金额；无年龄免费人员时不显示“年龄免费 0 人”。
- 人员增加、删除、编辑、身份证变化、预约日期跨年、出行方式或车型变化后都重新预览；保留现有 debounce 和请求序号锁，过期结果不得覆盖新数据。
- 小程序订单详情与管理后台均显示人员类型、年龄免费/正常收费、身份证掩码/未提供，以及订单总人数、免费人数、收费人数和金额。

### 1.6 保险最终结论

- 身份证用于为游客投保。业务已明确接受：选择“暂时无法提供身份证号”的儿童/老人，本次可继续预约和正常收费，但暂时无法投保。
- 该风险已接受，无需再等待保险供应方或另行业务确认，不得将其标记为开发或上线阻塞项。
- 弹窗勾选后、人员卡片、小程序订单详情和管理后台都必须如实展示“暂时无法投保”，避免用户或工作人员误以为已投保。
- 后端必须保留 `idCardUnavailable` 和空身份证状态，不得将空身份证当作投保成功；无身份证人员不进入常用人员自动保存。
- 用户协议、隐私政策、保险文案及日志不得对这类人员做“已投保”或“投保成功”承诺。

### 1.7 已完成的前置优化（不得重复开发）

以下用户反馈项已实现并有现有代码/提交可供复用，本计划只做兼容，不重写它们：

- 身份证输入归一化和红叉错误提示：`4e3ef15`，复用 `fctl/utils/id-card-input.js`。
- 按姓名弱提示匹配常用人员：`cdc89ba`，复用 `fctl/utils/profile-matcher.js`。
- 车牌键盘中“豫”字前置：`dfef25a`。
- 小程序全局字体放大与订单详情人数突出：`0a3296c`、`2964157`、`30a3df8`。
- 后端经营统计：`nest` 的 `0963f0c`；后台统计页：`admin` 的 `8cf08ea`、`4a7cdf2`。
- 常用人员后端已按现有规则保存；空身份证记录已由仓储条件过滤，本功能只需保持该约束。

---

## 2. 最终数据契约

### 2.1 请求 Passenger

```ts
export enum PassengerType {
  ADULT = 'adult',
  CHILD = 'child',
  SENIOR = 'senior',
}

export interface PassengerInput {
  name: string;
  phone: string;
  idCard?: string | null;
  passengerType?: PassengerType; // 旧客户端缺失时按 adult
  idCardUnavailable?: boolean;   // 旧客户端缺失时按 false
}
```

输入约束：

- `adult`：`idCardUnavailable` 必须为 `false`，身份证必填。
- `child` / `senior`：身份证和 `idCardUnavailable=true` 二选一。
- `idCardUnavailable=true` 时身份证必须为空。
- `child` 有身份证时年龄必须 `<= 7`。
- `senior` 有身份证时年龄必须 `>= 70`。
- `passengers[0]` 必须是 `adult`、有身份证且 `idCardUnavailable=false`。

### 2.2 订单内保存的 Passenger 快照

```ts
export interface StoredPassenger {
  name: string;
  phone: string;
  idCard: string;
  passengerType: PassengerType;
  idCardUnavailable: boolean;
  ageValue: number | null;
  ageFree: boolean;
  finalCharged: boolean;
  pricingReason:
    | 'member_order_free'
    | 'daily_quota_order_free'
    | 'child_age_free'
    | 'senior_age_free'
    | 'id_card_unavailable'
    | 'regular';
}
```

旧订单的乘客缺少这些字段时，读取层归一化为：

```ts
{
  passengerType: 'adult',
  idCardUnavailable: false,
  ageValue: null,
  ageFree: false,
  finalCharged: booking.isFree ? false : true,
  pricingReason: booking.freeReason === 'member'
    ? 'member_order_free'
    : booking.freeReason === 'dailyQuota'
      ? 'daily_quota_order_free'
      : 'regular'
}
```

### 2.3 免费来源

`Booking.freeReason` 与前端/后台类型扩展为：

```ts
type FreeReason = 'member' | 'dailyQuota' | 'age' | null;
```

- `member`：会员整单免费。
- `dailyQuota`：每日名额整单免费。
- `age`：没有命中前两项，且所有人员均因年龄免费，最终金额为 0。
- 部分人员年龄免费但订单仍需付费：`isFree=false`、`freeReason=null`，金额为收费人数乘单价。

### 2.4 费用预览响应

在现有 `FreeEligibilityResult` 上新增：

```ts
interface PassengerPricingResult {
  index: number;
  passengerType: PassengerType;
  ageValue: number | null;
  ageFree: boolean;
  finalCharged: boolean;
  pricingReason: StoredPassenger['pricingReason'];
}

interface FreeEligibilityResult {
  // 保留现有字段
  isFree: boolean;
  freeReason: 'member' | 'dailyQuota' | 'age' | null;
  amount: number;
  unitPrice: number;
  personCount: number;

  ageFreePeople: number;
  chargedPeople: number;
  passengerPricing: PassengerPricingResult[];
}
```

金额不允许由前端自行计算后提交。

---

## 3. File Map

### `nest` 创建

- `nest/src/common/passenger-business.exception.ts`：稳定乘客业务错误码异常。
- `nest/src/common/passenger-business.exception.spec.ts`：异常响应结构测试。
- `nest/src/modules/booking/passenger-pricing.ts`：人员类型、年龄计算、输入业务校验、人员级定价纯函数。
- `nest/src/modules/booking/passenger-pricing.spec.ts`：年龄边界、无身份证、类型不符、旧输入兼容测试。
- `nest/src/modules/booking/booking-eligibility.spec.ts`：会员/每日免费/年龄免费优先级和金额测试。

### `nest` 修改

- `nest/src/modules/booking/dto/createBooking.dto.ts`：扩展 Passenger DTO 条件字段。
- `nest/src/modules/booking/dto/previewBooking.dto.ts`：继续复用 Passenger DTO。
- `nest/src/modules/booking/dto/free-eligibility.dto.ts`：扩展预览结果类型。
- `nest/src/modules/booking/booking.service.ts`：统一校验、费用优先级、快照落库、人数一致性。
- `nest/src/filters/http-exception.filter.ts`：在统一错误响应中保留稳定业务错误码。

### `fctl` 创建

- `fctl/utils/passenger-pricing.js`：前端即时年龄与类型校验，不作为最终计费依据。
- `fctl/utils/passenger-display.js`：小程序订单人员快照归一化，表单与详情共用。
- `fctl/utils/passenger-error-messages.js`：乘客业务错误码中文映射。
- `fctl/tests/passenger-pricing.test.js`：前端年龄边界和旧数据归一化测试。
- `fctl/tests/passenger-display.test.js`：旧订单与新快照展示归一化测试。
- `fctl/tests/passenger-error-messages.test.js`：错误码映射和 fallback 测试。
- `fctl/components/child-senior-passenger-popup.vue`：儿童/老人新增与编辑底部弹窗。

### `fctl` 修改

- `fctl/pages/booking-form/booking-form.vue`：人员驱动人数、双入口、弹窗、费用摘要、车型限制。
- `fctl/pages/booking-detail/booking-detail.vue`：人员类型、年龄免费、未提供身份证/暂时无法投保、费用摘要展示。

### `admin` 修改

- `admin/src/types/index.ts`：Passenger 快照和 `age` 免费来源类型。
- `admin/src/utils/passenger.ts`：后台旧订单人员快照归一化。
- `admin/src/pages/orders/index.tsx`：订单详情显示人员类型、年龄优惠、未提供身份证和暂时无法投保状态。

---

## 4. Implementation Tasks

### Task 0: 建立稳定乘客业务错误码契约

**Files:**

- Create: `nest/src/common/passenger-business.exception.ts`
- Modify: `nest/src/filters/http-exception.filter.ts`
- Create: `fctl/utils/passenger-error-messages.js`
- Create: `fctl/tests/passenger-error-messages.test.js`

**Interfaces:**

```ts
export enum PassengerErrorCode {
  ID_CARD_REQUIRED = 'PASSENGER_ID_CARD_REQUIRED',
  ID_CARD_INVALID = 'PASSENGER_ID_CARD_INVALID',
  TYPE_AGE_MISMATCH = 'PASSENGER_TYPE_AGE_MISMATCH',
  COUNT_MISMATCH = 'PASSENGER_COUNT_MISMATCH',
  LIMIT_EXCEEDED = 'PASSENGER_LIMIT_EXCEEDED',
  CONTACT_INVALID = 'PASSENGER_CONTACT_INVALID',
  UNAVAILABLE_NOT_ALLOWED = 'PASSENGER_ID_CARD_UNAVAILABLE_NOT_ALLOWED',
}

export class PassengerBusinessException extends BadRequestException {
  constructor(code: PassengerErrorCode, message: string);
}
```

- [ ] **Step 1: 写错误响应失败测试**

验证 `PassengerBusinessException` 的 HTTP body 同时包含 `statusCode=400`、稳定 `code` 和中文 `message`，且不包含身份证原值。

```bash
cd /Users/lufy/Desktop/ff/nest
npx jest src/common/passenger-business.exception.spec.ts --runInBand
```

- [ ] **Step 2: 实现异常并保留 code**

`HttpExceptionFilter` 从 `exception.getResponse()` 读取 `code`，仅当存在时加入统一 JSON。不得改变已有非乘客异常的响应字段。

- [ ] **Step 3: 写并实现前端错误码映射**

```js
export function getPassengerErrorMessage(code, fallback = '预约信息校验失败，请检查')
```

覆盖上述全部错误码；未知 code 返回后端 `message` fallback。现有 `request.js` 已原样 reject `uni.request` 响应，`err.data.code` 可以直接读取，不需要修改请求封装。

```bash
cd /Users/lufy/Desktop/ff/fctl
node --experimental-default-type=module --test tests/passenger-error-messages.test.js
```

- [ ] **Step 4: 提交两个仓库**

```bash
cd /Users/lufy/Desktop/ff/nest
git add src/common/passenger-business.exception.ts src/common/passenger-business.exception.spec.ts src/filters/http-exception.filter.ts
git commit -m "feat: add passenger business error codes"

cd /Users/lufy/Desktop/ff/fctl
git add utils/passenger-error-messages.js tests/passenger-error-messages.test.js
git commit -m "feat: map passenger business errors"
```

### Task 1: 后端人员年龄与定价纯函数

**Files:**

- Create: `nest/src/modules/booking/passenger-pricing.ts`
- Create: `nest/src/modules/booking/passenger-pricing.spec.ts`

**Interfaces:**

```ts
export enum PassengerType { ADULT = 'adult', CHILD = 'child', SENIOR = 'senior' }

export type PassengerPricingReason =
  | 'member_order_free'
  | 'daily_quota_order_free'
  | 'child_age_free'
  | 'senior_age_free'
  | 'id_card_unavailable'
  | 'regular';

export function normalizePassengerType(value: unknown): PassengerType;
export function validateChineseIdCard(idCard: string): boolean;
export function extractBirthYear(idCard: string): number | null;
export function calculateYearAge(idCard: string, bookingDate: string): number | null;
export function validatePassengerBusinessRules(passengers: PassengerDto[], bookingDate: string): void;
export function calculateAgePricing(passengers: PassengerDto[], bookingDate: string): AgePricingSummary;
```

所有业务规则失败均抛 Task 0 的 `PassengerBusinessException`，不得退回无 code 的普通 `BadRequestException`。

- [ ] **Step 1: 写失败测试**

至少覆盖：

- 预约 2026 年、2019 年出生结果 7，儿童免费。
- 2018 年出生结果 8，儿童类型不符。
- 1956 年出生结果 70，老人免费。
- 1957 年出生结果 69，老人类型不符。
- 伪造儿童出生年份但校验码错误时拒绝。
- 日期字段为不存在的公历日期时拒绝，即使其他字符格式正确也不能享受优惠。
- 成人缺失 `passengerType` 时兼容为 `adult`。
- 联系人是儿童/老人时拒绝。
- 成人 `idCardUnavailable=true` 时拒绝。
- 儿童/老人无身份证且 unavailable=true 时有效但正常收费。
- 无身份证人员结果固定为 `ageFree=false`、`finalCharged=true`、`pricingReason='id_card_unavailable'`，与有身份证但正常收费的 `regular` 区分。
- unavailable=true 同时传身份证时拒绝。
- `personCount` 不在此纯函数中使用，避免双事实来源。

Run:

```bash
cd /Users/lufy/Desktop/ff/nest
npx jest src/modules/booking/passenger-pricing.spec.ts --runInBand
```

Expected: FAIL，模块不存在。

- [ ] **Step 2: 实现年龄计算与业务错误**

使用 Task 0 的稳定业务异常，错误响应不得包含身份证原值。先验证 18 位格式，再用公历日期构造并反查年月日，最后验证 MOD 11-2 校验码；全部通过后才读取第 7–10 位出生年份。实现可参考已落地的 `fctl/utils/validator.js` 校验码算法，但后端必须有独立测试，不能信任前端校验结果。

- [ ] **Step 3: 运行测试**

```bash
cd /Users/lufy/Desktop/ff/nest
npx jest src/modules/booking/passenger-pricing.spec.ts --runInBand
```

Expected: PASS。

- [ ] **Step 4: 提交 nest**

```bash
git add src/modules/booking/passenger-pricing.ts src/modules/booking/passenger-pricing.spec.ts
git commit -m "feat: add passenger age pricing rules"
```

### Task 2: 扩展后端 DTO 和请求校验

**Files:**

- Modify: `nest/src/modules/booking/dto/createBooking.dto.ts`
- Modify: `nest/src/modules/booking/dto/previewBooking.dto.ts`

- [ ] **Step 1: 扩展 PassengerDto**

实现以下字段，并保证旧客户端缺字段时仍按成人处理：

```ts
@Transform(({ value }) => value ?? PassengerType.ADULT)
@IsEnum(PassengerType)
passengerType: PassengerType = PassengerType.ADULT;

@Transform(({ value }) => value === true)
@IsBoolean()
@IsOptional()
idCardUnavailable = false;

@ValidateIf((o) => o.idCardUnavailable !== true && o.idCard != null && o.idCard !== '')
@IsString()
@Matches(ID_CARD_PATTERN, { message: '身份证号格式不正确' })
idCard?: string;
```

DTO 只处理“传入身份证时必须满足基础格式”；身份证必填、联系人/成人免填、严格身份证校验和年龄类型不符全部由 Task 1 业务函数处理，并返回稳定错误码。preview 与 create 复用同一 PassengerDto 和同一业务校验，因此完整请求的严格度一致。

小程序正在输入半成品身份证时不得请求 preview；已经落地的前端身份证纯函数负责即时格式反馈，Task 4 的 `calculateYearAge` 负责即时年龄提示。只有人员字段满足 preview 完整条件后才请求后端，不为半成品输入放宽接口业务边界。

- [ ] **Step 2: 增加 DTO 测试用例**

在 `passenger-pricing.spec.ts` 或新的 DTO spec 中验证 preview 与 create 复用相同 PassengerDto，确保无身份证儿童能通过结构校验、无身份证成人在业务校验被拒绝、传入非空但格式错误的身份证在 DTO 层被拒绝。

- [ ] **Step 3: 构建验证**

```bash
cd /Users/lufy/Desktop/ff/nest
npm run build
```

- [ ] **Step 4: 提交 nest**

```bash
git add src/modules/booking/dto/createBooking.dto.ts src/modules/booking/dto/previewBooking.dto.ts src/modules/booking/passenger-pricing.spec.ts
git commit -m "feat: accept child and senior passenger inputs"
```

### Task 3: 后端统一优惠优先级、金额与历史快照

**Files:**

- Create: `nest/src/modules/booking/booking-eligibility.spec.ts`
- Modify: `nest/src/modules/booking/dto/free-eligibility.dto.ts`
- Modify: `nest/src/modules/booking/booking.service.ts`

**Produces:**

- `FreeEligibilityResult` 包含 `ageFreePeople`、`chargedPeople`、`passengerPricing`。
- 订单 passengers JSON 保存 Task 1.2 的快照。

- [ ] **Step 1: 写优惠优先级失败测试**

构造并断言：

1. 会员命中：金额 0、`freeReason=member`、所有 `finalCharged=false`。
2. 会员未命中但每日名额命中：金额 0、`freeReason=dailyQuota`。
3. 前两项未命中，一名 7 岁儿童 + 一名成人：收费人数 1、金额 `unitPrice`、`isFree=false`。
4. 前两项未命中，所有人均年龄免费：金额 0、`isFree=true`、`freeReason=age`，创建订单直接 confirmed。
5. 无身份证儿童/老人：`ageFree=false`、`finalCharged=true`、原因 `id_card_unavailable`。
6. `personCount !== passengers.length`：preview 不接收 personCount；create 返回稳定人数不一致错误。
7. 摩托车 + 会员联系人 + 7 岁儿童：会员整单免费，儿童 `pricingReason=member_order_free`，同时 `ageFreePeople=1`。
8. 年龄全免费订单不占用 `dailyQuota` 名额；每日名额查询继续只统计 `freeReason=dailyQuota`。
9. 部分年龄免费订单保持 `PENDING/UNPAID`，支付金额为 `chargedPeople * unitPrice`。

Run:

```bash
cd /Users/lufy/Desktop/ff/nest
npx jest src/modules/booking/booking-eligibility.spec.ts --runInBand
```

- [ ] **Step 2: 在 determineFreeEligibility 开头统一业务校验**

进入 `determineFreeEligibility` 后、第一次数据库查询前执行 `validatePassengerBusinessRules` 和 `calculateAgePricing`。create 虽然已经进入事务并获取锁，但纯函数异常会使事务干净回滚。会员查询只遍历非空身份证，显式 `if (!p.idCard) continue`，避免把空值传给会员服务。

- [ ] **Step 3: 实现固定优惠顺序**

整单免费命中时，将所有 passenger pricing 改为相应 order-free reason，`chargedPeople=0`；仍保留 `ageFreePeople` 作为年龄资格统计。整单免费均未命中时：

```ts
const chargedPeople = personCount - ageFreePeople;
const amount = chargedPeople * unitPrice;
const isFree = amount === 0;
const freeReason = isFree ? 'age' : null;
```

- [ ] **Step 4: 创建订单前校验人数一致性**

在任何容量、免费名额或金额计算前检查 `createBookingDto.personCount === passengers.length`。继续落库 `personCount=passengers.length`，不能信任请求数值覆盖。

- [ ] **Step 5: 保存人员计费快照**

使用白名单字段构造保存对象，再由 eligibility 的 `passengerPricing[index]` 显式写入 `ageValue/ageFree/finalCharged/pricingReason` 后 `JSON.stringify`。不得使用 `{ ...p }` 保留前端传入的同名字段，也不得信任前端 age/free/amount。

- [ ] **Step 6: 运行后端回归**

```bash
cd /Users/lufy/Desktop/ff/nest
npx jest src/modules/booking/passenger-pricing.spec.ts src/modules/booking/booking-eligibility.spec.ts --runInBand
npm test
npm run build
```

- [ ] **Step 7: 提交 nest**

```bash
git add src/modules/booking
git commit -m "feat: apply age discounts to booking pricing"
```

### Task 4: 小程序人员纯函数和弹窗组件

**Files:**

- Create: `fctl/utils/passenger-pricing.js`
- Create: `fctl/tests/passenger-pricing.test.js`
- Create: `fctl/components/child-senior-passenger-popup.vue`

**Interfaces:**

```js
export function createAdultPassenger(seed = {})
export function normalizePassenger(passenger, bookingIsFree = false)
export function calculateYearAge(idCard, bookingDate)
export function getPassengerTypeError(passenger, bookingDate)
export function summarizePassengers(passengers)
```

组件 props/events：

```ts
props: {
  visible: Boolean,
  passenger: Object | null,
  bookingDate: String,
  defaultPhone: String,
  mode: 'add' | 'edit',
}
emits: ['confirm', 'close']
```

- [ ] **Step 1: 写前端纯函数失败测试**

覆盖年龄 7/8/69/70、旧乘客补 adult 字段、人员类型汇总、无身份证状态、日期为空时不产生类型错误。

```bash
cd /Users/lufy/Desktop/ff/fctl
node --experimental-default-type=module --test tests/passenger-pricing.test.js
```

- [ ] **Step 2: 实现纯函数并通过测试**

前端结果仅用于即时 UI，不生成可信金额或免费字段提交后端。

- [ ] **Step 3: 实现底部弹窗结构与样式**

严格复用本文 1.4 的交互与样式。组件内部使用草稿副本；关闭不修改父页面。手机号只在新增模式、默认手机号有效时自动带入。身份证直接复用已经落地并测试过的 `normalizeIdCardInput` 和 `getIdCardError`，不得重新实现另一套身份证输入校验。

- [ ] **Step 4: 实现确认校验**

确认事件只返回：

```js
{
  name,
  phone,
  idCard: idCardUnavailable ? '' : normalizedIdCard,
  passengerType: 'child' | 'senior',
  idCardUnavailable,
}
```

不返回 ageFree、ageValue、amount。

- [ ] **Step 5: 提交 fctl**

```bash
git add utils/passenger-pricing.js tests/passenger-pricing.test.js components/child-senior-passenger-popup.vue
git commit -m "feat: add child and senior passenger editor"
```

### Task 5: 小程序改为人员驱动人数

**Files:**

- Modify: `fctl/pages/booking-form/booking-form.vue`

- [ ] **Step 1: 替换人数步进器**

删除 `inputDisplayValue`、`increasePerson`、`decreasePerson`、`onPersonCountInput`、以人数补空卡片的 `syncPassengers`。新增只读人数汇总，任何时候通过：

```js
syncPersonCount() {
  this.formData.personCount = this.formData.passengers.length;
}
```

- [ ] **Step 2: 初始化和旧数据兼容**

新订单首位使用 `createAdultPassenger()`。再次预约或读取旧乘客时逐项 `normalizePassenger`，然后以数组长度覆盖历史 `personCount`。联系人强制为 adult。

- [ ] **Step 3: 普通同行人入口**

“添加普通同行人”点击和儿童/老人弹窗确认写入前都必须即时检查 `maxPerson`，然后才能追加。保留已经落地的姓名常用人员弱提示和主动选择，不重写 `profile-matcher.js`。

- [ ] **Step 4: 儿童/老人弹窗入口**

接入 `child-senior-passenger-popup`。新增时 append；编辑时按人员稳定标识或当前索引原位替换。不得把弹窗人员接入常用人员选择。

- [ ] **Step 5: 修正删除和匹配状态**

联系人不能删除。其他人员删除需确认。给前端人员增加仅 UI 使用的 `_key`，列表使用 `:key="p._key"`；把现有按数组索引保存的 `profileMatchesByIndex` 改为按 `_key` 保存，并同步修改姓名输入、失焦、提示点击、删除、历史载入的全部读写点。提交前移除 `_key` 和已经落地身份证输入逻辑使用的 `idCardError`，避免删除中间项后串位。

- [ ] **Step 6: 修正车型切换**

车型新上限小于当前人数时不修改车型、不删除人员，显示本文 1.3 的确定提示。达到上限时两个添加入口禁用。删除现有 `onVehicleTypeChange` 中自动 `syncPassengers(maxPerson)` 截断数据的行为。

- [ ] **Step 7: 修正表单校验与提交净化**

联系人/成人身份证必填；child/senior 按规则校验。提交 payload 使用 `passengers.map` 白名单字段，不能提交 `_key`、`idCardError`、前端 ageFree 等 UI 状态。`personCount` 始终使用净化后数组长度。

- [ ] **Step 8: 手动验证人数协同**

验证：1 人初始、添加普通人、添加儿童、编辑老人、删除中间人员、达到车型上限、从 3 人切摩托被阻止、常用人员匹配不串位。

- [ ] **Step 9: 提交 fctl**

```bash
git add pages/booking-form/booking-form.vue
git commit -m "feat: drive booking count from passenger list"
```

### Task 6: 小程序费用预览和价格展示

**Files:**

- Modify: `fctl/pages/booking-form/booking-form.vue`

- [ ] **Step 1: 放宽 preview 完整条件**

无身份证 child/senior 视为可预览；adult 仍要求有效身份证；有身份证的 child/senior 必须通过已经落地的身份证校验。预约日期和所有人员字段完整后才请求。正在输入半成品身份证时仅做前端即时提示，不调用 preview。

- [ ] **Step 2: 使用后端费用摘要**

底栏增加：总人数、`ageFreePeople`、`chargedPeople`。`freeReason=age` 显示“年龄免费”，直接创建已确认订单，不调微信支付。

- [ ] **Step 3: 移除错误金额兜底**

年龄优惠启用后，删除现有 `unitPrice * personCount` 金额兜底。人员或日期未完整时显示“请完善信息”；完整信息正在请求时显示“价格计算中”；请求失败时显示“价格计算失败，请重试”并禁止提交。不得按全员收费金额直接下单。

- [ ] **Step 4: 日期变化重新校验**

`bookingDate` 变化时同步运行 `getPassengerTypeError`，给不符人员卡片标红并通过 `hasAgeMismatch` 阻止提交；要求用户编辑或删除，不静默收费。人员编辑、删除、类型切换和日期变化后都要重新计算该状态，不能保留过期错误或漏掉新错误。

- [ ] **Step 5: 接入稳定错误码**

preview/create 失败时先读取 `err.data.code` 并调用 Task 0 的 `getPassengerErrorMessage`；未知 code 才回退后端 message。年龄类型不符、人数不一致、成人免填和人数超限必须显示不同文案。

- [ ] **Step 6: 回归支付分支**

验证会员整单免费、每日整单免费、全部年龄免费、部分年龄免费仍需支付、无身份证正常支付五种路径。

- [ ] **Step 7: 提交 fctl**

```bash
git add pages/booking-form/booking-form.vue
git commit -m "feat: show passenger age pricing preview"
```

### Task 7: 小程序订单详情与历史兼容

**Files:**

- Create: `fctl/utils/passenger-display.js`
- Create: `fctl/tests/passenger-display.test.js`
- Modify: `fctl/pages/booking-detail/booking-detail.vue`

- [ ] **Step 1: 解析人员快照**

在 `passenger-display.js` 实现 `normalizePassengerForDisplay(passenger, booking)`，严格使用本文 2.2 的默认值，供订单详情使用。空身份证显示“未提供”，不显示空字符串。写测试覆盖旧收费订单、旧会员免费、旧每日免费、新年龄免费和无身份证快照。

- [ ] **Step 2: 显示类型和计费状态**

显示联系人、普通同行人、同行儿童、同行老人标签；年龄免费使用绿色状态，未提供身份证使用黄色状态并同时显示“暂时无法投保”。历史详情使用保存的 `ageValue/ageFree/pricingReason`，不重新按当前年份计算。

- [ ] **Step 3: 扩展免费来源文案**

`freeReason=age` 显示“儿童/老人年龄免费”。不得把 age 当作每日免费。

- [ ] **Step 4: 手动验证旧新订单**

至少查看：旧订单无新字段、部分年龄免费收费订单、全部年龄免费订单、无身份证儿童/老人订单。

- [ ] **Step 5: 提交 fctl**

```bash
git add utils/passenger-display.js tests/passenger-display.test.js pages/booking-detail/booking-detail.vue
git commit -m "feat: display passenger age pricing details"
```

### Task 8: 管理后台订单展示

**Files:**

- Modify: `admin/src/types/index.ts`
- Create: `admin/src/utils/passenger.ts`
- Modify: `admin/src/pages/orders/index.tsx`

- [ ] **Step 1: 扩展类型和 JSON 兼容解析**

Passenger 新字段均设为可选以兼容旧订单。在 `admin/src/utils/passenger.ts` 增加 `normalizePassengerForDisplay(passenger, booking)`，严格复刻本文 2.2 的默认值且不重新计算年龄。当前 admin 仓库没有测试运行器，不新增无法执行的测试文件；使用相同夹具在订单详情联调中核对小程序与后台输出一致，并以 TypeScript build 保证类型正确。

- [ ] **Step 2: 详情展示**

每位人员展示类型 Tag、掩码/未提供身份证、年龄免费或正常收费状态；无身份证时另显示“暂时无法投保”。`freeReason=age` 显示年龄免费。

- [ ] **Step 3: 构建检查**

```bash
cd /Users/lufy/Desktop/ff/admin
npm run lint
npm run build
```

- [ ] **Step 4: 提交 admin**

```bash
git add src/types/index.ts src/utils/passenger.ts src/pages/orders/index.tsx
git commit -m "feat: show child and senior booking details"
```

### Task 9: 全链路回归与保险状态检查

- [ ] **Step 1: 后端全量验证**

```bash
cd /Users/lufy/Desktop/ff/nest
npm test
npm run build
```

- [ ] **Step 2: 小程序纯函数验证**

```bash
cd /Users/lufy/Desktop/ff/fctl
node --experimental-default-type=module --test tests/*.test.js
```

- [ ] **Step 3: 后台验证**

```bash
cd /Users/lufy/Desktop/ff/admin
npm run lint
npm run build
```

- [ ] **Step 4: 接口篡改测试**

直接调用 preview/create 验证：成人伪造 unavailable、儿童伪造出生年类型、篡改 personCount、传入前端伪造 ageFree/amount 均不能改变后端结果；断言每类业务拒绝都返回对应稳定 `code`，小程序映射函数能得到不同中文提示。

另外构造“格式看似正确但出生日期无效”和“出生年份符合免费但校验码错误”的身份证，确认两种请求均被后端拒绝。

- [ ] **Step 5: 微信开发者工具全流程**

覆盖普通成人、儿童 7/8 岁、老人 69/70 岁、无身份证儿童/老人、车型上限、跨年日期、会员、每日免费、部分年龄免费、全部年龄免费。

- [ ] **Step 6: 保险文案、状态与日志检查**

搜索并人工确认：无身份证人员在弹窗勾选后、人员卡片、小程序订单详情和管理后台都显示“暂时无法投保”，且没有“已投保”承诺；检查新增日志不包含身份证、手机号、姓名明文。

```bash
cd /Users/lufy/Desktop/ff
rg -n "暂时无法投保|已投保|投保成功|console\\.(log|debug|info).*?(idCard|身份证|phone|手机号|passengers)" fctl nest/src admin/src
```

- [ ] **Step 7: Schema 检查**

确认没有新增 Booking entity 列或生产数据库迁移；新快照只存在 `passengers` JSON。

---

## 5. 2026-08-13 Verification Findings and Repair Tasks

### Task 10: 后端强制车型人数上限

**Severity:** P1，必须修复。当前直接调用 API 可以创建 3 人摩托车或 8 人小型客车订单。

**Files:**

- Modify: `nest/src/modules/booking/passenger-pricing.ts`
- Modify: `nest/src/modules/booking/passenger-pricing.spec.ts`
- Modify: `nest/src/modules/booking/booking.service.ts`
- Modify: `nest/src/modules/booking/booking-eligibility.spec.ts`

**Interfaces:**

```ts
export function getPassengerLimit(
  travelMode?: TravelMode | string | null,
  vehicleType?: VehicleType | string | null,
): number;

export function validatePassengerLimit(
  passengers: PassengerPricingInput[],
  travelMode?: TravelMode | string | null,
  vehicleType?: VehicleType | string | null,
): void;
```

口径固定为：

- `travelMode === 'selfDriving' && vehicleType === 'wheelMotorcycle'`：2 人。
- `travelMode === 'selfDriving' && vehicleType === 'smallCar'`：7 人。
- 非机动车、景区摆渡车及其他出行方式：10 人。
- 后端一律根据 `passengers.length` 判断，不信任 `personCount`。

- [ ] **Step 1: 先写后端失败测试**

至少覆盖：

```ts
expect(getPassengerLimit('selfDriving', 'wheelMotorcycle')).toBe(2);
expect(getPassengerLimit('selfDriving', 'smallCar')).toBe(7);
expect(getPassengerLimit('selfDriving', 'nonMotorized')).toBe(10);
expect(getPassengerLimit('scenicBus', 'smallCar')).toBe(10);

expect(() => validatePassengerLimit(threePassengers, 'selfDriving', 'wheelMotorcycle'))
  .toThrowError(PassengerBusinessException);
expect(() => validatePassengerLimit(eightPassengers, 'selfDriving', 'smallCar'))
  .toThrowError(PassengerBusinessException);
```

对异常响应断言 `code === PASSENGER_LIMIT_EXCEEDED`，且 message 包含对应上限。

```bash
cd /Users/lufy/Desktop/ff/nest
npx jest src/modules/booking/passenger-pricing.spec.ts src/modules/booking/booking-eligibility.spec.ts --runInBand
```

Expected: 修复前测试 FAIL，证明超员请求尚未被拒绝。

- [ ] **Step 2: 实现纯函数与稳定错误**

`validatePassengerLimit` 超限时只抛：

```ts
throw new PassengerBusinessException(
  PassengerErrorCode.LIMIT_EXCEEDED,
  `当前出行方式最多可预约 ${limit} 人`,
);
```

不要将车型上限与景区当日总容量 `morningMaxPeople` 混为同一条规则。

- [ ] **Step 3: preview/create 共用校验**

- `determineFreeEligibility` 在第一次数据库查询前调用 `validatePassengerLimit`，保证 preview 不会接受超员数组。
- `createBooking` 在查询当日容量前同样调用，保证接口被直接调用时也不可绕过。
- 保留现有 `personCount !== passengers.length` 的 `COUNT_MISMATCH` 校验。

- [ ] **Step 4: 运行后端验证并提交**

```bash
cd /Users/lufy/Desktop/ff/nest
npm test
npm run build
git add src/modules/booking/passenger-pricing.ts src/modules/booking/passenger-pricing.spec.ts src/modules/booking/booking.service.ts src/modules/booking/booking-eligibility.spec.ts
git commit -m "fix: enforce passenger vehicle limits"
```

### Task 11: 修正小程序人数上限口径

**Severity:** P1，必须修复。当前 `maxPerson` 只看隐藏的 `vehicleType`，切换为景区摆渡车后仍可能显示小型客车 7 人上限。

**Files:**

- Modify: `fctl/utils/passenger-pricing.js`
- Modify: `fctl/tests/passenger-pricing.test.js`
- Modify: `fctl/pages/booking-form/booking-form.vue`

**Interfaces:**

```js
export function getPassengerLimit(travelMode, vehicleType)
```

前端与 Task 10 使用完全相同的 2/7/10 规则。前端只用于交互提示，后端仍是安全边界。

- [ ] **Step 1: 写失败测试**

```js
assert.equal(getPassengerLimit('selfDriving', 'wheelMotorcycle'), 2);
assert.equal(getPassengerLimit('selfDriving', 'smallCar'), 7);
assert.equal(getPassengerLimit('selfDriving', 'nonMotorized'), 10);
assert.equal(getPassengerLimit('scenicBus', 'smallCar'), 10);
```

```bash
cd /Users/lufy/Desktop/ff/fctl
node --experimental-default-type=module --test tests/passenger-pricing.test.js
```

- [ ] **Step 2: 统一 maxPerson 和切换交互**

```js
maxPerson() {
  return getPassengerLimit(this.formData.travelMode, this.formData.vehicleType);
}
```

- `onTravelPickerChange` 切换出行方式前先试算新上限；如当前人数超限，回退原出行方式并提示，不删除人员。
- `onVehicleTypeChange` 使用同一纯函数试算，不再临时改写 `formData.vehicleType` 来读 computed。
- 切到 `scenicBus` 时上限必须是 10，不受之前隐藏的 `vehicleType` 影响。
- 实际写入人员数组前仍保留二次上限检查。

- [ ] **Step 3: 回归与提交**

手动验证：摩托车 2 人、小客车 7 人、非机动车 10 人、摆渡车 10 人；已有 3 人时不得切到摩托车，不得删除已填人员。

```bash
cd /Users/lufy/Desktop/ff/fctl
node --experimental-default-type=module --test tests/*.test.js
git add utils/passenger-pricing.js tests/passenger-pricing.test.js pages/booking-form/booking-form.vue
git commit -m "fix: align passenger vehicle limits"
```

### Task 12: 拒绝未来出生年份获得儿童免费

**Severity:** P1，必须修复。已复现“有效校验码 + 2030 年出生”在预约 2026 年时得到 `age=-4`，并被当作儿童免费。

**Files:**

- Modify: `nest/src/modules/booking/passenger-pricing.ts`
- Modify: `nest/src/modules/booking/passenger-pricing.spec.ts`
- Modify: `fctl/utils/passenger-pricing.js`
- Modify: `fctl/tests/passenger-pricing.test.js`

- [ ] **Step 1: 先写未来出生年失败测试**

使用测试中已有的身份证校验码生成辅助函数，构造出生日期 `20300101`、预约日期 `2026-08-13` 的校验码正确身份证。

```ts
expect(calculateYearAge(futureIdCard, '2026-08-13')).toBe(-4);
expect(() => validatePassengerBusinessRules([adult, futureChild], '2026-08-13'))
  .toThrowError(PassengerBusinessException);
```

断言错误码为 `PASSENGER_TYPE_AGE_MISMATCH`，不得返回年龄免费。前端 `getPassengerTypeError` 也必须对 `age < 0` 返回明确错误。

- [ ] **Step 2: 最小修复**

保留“预约年份 - 出生年份”的既定粗略计算，不改成按月日精确年龄。儿童年龄条件改为：

```ts
const ageOk = age !== null && age >= 0 && (
  isChild ? age <= CHILD_MAX_AGE : age >= SENIOR_MIN_AGE
);
```

`calculateAgePricing` 的儿童免费条件也必须包含 `age >= 0`，防止未来调用方漏掉前置校验时错误免费。

- [ ] **Step 3: 验证并分别提交**

```bash
cd /Users/lufy/Desktop/ff/nest
npx jest src/modules/booking/passenger-pricing.spec.ts --runInBand
npm test
npm run build
git add src/modules/booking/passenger-pricing.ts src/modules/booking/passenger-pricing.spec.ts
git commit -m "fix: reject future passenger birth years"

cd /Users/lufy/Desktop/ff/fctl
node --experimental-default-type=module --test tests/passenger-pricing.test.js
git add utils/passenger-pricing.js tests/passenger-pricing.test.js
git commit -m "fix: flag future passenger birth years"
```

### Task 13: 统一身份证业务错误码

**Severity:** P2，建议本次一并修复。当前 17 位、非法日期等输入会先被 DTO `@Matches` 拦截，返回没有 `code` 的普通 400，导致已定义的 `PASSENGER_ID_CARD_INVALID` 不稳定。

**Files:**

- Modify: `nest/src/modules/booking/dto/createBooking.dto.ts`
- Modify: `nest/src/modules/booking/dto/passenger-dto.spec.ts`
- Modify: `nest/src/modules/booking/passenger-pricing.ts`
- Modify: `nest/src/modules/booking/passenger-pricing.spec.ts`

- [ ] **Step 1: 写失败测试**

使 preview 和 create 的 `PassengerDto` 对 `idCard` 只保留字段白名单，将身份证完整业务校验交给 `validatePassengerBusinessRules`。测试覆盖：

```ts
// DTO 不抢先生成无 code 的格式错误
expect(await validatePassengerDto({ idCard: '123' })).toHaveLength(0);

// 业务层统一返回稳定错误码
expectPassengerCode(idCard17Digits, PassengerErrorCode.ID_CARD_INVALID);
expectPassengerCode(invalidCalendarDateIdCard, PassengerErrorCode.ID_CARD_INVALID);
expectPassengerCode(badChecksumIdCard, PassengerErrorCode.ID_CARD_INVALID);
expectPassengerCode(123456789 as unknown as string, PassengerErrorCode.ID_CARD_INVALID);
```

- [ ] **Step 2: 将身份证校验收口到业务层**

- `PassengerDto.idCard` 保留 `@IsOptional()` 以便通过 whitelist，移除会抢先生成普通 400 的 `@Matches`/`@IsString`。
- `validatePassengerBusinessRules` 先判断“字段已提供但不是字符串”，抛 `ID_CARD_INVALID`；再处理空值、unavailable 互斥、严格格式/日期/校验码。
- preview/create 继续复用同一 `PassengerDto` 与同一业务函数。
- 不要修改全局 `ValidationPipe`，避免影响其他业务 DTO。

- [ ] **Step 3: 验证与提交**

```bash
cd /Users/lufy/Desktop/ff/nest
npx jest src/modules/booking/dto/passenger-dto.spec.ts src/modules/booking/passenger-pricing.spec.ts --runInBand
npm test
npm run build
git add src/modules/booking/dto/createBooking.dto.ts src/modules/booking/dto/passenger-dto.spec.ts src/modules/booking/passenger-pricing.ts src/modules/booking/passenger-pricing.spec.ts
git commit -m "fix: stabilize passenger id card errors"
```

### Task 14: 修正服务协议中的保险承诺

**Severity:** P1，必须修复。当前协议仍承诺“所支付费用包含为您及同行人员购置保险”，与“无身份证儿童/老人正常收费但暂时无法投保”直接冲突。

**Files:**

- Modify: `fctl/pages/service/service.vue`

- [ ] **Step 1: 修正实名制条款**

将“预约时须填写本人及同行人员身份证”改为：

```text
联系人和普通同行人必须如实填写姓名、身份证号和手机号；通过“添加同行儿童/老人”添加的人员如暂时无法提供身份证号，可按页面提示继续预约。
```

- [ ] **Step 2: 修正支付与保险条款**

保留现有保险介绍，但必须加入明确例外：

```text
对已提供投保所需有效身份信息的出行人，所支付费用包含入园游览保险费用。选择“暂时无法提供身份证号”的儿童/老人虽可继续预约并按正常价格收费，但因缺少投保必需信息，该人员暂时无法投保。
```

不得将无身份证人员表述为已投保、投保成功或已获得保险保障。

- [ ] **Step 3: 搜索回归并提交**

```bash
cd /Users/lufy/Desktop/ff/fctl
rg -n "所支付的费用包含|暂时无法投保|已投保|投保成功" pages components
git add pages/service/service.vue
git commit -m "fix: clarify insurance exception for no-id passengers"
```

### Task 15: 后台联系人身份证统一脱敏

**Severity:** P2，必须在上线前修复。当前人员列表已掩码，但订单详情顶部仍直接显示 `currentRecord.idCard`。

**Files:**

- Modify: `admin/src/pages/orders/index.tsx`

- [ ] **Step 1: 使用已有脱敏函数**

```tsx
<Descriptions.Item label="身份证号" span={2}>
  {maskIdCardText(currentRecord.idCard)}
</Descriptions.Item>
```

不要新增第二套脱敏实现；复用 `admin/src/utils/passenger.ts` 的 `maskIdCardText`。

- [ ] **Step 2: 验证新旧订单**

- 18 位身份证只显示前 4 位、后 4 位和中间掩码。
- 空身份证显示“未提供”。
- 顶部联系人和下方人员列表不得出现任何身份证明文。

- [ ] **Step 3: 在正确 Node 版本下验证并提交**

`admin/package.json` 要求 Node `20.19.0`，不得用 Node 18 的 Vite 失败冒充代码构建结果。

```bash
cd /Users/lufy/Desktop/ff/admin
node --version
npx eslint src/pages/orders/index.tsx src/types/index.ts src/utils/passenger.ts
npx tsc -b
npm run build
git add src/pages/orders/index.tsx
git commit -m "fix: mask contact id card in order details"
```

Expected: `node --version` 为 `v20.19.0`，或另一个满足 Vite 要求的 Node 22.12+。如本机只有 Node 18，必须如实报告构建受环境阻塞，不得声称 build 通过。

### Task 16: 修复后总回归与交付门禁

- [ ] **Step 1: 后端完整验证**

```bash
cd /Users/lufy/Desktop/ff/nest
npm test
npm run build
```

必须看到原有 71 项 Jest + 2 项 SQLite 诊断测试继续通过，且新增车型上限、未来出生年、稳定错误码用例通过。总数应高于本次修复前基线。

- [ ] **Step 2: 小程序完整纯函数验证**

```bash
cd /Users/lufy/Desktop/ff/fctl
node --experimental-default-type=module --test tests/*.test.js
```

必须看到原有 52 项继续通过，且新增 2/7/10 人上限和未来出生年用例通过。

- [ ] **Step 3: 后台验证**

```bash
cd /Users/lufy/Desktop/ff/admin
node --version
npx eslint src/pages/orders/index.tsx src/types/index.ts src/utils/passenger.ts
npx tsc -b
npm run build
```

已知全量 `npm run lint` 在本次修复前就会被两个无关历史问题拦住：`src/pages/feedbacks/index.tsx` 的 `react-hooks/set-state-in-effect` 错误，以及 `src/pages/system-config/index.tsx` 的 `exhaustive-deps` 警告。本任务不授权顺手修改这两个无关页面；需单独报告该基线情况。

- [ ] **Step 4: 接口防绕过验证**

直接调用 preview 和 create，不经过小程序 UI，至少验证：

1. 3 人摩托车：拒绝，`code=PASSENGER_LIMIT_EXCEEDED`。
2. 8 人小型客车：拒绝，`code=PASSENGER_LIMIT_EXCEEDED`。
3. 10 人景区摆渡车：允许进入正常费用预览；11 人拒绝。
4. 校验码正确但出生年晚于预约年的儿童：拒绝，不获得免费。
5. 17 位、非法日期、错误校验码和非字符串身份证：均返回 `PASSENGER_ID_CARD_INVALID`。

- [ ] **Step 5: 微信开发者工具手动验证**

流程：`进入预约页 → 景区摆渡车显示 10 人上限 → 切换小客车/摩托车 → 添加儿童/老人 → 勾选暂时无法提供 → 确认正常收费与暂时无法投保提示 → 提交 → 支付/免费分支 → 订单详情`。

重点检查：已填人员不被车型切换删除，人数摘要与人员卡片一致，保险例外文案可见，订单详情没有身份证明文。

- [ ] **Step 6: 差异与安全检查**

```bash
git -C /Users/lufy/Desktop/ff/fctl diff --check
git -C /Users/lufy/Desktop/ff/nest diff --check
git -C /Users/lufy/Desktop/ff/admin diff --check

rg -n "已投保|投保成功|console\\.(log|debug|info).*?(idCard|身份证|phone|手机号|passengers)" \
  /Users/lufy/Desktop/ff/fctl \
  /Users/lufy/Desktop/ff/nest/src \
  /Users/lufy/Desktop/ff/admin/src
```

检查最终 diff 只包含 Task 10–15 的相关文件，不得修改无关反馈页、系统配置页、支付实现、数据库 schema 或生产迁移。

---

## 6. Acceptance Checklist

- [ ] 普通人员表单中没有“暂时无法提供身份证号”。
- [ ] 儿童/老人弹窗与现有底部弹层风格一致。
- [ ] 人数完全由人员列表决定，页面没有手动人数步进器。
- [ ] 联系人和普通同行人无法免填身份证。
- [ ] 无身份证儿童/老人可以预约但按正常价格收费。
- [ ] 7 岁儿童和 70 岁老人免费，8 岁和 69 岁收费/类型不符。
- [ ] 会员整单免费优先于每日免费，每日免费优先于年龄免费。
- [ ] 所有人年龄免费时订单金额 0、`freeReason=age`，直接确认而不支付。
- [ ] 部分年龄免费时只按收费人数计算金额。
- [ ] 车型切换不会自动删除人员。
- [ ] `personCount` 篡改被后端拒绝。
- [ ] 伪造出生年份、无效日期或错误校验码不能获得年龄免费。
- [ ] 出生年份晚于预约年份时不能以负年龄获得儿童免费。
- [ ] 后端 preview/create 均拒绝 3 人摩托车、8 人小客车和 11 人其他出行方式。
- [ ] 景区摆渡车前端与后端上限均为 10，不受隐藏车型字段影响。
- [ ] 所有身份证业务校验失败均返回稳定业务错误码，非法身份证为 `PASSENGER_ID_CARD_INVALID`。
- [ ] 订单保存人员类型和计费快照，历史详情不重新计算。
- [ ] 旧订单仍可在小程序和后台正常展示。
- [ ] 小程序服务协议已明确无身份证儿童/老人的保险例外，不再承诺所有收费人员都已投保。
- [ ] 管理后台订单详情顶部和人员列表均不显示身份证明文。
- [ ] 未提供身份证人员没有被显示为已投保。
- [ ] 未提供身份证的儿童/老人在弹窗、人员卡片、小程序详情和后台均明确显示“暂时无法投保”。
- [ ] 无身份证人员的暂时无法投保状态不阻止预约、正常收费或发布。

## 7. Release Order

1. 先发布 `nest`，使接口兼容新旧 Passenger 输入并能返回新费用字段。
2. 发布 `admin`，确保新订单可以被工作人员正确识别。
3. 最后发布 `fctl` 小程序，开放儿童/老人弹窗入口。

回滚小程序不会破坏后端兼容；回滚后端前必须先回滚小程序，否则新 Passenger 请求会被旧 DTO 拒绝。
