<template>
    <view class="messages-page">
        <!-- 页面不分类，全量按时间倒序一屏拉下来，这条只剩「全部已读」；
             没有消息时它也无事可做，跟着列表一起不渲染 -->
        <view class="top-bar" v-if="list.length > 0">
            <view class="mark-all" @click="markAllRead">
                <text class="mark-all-text">全部已读</text>
            </view>
        </view>

        <view class="list" v-if="list.length > 0">
            <view
                v-for="item in list"
                :key="item.id"
                class="msg-card"
                @click="openMessage(item)"
            >
                <view class="msg-head">
                    <view class="msg-title-wrap">
                        <view v-if="!item.isRead" class="unread-dot"></view>
                        <text class="msg-title" :class="{ unread: !item.isRead }">{{ item.title }}</text>
                    </view>
                    <text class="msg-time">{{ formatTime(item.createdAt) }}</text>
                </view>
                <text class="msg-content">{{ item.content }}</text>
            </view>

            <view class="list-footer">
                <text v-if="loading" class="footer-text">加载中...</text>
                <text v-else-if="!hasMore" class="footer-text">没有更多了</text>
            </view>
        </view>

        <view class="empty" v-else-if="!loading">
            <text class="empty-icon">📭</text>
            <text class="empty-text">暂无消息</text>
        </view>

        <view class="loading" v-else>
            <text class="footer-text">加载中...</text>
        </view>
    </view>
</template>

<script>
import { request } from '@/utils/request.js';
import { fetchUnreadCount, setUnreadCount, getCachedUnreadCount, resolveJumpPath } from '@/utils/message-center.js';

/**
 * 消息中心（方案 §4.4）
 *
 * ── 前端不做任何规则判定 ─────────────────────────────────────────────────
 * 页面不分类也不筛选，全量按时间倒序拉下来；已读/未读、能否跳转全部由后端下发字段决定。
 * 前端唯一自己实现的是**跳转白名单**，因为那是防「旧消息里的路径指向已改名页面」的
 * 最后一道闸，只能在端上做（见 `utils/message-center.js` 的 `resolveJumpPath`）。
 */
export default {
    data() {
        return {
            loading: false,
            list: [],
            page: 1,
            pageSize: 20,
            total: 0,
            hasMore: true,
            unreadCount: getCachedUnreadCount()
        };
    },
    onLoad() {
        this.loadList(true);
    },
    onShow() {
        // 从详情页返回时刷新未读数（那边可能刚把消息标成已读）
        fetchUnreadCount(true).then((n) => {
            this.unreadCount = n;
        });
    },
    onPullDownRefresh() {
        this.loadList(true).finally(() => uni.stopPullDownRefresh());
    },
    onReachBottom() {
        if (!this.hasMore || this.loading) return;
        this.loadList(false);
    },
    methods: {
        loadList(reset) {
            if (reset) {
                this.page = 1;
                this.hasMore = true;
            }
            if (this.loading) return Promise.resolve();

            this.loading = true;
            // 不带 msgType：后端只在显式传了才按类型过滤，不传即全量
            return request({ url: 'messages', data: { page: this.page, pageSize: this.pageSize } })
                .then((res) => {
                    const rows = res && res.data ? res.data : [];
                    const pagination = (res && res.pagination) || {};
                    this.list = reset ? rows : this.list.concat(rows);
                    this.total = pagination.total || this.list.length;
                    this.hasMore = this.list.length < this.total;
                    if (this.hasMore) this.page += 1;
                    this.syncUnread(res);
                })
                .catch(() => {
                    if (reset) this.list = [];
                    // 失败提示由 request 统一弹（非 2xx 会 reject，这里不再重复提示）
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        /**
         * 用列表里的未读数校正角标
         *
         * 只在这一次确实把消息拉全了的时候校正：还有没加载完的页时，统计出的
         * 未读数会偏小，拿它去覆盖角标会把红点错误地消掉。
         */
        syncUnread(res) {
            if (!Array.isArray(res && res.data)) return;
            if (!res.pagination || res.data.length < res.pagination.total) return;
            const unread = res.data.filter((m) => !m.isRead).length;
            this.unreadCount = setUnreadCount(unread);
        },
        openMessage(item) {
            if (!item.isRead) this.markRead([item.id]);
            const target = resolveJumpPath(item.jumpPath);
            if (!target) {
                // jumpPath 为空（如反馈回复）是正常的，不提示；
                // 有路径但不在白名单里说明这条消息的链接已失效，要说一声，
                // 否则用户会以为「点了没反应」是卡住了
                if (item.jumpPath) uni.showToast({ title: '该消息的链接已失效', icon: 'none' });
                return;
            }
            if (target.type === 'switchTab') {
                uni.switchTab({ url: target.url });
            } else {
                uni.navigateTo({ url: target.url });
            }
        },
        markRead(ids) {
            if (!ids || ids.length === 0) return;
            // 先本地置已读再发请求：用户点开就要立刻看到红点消失，
            // 等接口回来再变会有明显的延迟感。失败也不回滚——服务端没记住的话，
            // 下次进来这条消息还能再点一次，代价可接受
            this.list = this.list.map((m) => (ids.indexOf(m.id) >= 0 ? { ...m, isRead: true } : m));
            const next = Math.max(0, this.unreadCount - ids.length);
            this.unreadCount = setUnreadCount(next);
            request({ method: 'POST', url: 'messages/read', data: { ids } }).catch(() => {});
        },
        markAllRead() {
            if (this.unreadCount === 0 && this.list.every((m) => m.isRead)) {
                uni.showToast({ title: '没有未读消息', icon: 'none' });
                return;
            }
            uni.showModal({
                title: '提示',
                content: '将全部消息标记为已读？',
                success: (res) => {
                    if (!res.confirm) return;
                    // 显式传 all:true。后端刻意不接受「ids 为空即全部已读」——
                    // 那种设计会让一个空 body 静默清空用户全部未读（见 ReadMessagesDto）
                    request({ method: 'POST', url: 'messages/read', data: { all: true } })
                        .then((resp) => {
                            const updated = resp && resp.data ? resp.data.updated : 0;
                            this.list = this.list.map((m) => ({ ...m, isRead: true }));
                            this.unreadCount = setUnreadCount(0);
                            uni.showToast({
                                title: updated > 0 ? `已标记 ${updated} 条` : '没有未读消息',
                                icon: 'none'
                            });
                        })
                        .catch(() => {});
                }
            });
        },
        /**
         * 时间展示：今天 / 昨天只给时分，更早给月日，跨年才给年份。
         * 消息列表里绝大多数是近几天的，全量 `YYYY-MM-DD HH:mm` 会让每行都很长。
         */
        formatTime(value) {
            if (!value) return '';
            const date = new Date(value);
            if (isNaN(date.getTime())) return '';
            const now = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            const hm = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
            const sameDay = (a, b) =>
                a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

            if (sameDay(date, now)) return hm;
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            if (sameDay(date, yesterday)) return `昨天 ${hm}`;
            if (date.getFullYear() === now.getFullYear()) {
                return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${hm}`;
            }
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
        }
    }
};
</script>

<style scoped>
.messages-page {
    min-height: 100vh;
    background-color: #f5f5f5;
    padding-bottom: 40rpx;
}

/* 顶部操作条 */
.top-bar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    background: #fff;
    padding: 0 20rpx;
    border-bottom: 1rpx solid #f0f0f0;
    position: sticky;
    top: 0;
    z-index: 10;
}

/* 热区靠 padding 撑到约 44px 高：这是条里唯一的可点元素 */
.mark-all {
    padding: 26rpx 20rpx;
}

.mark-all-text {
    font-size: 26rpx;
    color: #2F6E8E;
}

/* 列表 */
.list {
    padding: 20rpx;
}

.msg-card {
    background: #fff;
    border-radius: 20rpx;
    padding: 28rpx;
    margin-bottom: 20rpx;
}

.msg-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
}

.msg-title-wrap {
    display: flex;
    align-items: center;
    flex: 1;
    margin-right: 16rpx;
}

.unread-dot {
    width: 14rpx;
    height: 14rpx;
    border-radius: 50%;
    background: #ff4757;
    margin-right: 12rpx;
    flex-shrink: 0;
}

.msg-title {
    font-size: 30rpx;
    color: #333;
    flex: 1;
}

.msg-title.unread {
    font-weight: bold;
}

.msg-time {
    font-size: 24rpx;
    color: #bbb;
    flex-shrink: 0;
}

.msg-content {
    display: block;
    font-size: 27rpx;
    color: #888;
    line-height: 1.6;
    margin-top: 14rpx;
}

.list-footer,
.loading {
    text-align: center;
    padding: 24rpx 0;
}

.footer-text {
    font-size: 24rpx;
    color: #bbb;
}

/* 空态 */
.empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 200rpx;
}

.empty-icon {
    font-size: 100rpx;
    margin-bottom: 20rpx;
}

.empty-text {
    font-size: 28rpx;
    color: #bbb;
}
</style>
