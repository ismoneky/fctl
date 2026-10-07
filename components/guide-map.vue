<template>
  <view class="guide-map" :style="{ height: height + 'px' }"
    @touchstart="onTouchStart" @touchmove.stop.prevent="onTouchMove" @touchend="onTouchEnd" @touchcancel="onTouchEnd">
    <view class="guide-map-canvas" :style="canvasStyle">
      <image :key="imageUrl + '-' + retryCount" class="guide-map-image" :src="imageUrl" mode="scaleToFill"
        :style="{ width: imageSize.width + 'px', height: imageSize.height + 'px' }" @load="onImageLoad" @error="onImageError" />
      <view v-for="point in points" :key="point.id" v-show="loaded && !failed" class="guide-map-marker"
        :class="{ 'is-selected': point.id === selectedId }" :style="markerStyle(point)" @tap.stop="selectPoint(point)">
        <text>{{ point.number }}</text>
      </view>
    </view>
    <view v-if="!loaded || failed" class="guide-map-status" @touchstart.stop @touchmove.stop>
      <text>{{ failed ? '导览图加载失败' : '正在加载导览图…' }}</text>
      <button v-if="failed" size="mini" @tap.stop="retryImage">重新加载</button>
    </view>
    <view v-if="loaded && !failed" class="guide-map-tools" @touchstart.stop @touchmove.stop>
      <button class="guide-map-tool guide-map-tool--reset" @tap.stop="reset">全图</button>
      <button class="guide-map-tool" aria-label="放大导览图" @tap.stop="zoom(1.4)">＋</button>
      <button class="guide-map-tool" aria-label="缩小导览图" @tap.stop="zoom(1 / 1.4)">−</button>
    </view>
    <view v-if="loaded && !failed" class="guide-map-tip"><text>双指缩放 · 拖动查看 · 点击标记</text></view>
  </view>
</template>

<script>
import { fitGuideImage, clampGuideTransform, focusGuidePoint, pinchGuideTransform } from '../utils/scenic-guide.js';

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
      return { left: (point.x * this.imageSize.width) + 'px', top: (point.y * this.imageSize.height) + 'px', transform: `translate(-50%, -50%) scale(${1 / this.transform.scale})` };
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
    onTouchStart(event) { this.moved = false; this.beginGesture(event.touches); },
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
.guide-map { position: relative; width: 100%; overflow: hidden; background: #e8eff0; border-radius: 24rpx; touch-action: none; }
.guide-map-canvas { position: absolute; left: 0; top: 0; transform-origin: 0 0; will-change: transform; }
.guide-map-image { display: block; }
.guide-map-marker { position: absolute; width: 38px; height: 38px; display: flex; justify-content: center; align-items: center; padding: 4px; }
.guide-map-marker text { width: 28px; height: 28px; line-height: 24px; border: 2px solid #fff; text-align: center; border-radius: 50%; color: #fff; font-size: 12px; font-weight: 700; background: #357faf; box-shadow: 0 2px 7px rgba(20, 49, 68, .35); }
.guide-map-marker.is-selected { z-index: 2; }
.guide-map-marker.is-selected text { background: #e79243; box-shadow: 0 0 0 4px rgba(231, 146, 67, .28), 0 2px 7px rgba(20, 49, 68, .35); }
.guide-map-tools { position: absolute; right: 12px; top: 12px; display: flex; flex-direction: column; gap: 7px; }
.guide-map-tool { width: 38px; height: 38px; line-height: 38px; padding: 0; background: rgba(255,255,255,.95); color: #2f6e8e; border-radius: 10px; font-size: 23px; box-shadow: 0 2px 9px rgba(25,60,75,.1); }
.guide-map-tool::after { border: none; }
.guide-map-tool--reset { font-size: 12px; }
.guide-map-tip { position: absolute; bottom: 10px; left: 12px; pointer-events: none; background: rgba(255,255,255,.88); border-radius: 6px; padding: 4px 7px; color: #637b88; font-size: 10px; }
.guide-map-status { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 14px; color: #738995; font-size: 14px; background: #edf3f4; }
.guide-map-status button { color: #2f6e8e; background: white; }
</style>
