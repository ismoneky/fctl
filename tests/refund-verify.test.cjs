const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function component(path, globals = {}) {
  const source = fs.readFileSync(`${__dirname}/../pages/${path}/${path}.vue`, 'utf8');
  const script = source.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1]
    .replace(/import[\s\S]*?from\s*['"][^'"]+['"];?/g, '')
    .replace('export default', 'module.exports =');
  const context = { module: { exports: {} }, myTabBar: {}, LocationPickerPopup: {}, OrderDeleteConfirm: {}, ...globals };
  const utilityPath = `${__dirname}/../utils/booking-status.js`;
  if (fs.existsSync(utilityPath)) vm.runInNewContext(fs.readFileSync(utilityPath, 'utf8').replace(/export /g, ''), context);
  vm.runInNewContext(script, context);
  return context.module.exports;
}
test('扫码失败显示服务端退款原因，而不是笼统失败', async () => {
  const ctx = {};
  const c = component('profile', {
    wx: { scanCode: o => o.success({ result: 'TL-TEST' }) },
    uni: { showLoading() {}, hideLoading() {} },
    request: () => Promise.reject({ data: { message: '订单退款中，核验码已失效，无法入场' } }),
  });
  c.methods.handleScan.call(ctx);
  await new Promise(setImmediate);
  assert.match(ctx.verifyModal.message, /订单退款中/);
});
test('退款开始即遮挡二维码，接口成功后不等弹窗关闭就刷新', async () => {
  let resolveRefund;
  let first = true;
  let refreshes = 0;
  const c = component('booking-detail', {
    uni: { showModal(o) { if (first) { first = false; o.success({ confirm: true }); } }, showLoading() {}, hideLoading() {} },
    request: () => new Promise(resolve => { resolveRefund = resolve; }),
  });
  const ctx = { formData: { bookingId: 'TL-TEST', status: 'confirmed' }, clearDetailTimer() {}, getBookingDetail() { refreshes++; } };
  c.methods._doRefund.call(ctx);
  assert.equal(ctx.refundPending, true);
  resolveRefund({ success: true });
  await new Promise(setImmediate);
  assert.equal(refreshes, 1);
});
test('旧详情请求不能覆盖退款开始后的页面状态', async () => {
  let resolveDetail;
  const c = component('booking-detail', {
    uni: { showLoading() {}, hideLoading() {} },
    request: () => new Promise(resolve => { resolveDetail = resolve; }),
    normalizePassengerListForDisplay: () => [],
  });
  const ctx = { formData: { status: 'confirmed' }, detailRequestId: 0, startCountdown() {}, clearDetailTimer() {}, loopDetail() {} };
  c.methods.getBookingDetail.call(ctx, 'TL-TEST');
  ctx.detailRequestId++;
  ctx.formData.refundStatus = 'refunding';
  resolveDetail({ success: true, data: { status: 'confirmed', refundStatus: 'none' } });
  await new Promise(setImmediate);
  assert.equal(ctx.formData.refundStatus, 'refunding');
});
test('2xx业务失败不能显示核验成功', async () => {
  const ctx = {};
  const c = component('profile', {
    wx: { scanCode: o => o.success({ result: 'TL-TEST' }) },
    uni: { showLoading() {}, hideLoading() {} },
    request: () => Promise.resolve({ success: false, message: '订单已退款' }),
  });
  c.methods.handleScan.call(ctx);
  await new Promise(setImmediate);
  assert.equal(ctx.verifyModal.success, false);
  assert.match(ctx.verifyModal.message, /已退款/);
});
test('退款中的confirmed订单不可展示二维码', () => {
  const c = component('booking-detail');
  assert.equal(typeof c.computed.canShowQr, 'function', '缺少退款感知的二维码显示判断');
  assert.equal(c.computed.canShowQr.call({ formData: { status: 'confirmed', refundStatus: 'refunding', bookingId: 'TL-TEST' }, refundPending: false }), false);
});
test('退款列表和详情展示采用同一优先级，过期审核流程保持原状', () => {
  const c = component('booking');
  assert.equal(c.methods.getBookingDisplayStatus({ status: 'confirmed', refundStatus: 'refunding' }), 'refunding');
  assert.equal(c.methods.getBookingDisplayStatus({ status: 'confirmed', refundStatus: 'refunded' }), 'refunded');
  assert.equal(c.methods.getBookingDisplayStatus({ status: 'expired', refundStatus: 'refunding' }), 'expired');
  assert.equal(c.methods.getStatusText('refunding'), '退款中');
});
test('网络异常不误报订单无效，提示结果未确认', async () => {
  const ctx = {};
  const c = component('profile', {
    wx: { scanCode: o => o.success({ result: 'TL-TEST' }) },
    uni: { showLoading() {}, hideLoading() {} },
    request: () => Promise.reject({ errMsg: 'request:fail timeout' }),
  });
  c.methods.handleScan.call(ctx);
  await new Promise(setImmediate);
  assert.match(ctx.verifyModal.message, /未能确认核验结果/);
});
test('退款后的详情查询失败时保持二维码遮挡', async () => {
  const c = component('booking-detail', {
    uni: { showLoading() {}, hideLoading() {}, showToast() {} },
    request: () => Promise.reject({ errMsg: 'timeout' }),
  });
  const ctx = { detailRequestId: 0, formData: { status: 'confirmed', bookingId: 'TL-TEST' }, refundPending: true };
  await c.methods.getBookingDetail.call(ctx, 'TL-TEST');
  assert.equal(ctx.refundPending, true);
  assert.equal(c.computed.canShowQr.call(ctx), false);
});
test('失败提示优先保留具体中文业务原因，数组原因不截断', () => {
  const c = {};
  vm.runInNewContext(fs.readFileSync(`${__dirname}/../utils/booking-status.js`, 'utf8').replace(/export /g, ''), c);
  assert.equal(c.getRequestFailureMessage({ data: { message: 'Failed to initiate refund', error: '退款申请处理中，请勿重复提交' } }, '失败'), '退款申请处理中，请勿重复提交');
  assert.equal(c.getRequestFailureMessage({ data: { message: ['原因一', '原因二'] } }, '失败'), '原因一\n原因二');
});
