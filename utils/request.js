// utils/request.js

/**
 * 重试参数（只在 `retry: true` 的调用点上生效）
 *
 * ⚠️ **默认关闭，必须显式开启**。自动重试只对**幂等请求**安全：
 * 价格预览、名额查询这类重发一次不会有副作用；而下单（POST /bookings）、
 * 发起支付（/pay）、退款申请（/refund-apply）、删除订单一旦被自动重试，
 * 就是重复下单、重复发起退款 —— 所以这个开关绝不能做成全局默认。
 *
 * 重试次数与退避取 2 次 / 300ms / 800ms：价格预览是用户正盯着等的交互，
 * 退避太久体验比失败还差；而偶发的连接层问题（切网、连接被复用失效）
 * 在毫秒级重发一次基本就能过。
 */
const RETRY_MAX = 2;
const RETRY_DELAYS_MS = [300, 800];

/**
 * 只重试 5xx。
 *
 * 4xx **一律不重试**：那是确定性结论，同样的参数再发一次必然还是 4xx
 * （校验不通过、无权限、订单不存在），重试只是让用户白等两次。
 */
const shouldRetryStatus = (statusCode) => statusCode >= 500;

// 通用请求封装
export const request = (options) => {
    const baseURL = 'https://www.hbfctl.com.cn/'; // 根据环境切换
    const prefix = 'api'; // 接口前缀：nginx 上 /test/ 反代到后端根路径，与原先的 /api/ 同一套规则
    // 削掉调用方 url 的前导斜杠，统一由这里补一个再拼。
    // 全仓两种写法都有（'/bookings' 和 'bookings'），直接字符串相加时后者会拼成
    // `/testbookings`——它匹配不上 nginx 的 `/test/` location，会被兜底到 admin 的 SPA，
    // 返回一段 HTML 而不是 404，排查时极具迷惑性。
    const path = String(options.url || '').replace(/^\/+/, '');
    const timeout = options.timeout || 60000; // 超时时间，默认 60 秒
    const maxRetry = options.retry === true ? RETRY_MAX : 0;

    /**
     * 发一次请求。`attempt` 从 0 起，即第 `attempt + 1` 次尝试。
     *
     * header 在这里逐次构造而不是提到外面：token 每次重发都重新读一遍存储，
     * 首次请求因 token 尚未落盘而 401 时，重试顺带就恢复了。
     * （注意 401 本身不触发重试——那是 4xx——但重试的时机常常正好晚于 token 写入。）
     */
    const send = (attempt) => new Promise((resolve, reject) => {
        const header = options.header || {};
        header.Authorization = `Bearer ${uni.getStorageSync('token')}`;
        uni.request({
            url: `${baseURL}${prefix}/${path}`, // 请求地址
            method: options.method || 'GET', // 请求方法，默认为 GET
            data: options.data || {}, // 请求数据
            header: header, // 请求头
            timeout: timeout,
            success: (res) => {
                // 放宽状态码校验，允许 2xx 范围内的状态码作为成功
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(res.data);
                    return;
                }
                if (attempt < maxRetry && shouldRetryStatus(res.statusCode)) {
                    setTimeout(() => send(attempt + 1).then(resolve, reject), RETRY_DELAYS_MS[attempt]);
                    return;
                }
                reject(res);
            },
            fail: (err) => {
                // fail = 请求根本没拿到响应：超时、断网、切网、连接被中断。
                // 这类失败没有状态码可判，但正是重试最有效的场景
                if (attempt < maxRetry) {
                    setTimeout(() => send(attempt + 1).then(resolve, reject), RETRY_DELAYS_MS[attempt]);
                    return;
                }
                reject(err);
            },
        });
    });

    return send(0);
};
