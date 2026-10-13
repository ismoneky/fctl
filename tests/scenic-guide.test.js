import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeGuide, filterGuidePoints, canNavigateToPoint, fitGuideImage, clampGuideTransform, focusGuidePoint, pinchGuideTransform } from '../utils/scenic-guide.js';

test('guide normalization drops malformed and hidden points, preserving edge positions and multiple categories', () => {
  const point = { id: 'entrance', name: '入口', visible: true, x: 0, y: 1, categories: ['entrance', 'parking'], sortOrder: 2 };
  const guide = normalizeGuide({ title: '导览', imageUrl: 'https://cdn.example.com/a.jpg', imageWidth: 2000, imageHeight: 1000, points: [point, { ...point, id: 'hidden', visible: false }, { ...point, id: 'bad', x: 2 }, { ...point, id: 'first', sortOrder: 0 }] });
  assert.deepEqual(guide.points.map(p => p.id), ['first', 'entrance']);
  assert.equal(guide.points[1].x, 0);
  assert.equal(filterGuidePoints(guide.points, 'parking').length, 2);
  assert.equal(filterGuidePoints(guide.points, 'toilet').length, 0);
  assert.equal(normalizeGuide(null).points.length, 0);
  assert.equal(normalizeGuide({ imageUrl: 'javascript:bad' }).imageUrl, '');
});

test('navigation requires two actual finite coordinates and does not treat null as zero', () => {
  assert.equal(canNavigateToPoint({ latitude: 0, longitude: 0 }), true);
  assert.equal(canNavigateToPoint({ latitude: 35.7, longitude: 114.1 }), true);
  for (const point of [{}, { latitude: 35 }, { latitude: null, longitude: null }, { latitude: '35', longitude: 114 }, { latitude: 91, longitude: 114 }]) assert.equal(canNavigateToPoint(point), false);
});

test('wide guide fits without cropping and uses a compact marker gutter', () => {
  assert.deepEqual(fitGuideImage(2000, 1000, { width: 400, height: 300 }), { width: 380, height: 190 });
  assert.deepEqual(clampGuideTransform({ x: 0, y: 0, scale: 1 }, { width: 380, height: 190 }, { width: 400, height: 300 }), { x: 10, y: 55, scale: 1 });
});

test('focus centers a selected point and clamps image boundaries during panning', () => {
  const image = { width: 360, height: 180 };
  const viewport = { width: 400, height: 300 };
  assert.deepEqual(focusGuidePoint({ x: 0.8, y: 0.5 }, image, viewport, 3), { x: -664, y: -120, scale: 3 });
  assert.deepEqual(clampGuideTransform({ x: 800, y: -800, scale: 3 }, image, viewport), { x: 10, y: -250, scale: 3 });
});

test('pinch zoom keeps the touched image point under the moving midpoint', () => {
  const result = pinchGuideTransform({ x: -160, y: -30, scale: 2 }, { x: 200, y: 150 }, { x: 210, y: 160 }, 1.5, { width: 360, height: 180 }, { width: 400, height: 300 });
  assert.deepEqual(result, { x: -330, y: -110, scale: 3 });
});

test('map control touches do not start a canvas gesture', async () => {
  const module = await import('../utils/scenic-guide.js');
  assert.equal(typeof module.shouldStartGuideGesture, 'function', 'expected a map-control gesture guard');
  assert.equal(module.shouldStartGuideGesture({ target: { dataset: { guideMapControl: true } } }), false);
  assert.equal(module.shouldStartGuideGesture({ target: { dataset: {} } }), true);
});

test('co-located guide markers receive distinct screen positions while isolated markers stay anchored', async () => {
  const module = await import('../utils/scenic-guide.js');
  assert.equal(typeof module.spreadGuideMarkers, 'function', 'expected a dense-marker layout helper');

  const markers = module.spreadGuideMarkers([
    { id: 'a', x: 0.5, y: 0.5 },
    { id: 'b', x: 0.5, y: 0.5 },
    { id: 'isolated', x: 0.9, y: 0.9 },
  ], 300, 300, 14);

  const [first, second, isolated] = markers;
  const distance = Math.hypot(first.screenX - second.screenX, first.screenY - second.screenY);
  assert.ok(distance >= 14, `expected co-located markers to be at least 14px apart, got ${distance}`);
  assert.deepEqual([isolated.offsetX, isolated.offsetY], [0, 0]);
  assert.deepEqual(markers.map(marker => marker.id), ['a', 'b', 'isolated']);
});

test('larger co-located marker groups keep every marker visually separate', async () => {
  const { spreadGuideMarkers } = await import('../utils/scenic-guide.js');
  const markers = spreadGuideMarkers(Array.from({ length: 5 }, (_, index) => ({ id: String(index), x: 0.5, y: 0.5 })), 300, 300, 14);

  for (let first = 0; first < markers.length; first++) {
    for (let second = first + 1; second < markers.length; second++) {
      const distance = Math.hypot(markers[first].screenX - markers[second].screenX, markers[first].screenY - markers[second].screenY);
      assert.ok(distance >= 13.99, `expected markers ${first} and ${second} not to overlap, got ${distance}`);
    }
  }
});
