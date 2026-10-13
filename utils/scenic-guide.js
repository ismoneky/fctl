export const GUIDE_CATEGORIES = [
  { value: 'all', label: '全部' },
  { value: 'spot', label: '景点' },
  { value: 'station', label: '驿站' },
  { value: 'camp', label: '露营' },
  { value: 'parking', label: '停车场' },
  { value: 'toilet', label: '卫生间' },
  { value: 'entrance', label: '出入口' },
];
const finite = value => typeof value === 'number' && Number.isFinite(value);
const imageUrl = value => typeof value === 'string' && /^https:\/\/[^\s/@?#]+(?:[/?#][^\s]*)?$/.test(value) ? value : '';
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export function normalizeGuide(data) {
  const source = data && typeof data === 'object' ? data : {};
  const ids = new Set();
  const points = (Array.isArray(source.points) ? source.points : []).filter(point => {
    if (!point || typeof point.id !== 'string' || ids.has(point.id) || typeof point.name !== 'string' || !point.name.trim() || point.visible !== true) return false;
    if (![point.x, point.y].every(value => finite(value) && value >= 0 && value <= 1)) return false;
    ids.add(point.id);
    return true;
  }).map(point => ({
    ...point,
    categories: (Array.isArray(point.categories) ? point.categories : []).filter(category => category !== 'all' && GUIDE_CATEGORIES.some(option => option.value === category)),
    imageUrl: imageUrl(point.imageUrl),
    description: typeof point.description === 'string' ? point.description : '',
    address: typeof point.address === 'string' ? point.address : '',
    sortOrder: finite(point.sortOrder) ? point.sortOrder : 0,
  })).sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    title: typeof source.title === 'string' && source.title.trim() ? source.title : '风车天路景区导览',
    imageUrl: imageUrl(source.imageUrl),
    imageWidth: finite(source.imageWidth) && source.imageWidth > 0 ? source.imageWidth : 1,
    imageHeight: finite(source.imageHeight) && source.imageHeight > 0 ? source.imageHeight : 1,
    points,
  };
}

export function filterGuidePoints(points, category) { return category === 'all' ? points : points.filter(point => point.categories.includes(category)); }
export function canNavigateToPoint(point) { return !!point && finite(point.latitude) && finite(point.longitude) && Math.abs(point.latitude) <= 90 && Math.abs(point.longitude) <= 180; }
export function shouldStartGuideGesture(event) { return !event?.target?.dataset?.guideMapControl; }

export function spreadGuideMarkers(points, displayWidth, displayHeight, minDistance = 14) {
  const markers = (Array.isArray(points) ? points : []).map(point => ({
    ...point,
    screenX: point.x * displayWidth,
    screenY: point.y * displayHeight,
    offsetX: 0,
    offsetY: 0,
  }));
  const remaining = new Set(markers.map((_, index) => index));

  while (remaining.size) {
    const start = remaining.values().next().value;
    const group = [start];
    remaining.delete(start);
    for (let cursor = 0; cursor < group.length; cursor++) {
      const anchor = markers[group[cursor]];
      for (const candidateIndex of [...remaining]) {
        const candidate = markers[candidateIndex];
        if (Math.hypot(anchor.screenX - candidate.screenX, anchor.screenY - candidate.screenY) >= minDistance) continue;
        group.push(candidateIndex);
        remaining.delete(candidateIndex);
      }
    }
    if (group.length === 1) continue;

    const center = group.reduce((value, index) => ({
      x: value.x + markers[index].screenX / group.length,
      y: value.y + markers[index].screenY / group.length,
    }), { x: 0, y: 0 });
    const radius = minDistance / (2 * Math.sin(Math.PI / group.length));
    group.forEach((index, order) => {
      const marker = markers[index];
      const angle = -Math.PI / 2 + order * Math.PI * 2 / group.length;
      const screenX = center.x + Math.cos(angle) * radius;
      const screenY = center.y + Math.sin(angle) * radius;
      marker.offsetX = screenX - marker.screenX;
      marker.offsetY = screenY - marker.screenY;
      marker.screenX = screenX;
      marker.screenY = screenY;
    });
  }

  return markers;
}

const EDGE = 10;
export function fitGuideImage(width, height, viewport) {
  if (width <= 0 || height <= 0 || viewport.width <= EDGE * 2 || viewport.height <= EDGE * 2) return { width: 1, height: 1 };
  const ratio = Math.min((viewport.width - EDGE * 2) / width, (viewport.height - EDGE * 2) / height);
  return { width: width * ratio, height: height * ratio };
}
export function clampGuideTransform(transform, image, viewport) {
  const scale = clamp(transform.scale, 1, 5);
  const bound = (offset, size, space) => size <= space - EDGE * 2 ? (space - size) / 2 : clamp(offset, space - EDGE - size, EDGE);
  return { x: bound(transform.x, image.width * scale, viewport.width), y: bound(transform.y, image.height * scale, viewport.height), scale };
}
export function focusGuidePoint(point, image, viewport, scale = 3) {
  return clampGuideTransform({ x: viewport.width / 2 - point.x * image.width * scale, y: viewport.height / 2 - point.y * image.height * scale, scale }, image, viewport);
}
export function pinchGuideTransform(start, oldMidpoint, newMidpoint, ratio, image, viewport) {
  const scale = clamp(start.scale * ratio, 1, 5);
  return clampGuideTransform({
    x: newMidpoint.x - (oldMidpoint.x - start.x) / start.scale * scale,
    y: newMidpoint.y - (oldMidpoint.y - start.y) / start.scale * scale,
    scale,
  }, image, viewport);
}
