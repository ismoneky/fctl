import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
	shouldCollapseAnnouncement,
	splitAnnouncementParagraphs,
} from '../utils/announcement-display.js';

test('公告正文按后台换行拆成可独立展示的段落', () => {
	assert.deepEqual(
		splitAnnouncementParagraphs('道路单向通行。\n鲍庄村驶入，淇林岩驶出。\r\n林区内禁止明火。'),
		['道路单向通行。', '鲍庄村驶入，淇林岩驶出。', '林区内禁止明火。'],
	);
});

test('公告正文忽略空行并收拢段内多余空白', () => {
	assert.deepEqual(
		splitAnnouncementParagraphs('  每日前100名预约免费入园。  \n\n  一车多人需全员实名预约登记，  现场核验。 '),
		['每日前100名预约免费入园。', '一车多人需全员实名预约登记， 现场核验。'],
	);
});

test('空公告正文返回空段落列表', () => {
	assert.deepEqual(splitAnnouncementParagraphs(null), []);
	assert.deepEqual(splitAnnouncementParagraphs(' \n '), []);
});

test('三行以内的短公告直接完整展示', () => {
	assert.equal(shouldCollapseAnnouncement('风车天路实行实名制预约，请提前预约。'), false);
	assert.equal(shouldCollapseAnnouncement('山路弯道较多。\n请注意安全。\n谨慎驾驶。'), false);
});

test('超过三行的长公告默认收起并提供展开入口', () => {
	assert.equal(
		shouldCollapseAnnouncement(
			'尊敬的用户您好！为缓解道路拥堵，提高游客游玩体验，风车天路9月25号至10月7号实行单向通行，鲍庄村驶入，淇林岩驶出，林区内禁止明火，保护环境人人有责。',
		),
		true,
	);
	assert.equal(shouldCollapseAnnouncement('第一项。\n第二项。\n第三项。\n第四项。'), true);
});
