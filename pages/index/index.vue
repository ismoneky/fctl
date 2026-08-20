<template>
  <view class="index">
    <view class="container">
      <!-- 顶部轮播图 -->
      <view class="banner-section">
        <swiper
          class="swiper"
          :indicator-dots="true"
          :autoplay="true"
          :interval="3000"
          :duration="500"
          indicator-color="rgba(255,255,255,0.5)"
          indicator-active-color="#fff"
        >
          <swiper-item v-for="(item, index) in bannerList" :key="index">
            <image
              :src="item.image"
              class="banner-image"
              mode="aspectFill"
            ></image>
          </swiper-item>
        </swiper>
      </view>

      <!-- 立即预约入口 -->
      <view class="booking-entry">
        <view class="booking-card">
          <view class="booking-top">
            <view class="booking-info">
              <text class="booking-title">风车天路</text>
              <text class="booking-subtitle">体验浪漫风车之旅</text>
              <view class="booking-tags">
                <view class="tag-item">
                  <image class="tag-icon-svg" src="/static/svg/tag-sun.svg" mode="aspectFit" />
                  <text class="tag-label">全天候</text>
                </view>
                <view class="tag-item">
                  <image class="tag-icon-svg" src="/static/svg/tag-mountain.svg" mode="aspectFit" />
                  <text class="tag-label">风景绝美</text>
                </view>
              </view>
            </view>
            <image class="booking-logo" src="https://cdn.hbfctl.com.cn/content/logo_png.png" mode="aspectFit" />
          </view>
          <view class="booking-action" @click="goToBooking">
            <view class="action-circle">
              <image class="action-arrow-svg" src="/static/svg/arrow-right.svg" mode="aspectFit" />
            </view>
            <view class="action-info">
              <text class="action-title">立即预约</text>
              <text class="action-sub">开启您的风车之旅</text>
            </view>
            <image class="action-chevron-svg" src="/static/svg/chevron-right.svg" mode="aspectFit" />
          </view>
        </view>
      </view>

      <!-- 景区位置导航条 -->
      <view class="location-bar" @click="openScenicLocation">
        <image class="location-bar-icon" src="/static/svg/location.svg" mode="aspectFit" />
        <text class="location-bar-text">{{ scenicLocation.name }}</text>
        <text class="location-bar-nav">导航 ›</text>
      </view>

      <!-- 公告轮播条 -->
      <view
        class="notice-bar"
        v-if="noticeList.length > 0"
        @click="onNoticeBarClick"
      >
        <image class="notice-bar-icon" src="/static/svg/megaphone.svg" mode="aspectFit" />
        <swiper
          class="notice-bar-swiper"
          :vertical="true"
          :autoplay="noticeList.length > 1"
          :circular="noticeList.length > 1"
          :interval="4000"
          :duration="500"
          @change="onNoticeSwiperChange"
        >
          <swiper-item v-for="(item, index) in noticeList" :key="index">
            <view class="notice-bar-item">
              <text class="notice-bar-text">{{ item.oneline }}</text>
            </view>
          </swiper-item>
        </swiper>
        <text class="notice-bar-more">›</text>
      </view>

      <!-- 风车天路特色 -->
      <!-- <view class="section">
                <view class="section-header">
                    <text class="section-title">天路特色</text>
                </view>
                <view class="features-grid">
                    <view class="feature-item" v-for="(item, index) in featureList" :key="index">
                        <text class="feature-icon">{{ item.icon }}</text>
                        <text class="feature-name">{{ item.name }}</text>
                        <text class="feature-desc">{{ item.desc }}</text>
                    </view>
                </view>
            </view> -->

      <!-- 风车美景 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">风车美景</text>
          <text class="section-more" @click="goToGallery(null, 'all')"
            >更多 ›</text
          >
        </view>
        <scroll-view scroll-x class="scenic-scroll">
          <view
            class="scenic-item"
            v-for="(item, index) in scenicList"
            :key="index"
            @click="goToGallery(item, index)"
          >
            <image
              :src="item.image"
              class="scenic-image"
              mode="aspectFill"
            ></image>
            <view class="scenic-info">
              <text class="scenic-name">{{ item.name }}</text>
              <text class="scenic-desc">{{ item.desc }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 游玩须知 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">游玩须知</text>
        </view>
        <view class="notice-list">
          <view
            class="notice-item"
            v-for="(item, index) in noticeList"
            :key="index"
            @click="showNoticeDetail(item)"
          >
            <view class="notice-dot"></view>
            <text class="notice-text">{{ item.content }}</text>
            <text class="notice-time">{{ item.time }}</text>
          </view>
        </view>
      </view>
    </view>
    <my-tab-bar :current="0"></my-tab-bar>
  </view>
</template>

<script>
import myTabBar from "../../components/my-tab-bar.vue";
import { request } from "../../utils/request.js";
import { isWhitelistedUser } from "../../utils/whitelist.js";
import { SCENIC_LOCATION } from "../../utils/scenic-location.js";
export default {
  components: {
    myTabBar,
  },
  data() {
    return {
      bannerList: [],
      noticeBarIndex: 0,
      scenicLocation: SCENIC_LOCATION,
      featureList: [
        {
          icon: "icon-Energy-",
          name: "风车奇观",
          desc: "百余座风力发电机",
          image: "https://cdn.hbfctl.com.cn/index/7.jpg",
        },
        {
          icon: "🏔️",
          name: "天路美景",
          desc: "蜿蜒曲折的山路风光",
          image: "https://cdn.hbfctl.com.cn/index/3.jpg",
        },
        {
          icon: "📸",
          name: "打卡圣地",
          desc: "网红拍照取景地",
          image: "https://cdn.hbfctl.com.cn/index/8.jpg",
        },
        {
          icon: "🌤️",
          name: "四季皆宜",
          desc: "一年四季风景各异",
          image: "https://cdn.hbfctl.com.cn/index/9.jpg",
        },
      ],
      scenicList: [
        {
          id: 2,
          name: "天路盘山道",
          image: "https://cdn.hbfctl.com.cn/index/7.jpg",
          desc: "自驾天堂",
        },
        {
          id: 3,
          name: "日落观景点",
          image: "https://cdn.hbfctl.com.cn/index/3.jpg",
          desc: "观日出最佳位置",
        },
        {
          id: 4,
          name: "云海平台",
          image: "https://cdn.hbfctl.com.cn/index/8.jpg",
          desc: "云雾缭绕仙境",
        },
        {
          id: 1,
          name: "风车观景台",
          image: "https://cdn.hbfctl.com.cn/index/9.jpg",
          desc: "最佳观赏点",
        },
      ],
      noticeList: [],
    };
  },
  async onLoad() {
    this.loadBanners();
    this.loadAnnouncements();
    uni.login({
      provider: "weixin",
      success: async (loginRes) => {
        try {
          console.log("微信登录成功，code:", loginRes.code);
          const res = await request({
            url: "/users/wx-login", // 后端登录接口
            method: "POST",
            data: {
              code: loginRes.code,
            },
          });
          // 适配后端返回格式
          if (res.success && res.data) {
            uni.setStorageSync("token", res.data.token);
            uni.setStorageSync("isAdmin", res.data.admin === true);
          } else {
            uni.showToast({
              title: "微信登录失败",
              icon: "none",
            });
          }
        } catch (err) {
          uni.showToast({
            title: "微信登录异常",
            icon: "none",
          });
        }
      },
      fail: (err) => {
        uni.showToast({
          title: "微信授权失败",
          icon: "none",
        });
        console.log("微信登录失败:", err);
      },
    });
  },
  // 分享给好友
  onShareAppMessage() {
    return {
      title: "风车天路 - 浪漫风车之旅等你来",
      path: "/pages/index/index",
      imageUrl: "", // 可以设置分享图片
    };
  },
  // 分享到朋友圈（需要在 app.json 中配置）
  onShareTimeline() {
    return {
      title: "风车天路 - 浪漫风车之旅等你来",
      query: "",
      imageUrl: "",
    };
  },
  methods: {
    loadBanners() {
      const fallback = [
        { image: 'https://cdn.hbfctl.com.cn/index/1.jpg' },
        { image: 'https://cdn.hbfctl.com.cn/index/2.jpg' },
        { image: 'https://cdn.hbfctl.com.cn/index/3.jpg' },
        { image: 'https://cdn.hbfctl.com.cn/index/4.jpg' },
        { image: 'https://cdn.hbfctl.com.cn/index/5.jpg' },
        { image: 'https://cdn.hbfctl.com.cn/index/6.jpg' },
      ];
      request({ method: 'GET', url: '/system-config/banners' })
        .then(res => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            this.bannerList = res.data.map(b => ({ image: b.imageUrl }));
          } else {
            this.bannerList = fallback;
          }
        })
        .catch(() => {
          this.bannerList = fallback;
        });
    },
    // 获取公告列表
    loadAnnouncements() {
      request({ method: "GET", url: "/announcements" })
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            this.noticeList = res.data.map((item) => ({
              content: item.content,
              // 轮播条单行展示：折叠换行为空格（text 组件对 \n 是组件级换行，CSS nowrap 管不住）
              oneline: this.toOnelineNotice(item.content),
              time: this.formatNoticeDate(item.updatedAt),
            }));
          }
        })
        .catch(() => {});
    },
    // 公告单行化：换行/连续空白折叠为一个空格
    toOnelineNotice(text) {
      return String(text || "")
        .replace(/[\r\n]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    },
    // 格式化公告日期为 MM-DD
    formatNoticeDate(dateStr) {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${mm}-${dd}`;
    },
    // 查看游玩须知详情
    showNoticeDetail(item) {
      uni.showModal({
        title: "游玩须知",
        content: item.content,
        showCancel: false,
        confirmText: "我知道了",
      });
    },
    // 公告轮播切换
    onNoticeSwiperChange(e) {
      this.noticeBarIndex = e.detail.current;
    },
    // 点击公告轮播条，查看当前轮播到的公告详情
    onNoticeBarClick() {
      const item = this.noticeList[this.noticeBarIndex];
      if (item) {
        this.showNoticeDetail(item);
      }
    },
    // 打开景区位置（微信内置地图，支持导航）
    openScenicLocation() {
      uni.openLocation({
        latitude: this.scenicLocation.latitude,
        longitude: this.scenicLocation.longitude,
        name: this.scenicLocation.name,
        address: this.scenicLocation.address,
        scale: this.scenicLocation.scale
      });
    },
    // 跳转到预约页面
    goToBooking() {
      // 白名单用户不受「关闭预约」开关限制，直接进入预约页
      if (isWhitelistedUser()) {
        // 推迟跳转：tap 内同步 navigateTo 会让 iOS clickCheckTask 拿到已销毁的节点链而报错
        setTimeout(() => {
          uni.navigateTo({ url: "/pages/booking-form/booking-form" });
        }, 60);
        return;
      }
      uni.showLoading({ title: "加载中..." });
      request({ method: "GET", url: "/system-config/booking-enabled" })
        .then((res) => {
          const data = res.data || {};
          if (data.bookingEnabled === false) {
						request({ method: "GET", url: "/system-config/booking-disabled-message" }).then(res2 => {
							const data2 = res2.data || {};
								uni.showModal({
									title: "暂停预约",
									content: data2.bookingDisabledMessage || "当前暂停预约，请稍后再试",
									showCancel: false,
									confirmText: "我知道了",
								});
						})
          } else {
            uni.navigateTo({ url: "/pages/booking-form/booking-form" });
          }
        })
        .catch(() => {
          // 接口异常不阻断，直接放行，在提交时拦截
              uni.navigateTo({ url: "/pages/booking-form/booking-form" });
        })
        .finally(() => {
          uni.hideLoading();
        });
    },
    // 跳转到美景画廊
    goToGallery(item, mode) {
      // let path = encodeURIComponent(item.url);
      let url =
        "/pages/gallery/gallery?mode=" +
        mode +
        (item ? "&image=" + encodeURIComponent(item.image) : "");
      uni.navigateTo({
        url: url,
      });
    },
  },
};
</script>

<style scoped>
.index {
  height: 100vh;
  overflow: hidden;
}

.container {
  height: calc(100vh - 100rpx - env(safe-area-inset-bottom));
  background-color: #f5f5f5;
  padding-bottom: 0px;
  overflow: hidden;
  overflow-y: auto;
}

/* 轮播图 */
.banner-section {
  width: 100%;
  height: 400rpx;
  padding: 20rpx 25rpx;
  border-radius: 28rpx;
  overflow: hidden;
}

.swiper {
  width: 100%;
  height: 100%;
  border-radius: 28rpx;
  overflow: hidden;
}

.banner-image {
  width: 100%;
  height: 100%;
}

/* ===== 预约入口卡片 ===== */
/* 位置导航条常驻，由其 margin-top 预留「立即预约」按钮悬出空间 */
.booking-entry {
  padding: 30rpx 30rpx 0;
}

/* ===== 景区位置导航条 ===== */
.location-bar {
  margin: 72rpx 30rpx 0;
  display: flex;
  align-items: center;
  background: #EAF6FF;
  border: 1rpx solid #B3DCF9;
  border-radius: 16rpx;
  padding: 14rpx 20rpx;
  gap: 14rpx;
}

.location-bar-icon {
  width: 34rpx;
  height: 34rpx;
  flex-shrink: 0;
}

.location-bar-text {
  flex: 1;
  font-size: 26rpx;
  color: #2F6E8E;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.location-bar-nav {
  font-size: 26rpx;
  font-weight: bold;
  color: #3F99F6;
  flex-shrink: 0;
}

.booking-card {
  background: #EAF6FF;
  border-radius: 28rpx;
  overflow: visible;
  box-shadow: 0 16rpx 50rpx rgba(0,0,0,0.1);
  position: relative;
  height: 360rpx;
}

.booking-top {
  padding: 44rpx 0 0 40rpx;
  position: relative;
  height: 100%;
  overflow: hidden;
  border-radius: 28rpx;
}

.booking-info {
  width: 360rpx;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.booking-title {
  font-size: 44rpx;
  font-weight: 800;
  color: #2F6E8E;
  margin-bottom: 8rpx;
  line-height: 1.3;
}

.booking-subtitle {
  font-size: 24rpx;
  color: #2F6E8E;
  margin-bottom: 32rpx;
}

.booking-tags {
  display: flex;
  gap: 32rpx;
}

.tag-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.tag-icon-svg {
  width: 46rpx;
  height: 46rpx;
}

.tag-label {
  font-size: 26rpx;
  color: #2F6E8E;
}

.booking-logo {
  width: 480rpx;
  height: 480rpx;
  position: absolute;
  right: -60rpx;
  top: -75rpx;
  z-index: 0;
}

.booking-action {
  position: absolute;
  bottom: -52rpx;
  left: 80rpx;
  right: 80rpx;
  display: flex;
  align-items: center;
  background: linear-gradient(115deg, #3F99F6 0%, #2F6E8E 90%);
  border-radius: 60rpx;
  padding: 18rpx 28rpx;
  gap: 28rpx;
  /* box-shadow: 0 10rpx 28rpx rgba(63, 153, 246, 0.4); */
  box-shadow: 0px 10rpx 28rpx rgba(63,153,246,0.3);
  z-index: 10;
}

.action-circle {
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action-arrow-svg {
  width: 36rpx;
  height: 36rpx;
}

.action-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.action-title {
  font-size: 36rpx;
  font-weight: 800;
  color: #fff;
  line-height: 1.2;
}

.action-sub {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.85);
  margin-top: 4rpx;
}

.action-chevron-svg {
  width: 36rpx;
  height: 36rpx;
  flex-shrink: 0;
}

.btn-text {
  font-size: 28rpx;
  font-weight: bold;
  color: #3F99F6;
  margin-bottom: 5rpx;
}

.btn-arrow {
  font-size: 32rpx;
  color: #3F99F6;
}

/* ===== 公告轮播条 ===== */
.notice-bar {
  margin: 20rpx 30rpx 0;
  display: flex;
  align-items: center;
  background: #FFF7E8;
  border: 1rpx solid #FFD591;
  border-radius: 16rpx;
  padding: 14rpx 20rpx;
  gap: 14rpx;
}

.notice-bar-icon {
  width: 36rpx;
  height: 36rpx;
  flex-shrink: 0;
}

.notice-bar-swiper {
  flex: 1;
  height: 44rpx;
  overflow: hidden;
}

.notice-bar-item {
  height: 44rpx;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.notice-bar-text {
  flex: 1;
  height: 44rpx;
  line-height: 44rpx;
  font-size: 26rpx;
  color: #ED6A0C;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notice-bar-more {
  font-size: 32rpx;
  color: #FFD591;
  flex-shrink: 0;
  line-height: 1;
}

/* 通用section */
.section {
  margin: 20rpx 30rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.section-more {
  font-size: 28rpx;
  color: #999;
}

/* 特色网格 */
.features-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.feature-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.feature-icon {
  font-size: 60rpx;
  margin-bottom: 15rpx;
}

.feature-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.feature-desc {
  font-size: 24rpx;
  color: #999;
}

/* 美景列表 */
.scenic-scroll {
  white-space: nowrap;
}

.scenic-item {
  display: inline-block;
  width: 280rpx;
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  margin-right: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.scenic-image {
  width: 100%;
  height: 180rpx;
}

.scenic-info {
  padding: 20rpx;
}

.scenic-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scenic-desc {
  font-size: 24rpx;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 公告列表 */
.notice-list {
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx 30rpx;
}

.notice-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.notice-item:last-child {
  border-bottom: none;
}

.notice-dot {
  width: 12rpx;
  height: 12rpx;
  background: #4a90e2;
  border-radius: 50%;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.notice-text {
  flex: 1;
  font-size: 28rpx;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notice-time {
  font-size: 24rpx;
  color: #999;
  margin-left: 20rpx;
  flex-shrink: 0;
}
</style>
