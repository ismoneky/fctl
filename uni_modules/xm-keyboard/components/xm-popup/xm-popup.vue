<template>
	<view class="xm-popup-wrap" :class="{ 
			'xm-popup-wrap-show': show,
			'xm-popup-wrap-show-content': showContent,
		}" :style="{ 
			zIndex: zIndex,
			background: maskBackground
		}" @tap.stop="toClose" @touchmove.stop.prevent="stop" :animation="animationData">
		<view class="xm-popup-cnt" :class="{ 
			'xm-popup-cnt-show-content': showContent,
			'xm-anim': anim,
		}" :style="{
				borderTopLeftRadius: radius + 'px',
				borderTopRightRadius: radius + 'px',
				background: background
		}" @tap.stop="stop">
			<slot></slot>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'xm-popup',
		emits: ['close'],
		props: {
			// 是否显示弹出层
			show: {
				type: Boolean,
				default: false
			},
			// 弹出层内容背景颜色
			background: {
				type: String,
				default: '#FFFFFF'
			},
			// 弹出层内容圆角
			radius: {
				type: [Number, String],
				default: 0
			},
			// 弹出层的z-index
			zIndex: {
				type: [Number, String],
				default: 1992
			},
			// 点击遮罩, 是否可关闭
			maskClosable: {
				type: Boolean,
				default: true
			},
			// 遮罩的背景色
			maskBackground: {
				type: String,
				default: 'rgba(0,0,0,0.6)'
			},
			// 是否直接显示键盘
			showContent: {
				type: Boolean,
				default: false
			},
			// 是否加入动画效果
			anim: {
				type: Boolean,
				default: true
			}
		},
		data() {
			return {
				isShow: false,
				animation: {},
				animationData: {}
			}
		},
		methods: {
			toClose(e) {
				if (!this.maskClosable) return;
				this.$emit('close', {});
			},
			stop(e) {

			},
		},
	};
</script>

<style scoped lang="scss">
	.xm-popup {
		&-wrap {
			position: fixed;
			left: 0;
			right: 0;
			top: 0;
			bottom: 0;
			z-index: 1001;
			display: none;
			flex-direction: row;
			align-items: flex-end;
			justify-content: center;

			&-show {
				display: flex;
			}

			&-show-content {
				display: flex;
				position: unset;
				background-color: unset !important;
			}
		}

		&-cnt {
			width: 100%;
			min-height: 20px;
			overflow: hidden;
			padding-bottom: constant(safe-area-inset-bottom);
			padding-bottom: env(safe-area-inset-bottom);
			flex: 1;
			
			&.xm-anim{
				animation-duration: .2s;
				animation-timing-function: ease-out;
				animation-fill-mode: both;
				animation-name: xm-up;
			}

			&-show-content {
				padding-bottom: 0;
			}
		}

		@keyframes xm-up {
			0% {
				opacity: 0;
				transform: translateY(100%)
			}

			100% {
				opacity: 1;
				transform: translateY(0)
			}
		}
	}
</style>