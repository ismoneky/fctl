<template>
  <view class="guide-page">
    <view class="guide-heading"><view><text class="guide-heading__eyebrow">探索风车天路</text><text class="guide-heading__title">{{ guide.title }}</text></view><text class="guide-heading__count">{{ guide.points.length }} 个地点</text></view>
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
    return { guide: normalizeGuide(null), loading: true, error: false, selectedCategory: 'all', selectedId: '', listOpen: true, scrollTarget: '', failedImages: {}, windowHeight: 650, categories: GUIDE_CATEGORIES, unreadCount: getCachedUnreadCount(), requestSequence: 0 };
  },
  computed: {
    numberedPoints() { return this.guide.points.map((point, index) => ({ ...point, number: index + 1, categoryText: point.categories.map(this.categoryLabel).join(' · ') })); },
    visiblePoints() { return filterGuidePoints(this.numberedPoints, this.selectedCategory); },
    mapHeight() { return Math.round(Math.max(200, Math.min(this.listOpen ? 360 : 650, this.windowHeight * (this.listOpen ? 0.43 : 0.68)))); },
  },
  onLoad() { try { this.windowHeight = uni.getSystemInfoSync().windowHeight; } catch { /* use initial height */ } },
  onShow() { this.loadGuide(); fetchUnreadCount().then(count => { this.unreadCount = count; }).catch(() => {}); },
  onUnload() { this.requestSequence++; },
  onResize(event) { if (event.size && event.size.windowHeight) this.windowHeight = event.size.windowHeight; },
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
.guide-page { height: 100vh; display: flex; flex-direction: column; padding-bottom: calc(100rpx + env(safe-area-inset-bottom)); overflow: hidden; background: #f6f8f9; color: #2e4654; }
.guide-heading { display: flex; flex-shrink: 0; justify-content: space-between; align-items: flex-end; padding: 26rpx 32rpx 22rpx; gap: 16rpx; }
.guide-heading__eyebrow { display: block; color: #7e969f; font-size: 20rpx; letter-spacing: 4rpx; margin-bottom: 8rpx; }
.guide-heading__title { display: block; font-size: 34rpx; font-weight: 700; line-height: 1.3; }
.guide-heading__count { font-size: 21rpx; color: #8ba0aa; flex-shrink: 0; padding-bottom: 4rpx; }
.guide-map-wrap { margin: 0 24rpx; flex-shrink: 0; }
.guide-categories { width: 100%; flex-shrink: 0; white-space: nowrap; }
.guide-category-row { display: flex; padding: 24rpx 28rpx 20rpx; gap: 14rpx; }
.guide-category { padding: 13rpx 25rpx; line-height: 1; border-radius: 40rpx; background: #e9eff2; color: #738792; font-size: 24rpx; flex-shrink: 0; }
.guide-category.is-active { background: #2f6e8e; color: #fff; }
.guide-list-header { display: flex; flex-shrink: 0; justify-content: space-between; align-items: center; padding: 2rpx 32rpx 14rpx; font-weight: 600; font-size: 26rpx; }
.guide-list-toggle { font-weight: 400; color: #6a8ba0; font-size: 22rpx; padding: 8rpx; }
.guide-locations { flex: 1; min-height: 0; height: 0; width: 100%; }
.guide-location { margin: 0 24rpx 14rpx; border: 1rpx solid #e7eef1; border-radius: 20rpx; padding: 22rpx; background: white; }
.guide-location.is-selected { border-color: #b6d1df; background: #fff; }
.guide-location__summary { display: flex; align-items: center; gap: 18rpx; }
.guide-location__number { width: 54rpx; height: 54rpx; display: flex; justify-content: center; align-items: center; border-radius: 50%; color: #357faf; background: #edf4f8; font-size: 24rpx; font-weight: 700; flex-shrink: 0; }
.is-selected .guide-location__number { background: #fff0dd; color: #c5833e; }
.guide-location__text { flex: 1; min-width: 0; }
.guide-location__name { display: block; font-size: 28rpx; font-weight: 600; overflow-wrap: anywhere; }
.guide-location__tags { display: block; font-size: 21rpx; color: #8b9ba3; margin-top: 6rpx; }
.guide-location__arrow { color: #93a9b5; font-size: 34rpx; }
.guide-location__detail { padding-top: 20rpx; }
.guide-location__photo { width: 100%; border-radius: 12rpx; margin-bottom: 14rpx; }
.guide-location__description { display: block; font-size: 25rpx; line-height: 1.8; color: #617480; white-space: pre-wrap; }
.guide-location__address, .guide-image-error { display: block; font-size: 22rpx; color: #83949c; margin-top: 12rpx; }
.guide-location__actions { display: flex; justify-content: flex-end; gap: 16rpx; margin-top: 18rpx; }
.guide-location__actions button { margin: 0; border-radius: 12rpx; font-size: 23rpx; line-height: 2.5; padding: 0 26rpx; }
.guide-location__actions button::after { border: 0; }
.guide-locate-button { background: #edf4f8; color: #2f6e8e; }
.guide-navigate-button { background: #2f6e8e; color: white; }
.guide-empty { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #8b9ca6; font-size: 26rpx; gap: 22rpx; }
.guide-empty__title { color: #526f80; font-size: 30rpx; }
.guide-error { display: flex; flex-shrink: 0; justify-content: space-between; gap: 16rpx; padding: 14rpx 30rpx; margin-bottom: 12rpx; background: #fff4e5; color: #9b7546; font-size: 23rpx; }
.guide-retry { color: #2f6e8e; flex-shrink: 0; }
.guide-list-empty, .guide-collapsed-note { padding: 35rpx 28rpx; text-align: center; font-size: 24rpx; color: #8c9ba4; }
.guide-list-footer { font-size: 20rpx; color: #a4b1b8; text-align: center; padding: 14rpx 0 24rpx; letter-spacing: 3rpx; }
</style>
