<template>
	<scroll-view class="content" scroll-y>
		<text class="doc-title">风车天路小程序用户服务协议</text>
		<text class="doc-update">更新日期：2026年05月01日</text>

		<text class="doc-intro">本协议由您与河南省云玺旅游有限公司（以下简称"我们"）就使用风车天路小程序预约服务所订立。使用本小程序即表示您已阅读并同意本协议全部条款。</text>

		<text class="section-title">一、服务内容</text>
		<text class="section-body">本小程序为您提供风车天路景区的实名制在线预约服务，包括：预约登记、在线支付、预约核验码获取、订单管理及退款申请等功能。</text>

		<text class="section-title">二、账号与实名制</text>
		<text class="section-body">1. 您需通过微信授权登录使用本小程序；{{ '\n' }}2. 联系人和普通同行人必须如实填写姓名、身份证号和手机号；通过“添加同行儿童/老人”添加的人员如暂时无法提供身份证号，可按页面提示继续预约；{{ '\n' }}3. 如因填写虚假信息导致无法入园或其他损失，责任由您自行承担。</text>

		<text class="section-title">三、预约规则</text>
		<text class="section-body">1. 每日预约名额有限，约满即止，建议提前 1-3 天预约；{{ '\n' }}2. 预约完成后须在预约日当天开放时段内凭核验码入园；{{ '\n' }}3. 景区仅允许 7 座及以下小型客车和摩托、非机动车通行；{{ '\n' }}4. 超过预约日期未使用视为自动放弃，不予退款。</text>

		<text class="section-title">四、支付与费用说明</text>
		<text class="section-body">1. 预约时需支付费用，具体金额以平台公示为准；{{ '\n' }}2. 对已提供投保所需有效身份信息的出行人，所支付费用包含入园游览保险费用。选择“暂时无法提供身份证号”的儿童/老人虽可继续预约并按正常价格收费，但因缺少投保必需信息，该人员暂时无法投保；{{ '\n' }}3. 投保所需的姓名、身份证号码信息将用于保险出险核验，如发生意外可凭此信息进行理赔；{{ '\n' }}4. 退款规则：{{ '\n' }}   · 预约日前一天（含）之前取消：全额退款；{{ '\n' }}   · 预约当天且未完成核验前取消：全额退款；{{ '\n' }}   · 完成核验（已入园）后：不予退款；{{ '\n' }}   · 超期未使用：不予退款；{{ '\n' }}5. 因恶劣天气、道路封闭等不可抗力导致景区关闭，可联系客服处理退款；{{ '\n' }}6. 退款将原路退回，预计 1-7 个工作日到账。</text>

		<!-- 保险保障卡片 -->
		<view class="insurance-card">
			<view class="insurance-card__header">
				<view class="insurance-badge">承保保障</view>
				<text class="insurance-product-name">境内旅行意外伤害保险（2024版）</text>
			</view>

			<view class="insurance-table">
				<view class="insurance-table__row insurance-table__row--head">
					<text class="insurance-table__cell insurance-table__cell--head">保障项目</text>
					<text class="insurance-table__cell insurance-table__cell--head">保障内容</text>
				</view>
				<view class="insurance-table__row">
					<text class="insurance-table__cell insurance-table__cell--label">意外身故 / 伤残</text>
					<text class="insurance-table__cell">每份保额 <text class="insurance-highlight">200,000 元</text></text>
				</view>
				<view class="insurance-table__row">
					<text class="insurance-table__cell insurance-table__cell--label">意外医疗费用补偿</text>
					<view class="insurance-table__cell insurance-table__cell--multi">
						<text class="insurance-cell-line">每份保额 <text class="insurance-highlight">10,000 元</text></text>
						<text class="insurance-cell-line">给付比例 <text class="insurance-highlight">80%</text></text>
						<text class="insurance-cell-line insurance-cell-line--sub">每次事故免赔额 100 元</text>
					</view>
				</view>
				<view class="insurance-table__row">
					<text class="insurance-table__cell insurance-table__cell--label">最大投保份数</text>
					<text class="insurance-table__cell">1 份 / 人</text>
				</view>
				<view class="insurance-table__row insurance-table__row--last">
					<text class="insurance-table__cell insurance-table__cell--label">24 小时救援</text>
					<view class="insurance-table__cell insurance-table__cell--multi">
						<text class="insurance-cell-line">境内：<text class="insurance-highlight">400-069-0991</text></text>
						<text class="insurance-cell-line">全球：+86-21-33393745</text>
					</view>
				</view>
			</view>

			<view class="insurance-note">
				<text class="insurance-note__text">* 未满10周岁被保险人死亡保险金额不超过20万元；已满10周岁未满18周岁不超过50万元，以中国银保监会相关规定为准。</text>
			</view>

			<view class="insurance-card__footer" @click="openInsuranceClause">
				<text class="insurance-clause-link">查看完整保险条款</text>
				<text class="insurance-clause-arrow">›</text>
			</view>
		</view>

		<text class="section-title">五、用户行为规范</text>
		<text class="section-body">使用本小程序及进入景区时，您须遵守以下规定：{{ '\n\n' }}1. 全程限速 30km/h，严禁弯道超车；{{ '\n' }}2. 禁止下车徒步穿越非指定观景台区域；{{ '\n' }}3. 禁止明火、野炊、露营、吸烟；{{ '\n' }}4. 禁止采摘花草、惊扰野生动物；{{ '\n' }}5. 自觉带走垃圾，保护景区环境。</text>

		<text class="section-title">六、责任限制</text>
		<text class="section-body">1. 进入景区即表示您自愿承担户外自驾活动的固有风险（落石、侧风、路面湿滑等）；{{ '\n' }}2. 因您违反本协议或景区规定造成的人身财产损失，责任由您自行承担；{{ '\n' }}3. 因不可抗力（自然灾害、政府管制等）导致服务中断，我们不承担赔偿责任，但会协助处理退款；{{ '\n' }}4. 我们对服务中断、数据丢失等情形的赔偿责任以您实际支付的预约费用为上限。</text>

		<text class="section-title">七、知识产权</text>
		<text class="section-body">本小程序内的文字、图片、界面设计等内容的知识产权归河南省云玺旅游有限公司所有，未经授权不得复制、传播或用于商业用途。</text>

		<text class="section-title">八、协议变更</text>
		<text class="section-body">我们保留修改本协议的权利，修改后将在小程序内公告。继续使用本小程序视为您接受修订后的协议。</text>

		<text class="section-title">九、联系方式</text>
		<text class="section-body">服务电话：18639220123（工作时间 09:00-18:00）{{ '\n' }}运营主体：河南省云玺旅游有限公司</text>

		<text class="doc-footer">本协议最终解释权归河南省云玺旅游有限公司所有。</text>
	</scroll-view>
</template>

<script>
export default {
	methods: {
		openInsuranceClause() {
			const pdfUrl = 'https://cdn.hbfctl.com.cn/content/%E5%A2%83%E5%86%85%E6%97%85%E8%A1%8C%E6%84%8F%E5%A4%96%E4%BC%A4%E5%AE%B3%E4%BF%9D%E9%99%A9%282024%E7%89%88%29%E6%9D%A1%E6%AC%BE.pdf';
			uni.showLoading({ title: '加载中...', mask: true });
			uni.downloadFile({
				url: pdfUrl,
				success(res) {
					uni.hideLoading();
					if (res.statusCode === 200) {
						wx.openDocument({
							filePath: res.tempFilePath,
							fileType: 'pdf',
							fail() {
								uni.showToast({ title: '打开失败，请稍后重试', icon: 'none' });
							}
						});
					} else {
						uni.showToast({ title: '文件下载失败', icon: 'none' });
					}
				},
				fail() {
					uni.hideLoading();
					uni.showToast({ title: '网络错误，请稍后重试', icon: 'none' });
				}
			});
		}
	}
};
</script>

<style scoped>
.content {
	min-height: 100vh;
	background: #f5f8fa;
	padding: 36rpx 32rpx;
	box-sizing: border-box;
}
.doc-title {
	display: block;
	font-size: 34rpx;
	font-weight: 800;
	color: #2F6E8E;
	text-align: center;
	margin-bottom: 12rpx;
}
.doc-update {
	display: block;
	font-size: 24rpx;
	color: #bbb;
	text-align: center;
	margin-bottom: 32rpx;
}
.doc-intro {
	display: block;
	font-size: 26rpx;
	color: #555;
	line-height: 1.8;
	margin-bottom: 32rpx;
	padding: 24rpx;
	background: #fff;
	border-radius: 14rpx;
}
.section-title {
	display: block;
	font-size: 28rpx;
	font-weight: 700;
	color: #2F6E8E;
	margin: 32rpx 0 16rpx;
}
.section-body {
	display: block;
	font-size: 26rpx;
	color: #555;
	line-height: 1.8;
}
/* ===== 保险保障卡片 ===== */
.insurance-card {
	background: #fff;
	border-radius: 16rpx;
	border: 1.5rpx solid #d6eaf8;
	margin: 24rpx 0 8rpx;
	overflow: hidden;
}

.insurance-card__header {
	display: flex;
	align-items: center;
	gap: 16rpx;
	padding: 24rpx 28rpx 20rpx;
	background: linear-gradient(135deg, #eaf4fd 0%, #e8f8f3 100%);
	border-bottom: 1.5rpx solid #d6eaf8;
}

.insurance-badge {
	font-size: 24rpx;
	font-weight: 700;
	color: #fff;
	background: linear-gradient(135deg, #3F99F6, #33C5A0);
	padding: 6rpx 16rpx;
	border-radius: 20rpx;
	flex-shrink: 0;
}

.insurance-product-name {
	font-size: 26rpx;
	font-weight: 700;
	color: #2F6E8E;
	flex: 1;
}

/* 表格 */
.insurance-table {
	margin: 0 28rpx;
	border: 1.5rpx solid #e8f0f8;
	border-radius: 12rpx;
	overflow: hidden;
	margin-top: 20rpx;
}

.insurance-table__row {
	display: flex;
	border-bottom: 1.5rpx solid #eef4fb;
}

.insurance-table__row--head {
	background: #f0f7fd;
}

.insurance-table__row--last {
	border-bottom: none;
}

.insurance-table__cell {
	flex: 1;
	font-size: 26rpx;
	color: #555;
	padding: 20rpx 18rpx;
	line-height: 1.6;
}

.insurance-table__cell--head {
	font-size: 24rpx;
	font-weight: 700;
	color: #2F6E8E;
}

.insurance-table__cell--label {
	flex: 0 0 auto;
	width: 220rpx;
	font-weight: 600;
	color: #444;
	border-right: 1.5rpx solid #eef4fb;
	background: #fafcff;
}

.insurance-table__cell--multi {
	display: flex;
	flex-direction: column;
	gap: 4rpx;
}

.insurance-cell-line {
	font-size: 26rpx;
	color: #555;
	line-height: 1.6;
}

.insurance-cell-line--sub {
	font-size: 24rpx;
	color: #999;
}

.insurance-highlight {
	color: #3F99F6;
	font-weight: 700;
}

/* 备注 */
.insurance-note {
	padding: 16rpx 28rpx 0;
}

.insurance-note__text {
	display: block;
	font-size: 26rpx;
	color: #aaa;
	line-height: 1.7;
}

/* 底部条款链接 */
.insurance-card__footer {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
	padding: 24rpx 28rpx;
	margin-top: 12rpx;
	border-top: 1.5rpx solid #eef4fb;
	cursor: pointer;
}

.insurance-clause-link {
	font-size: 26rpx;
	color: #3F99F6;
	font-weight: 600;
	text-decoration: underline;
	text-decoration-color: rgba(63, 153, 246, 0.4);
}

.insurance-clause-arrow {
	font-size: 32rpx;
	color: #3F99F6;
	font-weight: 300;
	line-height: 1;
}

.doc-footer {
	display: block;
	font-size: 24rpx;
	color: #bbb;
	text-align: center;
	margin-top: 48rpx;
	padding-top: 24rpx;
	border-top: 1.5rpx solid #eee;
	padding-bottom: 60rpx;
}
</style>
