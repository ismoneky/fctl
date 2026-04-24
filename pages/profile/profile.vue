<template>
  <view class="profile">
    <!-- 申请管理员弹窗 -->
    <view v-if="applyModal.show" class="modal-mask" @tap="closeApplyModal">
      <view class="modal-card apply-modal" @tap.stop>
        <view class="apply-modal-header">
          <text class="apply-modal-icon-bg">🛡️</text>
          <text class="apply-modal-title">申请管理员权限</text>
          <text class="apply-modal-subtitle">提交后等待超级管理员审核</text>
        </view>
        <view class="apply-modal-body">
          <view class="apply-form-item">
            <view class="apply-input-wrap">
              <text class="apply-input-icon">👤</text>
              <input
                class="apply-input"
                v-model="applyForm.name"
                placeholder="请输入您的姓名"
                placeholder-style="color:#bbb"
                maxlength="20"
              />
            </view>
          </view>
          <view class="apply-form-item">
            <view class="apply-input-wrap">
              <text class="apply-input-icon">📱</text>
              <input
                class="apply-input"
                v-model="applyForm.phone"
                placeholder="请输入手机号码"
                placeholder-style="color:#bbb"
                type="number"
                maxlength="11"
              />
            </view>
          </view>
        </view>
        <view class="apply-modal-btns">
          <view class="apply-btn apply-btn-cancel" @tap="closeApplyModal"
            >取消</view
          >
          <view class="apply-btn apply-btn-submit" @tap="submitApply"
            >提交申请</view
          >
        </view>
      </view>
    </view>

    <!-- 核验结果弹窗 -->
    <view v-if="verifyModal.show" class="modal-mask" @tap="closeVerifyModal">
      <view class="modal-card verify-modal" @tap.stop>
        <view
          class="verify-result-icon"
          :class="verifyModal.success ? 'icon-success' : 'icon-fail'"
        >
          <text class="verify-result-emoji">{{
            verifyModal.success ? "✓" : "✕"
          }}</text>
        </view>
        <text
          class="verify-modal-title"
          :class="verifyModal.success ? 'title-success' : 'title-fail'"
        >
          {{ verifyModal.success ? "核验成功" : "核验失败" }}
        </text>
        <text class="verify-modal-msg">{{ verifyModal.message }}</text>
        <view
          class="verify-modal-btn"
          :class="verifyModal.success ? 'btn-success' : 'btn-fail'"
          @tap="closeVerifyModal"
          >确定</view
        >
      </view>
    </view>

    <view class="container">
      <!-- 用户信息卡片 -->
      <view class="user-card">
        <view class="user-header">
          <image
            class="avatar"
            :src="userInfo.avatar"
            mode="aspectFill"
            @tap="onAvatarTap"
          ></image>
          <view class="user-info">
            <text class="username">{{ userInfo.name }}</text>
          </view>
        </view>

        <view class="user-stats">
          <view class="stat-item" @click="goToBooking(2)">
            <text class="stat-number">{{ userStats.pending }}</text>
            <text class="stat-label">待使用</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item" @click="goToBooking(1)">
            <text class="stat-number">{{ userStats.completed }}</text>
            <text class="stat-label">待支付</text>
          </view>
        </view>
      </view>

      <!-- 管理员扫一扫 -->
      <view v-if="isAdmin" class="menu-section" style="margin-bottom: 0">
        <view class="menu-group">
          <view class="menu-item" @click="handleScan">
            <view class="menu-left">
              <text class="menu-icon">📷</text>
              <text class="menu-text">扫一扫核销</text>
            </view>
            <text class="menu-arrow">›</text>
          </view>
        </view>
      </view>

      <!-- 功能菜单 -->
      <view class="menu-section">
        <view class="menu-group">
          <view class="menu-item" @click="goToBooking(0)">
            <view class="menu-left">
              <text class="menu-icon iconfont icon-dingdan"></text>
              <text class="menu-text">我的订单</text>
            </view>
            <text class="menu-arrow">›</text>
          </view>
          <!-- <view class="menu-item" @click="handleMenuClick('help')">
                        <view class="menu-left">
                            <text class="menu-icon">❓</text>
                            <text class="menu-text">帮助中心</text>
                        </view>
                        <text class="menu-arrow">›</text>
                    </view> -->
          <view class="menu-item" @click="goToFeedback">
            <view class="menu-left">
              <image class="menu-icon-svg" src="/static/svg/message.svg" mode="aspectFit" />
              <text class="menu-text">意见反馈</text>
            </view>
            <text class="menu-arrow">›</text>
          </view>
        </view>

        <!-- <view class="menu-group">
				<view class="menu-item" @click="handleMenuClick('settings')">
					<view class="menu-left">
						<text class="menu-icon">⚙️</text>
						<text class="menu-text">设置</text>
					</view>
					<text class="menu-arrow">›</text>
				</view>
			</view> -->
      </view>

      <!-- 联系方式 -->
      <text class="contact-tip">如有问题可直接联系：18639220123</text>
    </view>
    <my-tab-bar :current="2"></my-tab-bar>
  </view>
</template>

<script>
import myTabBar from "@/components/my-tab-bar.vue";
import { request } from "@/utils/request.js";
export default {
  components: {
    myTabBar,
  },
  data() {
    return {
      isAdmin: false,
      avatarTapCount: 0,
      avatarTapTimer: null,
      applyModal: {
        show: false,
      },
      applyForm: {
        name: "",
        phone: "",
      },
      verifyModal: {
        show: false,
        success: false,
        message: "",
      },
      userInfo: {
        avatar: "/static/avatar.svg",
        name: "微信用户",
        phone: "138****8888",
        vipLevel: "黄金会员",
        points: 1580,
      },
      userStats: {
        pending: 0,
        completed: 0,
        collection: 8,
      },
      couponCount: 3,
    };
  },
  onShow() {
    this.isAdmin = uni.getStorageSync("isAdmin") === true;
    this.refreshData();
  },
  // 分享给好友
  onShareAppMessage() {
    return {
      title: "风车天路 - 浪漫风车之旅等你来",
      path: "/pages/index/index",
      imageUrl: "",
    };
  },
  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: "风车天路 - 浪漫风车之旅等你来",
      query: "",
      imageUrl: "",
    };
  },
  methods: {
    refreshData() {
      request({ url: "bookings/count", data: { status: "confirmed" } }).then(
        (res) => {
          if (res.data) {
            this.userStats.pending = res.data.count;
          }
        },
      );
      request({ url: "bookings/count", data: { status: "pending" } })
        .then((res) => {
          if (res.data) {
            this.userStats.completed = res.data.count;
          }
        })
        .catch(() => {});
    },
    onAvatarTap() {
      this.avatarTapCount++;
      clearTimeout(this.avatarTapTimer);
      if (this.avatarTapCount >= 10) {
        this.avatarTapCount = 0;
        this.applyForm = { name: "", phone: "" };
        this.applyModal.show = true;
        return;
      }
      this.avatarTapTimer = setTimeout(() => {
        this.avatarTapCount = 0;
      }, 3000);
    },
    closeApplyModal() {
      this.applyModal.show = false;
    },
    submitApply() {
      const name = this.applyForm.name.trim();
      const phone = this.applyForm.phone.trim();
      if (!name) {
        uni.showToast({ title: "请输入姓名", icon: "none" });
        return;
      }
      if (!/^1\d{10}$/.test(phone)) {
        uni.showToast({ title: "请输入正确的手机号", icon: "none" });
        return;
      }
      uni.showLoading({ title: "提交中..." });
      request({
        method: "POST",
        url: "admin-application/apply",
        data: { name, phone },
      })
        .then(() => {
          this.applyModal.show = false;
          uni.showToast({
            title: "申请已提交，请等待审核",
            icon: "none",
            duration: 2500,
          });
        })
        .catch(() => {
          uni.showToast({ title: "提交失败，请稍后重试", icon: "none" });
        })
        .finally(() => {
          uni.hideLoading();
        });
    },
    closeVerifyModal() {
      this.verifyModal.show = false;
    },
    handleScan() {
      // #ifdef MP-WEIXIN
      wx.scanCode({
        onlyFromCamera: false,
        scanType: ["qrCode"],
        success: (res) => {
          const bookingId = res.result;
          uni.showLoading({ title: "核验中..." });
          request({
            method: "POST",
            url: `bookings/${bookingId}/verify`,
          })
            .then(() => {
              this.verifyModal = {
                show: true,
                success: true,
                message: "订单核验通过，祝您游玩愉快！",
              };
            })
            .catch(() => {
              this.verifyModal = {
                show: true,
                success: false,
                message: "订单核验失败，请检查订单状态",
              };
            })
            .finally(() => {
              uni.hideLoading();
            });
        },
        fail: (err) => {
          if (err.errMsg && err.errMsg.includes("cancel")) return;
          uni.showToast({ title: "扫码失败", icon: "none" });
        },
      });
      // #endif
    },
    editProfile() {
      uni.showToast({
        title: "编辑个人资料",
        icon: "none",
      });
      // uni.navigateTo({
      //     url: '/pages/edit-profile/edit-profile'
      // });
    },
    goToBooking(tabIndex) {
      uni.setStorageSync("bookingInitTab", tabIndex);
      uni.switchTab({
        url: "/pages/booking/booking",
        fail: () => {
          uni.reLaunch({ url: "/pages/booking/booking?tab=" + tabIndex });
        },
      });
    },
    goToFeedback() {
      uni.navigateTo({ url: "/pages/feedback/feedback" });
    },
    goToCollection() {
      uni.showToast({
        title: "我的收藏",
        icon: "none",
      });
    },
    goToVip() {
      uni.showToast({
        title: "会员中心",
        icon: "none",
      });
    },
    handleMenuClick(type) {
      const menuMap = {
        orders: "我的订单",
        collection: "我的收藏",
        coupon: "优惠券",
        "id-card": "常用证件",
        address: "地址管理",
        help: "帮助中心",
        feedback: "意见反馈",
        about: "关于我们",
        settings: "设置",
      };

      uni.showToast({
        title: menuMap[type] || "功能开发中",
        icon: "none",
      });

      // 实际项目中根据type跳转到对应页面
      // uni.navigateTo({
      //     url: `/pages/${type}/${type}`
      // });
    },
    handleLogout() {
      uni.showModal({
        title: "提示",
        content: "确定要退出登录吗?",
        success: (res) => {
          if (res.confirm) {
            // 清除登录信息
            uni.showToast({
              title: "已退出登录",
              icon: "success",
            });
            // 实际项目中跳转到登录页
            // uni.reLaunch({
            //     url: '/pages/login/login'
            // });
          }
        },
      });
    },
  },
};
</script>

<style scoped>
.profile {
  height: 100vh;
  overflow: hidden;
}
.container {
  height: calc(100vh - 100rpx - env(safe-area-inset-bottom));
  background-color: #f5f5f5;
  padding-bottom: 0px;
  overflow: hidden;
  overflow-y: auto;
}

/* 用户信息卡片 */
.user-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 30rpx;
  margin-bottom: 20rpx;
}

.user-header {
  display: flex;
  align-items: center;
  margin-bottom: 40rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 20rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
  margin-right: 20rpx;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.username {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 10rpx;
}

.user-phone {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.edit-btn {
  padding: 10rpx 30rpx;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border-radius: 30rpx;
  font-size: 26rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.3);
}

.user-stats {
  display: flex;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20rpx;
  padding: 30rpx 0;
  backdrop-filter: blur(10rpx);
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 10rpx;
}

.stat-label {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

.stat-divider {
  width: 1rpx;
  height: 60rpx;
  background: rgba(255, 255, 255, 0.2);
  align-self: center;
}

/* 会员卡片 */
.vip-card {
  margin: 0 30rpx 20rpx;
  background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%);
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.1);
}

.vip-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.vip-left {
  display: flex;
  flex-direction: column;
}

.vip-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 8rpx;
}

.vip-desc {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
}

.vip-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.vip-points {
  font-size: 28rpx;
  color: #fff;
  margin-bottom: 10rpx;
}

.vip-btn {
  padding: 8rpx 25rpx;
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
  border-radius: 30rpx;
  font-size: 24rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.5);
}

/* 功能菜单 */
.menu-section {
  padding: 0 30rpx;
}

.menu-group {
  background: #fff;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-left {
  display: flex;
  align-items: center;
  position: relative;
}

.menu-icon {
  font-size: 40rpx;
  margin-right: 20rpx;
}

.icon-dingdan {
	font-size: 37rpx;
	margin-top: 4rpx;
}

.menu-icon-svg {
  width: 40rpx;
  height: 40rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.menu-text {
  font-size: 30rpx;
  color: #333;
}

.badge {
  position: absolute;
  top: -10rpx;
  left: 50rpx;
  min-width: 32rpx;
  height: 32rpx;
  line-height: 32rpx;
  background: #ff4757;
  color: #fff;
  font-size: 20rpx;
  text-align: center;
  border-radius: 16rpx;
  padding: 0 8rpx;
}

.menu-arrow {
  font-size: 40rpx;
  color: #ddd;
}

/* ── 通用遮罩 & 卡片 ── */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-card {
  width: 600rpx;
  background: #fff;
  border-radius: 36rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.18);
}

/* ── 申请管理员弹窗 ── */
.apply-modal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 50rpx 40rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.apply-modal-icon-bg {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.apply-modal-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 10rpx;
}

.apply-modal-subtitle {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.75);
}

.apply-modal-body {
  padding: 40rpx 40rpx 10rpx;
}

.apply-form-item {
  margin-bottom: 24rpx;
}

.apply-input-wrap {
  display: flex;
  align-items: center;
  background: #f7f8fa;
  border-radius: 20rpx;
  padding: 0 28rpx;
  height: 90rpx;
  border: 1rpx solid #efefef;
}

.apply-input-icon {
  font-size: 34rpx;
  margin-right: 18rpx;
  flex-shrink: 0;
}

.apply-input {
  flex: 1;
  height: 90rpx;
  font-size: 30rpx;
  color: #333;
  background: transparent;
}

.apply-modal-btns {
  display: flex;
  gap: 0;
  border-top: 1rpx solid #f0f0f0;
  margin-top: 16rpx;
}

.apply-btn {
  flex: 1;
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  font-size: 32rpx;
  font-weight: 500;
}

.apply-btn-cancel {
  color: #999;
  border-right: 1rpx solid #f0f0f0;
}

.apply-btn-submit {
  color: #667eea;
  font-weight: bold;
}

/* ── 核验结果弹窗 ── */
.verify-modal {
  padding: 60rpx 50rpx 50rpx;
  align-items: center;
}

.verify-result-icon {
  width: 140rpx;
  height: 140rpx;
  border-radius: 70rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 36rpx;
}

.icon-success {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  box-shadow: 0 12rpx 30rpx rgba(67, 233, 123, 0.4);
}

.icon-fail {
  background: linear-gradient(135deg, #f5515f 0%, #f7971e 100%);
  box-shadow: 0 12rpx 30rpx rgba(245, 81, 95, 0.4);
}

.verify-result-emoji {
  font-size: 72rpx;
  color: #fff;
  font-weight: bold;
  line-height: 1;
}

.verify-modal-title {
  font-size: 44rpx;
  font-weight: bold;
  margin-bottom: 18rpx;
}

.title-success {
  color: #2dc76d;
}
.title-fail {
  color: #f5515f;
}

.verify-modal-msg {
  font-size: 28rpx;
  color: #999;
  text-align: center;
  margin-bottom: 50rpx;
  line-height: 1.7;
}

.verify-modal-btn {
  width: 100%;
  height: 90rpx;
  line-height: 90rpx;
  text-align: center;
  border-radius: 45rpx;
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
}

.btn-success {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  box-shadow: 0 8rpx 24rpx rgba(67, 233, 123, 0.35);
}

.btn-fail {
  background: linear-gradient(135deg, #f5515f 0%, #f7971e 100%);
  box-shadow: 0 8rpx 24rpx rgba(245, 81, 95, 0.35);
}

/* 退出登录 */
.logout-section {
  padding: 0 30rpx;
  margin-top: 20rpx;
}

.logout-btn {
  width: 100%;
  height: 90rpx;
  line-height: 90rpx;
  background: #fff;
  color: #ff6b6b;
  font-size: 32rpx;
  border-radius: 20rpx;
  border: none;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.contact-tip {
  display: block;
  text-align: center;
  font-size: 24rpx;
  color: #bbb;
  padding: 30rpx 0 20rpx;
}
</style>
