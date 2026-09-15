const SWIPE_OPEN_THRESHOLD = 0.46;
const DELETE_FILL_EASING = 1.35;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeMaxOffset(maxOffset) {
  const value = Number(maxOffset);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function calculateSwipeOffset(startOffset, dragLeftDistance, maxOffset) {
  const max = normalizeMaxOffset(maxOffset);
  const start = Number(startOffset) || 0;
  const distance = Number(dragLeftDistance) || 0;
  return clamp(start + distance, 0, max);
}

export function getSwipeProgress(offset, maxOffset) {
  const max = normalizeMaxOffset(maxOffset);
  if (!max) return 0;
  return clamp((Number(offset) || 0) / max, 0, 1);
}

export function settleSwipeOffset(offset, maxOffset) {
  const max = normalizeMaxOffset(maxOffset);
  return getSwipeProgress(offset, max) >= SWIPE_OPEN_THRESHOLD ? max : 0;
}

export function getDeleteFillProgress(offset, maxOffset) {
  const progress = getSwipeProgress(offset, maxOffset);
  if (progress === 0 || progress === 1) return progress;
  return Math.pow(progress, DELETE_FILL_EASING);
}
