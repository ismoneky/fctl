<template>
  <view class="index">
    <scroll-view
      class="container"
      scroll-y
      scroll-with-animation
      :scroll-into-view="noticeScrollTarget"
    >
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

      <!-- 景区位置导航条：文案保持通用，不指向具体地点 —— 去哪个由弹窗选择 -->
      <view class="location-bar" @click="onLocationBarClick">
        <image class="location-bar-icon" src="/static/svg/location.svg" mode="aspectFit" />
        <text class="location-bar-text">查看景区位置</text>
        <text class="location-bar-nav">导航 ›</text>
      </view>

      <!-- 导航目的地选择（地点数据见 utils/scenic-location.js） -->
      <location-picker-popup
        :visible="locationPickerVisible"
        :locations="scenicLocations"
        @select="onLocationPicked"
        @close="locationPickerVisible = false"
      />

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

      <!-- 游玩须知：不替公告概括标题；短文完整展示，长文保留三行原文预览 -->
      <view class="section" v-if="noticeList.length > 0">
        <view class="section-header">
          <text class="section-title">游玩须知</text>
        </view>
        <view class="notice-list">
          <view
            class="notice-item"
            :class="{ 'notice-item--highlight': noticeHighlightKey === item.key }"
            v-for="item in noticeList"
            :key="item.key"
            :id="'notice-' + item.key"
          >
            <text
              class="notice-content"
              :class="{
                'notice-content--collapsed': item.collapsible && !isNoticeExpanded(item)
              }"
            >{{ item.displayContent }}</text>
            <view class="notice-footer">
              <text class="notice-time">{{ item.time }}</text>
              <text
                v-if="item.collapsible"
                class="notice-toggle"
                @click.stop="toggleNotice(item)"
              >{{ isNoticeExpanded(item) ? '收起' : '展开全文' }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
    <my-tab-bar :current="0" :unread="unreadCount"></my-tab-bar>
  </view>
</template>

<script>
import myTabBar from "../../components/my-tab-bar.vue";
import { request } from "../../utils/request.js";
import { isWhitelistedUser } from "../../utils/whitelist.js";
import { SCENIC_LOCATIONS, openScenicLocation } from "../../utils/scenic-location.js";
import { fetchUnreadCount, getCachedUnreadCount } from "../../utils/message-center.js";
import {
  shouldCollapseAnnouncement,
  splitAnnouncementParagraphs,
} from "../../utils/announcement-display.js";
import LocationPickerPopup from "../../components/location-picker-popup.vue";
export default {
  components: {
    myTabBar,
    LocationPickerPopup,
  },
  data() {
    return {
      // 未读消息红点（「我的」tab 上）。三个 tab 页读的是同一份模块级缓存
      unreadCount: getCachedUnreadCount(),
      bannerList: [],
      noticeBarIndex: 0,
      noticeExpandedKeys: {},
      noticeScrollTarget: "",
      noticeHighlightKey: "",
      _noticeHighlightTimer: null,
      // 导航候选地点（来源见 utils/scenic-location.js）
      scenicLocations: SCENIC_LOCATIONS,
      locationPickerVisible: false,
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
  onLoad() {
    // 登录不在这里：登录态刷新已统一交给 App.vue 的 onShow（冷启动与从后台恢复都覆盖到）。
    // 此前只在首页 onLoad 登录，用户停在预约页从后台切回时页面栈保留、onLoad 不跑，
    // 首页的 onLoad / onShow 也都不会执行，token 就没人刷新了。
    this.loadBanners();
    this.loadAnnouncements();
  },
  /**
   * 切回首页时刷新未读红点。
   *
   * 首页是 tab 页且 `onLoad` 只跑一次，不做这一步的话用户在消息中心读完消息、
   * 切回首页，红点会一直亮着（三个 tab 页各自负责自己那次的刷新）。
   */
  onShow() {
    this.refreshUnread();
  },
  onUnload() {
    if (this._noticeHighlightTimer) {
      clearTimeout(this._noticeHighlightTimer);
      this._noticeHighlightTimer = null;
    }
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
    /**
     * 刷新未读数（30 秒节流，见 utils/message-center.js）。
     * 失败静默：首页的红点是附属信息，不该因为它弹提示干扰首屏。
     */
    refreshUnread(force) {
      fetchUnreadCount(force === true).then((n) => {
        this.unreadCount = n;
      });
    },
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
            this.noticeList = res.data.map((item, index) => {
              const paragraphs = splitAnnouncementParagraphs(item.content);
              return {
                key: String(item.announcementId || item.id || index),
                displayContent: paragraphs.join("\n"),
                collapsible: shouldCollapseAnnouncement(item.content),
                // 轮播条单行展示：折叠换行为空格（text 组件对 \n 是组件级换行，CSS nowrap 管不住）
                oneline: this.toOnelineNotice(item.content),
                time: this.formatNoticeDate(item.updatedAt),
              };
            });
            this.noticeExpandedKeys = {};
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
    isNoticeExpanded(item) {
      return !!(item && this.noticeExpandedKeys[item.key]);
    },
    toggleNotice(item) {
      if (!item || !item.collapsible) return;
      this.noticeExpandedKeys = {
        ...this.noticeExpandedKeys,
        [item.key]: !this.isNoticeExpanded(item),
      };
    },
    focusNotice(item) {
      if (!item) return;
      if (item.collapsible && !this.isNoticeExpanded(item)) {
        this.noticeExpandedKeys = {
          ...this.noticeExpandedKeys,
          [item.key]: true,
        };
      }
      this.noticeHighlightKey = item.key;
      this.noticeScrollTarget = "";
      this.$nextTick(() => {
        this.noticeScrollTarget = `notice-${item.key}`;
      });
      if (this._noticeHighlightTimer) clearTimeout(this._noticeHighlightTimer);
      this._noticeHighlightTimer = setTimeout(() => {
        if (this.noticeHighlightKey === item.key) this.noticeHighlightKey = "";
        this._noticeHighlightTimer = null;
      }, 1600);
    },
    // 公告轮播切换
    onNoticeSwiperChange(e) {
      this.noticeBarIndex = e.detail.current;
    },
    // 点击公告轮播条，查看当前轮播到的公告详情
    onNoticeBarClick() {
      const item = this.noticeList[this.noticeBarIndex];
      this.focusNotice(item);
    },
    // 点击导航条：有多个目的地，先弹窗选择，不直接跳转
    onLocationBarClick() {
      this.locationPickerVisible = true;
    },
    // 弹窗选中目的地后才打开微信内置地图（导航能力的唯一出口）
    onLocationPicked(location) {
      this.locationPickerVisible = false;
      openScenicLocation(location);
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
  box-sizing: border-box;
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
  border-radius: 20rpx;
  padding: 0 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(31, 55, 68, 0.05);
}

.notice-item {
  display: block;
  padding: 28rpx 0;
  border-bottom: 1rpx solid #E9EEF1;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.notice-item:last-child {
  border-bottom: none;
}

.notice-item--highlight {
  background: #EDF5F8;
  box-shadow: inset 5rpx 0 0 #3F99F6;
  animation: notice-focus 0.8s ease-in-out 2;
}

@keyframes notice-focus {
  0%, 100% { background: #EDF5F8; }
  50% { background: #DDEEF5; }
}

.notice-content {
  display: block;
  width: 100%;
  box-sizing: border-box;
  font-size: 26rpx;
  line-height: 1.65;
  color: #5F6B73;
  word-break: break-all;
  white-space: pre-line;
}

.notice-content--collapsed {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.notice-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-height: 34rpx;
  margin-top: 10rpx;
}

.notice-time {
  font-size: 23rpx;
  line-height: 1.45;
  color: #98A2A8;
}

.notice-toggle {
  font-size: 23rpx;
  line-height: 1.45;
  color: #2F6E8E;
  font-weight: 600;
  margin-left: 24rpx;
  padding: 6rpx 0 6rpx 12rpx;
}
</style>
