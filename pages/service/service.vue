<template>
	<scroll-view class="content" scroll-y>
		<text class="doc-title">风车天路小程序用户服务协议</text>
		<text class="doc-update">更新日期：2026年05月01日</text>

		<text class="doc-intro">本协议由您与河南省云玺旅游有限公司（以下简称"我们"）就使用风车天路小程序预约服务所订立。使用本小程序即表示您已阅读并同意本协议全部条款。</text>

		<text class="section-title">一、服务内容</text>
		<text class="section-body">本小程序为您提供风车天路景区的实名制在线预约服务，包括：预约登记、在线支付、预约核验码获取、订单管理及退款申请等功能。</text>

		<text class="section-title">二、账号与实名制</text>
		<text class="section-body">1. 您需通过微信授权登录使用本小程序；{{ '\n' }}2. 预约时须如实填写本人及同行人员的真实姓名、身份证号码、手机号等信息，不得填写虚假信息；{{ '\n' }}3. 如因填写虚假信息导致无法入园或其他损失，责任由您自行承担。</text>

		<text class="section-title">三、预约规则</text>
		<text class="section-body">1. 每日预约名额有限，约满即止，建议提前 1-3 天预约；{{ '\n' }}2. 预约完成后须在预约日当天开放时段内凭核验码入园；{{ '\n' }}3. 景区仅允许 7 座及以下小型客车和摩托、非机动车通行；{{ '\n' }}4. 超过预约日期未使用视为自动放弃，不予退款。</text>

		<text class="section-title">四、支付与费用说明</text>
		<text class="section-body">1. 预约时需支付费用，具体金额以平台公示为准；{{ '\n' }}2. 您所支付的费用包含为您及同行人员购置的入园游览保险费用，保险保障您在景区游览期间的人身安全；{{ '\n' }}3. 投保所需的姓名、身份证号码信息将用于保险出险核验，如发生意外可凭此信息进行理赔；{{ '\n' }}4. 退款规则：{{ '\n' }}   · 预约日前一天（含）之前取消：全额退款；{{ '\n' }}   · 预约当天且未完成核验前取消：全额退款；{{ '\n' }}   · 完成核验（已入园）后：不予退款；{{ '\n' }}   · 超期未使用：不予退款；{{ '\n' }}5. 因恶劣天气、道路封闭等不可抗力导致景区关闭，可联系客服处理退款；{{ '\n' }}6. 退款将原路退回，预计 1-7 个工作日到账。</text>

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
export default {};
</script>

<style scoped>
.content {
	min-height: 100vh;
	background: #f0f2f8;
	padding: 36rpx 32rpx;
	box-sizing: border-box;
}
.doc-title {
	display: block;
	font-size: 34rpx;
	font-weight: 800;
	color: #1a1a2e;
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
	color: #1a1a2e;
	margin: 32rpx 0 16rpx;
}
.section-body {
	display: block;
	font-size: 26rpx;
	color: #555;
	line-height: 1.8;
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
