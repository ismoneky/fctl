<template>
  <view class="guide-map" :style="{ height: height + 'px' }"
    @touchstart="onTouchStart" @touchmove.stop.prevent="onTouchMove" @touchend="onTouchEnd" @touchcancel="onTouchEnd">
    <view class="guide-map-canvas" :style="canvasStyle">
      <image :key="imageUrl + '-' + retryCount" class="guide-map-image" :src="imageUrl" mode="scaleToFill"
        :style="{ width: imageSize.width + 'px', height: imageSize.height + 'px' }" @load="onImageLoad" @error="onImageError" />
      <view v-for="point in displayPoints" :key="point.id" v-show="loaded && !failed" class="guide-map-marker"
        :class="{ 'is-selected': point.id === selectedId }" :style="markerStyle(point)" @tap.stop="selectPoint(point)">
        <text>{{ point.number }}</text>
      </view>
    </view>
    <view v-if="!loaded || failed" class="guide-map-status" @touchstart.stop @touchmove.stop>
      <text>{{ failed ? '导览图加载失败' : '正在加载导览图…' }}</text>
      <button v-if="failed" size="mini" @tap.stop="retryImage">重新加载</button>
    </view>
    <view v-if="loaded && !failed" class="guide-map-tools" :data-guide-map-control="true">
      <button class="guide-map-tool guide-map-tool--reset" :data-guide-map-control="true" aria-label="显示完整导览图" @tap.stop="reset">全</button>
      <button class="guide-map-tool" :data-guide-map-control="true" aria-label="放大导览图" @tap.stop="zoom(1.4)">＋</button>
      <button class="guide-map-tool guide-map-tool--last" :data-guide-map-control="true" aria-label="缩小导览图" @tap.stop="zoom(1 / 1.4)">−</button>
    </view>
  </view>
</template>

<script>
import { fitGuideImage, clampGuideTransform, focusGuidePoint, pinchGuideTransform, shouldStartGuideGesture, spreadGuideMarkers } from '../utils/scenic-guide.js';

export default {
  name: 'GuideMap',
  props: {
    imageUrl: { type: String, required: true },
    imageWidth: { type: Number, required: true },
    imageHeight: { type: Number, required: true },
    points: { type: Array, default: () => [] },
    selectedId: { type: String, default: '' },
    height: { type: Number, default: 320 },
  },
  emits: ['select'],
  data() {
    return {
      viewport: { width: 1, height: 1, left: 0, top: 0 },
      naturalWidth: this.imageWidth, naturalHeight: this.imageHeight,
      transform: { x: 0, y: 0, scale: 1 }, loaded: false, failed: false,
      retryCount: 0, gesture: null, moved: false, lastGestureAt: 0,
    };
  },
  computed: {
    imageSize() { return fitGuideImage(this.naturalWidth, this.naturalHeight, this.viewport); },
    canvasStyle() { return { width: this.imageSize.width + 'px', height: this.imageSize.height + 'px', transform: `translate(${this.transform.x}px, ${this.transform.y}px) scale(${this.transform.scale})` }; },
    displayPoints() { return spreadGuideMarkers(this.points, this.imageSize.width * this.transform.scale, this.imageSize.height * this.transform.scale, 14); },
  },
  watch: {
    imageUrl() { this.loaded = false; this.failed = false; this.naturalWidth = this.imageWidth; this.naturalHeight = this.imageHeight; this.$nextTick(() => this.measure()); },
    height() { this.$nextTick(() => this.measure()); },
  },
  mounted() { this.$nextTick(() => this.measure()); },
  methods: {
    measure() {
      uni.createSelectorQuery().in(this).select('.guide-map').boundingClientRect(rect => {
        if (!rect || !rect.width || !rect.height) return;
        this.viewport = { width: rect.width, height: rect.height, left: rect.left, top: rect.top };
        const selected = this.points.find(point => point.id === this.selectedId);
        if (selected) this.focusPoint(selected); else this.reset();
      }).exec();
    },
    reset() { this.transform = clampGuideTransform({ x: 0, y: 0, scale: 1 }, this.imageSize, this.viewport); },
    onImageLoad(event) {
      const detail = event.detail || {};
      if (detail.width > 0 && detail.height > 0) { this.naturalWidth = detail.width; this.naturalHeight = detail.height; }
      this.loaded = true; this.failed = false; this.measure();
    },
    onImageError() { this.failed = true; this.loaded = false; },
    retryImage() { this.failed = false; this.loaded = false; this.retryCount++; },
    markerStyle(point) {
      const scale = this.transform.scale || 1;
      return { left: (point.x * this.imageSize.width + point.offsetX / scale) + 'px', top: (point.y * this.imageSize.height + point.offsetY / scale) + 'px', transform: `translate(-50%, -50%) scale(${1 / scale})` };
    },
    selectPoint(point) { if (Date.now() - this.lastGestureAt > 180) this.$emit('select', point); },
    focusPoint(point) { this.transform = focusGuidePoint(point, this.imageSize, this.viewport, Math.max(2.5, this.transform.scale)); },
    zoom(ratio) {
      const mid = { x: this.viewport.width / 2, y: this.viewport.height / 2 };
      this.transform = pinchGuideTransform(this.transform, mid, mid, ratio, this.imageSize, this.viewport);
    },
    touch(touch) { return { x: touch.clientX - this.viewport.left, y: touch.clientY - this.viewport.top }; },
    beginGesture(touches) {
      if (!touches || !touches.length) { this.gesture = null; return; }
      const first = this.touch(touches[0]);
      if (touches.length > 1) {
        const second = this.touch(touches[1]);
        this.gesture = { type: 'pinch', start: { ...this.transform }, midpoint: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }, distance: Math.max(1, Math.hypot(first.x - second.x, first.y - second.y)) };
      } else this.gesture = { type: 'pan', start: { ...this.transform }, point: first };
    },
    onTouchStart(event) {
      this.moved = false;
      if (!shouldStartGuideGesture(event)) { this.gesture = null; return; }
      this.beginGesture(event.touches);
    },
    onTouchMove(event) {
      if (!this.loaded || this.failed || !this.gesture || !event.touches.length) return;
      const first = this.touch(event.touches[0]);
      const gesture = this.gesture;
      if (event.touches.length > 1 && gesture.type === 'pinch') {
        const second = this.touch(event.touches[1]);
        const midpoint = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
        const distance = Math.hypot(first.x - second.x, first.y - second.y);
        this.transform = pinchGuideTransform(gesture.start, gesture.midpoint, midpoint, distance / gesture.distance, this.imageSize, this.viewport);
        this.moved = true;
      } else if (event.touches.length === 1 && gesture.type === 'pan') {
        const dx = first.x - gesture.point.x, dy = first.y - gesture.point.y;
        if (Math.abs(dx) + Math.abs(dy) > 6) this.moved = true;
        this.transform = clampGuideTransform({ ...gesture.start, x: gesture.start.x + dx, y: gesture.start.y + dy }, this.imageSize, this.viewport);
      } else this.beginGesture(event.touches);
    },
    onTouchEnd(event) { if (this.moved) this.lastGestureAt = Date.now(); this.beginGesture(event.touches); },
  },
};
</script>

<style scoped>
.guide-map { position: relative; width: 100%; overflow: hidden; box-sizing: border-box; background: #edf1f0; border: 1rpx solid rgba(35, 67, 78, .08); border-radius: 18rpx; touch-action: none; box-shadow: 0 10rpx 32rpx rgba(37, 61, 69, .07); }
.guide-map-canvas { position: absolute; left: 0; top: 0; transform-origin: 0 0; will-change: transform; }
.guide-map-image { display: block; }
.guide-map-marker { position: absolute; width: 14px; height: 14px; display: flex; justify-content: center; align-items: center; box-sizing: border-box; }
.guide-map-marker text { width: 100%; height: 100%; line-height: 12px; box-sizing: border-box; border: 1px solid rgba(255,255,255,.95); text-align: center; border-radius: 50%; color: #fff; font-size: 8px; font-weight: 700; background: #267397; box-shadow: 0 1px 4px rgba(15, 40, 51, .28); }
.guide-map-marker.is-selected { width: 18px; height: 18px; z-index: 2; }
.guide-map-marker.is-selected text { line-height: 16px; background: #df8b3d; box-shadow: 0 0 0 2px rgba(255,255,255,.88), 0 2px 6px rgba(77, 48, 19, .25); }
.guide-map-tools { position: absolute; right: 10px; top: 10px; display: flex; flex-direction: column; overflow: hidden; border: 1px solid rgba(41, 75, 86, .1); border-radius: 9px; background: rgba(255,255,255,.9); box-shadow: 0 4px 14px rgba(28,53,61,.1); backdrop-filter: blur(8px); }
.guide-map-tool { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; min-height: 30px; line-height: 1; margin: 0; padding: 0; background: transparent; color: #285f77; border-radius: 0; border-bottom: 1px solid rgba(41, 75, 86, .09); font-size: 18px; font-weight: 400; }
.guide-map-tool--last { border-bottom: 0; }
.guide-map-tool::after { border: none; }
.guide-map-tool--reset { font-size: 11px; font-weight: 600; }
.guide-map-status { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 14px; color: #738995; font-size: 14px; background: #edf3f4; }
.guide-map-status button { color: #2f6e8e; background: white; }
</style>
