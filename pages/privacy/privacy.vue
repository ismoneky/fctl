<template>
	<scroll-view class="content" scroll-y>
		<text class="doc-title">风车天路小程序隐私政策</text>
		<text class="doc-update">更新日期：2026年05月01日</text>

		<text class="doc-intro">欢迎使用风车天路小程序（以下简称"本小程序"）。本小程序由河南省云玺旅游有限公司（以下简称"我们"）运营。我们非常重视您的个人信息和隐私保护，请您在使用本小程序前仔细阅读本隐私政策。</text>

		<text class="section-title">一、我们收集的个人信息</text>
		<text class="section-body">为向您提供景区实名制预约服务，我们将收集以下信息：{{ '\n\n' }}1. 【身份信息】姓名、身份证号码。用于景区实名制入园核验，符合景区实名预约管理规定要求。{{ '\n\n' }}2. 【联系信息】手机号码。用于预约确认、行程提醒及紧急情况联络。{{ '\n\n' }}3. 【出行信息】车牌号码、车辆类型。用于景区车辆通行管理。{{ '\n\n' }}4. 【微信信息】微信OpenID。用于账号识别与登录，不获取微信昵称、头像等其他信息。{{ '\n\n' }}5. 【设备信息】在您使用小程序过程中，我们可能收集您的设备标识符，用于保障服务安全。{{ '\n\n' }}以上信息均为提供预约服务所必需，我们遵循"最小必要"原则，不会收集与服务无关的个人信息。</text>

		<text class="section-title">二、我们如何使用您的信息</text>
		<text class="section-body">我们收集的个人信息仅用于以下目的：{{ '\n\n' }}1. 完成景区实名制预约登记；{{ '\n' }}2. 景区入口核验您的身份与车辆信息；{{ '\n' }}3. 处理预约支付、退款事宜；{{ '\n' }}4. 为您购置入园游览保险，您的姓名、身份证号码将作为投保人信息用于出险核验；{{ '\n' }}5. 向您发送预约相关通知；{{ '\n' }}6. 遵守法律法规要求的信息留存义务。{{ '\n\n' }}我们不会将您的个人信息用于上述目的之外的任何用途，也不会将其出售给第三方。</text>

		<text class="section-title">三、信息存储与保护</text>
		<text class="section-body">1. 您的个人信息存储于中国境内的服务器，存储期限为您最后一次预约完成后 3 年，届满后将予以删除或匿名化处理。{{ '\n\n' }}2. 我们采用加密传输（HTTPS）、访问控制等技术措施保护您的信息安全。{{ '\n\n' }}3. 我们严格限制对个人信息的访问权限，仅授权必要人员处理相关数据。</text>

		<text class="section-title">四、信息共享</text>
		<text class="section-body">我们不会向任何第三方出售或出租您的个人信息。仅在以下情形下可能共享：{{ '\n\n' }}1. 经您明确同意；{{ '\n' }}2. 为完成预约服务，向微信支付传输必要的支付信息；{{ '\n' }}3. 依据法律法规规定或政府主管部门要求；{{ '\n' }}4. 景区工作人员在入园核验时查验您的预约信息。</text>

		<text class="section-title">五、您的权利</text>
		<text class="section-body">您对自己的个人信息享有以下权利：{{ '\n\n' }}1. 查阅权：您可在"个人中心"查看您的预约记录及常用信息；{{ '\n' }}2. 更正权：您可修改常用人员信息中的错误内容；{{ '\n' }}3. 删除权：预约完成后，您可联系我们申请删除您的个人信息；{{ '\n' }}4. 撤回同意权：您可随时停止使用本小程序，但已产生的预约记录将按法规要求保留。{{ '\n\n' }}如需行使上述权利，请通过本政策末尾的联系方式与我们联系。</text>

		<text class="section-title">六、未成年人保护</text>
		<text class="section-body">本小程序不面向 18 岁以下未成年人提供服务。如发现未成年人在未经监护人同意的情况下提交了个人信息，请及时联系我们予以删除。</text>

		<text class="section-title">七、隐私政策的变更</text>
		<text class="section-body">我们可能适时修订本隐私政策。修订后将在小程序内公告，重大变更将通过弹窗方式通知您。继续使用本小程序视为您接受修订后的政策。</text>

		<text class="section-title">八、联系我们</text>
		<text class="section-body">如您对本隐私政策有任何疑问，请通过以下方式联系我们：{{ '\n\n' }}运营主体：河南省云玺旅游有限公司{{ '\n' }}服务电话：18639220123（工作时间 09:00-18:00）{{ '\n' }}投诉建议：18639220123</text>

		<text class="doc-footer">本隐私政策最终解释权归河南省云玺旅游有限公司所有。</text>
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
