<template>
  <view class="guide-page">
    <view v-if="error" class="guide-error"><text>{{ guide.imageUrl ? '更新失败，当前展示上次加载的导览' : '导览加载失败，请稍后重试' }}</text><text class="guide-retry" @tap="loadGuide">重试</text></view>
    <view v-if="loading && !guide.imageUrl" class="guide-empty"><text>正在加载景区导览…</text></view>
    <view v-else-if="!guide.imageUrl" class="guide-empty"><text class="guide-empty__title">{{ error ? '暂时无法获取导览' : '景区导览正在准备中' }}</text><text>稍后再来看看吧</text><button v-if="error" size="mini" @tap="loadGuide">重新加载</button></view>
    <template v-else>
      <view class="guide-map-wrap"><guide-map ref="guideMap" :image-url="guide.imageUrl" :image-width="guide.imageWidth" :image-height="guide.imageHeight" :height="mapHeight" :points="visiblePoints" :selected-id="selectedId" @select="selectPoint" /></view>
      <scroll-view scroll-x class="guide-categories" :show-scrollbar="false"><view class="guide-category-row"><view v-for="category in categories" :key="category.value" class="guide-category" :class="{ 'is-active': category.value === selectedCategory }" @tap="setCategory(category.value)">{{ category.label }}</view></view></scroll-view>
      <view class="guide-list-header"><text>{{ selectedCategory === 'all' ? '沿途地点' : categoryLabel(selectedCategory) }} · {{ visiblePoints.length }}</text><text class="guide-list-toggle" @tap="listOpen = !listOpen">{{ listOpen ? '收起列表' : '展开列表' }}</text></view>
      <scroll-view v-if="listOpen" scroll-y class="guide-locations" :scroll-into-view="scrollTarget" scroll-with-animation>
        <view v-if="!visiblePoints.length" class="guide-list-empty">{{ guide.points.length ? '该分类暂无地点，可以看看其他分类' : '暂无地点标记，可先缩放查看导览图' }}</view>
        <view v-for="point in visiblePoints" :id="'guide-point-' + point.id" :key="point.id" class="guide-location" :class="{ 'is-selected': point.id === selectedId }" @tap="selectPoint(point)">
          <view class="guide-location__summary"><view class="guide-location__number">{{ point.number }}</view><view class="guide-location__text"><text class="guide-location__name">{{ point.name }}</text><text class="guide-location__tags">{{ point.categoryText }}</text></view><text class="guide-location__arrow">{{ point.id === selectedId ? '⌃' : '›' }}</text></view>
          <view v-if="point.id === selectedId" class="guide-location__detail" @tap.stop>
            <image v-if="point.imageUrl" class="guide-location__photo" :src="point.imageUrl" mode="widthFix" @tap="previewImage(point.imageUrl)" @error="onPointImageError(point.id)" v-show="!failedImages[point.id]" />
            <text v-if="failedImages[point.id]" class="guide-image-error">配图暂时无法加载</text>
            <text v-if="point.description" class="guide-location__description">{{ point.description }}</text>
            <text v-if="point.address" class="guide-location__address">{{ point.address }}</text>
            <view class="guide-location__actions"><button size="mini" class="guide-locate-button" @tap.stop="focusPoint(point)">在图上查看</button><button v-if="canNavigate(point)" size="mini" class="guide-navigate-button" @tap.stop="navigate(point)">导航前往</button></view>
          </view>
        </view>
        <view class="guide-list-footer">山路风景，慢慢发现</view>
      </scroll-view>
      <view v-else class="guide-collapsed-note">点击图上标记可展开地点详情</view>
    </template>
    <my-tab-bar :current="1" :unread="unreadCount" />
  </view>
</template>

<script>
import GuideMap from '../../components/guide-map.vue';
import MyTabBar from '../../components/my-tab-bar.vue';
import { request } from '../../utils/request.js';
import { fetchUnreadCount, getCachedUnreadCount } from '../../utils/message-center.js';
import { GUIDE_CATEGORIES, normalizeGuide, filterGuidePoints, canNavigateToPoint } from '../../utils/scenic-guide.js';

export default {
  components: { GuideMap, MyTabBar },
  data() {
    return { guide: normalizeGuide(null), loading: true, error: false, selectedCategory: 'all', selectedId: '', listOpen: true, scrollTarget: '', failedImages: {}, windowWidth: 375, windowHeight: 650, categories: GUIDE_CATEGORIES, unreadCount: getCachedUnreadCount(), requestSequence: 0 };
  },
  computed: {
    numberedPoints() { return this.guide.points.map((point, index) => ({ ...point, number: index + 1, categoryText: point.categories.map(this.categoryLabel).join(' · ') })); },
    visiblePoints() { return filterGuidePoints(this.numberedPoints, this.selectedCategory); },
    mapHeight() {
      const viewportWidth = Math.max(240, this.windowWidth - 20);
      const imageRatio = this.guide.imageHeight / this.guide.imageWidth;
      const naturalHeight = (viewportWidth - 20) * imageRatio + 20;
      const maxHeight = this.windowHeight * (this.listOpen ? 0.52 : 0.76);
      return Math.round(Math.max(220, Math.min(naturalHeight, maxHeight, this.listOpen ? 430 : 720)));
    },
  },
  onLoad() { try { const system = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync(); this.windowWidth = system.windowWidth; this.windowHeight = system.windowHeight; } catch { /* use initial size */ } },
  onShow() { this.loadGuide(); fetchUnreadCount().then(count => { this.unreadCount = count; }).catch(() => {}); },
  onUnload() { this.requestSequence++; },
  onResize(event) { if (event.size) { if (event.size.windowWidth) this.windowWidth = event.size.windowWidth; if (event.size.windowHeight) this.windowHeight = event.size.windowHeight; } },
  methods: {
    async loadGuide() {
      const sequence = ++this.requestSequence;
      this.loading = true; this.error = false;
      try {
        const res = await request({ url: '/scenic-guide', timeout: 15000 });
        if (sequence !== this.requestSequence) return;
        if (!res.success || !res.data) throw new Error('Invalid guide response');
        this.guide = normalizeGuide(res.data); this.failedImages = {};
        if (!this.visiblePoints.some(point => point.id === this.selectedId)) this.selectedId = '';
      } catch { if (sequence === this.requestSequence) this.error = true; }
      finally { if (sequence === this.requestSequence) this.loading = false; }
    },
    categoryLabel(value) { const category = GUIDE_CATEGORIES.find(item => item.value === value); return category ? category.label : ''; },
    setCategory(value) { this.selectedCategory = value; this.selectedId = ''; this.scrollTarget = ''; },
    selectPoint(point) {
      this.selectedId = point.id; this.listOpen = true; this.scrollTarget = '';
      this.$nextTick(() => { this.scrollTarget = 'guide-point-' + point.id; this.focusPoint(point); });
    },
    focusPoint(point) { if (this.$refs.guideMap) this.$refs.guideMap.focusPoint(point); },
    canNavigate: canNavigateToPoint,
    navigate(point) {
      if (!canNavigateToPoint(point)) return;
      uni.openLocation({ latitude: point.latitude, longitude: point.longitude, name: point.name, address: point.address || '', scale: 16, fail: () => uni.showToast({ title: '暂时无法打开导航，请稍后重试', icon: 'none' }) });
    },
    previewImage(url) { uni.previewImage({ current: url, urls: [url] }); },
    onPointImageError(id) { this.failedImages = { ...this.failedImages, [id]: true }; },
  },
};
</script>

<style scoped>
.guide-page { height: 100vh; display: flex; flex-direction: column; padding-bottom: calc(100rpx + env(safe-area-inset-bottom)); overflow: hidden; background: #f4f6f5; color: #2b424d; }
.guide-map-wrap { margin: 18rpx 18rpx 0; flex-shrink: 0; }
.guide-categories { width: 100%; flex-shrink: 0; white-space: nowrap; }
.guide-category-row { display: flex; padding: 20rpx 20rpx 14rpx; gap: 8rpx; }
.guide-category { padding: 10rpx 18rpx; line-height: 1; border: 1rpx solid transparent; border-radius: 10rpx; color: #71828a; font-size: 22rpx; flex-shrink: 0; }
.guide-category.is-active { border-color: rgba(47,110,142,.13); background: #e4eef2; color: #245f7c; font-weight: 600; }
.guide-list-header { display: flex; flex-shrink: 0; justify-content: space-between; align-items: center; padding: 2rpx 28rpx 10rpx; font-weight: 600; font-size: 24rpx; }
.guide-list-toggle { font-weight: 400; color: #5d8295; font-size: 21rpx; padding: 8rpx 0 8rpx 18rpx; }
.guide-locations { flex: 1; min-height: 0; height: 0; width: 100%; }
.guide-location { margin: 0 28rpx; border-bottom: 1rpx solid rgba(48,78,90,.09); padding: 22rpx 2rpx; }
.guide-location.is-selected { padding: 22rpx 18rpx; margin: 0 18rpx; border-bottom-color: transparent; border-radius: 16rpx; background: rgba(255,255,255,.82); box-shadow: 0 8rpx 24rpx rgba(38,67,77,.05); }
.guide-location__summary { display: flex; align-items: center; gap: 16rpx; }
.guide-location__number { width: 34rpx; height: 34rpx; display: flex; justify-content: center; align-items: center; box-sizing: border-box; border: 1rpx solid rgba(45,112,145,.28); border-radius: 50%; color: #2d7091; font-size: 18rpx; font-weight: 700; flex-shrink: 0; }
.is-selected .guide-location__number { border-color: #df8b3d; background: #df8b3d; color: #fff; }
.guide-location__text { flex: 1; min-width: 0; }
.guide-location__name { display: block; font-size: 26rpx; font-weight: 600; overflow-wrap: anywhere; }
.guide-location__tags { display: block; font-size: 20rpx; color: #8a989e; margin-top: 4rpx; }
.guide-location__arrow { color: #8ba0a9; font-size: 30rpx; font-weight: 300; }
.guide-location__detail { padding: 18rpx 0 2rpx 50rpx; }
.guide-location__photo { width: 100%; border-radius: 10rpx; margin-bottom: 14rpx; }
.guide-location__description { display: block; font-size: 24rpx; line-height: 1.75; color: #5d7079; white-space: pre-wrap; }
.guide-location__address, .guide-image-error { display: block; font-size: 21rpx; color: #819198; margin-top: 10rpx; }
.guide-location__actions { display: flex; justify-content: flex-end; gap: 12rpx; margin-top: 18rpx; }
.guide-location__actions button { margin: 0; border-radius: 9rpx; font-size: 22rpx; line-height: 2.45; padding: 0 24rpx; }
.guide-location__actions button::after { border: 0; }
.guide-locate-button { background: #e7eef0; color: #526f7c; }
.guide-navigate-button { background: #286f91; color: white; box-shadow: 0 5rpx 14rpx rgba(40,111,145,.18); }
.guide-empty { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #8b9ca6; font-size: 26rpx; gap: 22rpx; }
.guide-empty__title { color: #526f80; font-size: 30rpx; }
.guide-error { display: flex; flex-shrink: 0; justify-content: space-between; gap: 16rpx; padding: 14rpx 26rpx; background: #fff4e5; color: #9b7546; font-size: 23rpx; }
.guide-retry { color: #2f6e8e; flex-shrink: 0; }
.guide-list-empty, .guide-collapsed-note { padding: 30rpx 28rpx; text-align: center; font-size: 23rpx; color: #8c9ba4; }
.guide-list-footer { font-size: 19rpx; color: #a1adb2; text-align: center; padding: 16rpx 0 24rpx; letter-spacing: 3rpx; }
</style>
