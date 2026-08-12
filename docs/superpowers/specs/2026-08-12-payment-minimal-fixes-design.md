# 小程序支付流程最小修复设计

## 目标

在不修改后端、不新增页面、不加入日志功能、保持现有支付调用方式不变的前提下，修复小程序当前支付改动中已确认的四个问题：

1. 创建预约请求超过两秒时可能重复提交并生成多个订单。
2. 支付准备异常后的状态复查没有被等待，按钮锁和模块锁释放过早。
3. 支付结果轮询在页面卸载后仍可能继续执行。
4. 订单详情页可能同时存在多条五秒刷新定时器链。

本期只修改以下三个文件：

- `utils/payment.js`
- `pages/booking-form/booking-form.vue`
- `pages/booking-detail/booking-detail.vue`

## 模块与页面职责

`utils/payment.js` 是支付行为的模块。它负责支付参数请求、按订单去重、稳定错误码处理、异常后的状态复查、微信支付拉起、支付结果轮询以及轮询清理。

预约表单页和订单详情页只负责页面状态、按钮展示和跳转，不自行判断微信支付结果，也不自行维护支付状态查询流程。

现有外部接口保持不变：

```js
handlePayment(bookingId, onSuccess)
```

新增一个页面生命周期清理接口：

```js
stopPaymentPolling(bookingId)
```

## `utils/payment.js`

### 支付准备任务

继续使用模块级 `Map` 按 `bookingId` 保存正在进行的支付准备 Promise。同一订单在支付准备任务结束前重复调用 `handlePayment` 时，返回同一个 Promise。

支付准备任务覆盖以下步骤：

1. 请求支付参数，单独使用 25 秒超时。
2. 支付参数成功时拉起 `uni.requestPayment`。
3. 支付参数请求发生超时、结果未知或已支付响应时，等待一次本地支付状态查询完成。

支付准备任务不等待微信支付回调。微信支付面板成功或失败关闭后，另行启动支付结果轮询。

### 异常状态复查

`handlePayPrepError` 和 `checkPayStatusOnce` 必须返回 Promise，禁止以 fire-and-forget 方式发起状态查询。

错误处理结果分为两类：

- 状态查询确认 `paid`：显示支付成功，执行 `onSuccess`，支付准备 Promise 按成功结束，不再触发页面失败分支。
- 未确认已支付或状态查询失败：显示对应提示，支付准备 Promise 在提示完成后 reject，由页面进入订单详情或恢复按钮。

错误码处理规则：

| 错误码或情况 | 处理方式 |
| --- | --- |
| `ORDER_ALREADY_PAID` | 查询一次支付状态；确认已支付后按成功处理 |
| `PAYMENT_PREPARATION_TIMEOUT` | 查询一次状态；未支付时提示“支付准备超时，可在订单详情重试” |
| `PAYMENT_RESULT_UNKNOWN` | 查询一次状态；未确认时提示结果确认中 |
| `CLOSE_ORDER_UNKNOWN` | 与结果未知相同 |
| `QUERY_ORDER_UNKNOWN` | 与结果未知相同 |
| `PAYMENT_START_REJECTED` | 不查单；优先显示 `err.data.error`，缺失时使用通用中文提示 |
| 网络超时或其他网络异常 | 按结果未知处理，先查询一次状态 |

### 支付结果轮询

保留递归 `setTimeout` 实现：每次请求结束后再安排下一次查询，不使用 `setInterval`，避免请求重叠。

新增模块级支付轮询停止函数 Map：

- 同一 `bookingId` 启动新轮询前先停止旧轮询。
- `pollPaymentStatus` 正常成功、达到重试上限或被页面停止时，从 Map 删除停止函数。
- `stopPaymentPolling(bookingId)` 只停止指定订单的轮询并关闭其 loading，不影响其他订单。
- `finished` 标记继续保证成功回调和最终提示最多执行一次。

## 预约表单页

### 页面状态

增加：

```js
submitting: false,
activePaymentBookingId: ''
```

保留现有：

```js
paymentLaunching: false
```

`submitting` 表示正在创建预约订单；`paymentLaunching` 只表示正在准备支付，两者不得混用。

### 提交流程

表单校验通过后、调用 `POST /bookings` 前设置 `submitting=true`。`submitting` 或 `paymentLaunching` 为 true 时，`handleSubmit` 直接返回，按钮处于禁用状态。

状态交接规则：

- 创建失败：恢复 `submitting=false`。
- 免费订单创建成功：保持禁用，等待跳转订单详情。
- 收费订单创建成功：设置 `activePaymentBookingId`，由 `submitting` 交接给 `paymentLaunching`，不得出现两个状态同时为 false 的可重复提交窗口。
- 免费条件变化：弹出确认框期间保持 `submitting=true`；确认支付时交接给 `paymentLaunching`，取消时直接进入订单详情。
- 支付准备异常：等待支付模块完成状态复查后，再进入已经创建的订单详情。

按钮文案按以下优先级显示：

```text
submitting       -> 提交中…
paymentLaunching -> 支付准备中…
其他             -> 立即预约
```

页面卸载时，如果存在 `activePaymentBookingId`，调用 `stopPaymentPolling(activePaymentBookingId)`。

## 订单详情页

保留现有 `paymentLaunching` 支付准备锁，并在支付 Promise 完成后释放。异常状态复查完成前不得恢复支付按钮。

在页面数据中明确声明：

```js
timer: null
```

新增 `clearDetailTimer`，并遵守以下规则：

- `loopDetail` 创建新五秒定时器前先清理旧定时器。
- 详情重新加载后，无论订单是否仍为 `confirmed`，都先清理上一条定时器链。
- 定时器触发时先把当前 `timer` 置空，再请求详情并决定是否继续下一轮。
- `onUnload` 依次清理倒计时、详情刷新定时器和当前订单的支付轮询。

支付成功后继续重新读取订单详情，展示最新状态和二维码。

## 不在本期范围

- 后端支付逻辑和错误码结构。
- 小程序日志采集与上报。
- 新页面或新的支付入口。
- 修改支付轮询次数和时间间隔。
- 修改微信支付参数结构。
- 与本次四个问题无关的页面样式和业务流程。

## 验收标准

1. 创建订单接口响应较慢时连续点击“立即预约”，只发送一次创建请求、只生成一个订单。
2. 支付准备超时或返回结果未知时，先完成一次支付状态查询，再释放按钮锁或进入详情。
3. `ORDER_ALREADY_PAID` 查询确认已支付后只执行一次成功跳转，不再执行失败跳转。
4. `PAYMENT_START_REJECTED` 显示后端 `error` 字段的具体中文信息；字段缺失时显示通用中文提示。
5. 微信支付成功和用户取消支付都继续轮询本地支付状态，不直接把订单判为失败。
6. 页面卸载后，所属订单的支付轮询停止，不再弹 Toast 或调用已卸载页面的回调。
7. 订单详情页任意时刻最多存在一条五秒刷新定时器链。
8. 支付准备结束后按钮可恢复；不会因订单长期为 `PAYING` 而永久禁用。
9. 正常收费支付、免费预约、免费条件变化、支付取消后详情重试的原有流程保持不变。

## 手工验证场景

1. 将创建订单请求延迟到三秒以上，连续点击预约按钮，确认只产生一次请求。
2. 正常创建收费订单并完成微信支付，确认进入详情且展示已确认状态。
3. 在微信支付面板取消，确认查单后订单仍可在详情重新支付。
4. 模拟支付准备接口 25 秒超时，确认先请求 `pay-status`，随后进入详情并恢复重试入口。
5. 模拟 `ORDER_ALREADY_PAID`，确认只出现一次成功提示和一次跳转。
6. 模拟 `PAYMENT_START_REJECTED`，确认显示后端具体错误且允许在详情重试。
7. 支付轮询期间退出页面，确认退出后没有支付 Toast 或页面跳转。
8. 多次触发详情 `onShow` 和支付成功刷新，确认始终只有一个五秒定时器。
