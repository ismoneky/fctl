<template>
	<view
		class="xm-keyboard-input"
		:style="{
			'justify-content': align
		}"
	>
		<view
			v-for="(item, index) in values"
			:key="index"
			class="xm-keyboard-input-item"
			:class="{
				'xm-cur': cur === index,
				'xm-show-pointer': showPointer
			}"
			:style="{
				marginLeft: (index == 0 ? 0 : 18 - max) + 'px',
				maxWidth: maxSize + 'px',
				maxHeight: maxSize + 'px'
			}"
			@click="changeCur(index)"
		>
			<xm-square height="120%">
				<view
					class="xm-keyboard-input-cnt"
					:class="{
						'xm-cursor': cursor && cur === index && !item
					}"
					:style="{
						maxWidth: maxSize + 'px',
						maxHeight: maxSize + 'px'
					}"
				>
					{{ item }}
				</view>
			</xm-square>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'xm-keyboard-input',
		emits: ['change'],
		props: {
			initValue: {
				type: String,
				default: ''
			},
			cursor: {
				type: Boolean,
				default: false
			},
			max: {
				type: Number,
				default: 8
			},
			showPointer: {
				type: Boolean,
				default: true
			},
			maxSize: {
				type: Number,
				default: 40
			},
			align: {
				type: String,
				default: 'center'
				// default: 'space-between',
			}
		},
		data() {
			return {
				cur: 0,
				values: []
			};
		},
		methods: {
			changeCur(index) {
				this.cur = index;
				this.toChange();
			},
			toChange() {
				this.$emit('change', this.cur);
			},
			toAdd(v) {
				this.values[this.cur] = v;
				// #ifdef VUE2
				this.$set(this.values, this.cur, v);
				// #endif
				if (this.cur < this.max - 1) {
					this.cur++;
					this.toChange();
				}
			},
			toDel() {
				// 处理一下, 如果是最后一位 并且有值的情况下, 只移除值不变更位置, 或者主动选择到了某一位置
				if ((this.cur == this.max - 1 && this.values[this.cur]) || this.values[this.cur]) {
					this.resetCurValue();
					return;
				}
				if (this.cur <= 0) {
					this.cur = 0;
				} else {
					this.cur--;
					this.resetCurValue();
					this.toChange();
				}
			},
			resetCurValue() {
				// #ifdef VUE2
				this.$set(this.values, this.cur, '');
				// #endif
				// #ifdef VUE3
				this.values[this.cur] = '';
				this.$forceUpdate();
				// #endif

				this.toChange();
			},
			toClear() {
				this.cur = 0;
				this.initValues();
				this.toChange();
			},
			changeValue(v, pos, skipEmit) {
				let max = Math.max(v.length, this.max);
				for (let i = 0; i < max; i++) {
					this.values[i] = v.charAt(i);
					// #ifdef VUE2
					this.$set(this.values, i, v.charAt(i));
					// #endif
				}
				// #ifdef VUE3
				this.$forceUpdate();
				// #endif

				let cur = this.values.findIndex((x) => !x);
				this.cur = cur === -1 ? this.max - 1 : cur;
				if (pos != void 0) {
					this.cur = pos;
				}
				if (skipEmit) {
					return;
				}
				this.toChange();
			},
			initValues() {
				let vs = [];
				vs.length = this.max;
				vs.fill('');
				this.values = vs;
			}
		},
		mounted() {
			this.initValues();
			this.changeValue(this.initValue || '', null, true);
		}
	};
</script>

<style scoped lang="scss">
	.xm-keyboard-input {
		display: flex;

		$theme: #007aff;
		$themeBackground: rgba(0, 73, 255, 0.03);

		@keyframes blink {
			0% {
				opacity: 0;
			}

			50% {
				opacity: 1;
			}

			100% {
				opacity: 0;
			}
		}

		&-item {
			width: 100%;
			height: 100%;
			box-sizing: border-box;
			border: 1px solid #ccc;
			border-radius: 2px;

			&:first-child {
				margin-left: 0;
			}
			&.xm-show-pointer:nth-child(8) {
				border-style: solid;
			}

			&.xm-show-pointer:nth-child(2) {
				position: relative;
				margin-right: 5px;
				&::after {
					content: ' ';
					position: absolute;
					right: -12px;
					top: calc(50% - 3px);
					display: flex;
					align-items: center;
					width: 6px;
					height: 6px;
					background-color: #ccc;
					border-radius: 100%;
				}
			}
			&.xm-show-pointer:nth-child(8) {
				border-style: dashed;
				border-color: #4dc790;
				background-color: #e9faf2;
				color: #28cd80;
				
				&.xm-cur{
					border-color: $theme;
				}
			}

			&.xm-cur {
				border-color: $theme;
				background-color: $themeBackground;
				transition: 0.1s;
			}

			.xm-cursor {
				&::after {
					color: $theme;
					content: '|';
					animation: blink 1s infinite;
				}
			}
		}

		&-cnt {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 100%;
			height: 100%;
		}
	}
</style>
