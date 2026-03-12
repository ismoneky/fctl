<template>
    <view class="tab-bar-wrap">
        <!-- 底部占位，防止内容被遮挡 -->
        <!-- <view class="tab-bar-placeholder"></view> -->

        <!-- 实际的 TabBar -->
        <view class="tab-bar">
            <view class="tab-bar-item" v-for="(item, index) in list" :key="index" @click="switchTab(item, index)">
                <text class="iconfont tab-icon" :class="[ current === index ? 'active' : '' , item.icon]"></text>
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
                    icon: "icon-shouye1"
                },
                {
                    pagePath: "/pages/booking/booking",
                    text: "预约",
                    icon: "icon-dingdan"
                },
                {
                    pagePath: "/pages/profile/profile",
                    text: "我的",
                    icon: "icon-wode"
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
// .tab-bar-placeholder {
// 	height: calc(100rpx + env(safe-area-inset-bottom));
// }

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

        .tab-icon {
            font-size: 36rpx;
            color: #7A7E83;
            margin-bottom: 4rpx;

            &.active {
                color: #667eea;
            }
        }

        .tab-text {
            font-size: 24rpx;
            color: #7A7E83;

            &.active {
                color: #667eea;
            }
        }
    }
}
</style>
