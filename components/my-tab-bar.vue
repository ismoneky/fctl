<template>
    <view class="tab-bar-wrap">
        <view class="tab-bar">
            <view class="tab-bar-item" v-for="(item, index) in list" :key="index" @click="switchTab(item, index)">
                <view class="tab-icon-wrap">
                    <image class="tab-icon-svg" :src="current === index ? item.iconActive : item.iconNormal" mode="aspectFit" />
                    <!-- 小红点：哪个 tab 有未读由 list 里的 badge 决定（目前只有「我的」有） -->
                    <view v-if="item.badge && unread > 0" class="tab-dot"></view>
                </view>
                <text class="tab-text" :class="{ 'active': current === index }">{{ item.text }}</text>
            </view>
        </view>
    </view>
</template>

<script>
export default {
    name: "my-tab-bar",
    props: {
        current: {
            type: Number,
            default: 0
        },
        /**
         * 未读消息数（>0 时在带 badge 的 tab 上显示小红点）
         *
         * 默认 0 而不是必填：这个组件在三个 tab 页各用一次，漏传一个 prop
         * 会让那个页面的红点永远是「无未读」——静默失效且很难发现，
         * 所以默认值取「不显示」而不是「显示」。
         */
        unread: {
            type: Number,
            default: 0
        }
    },
    data() {
        return {
            list: [
                {
                    pagePath: "/pages/index/index",
                    text: "首页",
                    iconNormal: "/static/svg/tab-home-normal.svg",
                    iconActive: "/static/svg/tab-home-active.svg"
                },
                {
                    pagePath: "/pages/booking/booking",
                    text: "预约",
                    iconNormal: "/static/svg/tab-booking-normal.svg",
                    iconActive: "/static/svg/tab-booking-active.svg"
                },
                {
                    pagePath: "/pages/profile/profile",
                    text: "我的",
                    iconNormal: "/static/svg/tab-profile-normal.svg",
                    iconActive: "/static/svg/tab-profile-active.svg",
                    // 消息中心的入口在「我的」页里，所以未读红点挂在这个 tab 上
                    badge: true
                }
            ]
        };
    },
    methods: {
        switchTab(item, index) {
            if (this.current === index) return;
            uni.reLaunch({
                url: item.pagePath
            });
        }
    }
}
</script>

<style lang="scss" scoped>
.tab-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: calc(100rpx + env(safe-area-inset-bottom));
    background-color: #ffffff;
    display: flex;
    padding-bottom: env(safe-area-inset-bottom);
    border-top: 1rpx solid #f0f0f0;
    box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
    z-index: 999;

    .tab-bar-item {
        flex: 1;
        height: 100rpx;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        .tab-icon-wrap {
            position: relative;
            line-height: 0;
        }

        .tab-icon-svg {
            width: 48rpx;
            height: 48rpx;
            margin-bottom: 4rpx;
        }

        .tab-dot {
            position: absolute;
            top: -2rpx;
            right: -8rpx;
            width: 16rpx;
            height: 16rpx;
            border-radius: 50%;
            background: #ff4757;
        }

        .tab-text {
            font-size: 24rpx;
            color: #7A7E83;

            &.active {
                color: #2F6E8E;
            }
        }
    }
}
</style>
