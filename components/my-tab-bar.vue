<template>
    <view class="tab-bar-wrap">
        <view class="tab-bar">
            <view class="tab-bar-item" v-for="(item, index) in list" :key="index" @click="switchTab(item, index)">
                <image class="tab-icon-svg" :src="current === index ? item.iconActive : item.iconNormal" mode="aspectFit" />
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
                    iconActive: "/static/svg/tab-profile-active.svg"
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

        .tab-icon-svg {
            width: 48rpx;
            height: 48rpx;
            margin-bottom: 4rpx;
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
