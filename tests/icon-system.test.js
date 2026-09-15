import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SVG_DIR = path.join(ROOT, 'static/svg');

const iconColors = {
  'scan-line.svg': '#222222',
  'inbox.svg': '#222222',
  'contact-round.svg': '#222222',
  'message-square-more.svg': '#222222',
  'shield-check.svg': '#222222',
  'file-text.svg': '#222222',
  'user-round.svg': '#222222',
  'smartphone.svg': '#222222',
  'mail.svg': '#222222',
  'mail-open.svg': '#222222',
  'check-check.svg': '#222222',
  'chevron-right-neutral.svg': '#B8B8B8',
  'chevron-down-primary.svg': '#2F6E8E',
  'plus-primary.svg': '#263238',
  'plus-disabled.svg': '#98A2A8',
  'shield-check-white.svg': '#FFFFFF',
  'circle-check-white.svg': '#FFFFFF',
  'circle-x-white.svg': '#FFFFFF',
  'trash-2-danger.svg': '#D94C4C',
  'trash-2-white.svg': '#FFFFFF',
  'tab-home-normal.svg': '#9A9A9A',
  'tab-home-active.svg': 'url(#tab-active-gradient)',
  'tab-booking-normal.svg': '#9A9A9A',
  'tab-booking-active.svg': 'url(#tab-active-gradient)',
  'tab-profile-normal.svg': '#9A9A9A',
  'tab-profile-active.svg': 'url(#tab-active-gradient)',
};

function svgRoot(source) {
  const match = source.match(/<svg\b([^>]*)>/);
  assert.ok(match, 'asset must have an <svg> root');
  return match[1];
}

test('target icon set uses one 24px rounded outline contract', () => {
  for (const [name, color] of Object.entries(iconColors)) {
    const file = path.join(SVG_DIR, name);
    assert.ok(fs.existsSync(file), `${name} must exist`);
    const source = fs.readFileSync(file, 'utf8');
    const root = svgRoot(source);

    assert.match(root, /viewBox="0 0 24 24"/, `${name}: 24×24 viewBox`);
    assert.match(root, /fill="none"/, `${name}: outline fill`);
    assert.ok(root.includes(`stroke="${color}"`), `${name}: approved palette`);
    assert.match(root, /stroke-width="2"/, `${name}: 2px stroke`);
    assert.match(root, /stroke-linecap="round"/, `${name}: rounded line caps`);
    assert.match(root, /stroke-linejoin="round"/, `${name}: rounded joins`);
    assert.doesNotMatch(root, /\s(?:width|height)="/, `${name}: CSS controls display size`);
    assert.doesNotMatch(source, /currentColor/, `${name}: external image color must be explicit`);
  }
});

test('active tab icons reuse the homepage booking gradient', () => {
  for (const name of ['tab-home-active.svg', 'tab-booking-active.svg', 'tab-profile-active.svg']) {
    const source = fs.readFileSync(path.join(SVG_DIR, name), 'utf8');
    assert.match(source, /<linearGradient id="tab-active-gradient"[^>]*>/);
    assert.match(source, /<stop offset="0%" stop-color="#3F99F6"\/>/);
    assert.match(source, /<stop offset="90%" stop-color="#2F6E8E"\/>/);
  }
});

test('booking active gradient uses the full SVG canvas so straight strokes render', () => {
  const source = fs.readFileSync(path.join(SVG_DIR, 'tab-booking-active.svg'), 'utf8');
  assert.match(
    source,
    /<linearGradient id="tab-active-gradient" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="24" y2="24">/,
  );
});

test('profile page uses semantic SVG icons instead of emoji and text chevrons', () => {
  const source = fs.readFileSync(path.join(ROOT, 'pages/profile/profile.vue'), 'utf8');
  for (const icon of [
    'shield-check-white.svg',
    'user-round.svg',
    'smartphone.svg',
    'scan-line.svg',
    'inbox.svg',
    'contact-round.svg',
    'message-square-more.svg',
    'shield-check.svg',
    'file-text.svg',
    'chevron-right-neutral.svg',
    'circle-check-white.svg',
    'circle-x-white.svg',
  ]) {
    assert.ok(source.includes(`/static/svg/${icon}`), `profile must reference ${icon}`);
  }
  assert.doesNotMatch(source, /🛡️|👤|📱|📷|<text class="menu-arrow">›<\/text>/);
});

test('message center exposes read state and empty state with semantic icons', () => {
  const source = fs.readFileSync(path.join(ROOT, 'pages/messages/messages.vue'), 'utf8');
  assert.ok(source.includes('/static/svg/check-check.svg'));
  assert.ok(source.includes("item.isRead ? '/static/svg/mail-open.svg' : '/static/svg/mail.svg'"));
  assert.ok(source.includes('/static/svg/inbox.svg'));
  assert.doesNotMatch(source, /📭/);
});

test('booking form renders the common-profile disclosure as a compact outline icon', () => {
  const source = fs.readFileSync(path.join(ROOT, 'pages/booking-form/booking-form.vue'), 'utf8');
  assert.ok(source.includes('/static/svg/chevron-down-primary.svg'));
  assert.doesNotMatch(source, /<text class="name-picker-caret">▾<\/text>/);

  const rule = source.match(/\.name-picker-chevron\s*\{([^}]*)\}/);
  assert.ok(rule, 'booking form: name-picker-chevron style must exist');
  assert.match(rule[1], /width:\s*28rpx/);
  assert.match(rule[1], /height:\s*28rpx/);
});

test('booking form renders the add-passenger action with normal and disabled outline icons', () => {
  const source = fs.readFileSync(path.join(ROOT, 'pages/booking-form/booking-form.vue'), 'utf8');
  assert.ok(source.includes("atMaxPerson ? '/static/svg/plus-disabled.svg' : '/static/svg/plus-primary.svg'"));
  assert.doesNotMatch(source, />＋ 添加同行人<\/button>/);

  const rule = source.match(/\.add-entry-icon\s*\{([^}]*)\}/);
  assert.ok(rule, 'booking form: add-entry-icon style must exist');
  assert.match(rule[1], /width:\s*28rpx/);
  assert.match(rule[1], /height:\s*28rpx/);
});

test('booking form gives the add-passenger action a restrained elevated hierarchy', () => {
  const source = fs.readFileSync(path.join(ROOT, 'pages/booking-form/booking-form.vue'), 'utf8');
  const rule = source.match(/\.add-entry-btn\s*\{([^}]*)\}/);
  assert.ok(rule, 'booking form: add-entry-btn style must exist');
  assert.match(rule[1], /font-size:\s*28rpx/);
  assert.match(rule[1], /font-weight:\s*600/);
  assert.match(rule[1], /border-radius:\s*16rpx/);
  assert.match(rule[1], /border:\s*1\.5rpx solid #CAD6DC/);
  assert.match(rule[1], /background:\s*linear-gradient\(135deg, #E2EFF8 0%, #E2F2EC 100%\)/);
  assert.match(rule[1], /color:\s*#263238/);
  assert.match(rule[1], /box-shadow:\s*0 6rpx 16rpx rgba\(31, 55, 68, 0\.08\)/);

  const disabledRule = source.match(/\.add-entry-btn--disabled\s*\{([^}]*)\}/);
  assert.ok(disabledRule, 'booking form: disabled add-entry style must exist');
  assert.match(disabledRule[1], /box-shadow:\s*none/);
});

test('booking form keeps interface and semantic colors inside one deliberate palette', () => {
  const source = fs.readFileSync(path.join(ROOT, 'pages/booking-form/booking-form.vue'), 'utf8');
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const allowedHex = new Set([
    '#2F6E8E', '#3F99F6', '#33C5A0',
    '#E2EFF8', '#E2F2EC',
    '#FFFFFF', '#F5F8FA', '#F7F9FA',
    '#263238', '#5F6B73', '#98A2A8',
    '#CAD6DC', '#DDE4E8', '#E9EEF1',
    '#D94C4C', '#FCECEC',
    '#2F9275', '#E8F4EF',
    '#9A7424', '#FFF6E3',
  ]);
  const allowedRgba = new Set([
    'rgba(31, 55, 68, 0.08)',
    'rgba(31, 55, 68, 0.16)',
    'rgba(47, 110, 142, 0.10)',
    'rgba(217, 76, 76, 0.14)',
    'rgba(0, 0, 0, 0.45)',
  ]);
  const unknownHex = [...new Set(withoutComments.match(/#[0-9A-Fa-f]{3,8}\b/g) || [])]
    .filter((color) => !allowedHex.has(color));
  const unknownRgba = [...new Set(withoutComments.match(/rgba?\([^)]*\)/g) || [])]
    .filter((color) => !allowedRgba.has(color));

  assert.deepEqual(unknownHex, [], `unexpected booking colors: ${unknownHex.join(', ')}`);
  assert.deepEqual(unknownRgba, [], `unexpected booking shadows: ${unknownRgba.join(', ')}`);
});

test('booking form separates neutral information from error, success, and warning strength', () => {
  const source = fs.readFileSync(path.join(ROOT, 'pages/booking-form/booking-form.vue'), 'utf8');
  const rule = (selector) => {
    const match = source.match(new RegExp(`\\.${selector}\\s*\\{([^}]*)\\}`));
    assert.ok(match, `booking form: ${selector} style must exist`);
    return match[1];
  };

  assert.match(rule('free-banner'), /background:\s*#F7F9FA/);
  assert.match(rule('free-banner'), /border:\s*1\.5rpx solid #CAD6DC/);
  assert.match(rule('field-error-text'), /color:\s*#D94C4C/);
  assert.match(rule('passenger-delete-btn'), /color:\s*#D94C4C/);
  assert.match(rule('passenger-age-free-tag'), /color:\s*#2F9275/);
  assert.match(rule('passenger-age-free-tag'), /background:\s*#E8F4EF/);
  assert.match(rule('passenger-unavailable-tag'), /color:\s*#9A7424/);
  assert.match(rule('passenger-unavailable-tag'), /background:\s*#FFF6E3/);
  assert.match(rule('passenger-age-mismatch-tag'), /color:\s*#D94C4C/);
  assert.match(rule('passenger-age-mismatch-tag'), /background:\s*#FCECEC/);
});

test('non-tab glyphs use the compact 36rpx display size', () => {
  const profile = fs.readFileSync(path.join(ROOT, 'pages/profile/profile.vue'), 'utf8');
  const messages = fs.readFileSync(path.join(ROOT, 'pages/messages/messages.vue'), 'utf8');

  for (const [label, source, selector] of [
    ['profile menu', profile, 'menu-icon-svg'],
    ['profile chevron', profile, 'menu-chevron-svg'],
    ['profile modal', profile, 'apply-modal-icon-svg'],
    ['message action', messages, 'mark-all-icon'],
    ['message card', messages, 'message-state-icon'],
    ['message empty state', messages, 'empty-icon-svg'],
  ]) {
    const rule = source.match(new RegExp(`\\.${selector}[^\\{]*\\{([^}]*)\\}`));
    assert.ok(rule, `${label}: ${selector} style must exist`);
    assert.match(rule[1], /width:\s*36rpx/);
    assert.match(rule[1], /height:\s*36rpx/);
  }
});

test('tab glyphs remain at the approved 40rpx display size', () => {
  const source = fs.readFileSync(path.join(ROOT, 'components/my-tab-bar.vue'), 'utf8');
  const rule = source.match(/\.tab-icon-svg\s*\{([^}]*)\}/);
  assert.ok(rule, 'tab icon style must exist');
  assert.match(rule[1], /width:\s*40rpx/);
  assert.match(rule[1], /height:\s*40rpx/);
});

test('tab labels use the compact size and active gradient midpoint color', () => {
  const source = fs.readFileSync(path.join(ROOT, 'components/my-tab-bar.vue'), 'utf8');
  const rule = source.match(/\.tab-text\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/);
  assert.ok(rule, 'tab text style must exist');
  assert.match(rule[1], /font-size:\s*22rpx/);
  assert.match(rule[1], /&\.active\s*\{[^}]*color:\s*#357FAF/);
});

test('order list and detail share one status-aware delete confirmation surface', () => {
  const list = fs.readFileSync(path.join(ROOT, 'pages/booking/booking.vue'), 'utf8');
  const detail = fs.readFileSync(path.join(ROOT, 'pages/booking-detail/booking-detail.vue'), 'utf8');
  const componentPath = path.join(ROOT, 'components/order-delete-confirm.vue');

  assert.ok(fs.existsSync(componentPath), 'shared order delete confirmation component must exist');
  const component = fs.readFileSync(componentPath, 'utf8');

  assert.ok(list.includes('<order-delete-confirm'));
  assert.ok(detail.includes('<order-delete-confirm'));
  assert.ok(list.includes('class="booking-swipe-shell"'));
  assert.match(list, /class="[^"]*\bbooking-swipe-content\b[^"]*"/);
  assert.ok(list.includes('class="booking-swipe-delete"'));
  assert.ok(list.includes('class="booking-swipe-delete-fill"'));
  assert.ok(list.includes('/static/svg/trash-2-white.svg'));
  assert.ok(list.includes('@touchstart="onBookingTouchStart($event, item)"'));
  assert.ok(list.includes('@touchmove="onBookingTouchMove($event, item)"'));
  assert.ok(list.includes('@touchend="onBookingTouchEnd(item)"'));
  assert.doesNotMatch(list, /class="booking-delete-entry"/);
  assert.ok(detail.includes('class="delete-order-btn"'));
  assert.ok(component.includes('/static/svg/trash-2-danger.svg'));
  assert.ok(component.includes('{{ promptText }}'));
});
