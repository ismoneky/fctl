// utils/request.js

// 通用请求封装
export const request = (options) => {
    const baseURL = 'https://www.hbfctl.com.cn/'; // 根据环境切换
	const header = options.header || {};
	header.Authorization = `Bearer ${uni.getStorageSync('token')}`
    return new Promise((resolve, reject) => {
        uni.request({
            url: baseURL + "api/" + options.url, // 请求地址
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
