// 退款是独立状态，不改变订单 confirmed，展示时必须优先识别。
export function getBookingDisplayStatus(booking = {}) {
  if (booking.status === 'expired') return 'expired';
  if (booking.refundStatus === 'refunded' || booking.paymentStatus === 'refunded') return 'refunded';
  if (booking.refundStatus === 'refunding' || booking.paymentStatus === 'refunding') return 'refunding';
  return booking.status || '';
}

export function getRequestFailureMessage(error, fallback) {
  const body = error && error.data && typeof error.data === 'object' ? error.data : error;
  const values = [body && body.message, body && body.error, error && error.message];
  // 旧接口的 message 是通用英文描述，具体业务拒绝原因在 error 中。
  const chineseReason = values.find(value => typeof value === 'string' && /[\u4e00-\u9fff]/.test(value));
  if (chineseReason && !Array.isArray(body && body.message)) return chineseReason;
  for (const value of values) {
    const text = Array.isArray(value) ? value.filter(v => typeof v === 'string').join('\n') : value;
    if (typeof text === 'string' && text.trim()) return text;
  }
  return fallback;
}
