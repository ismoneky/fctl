<template>
<!-- 根节点常驻，避免组件本身参与页面节点切换；未打开时不挂载弹窗内容，规避 iOS 隐藏节点渲染异常。 -->
<view>
	<!-- 半透明遮罩：仅在打开时挂载，避免透明遮罩拦截页面交互 -->
	<view v-if="visible" class="lp-mask" @click="handleClose"></view>

	<!-- 居中浮层：有多个目的地，不设默认选中项，必须由用户显式选一个 -->
	<view v-if="visible" class="lp-dialog">
		<view class="lp-header">
			<text class="lp-title">选择导航目的地</text>
			<text class="lp-close" @click="handleClose">×</text>
		</view>

		<view class="lp-body">
			<view
				v-for="location in locations"
				:key="location.name"
				class="lp-item"
				@click="handleSelect(location)"
			>
				<view class="lp-item-main">
					<text class="lp-item-name">{{ location.name }}</text>
					<text class="lp-item-address" v-if="location.address">{{ location.address }}</text>
				</view>
				<text class="lp-item-chevron">›</text>
			</view>
		</view>
	</view>
</view>
</template>

<script>
export default {
	name: 'LocationPickerPopup',
	props: {
		visible: Boolean,
		/**
		 * 候选地点（SCENIC_LOCATIONS）。
		 * 由父页面传入而非组件内直接 import：数据源留在 utils，组件只负责展示与选择，
		 * 这样该组件不绑定具体业务数据，将来复用到别处也不用改。
		 */
		locations: {
			type: Array,
			default: () => [],
		},
	},
	emits: ['select', 'close'],
	methods: {
		handleClose() {
			this.$emit('close');
		},
		handleSelect(location) {
			this.$emit('select', location);
		},
	},
};
</script>

<style scoped>
/* 用居中浮层，不用 child-senior-passenger-popup.vue 那种底部弹出：
   底部正是 tabBar 的位置（components/my-tab-bar.vue 是 fixed + z-index 999），
   底部弹窗会和它挤在同一块区域、被压在下面（首页实测）。居中浮层既避开了 tabBar，
   也更贴合「选一个目的地就走」这种短决策。
   z-index 必须高于 999，否则底栏会盖在遮罩之上。 */
.lp-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 1000;
}

.lp-dialog {
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 600rpx;
	background: #fff;
	border-radius: 28rpx;
	box-shadow: 0 16rpx 60rpx rgba(0, 0, 0, 0.22);
	/* 裁掉 header 分隔线与圆角的冲突；阴影在盒外，不受影响 */
	overflow: hidden;
	box-sizing: border-box;
	z-index: 1001;
}

/* 头部与底部弹窗（child-senior-passenger-popup）保持一致：左对齐标题 + 右侧 ×。
   标题 34rpx → 30rpx（浮层比弹窗窄，34rpx 的粗体在 600rpx 卡里偏重）；
   关闭 × 36rpx → 44rpx，并靠 padding 把热区撑到 92rpx 见方（约 46px）。
   负外边距等量抵消 padding，热区不额外占布局空间，头部高度不受影响。 */
.lp-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 36rpx 40rpx 24rpx;
	border-bottom: 1.5rpx solid #f0f0f0;
}

.lp-title {
	font-size: 30rpx;
	font-weight: 700;
	color: #2f6e8e;
}

.lp-close {
	font-size: 44rpx;
	line-height: 1;
	color: #999;
	padding: 24rpx;
	margin: -24rpx -24rpx -24rpx 0;
}

.lp-body {
	padding: 8rpx 20rpx 20rpx;
}

.lp-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 32rpx 20rpx;
}

/* 两项之间加分隔线；不加圆角底色，避免看起来像「已选中」 */
.lp-item + .lp-item {
	border-top: 1.5rpx solid #f5f5f5;
}

.lp-item-main {
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.lp-item-name {
	font-size: 30rpx;
	font-weight: 600;
	color: #333;
}

.lp-item-address {
	margin-top: 6rpx;
	font-size: 24rpx;
	color: #999;
}

/* 右侧箭头：用「›」文本而非 <image src="/static/..."> —— 模板里的静态图会被编译器
   改写成对 common/assets.js 的模块引用，本组件会因此多一条公共 chunk 依赖
   （组件在小程序里是独立加载的，实测该引用会报 module 'common/assets.js' is not defined）。
   index.vue 的「更多 ›」「导航 ›」也是同一写法，保持一致。 */
.lp-item-chevron {
	font-size: 36rpx;
	color: #c8c8c8;
	line-height: 1;
	flex-shrink: 0;
	margin-left: 16rpx;
}
</style>
