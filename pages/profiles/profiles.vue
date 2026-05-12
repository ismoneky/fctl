<template>
	<view class="container">
		<!-- 常用人员列表 -->
		<view class="list-wrap" v-if="profiles.length > 0">
			<view class="profile-card" v-for="item in profiles" :key="item.profileId">
				<view class="card-info">
					<view class="card-name-row">
						<text class="card-name">{{ item.name }}</text>
						<text class="card-phone">{{ item.phone }}</text>
					</view>
					<text class="card-idcard">{{ maskIdCard(item.idCard) }}</text>
				</view>
				<view class="card-actions">
					<text class="action-btn action-edit" @click="openEdit(item)">编辑</text>
					<text class="action-btn action-delete" @click="handleDelete(item)">删除</text>
				</view>
			</view>
		</view>

		<view class="empty-wrap" v-else-if="!loading">
			<image class="empty-img" src="/static/svg/renyuanxinxi.svg" mode="aspectFit" />
			<text class="empty-text">还没有常用信息，点击下方添加</text>
		</view>

		<!-- 添加按钮 -->
		<view class="add-btn-wrap">
			<button class="add-btn" @click="openAdd">＋ 添加常用人员</button>
		</view>

		<!-- 新增/编辑弹窗 -->
		<view class="modal-mask" v-if="modalVisible" @click="closeModal"></view>
		<view class="modal-popup" :class="{ 'modal-popup--show': modalVisible }">
			<view class="modal-header">
				<text class="modal-title">{{ editingItem ? '编辑人员信息' : '添加常用人员' }}</text>
				<text class="modal-close" @click="closeModal">✕</text>
			</view>
			<view class="modal-body">
				<view class="field-block">
					<text class="field-label required-star">姓名</text>
					<view class="input-box">
						<input class="field-input" v-model="form.name" placeholder="请输入姓名" placeholder-style="color:#c8c8c8" maxlength="20" />
					</view>
				</view>
				<view class="field-block">
					<text class="field-label required-star">手机号</text>
					<view class="input-box">
						<input class="field-input" v-model="form.phone" type="number" maxlength="11" placeholder="请输入手机号码" placeholder-style="color:#c8c8c8" />
					</view>
				</view>
				<view class="field-block">
					<text class="field-label required-star">身份证号</text>
					<view class="input-box">
						<input class="field-input" v-model="form.idCard" maxlength="18" placeholder="请输入身份证号码" placeholder-style="color:#c8c8c8" />
					</view>
				</view>
			</view>
			<view class="modal-footer">
				<button class="modal-btn modal-btn--cancel" @click="closeModal">取消</button>
				<button class="modal-btn modal-btn--confirm" @click="handleSave" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
			</view>
		</view>
	</view>
</template>

<script>
import { request } from '../../utils/request';

export default {
	data() {
		return {
			profiles: [],
			loading: false,
			modalVisible: false,
			editingItem: null,
			saving: false,
			form: {
				name: '',
				phone: '',
				idCard: ''
			}
		};
	},
	onShow() {
		this.fetchProfiles();
	},
	methods: {
		async fetchProfiles() {
			this.loading = true;
			try {
				const res = await request({ method: 'GET', url: '/users/profiles' });
				if (res.success) {
					this.profiles = res.data || [];
				}
			} catch (e) {
				uni.showToast({ title: '加载失败', icon: 'none' });
			} finally {
				this.loading = false;
			}
		},
		maskIdCard(idCard) {
			if (!idCard || idCard.length < 8) return idCard;
			return idCard.substring(0, 4) + '**********' + idCard.substring(idCard.length - 4);
		},
		openAdd() {
			this.editingItem = null;
			this.form = { name: '', phone: '', idCard: '' };
			this.modalVisible = true;
		},
		openEdit(item) {
			this.editingItem = item;
			this.form = { name: item.name, phone: item.phone, idCard: item.idCard };
			this.modalVisible = true;
		},
		closeModal() {
			this.modalVisible = false;
			this.editingItem = null;
		},
		validateForm() {
			if (!this.form.name.trim()) {
				uni.showToast({ title: '请输入姓名', icon: 'none' });
				return false;
			}
			if (!/^1[3-9]\d{9}$/.test(this.form.phone)) {
				uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
				return false;
			}
			if (!/^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(this.form.idCard)) {
				uni.showToast({ title: '请输入正确的身份证号', icon: 'none' });
				return false;
			}
			return true;
		},
		async handleSave() {
			if (!this.validateForm()) return;
			this.saving = true;
			try {
				if (this.editingItem) {
					await request({
						method: 'PUT',
						url: `/users/profiles/${this.editingItem.profileId}`,
						data: this.form
					});
					uni.showToast({ title: '修改成功', icon: 'success' });
				} else {
					await request({
						method: 'POST',
						url: '/users/profiles',
						data: this.form
					});
					uni.showToast({ title: '添加成功', icon: 'success' });
				}
				this.closeModal();
				await this.fetchProfiles();
			} catch (e) {
				uni.showToast({ title: '保存失败，请重试', icon: 'none' });
			} finally {
				this.saving = false;
			}
		},
		handleDelete(item) {
			uni.showModal({
				title: '确认删除',
				content: `确定要删除"${item.name}"的常用信息吗？`,
				confirmText: '删除',
				confirmColor: '#ff4757',
				success: async (res) => {
					if (res.confirm) {
						try {
							await request({ method: 'DELETE', url: `/users/profiles/${item.profileId}` });
							uni.showToast({ title: '已删除', icon: 'success' });
							await this.fetchProfiles();
						} catch (e) {
							uni.showToast({ title: '删除失败', icon: 'none' });
						}
					}
				}
			});
		}
	}
};
</script>

<style scoped>
.container {
	min-height: 100vh;
	background: #f5f8fa;
	padding: 24rpx 24rpx 200rpx;
	box-sizing: border-box;
}

.list-wrap {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.profile-card {
	background: #fff;
	border-radius: 20rpx;
	padding: 30rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.card-info {
	flex: 1;
	min-width: 0;
}

.card-name-row {
	display: flex;
	align-items: center;
	gap: 20rpx;
	margin-bottom: 10rpx;
}

.card-name {
	font-size: 32rpx;
	font-weight: 700;
	color: #333;
}

.card-phone {
	font-size: 26rpx;
	color: #666;
}

.card-idcard {
	font-size: 24rpx;
	color: #999;
}

.card-actions {
	display: flex;
	gap: 24rpx;
	flex-shrink: 0;
	margin-left: 20rpx;
}

.action-btn {
	font-size: 26rpx;
	padding: 8rpx 0;
}

.action-edit {
	color: #3F99F6;
}

.action-delete {
	color: #ff4757;
}

.empty-wrap {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding-top: 120rpx;
	gap: 24rpx;
}

.empty-img {
	width: 100rpx;
	height: 100rpx;
	opacity: 0.3;
}

.empty-text {
	font-size: 28rpx;
	color: #bbb;
}

.add-btn-wrap {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 20rpx 30rpx;
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
	background: #fff;
	box-shadow: 0 -2rpx 20rpx rgba(0,0,0,0.06);
}

.add-btn {
	width: 100%;
	height: 90rpx;
	background: linear-gradient(135deg, #4a8faa 0%, #2F6E8E 100%);
	color: #fff;
	font-size: 32rpx;
	font-weight: bold;
	border-radius: 45rpx;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
}

.add-btn::after {
	border: none;
}

/* 弹窗 */
.modal-mask {
	position: fixed;
	inset: 0;
	background: rgba(0,0,0,0.45);
	z-index: 200;
}

.modal-popup {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	background: #fff;
	border-radius: 32rpx 32rpx 0 0;
	z-index: 201;
	transform: translateY(100%);
	transition: transform 0.3s ease;
	padding-bottom: env(safe-area-inset-bottom);
}

.modal-popup--show {
	transform: translateY(0);
}

.modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 36rpx 40rpx 24rpx;
	border-bottom: 1.5rpx solid #f0f0f0;
}

.modal-title {
	font-size: 34rpx;
	font-weight: 700;
	color: #333;
}

.modal-close {
	font-size: 36rpx;
	color: #999;
	padding: 8rpx;
}

.modal-body {
	padding: 32rpx 40rpx 0;
}

.field-block {
	margin-bottom: 28rpx;
}

.field-label {
	display: block;
	font-size: 26rpx;
	color: #444;
	font-weight: 500;
	margin-bottom: 14rpx;
}

.required-star::before {
	content: '* ';
	color: #e53935;
}

.input-box {
	width: 100%;
	height: 80rpx;
	border: 1.5rpx solid #E6E6E6;
	border-radius: 12rpx;
	padding: 0 20rpx;
	box-sizing: border-box;
	display: flex;
	align-items: center;
	background: #fff;
}

.field-input {
	flex: 1;
	height: 80rpx;
	line-height: 80rpx;
	font-size: 28rpx;
	color: #333;
	background: transparent;
	border: none;
	padding: 0;
}

.modal-footer {
	display: flex;
	gap: 20rpx;
	padding: 32rpx 40rpx;
}

.modal-btn {
	flex: 1;
	height: 88rpx;
	border-radius: 44rpx;
	font-size: 30rpx;
	font-weight: bold;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
}

.modal-btn::after {
	border: none;
}

.modal-btn--cancel {
	background: #f5f8fa;
	color: #666;
}

.modal-btn--confirm {
	background: linear-gradient(135deg, #4a8faa 0%, #2F6E8E 100%);
	color: #fff;
}
</style>
