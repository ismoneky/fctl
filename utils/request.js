// utils/request.js

// 通用请求封装
export const request = (options) => {
    const baseURL = 'https://www.hbfctl.com.cn/'; // 根据环境切换
    const prefix = 'test'; // 接口前缀：nginx 上 /test/ 反代到后端根路径，与原先的 /api/ 同一套规则
	const header = options.header || {};
	header.Authorization = `Bearer ${uni.getStorageSync('token')}`
    // 削掉调用方 url 的前导斜杠，统一由这里补一个再拼。
    // 全仓两种写法都有（'/bookings' 和 'bookings'），直接字符串相加时后者会拼成
    // `/testbookings`——它匹配不上 nginx 的 `/test/` location，会被兜底到 admin 的 SPA，
    // 返回一段 HTML 而不是 404，排查时极具迷惑性。
    const path = String(options.url || '').replace(/^\/+/, '');
    return new Promise((resolve, reject) => {
        uni.request({
            url: `${baseURL}${prefix}/${path}`, // 请求地址
            method: options.method || 'GET', // 请求方法，默认为 GET
            data: options.data || {}, // 请求数据
            header: header, // 请求头
            timeout: options.timeout || 60000, // 超时时间，默认 60 秒
            success: (res) => {
                // 放宽状态码校验，允许 2xx 范围内的状态码作为成功
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(res.data);
                } else {
                    reject(res);
                }
            },
            fail: (err) => {
                reject(err);
            },
        });
    });
};
