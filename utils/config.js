// utils/config.js

const config = {
    baseURL: process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' // 开发环境
        : 'https://your-production-domain.com', // 生产环境
};

export default config;