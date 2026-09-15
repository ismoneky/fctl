const ORDER_DELETE_PROMPTS = Object.freeze({
  pending: '当前订单待支付，删除后将无法继续支付该订单。',
  confirmed: '当前订单待使用，删除后预约凭证将无法查看，请确认已不再使用。',
  completed: '该订单已完成，删除后将无法再次查看订单信息。',
  cancelled: '该订单已取消，删除后将无法再次查看取消记录。',
  refunded: '该订单已退款，删除后退款记录将无法再次查看。',
  expired: '该订单已过期，删除后相关退款进度或申请入口将无法查看。',
});

const FALLBACK_DELETE_PROMPT = '删除后将无法再次查看该订单。';

export function getOrderDeletePrompt(status) {
  return ORDER_DELETE_PROMPTS[status] || FALLBACK_DELETE_PROMPT;
}
