<template>
    <view class="feedback">
        <view class="container">

            <view class="form-card">
                <view class="form-item-textarea">
                    <text class="form-label">反馈内容</text>
                    <textarea
                        class="form-textarea"
                        v-model="form.content"
                        placeholder="请描述您的问题或建议..."
                        placeholder-style="color:#bbb"
                        maxlength="500"
                        auto-height
                    />
                    <text class="word-count">{{ form.content.length }}/500</text>
                </view>

                <view class="divider"></view>

                <view class="form-item">
                    <text class="form-label">联系手机号</text>
                    <view class="input-wrap">
                        <input
                            class="form-input"
                            v-model="form.phone"
                            placeholder="请输入手机号，方便我们联系您"
                            placeholder-style="color:#bbb"
                            type="number"
                            maxlength="11"
                        />
                    </view>
                </view>
            </view>

        </view>

        <!-- 吸底按钮 -->
        <view class="submit-bar">
            <view class="submit-btn" @tap="submitFeedback">提交反馈</view>
        </view>
    </view>
</template>

<script>
import { request } from '@/utils/request.js';
export default {
    data() {
        return {
            form: {
                content: '',
                phone: ''
            }
        }
    },
    methods: {
        submitFeedback() {
            const content = this.form.content.trim();
            const phone = this.form.phone.trim();
            if (!content) {
                uni.showToast({ title: '请填写反馈内容', icon: 'none' });
                return;
            }
            if (!phone) {
                uni.showToast({ title: '请填写手机号', icon: 'none' });
                return;
            }
            if (!/^1\d{10}$/.test(phone)) {
                uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
                return;
            }
            uni.showLoading({ title: '提交中...' });
            request({
                method: 'POST',
                url: 'feedbacks',
                data: { content, phone }
            }).then(() => {
                uni.showToast({ title: '反馈已提交，感谢您的建议！', icon: 'none', duration: 2500 });
                setTimeout(() => uni.navigateBack(), 1500);
            }).catch(() => {
                uni.showToast({ title: '提交失败，请稍后重试', icon: 'none' });
            }).finally(() => {
                uni.hideLoading();
            });
        }
    }
}
</script>

<style scoped>
.feedback {
    height: 100vh;
    overflow: hidden;
    background: #f5f5f5;
    box-sizing: border-box;
}

.container {
    height: calc(100vh - 160rpx - env(safe-area-inset-bottom));
    padding: 30rpx;
    padding-bottom: 0;
    box-sizing: border-box;
    overflow-y: auto;
}

.form-card {
    background: #fff;
    border-radius: 24rpx;
    padding: 10rpx 30rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.form-item {
    padding: 30rpx 0;
    position: relative;
}

.form-item-textarea {
    padding: 30rpx 0 10rpx;
}

.form-label {
    font-size: 28rpx;
    color: #333;
    font-weight: 500;
    display: block;
    margin-bottom: 20rpx;
}

.form-textarea {
    width: 100%;
    min-height: 200rpx;
    max-height: 50vh;
    font-size: 30rpx;
    color: #333;
    line-height: 1.7;
    box-sizing: border-box;
    overflow-y: auto;
}

.word-count {
    font-size: 24rpx;
    color: #bbb;
    text-align: right;
    display: block;
    margin-top: 10rpx;
}

.divider {
    height: 1rpx;
    background: #f0f0f0;
}

.input-wrap {
    background: #f7f8fa;
    border-radius: 16rpx;
    padding: 0 24rpx;
    height: 88rpx;
    display: flex;
    align-items: center;
}

.form-input {
    flex: 1;
    height: 88rpx;
    font-size: 30rpx;
    color: #333;
    background: transparent;
}

/* 吸底按钮 */
.submit-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 20rpx 30rpx;
    padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
    background: #f5f5f5;
}

.submit-btn {
    height: 96rpx;
    line-height: 96rpx;
    text-align: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    font-size: 34rpx;
    font-weight: bold;
    border-radius: 48rpx;
    box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.4);
}
</style>
