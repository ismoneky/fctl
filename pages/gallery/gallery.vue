<template>
    <view class="gallery-container">
        <!-- 单图展示模式 -->
        <view v-if="mode === 'single'" class="single-view">
            <view class="image-card">
                <image :src="currentImage.image" mode="widthFix" class="large-image"></image>
                <view class="image-info">
                    <!-- <view class="image-title" v-if="currentTitle">{{ currentTitle }}</view> -->
                    <view class="image-desc">{{ currentImage.desc }}</view>
                    <!-- <view class="image-desc-placeholder">
                        {{ item.desc }}
                    </view> -->
                </view>
            </view>
        </view>

        <!-- 多图展示模式 -->
        <view v-else class="single-view">
            <view class="image-card" v-for="(item, index) in allImages" :key="index">
                <image :src="item.image" mode="widthFix" class="large-image"></image>
                    <view class="image-desc-placeholder">
                        {{ item.desc }}
                    </view>
            </view>
        </view>
    </view>
</template>

<script>
export default {
    data() {
        return {
            mode: 'single', // single, all
            currentImage: {
                image: '',
                name: '',
                desc: ''
            },
            currentTitle: '',
            currentDesc: '',
            allImages: [
                {
                    image: "/static/more/1.jpg"
                },
                {
                    image: "/static/more/2.jpg"
                },
                {
                    image: "/static/more/3.jpg"
                },
                {
                    image: "/static/more/4.jpg"
                },
                {
                    image: "/static/more/5.jpg"
                },
                {
                    image: "/static/more/6.jpg"
                },
                {
                    image: "/static/more/7.jpg"
                },
                {
                    image: "/static/more/8.jpg"
                },
                {
                    image: "/static/more/9.jpg"
                },
                {
                    image: "/static/more/10.jpg"
                },
                {
                    image: "/static/more/11.jpg"
                },
                {
                    image: "/static/more/12.jpg"
                },
                {
                    image: "/static/more/13.jpg"
                },
                {
                    image: "/static/more/14.jpg"
                },
                {
                    image: "/static/more/15.jpg"
                },
            ],
            scenicList: [
					{
						id: 2,
						name: '天路盘山道',
						image: '/static/image10.jpg',
						desc: '自驾天堂'
					},
					{
						id: 3,
						name: '日落观景点',
						image: 'https://s41.ax1x.com/2026/03/12/peAEG8K.jpg',
						desc: '观日出最佳位置'
					},
					{
						id: 4,
						name: '云海平台',
						image: 'https://s41.ax1x.com/2026/03/12/peAENKe.jpg',
						desc: '云雾缭绕仙境'
					},
                                        {
						id: 1,
						name: '风车观景台',
						image: 'https://s41.ax1x.com/2026/03/12/peAE14x.jpg',
						desc: '最佳观赏点'
					},
				]
        }
    },
    onLoad(options) {
        uni.setNavigationBarTitle({
            title: '美景详情'
        });
            console.log('单图模式，options.image=', options);

        if (options.mode === 'all') {
            this.mode = 'all';
            this.showImageList = this.allImages;
        } else {
            this.mode = 'single';
            this.currentImage = this.scenicList[options.mode];
            // this.showImageList = [this.allImages[options.mode]];
        }
    },
    methods: {
        viewImage(item) {
            this.mode = 'single';
            this.currentImage = item.image;
            this.currentTitle = item.name;
            this.currentDesc = item.desc;
            uni.setNavigationBarTitle({
                title: item.name
            });
        }
    }
}
</script>

<style lang="scss">
.gallery-container {
    min-height: 100vh;
    background-color: #f5f5f5;
    padding: 20rpx;
    box-sizing: border-box;
}

/* 单图模式样式 */
.single-view {
    .image-card {
        background-color: #fff;
        // border-radius: 20rpx;
        overflow: hidden;
        box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
        margin-bottom: 30rpx;
    }

    .large-image {
        width: 100%;
        display: block;
    }

    .image-info {
        padding: 30rpx;
    }

    .image-title {
        font-size: 36rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 20rpx;
    }

    .image-desc {
        font-size: 28rpx;
        color: #666;
        line-height: 1.6;
    }

    .image-desc-placeholder {
        font-size: 28rpx;
        color: #999;
        line-height: 1.6;
        font-style: italic;
    }
}
</style>
