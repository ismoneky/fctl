<template>
  <view v-if="visible" class="delete-confirm-mask" @tap="close" @touchmove.stop>
    <view class="delete-confirm-card" @tap.stop>
      <view class="delete-confirm-icon-shell">
        <image
          class="delete-confirm-icon"
          src="/static/svg/trash-2-danger.svg"
          mode="aspectFit"
        />
      </view>
      <text class="delete-confirm-title">确认删除订单？</text>
      <text class="delete-confirm-message">{{ promptText }}</text>
      <text class="delete-confirm-warning">此操作不可恢复</text>
      <view class="delete-confirm-actions">
        <view class="delete-confirm-action delete-confirm-cancel" @tap="close">暂不删除</view>
        <view class="delete-confirm-action delete-confirm-submit" @tap="confirm">确认删除</view>
      </view>
    </view>
  </view>
</template>

<script>
import { getOrderDeletePrompt } from '../utils/order-delete-prompt.js';

export default {
  name: 'OrderDeleteConfirm',
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      default: '',
    },
  },
  computed: {
    promptText() {
      return getOrderDeletePrompt(this.status);
    },
  },
  methods: {
    close() {
      this.$emit('close');
    },
    confirm() {
      this.$emit('confirm');
    },
  },
};
</script>

<style scoped>
.delete-confirm-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
}

.delete-confirm-card {
  width: 600rpx;
  overflow: hidden;
  border-radius: 24rpx;
  background: #FFFFFF;
  box-shadow: 0 20rpx 60rpx rgba(31, 55, 68, 0.16);
  text-align: center;
}

.delete-confirm-icon-shell {
  width: 72rpx;
  height: 72rpx;
  margin: 36rpx auto 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #FCECEC;
}

.delete-confirm-icon {
  width: 36rpx;
  height: 36rpx;
}

.delete-confirm-title,
.delete-confirm-message,
.delete-confirm-warning {
  display: block;
}

.delete-confirm-title {
  color: #263238;
  font-size: 32rpx;
  font-weight: 700;
  line-height: 1.4;
}

.delete-confirm-message {
  margin-top: 14rpx;
  padding: 0 42rpx;
  color: #5F6B73;
  font-size: 26rpx;
  line-height: 1.6;
}

.delete-confirm-warning {
  margin: 12rpx 0 28rpx;
  color: #D94C4C;
  font-size: 24rpx;
  line-height: 1.4;
}

.delete-confirm-actions {
  display: flex;
  border-top: 1rpx solid #E9EEF1;
}

.delete-confirm-action {
  flex: 1;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFFFFF;
  font-size: 28rpx;
  font-weight: 600;
}

.delete-confirm-cancel {
  color: #5F6B73;
}

.delete-confirm-submit {
  border-left: 1rpx solid #E9EEF1;
  color: #D94C4C;
}
</style>
