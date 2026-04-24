<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
		},
		onShow: function() {
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/*每个页面公共css */
@import '/static/iconfont.css';
page, view, text, image, button, input, textarea {
	box-sizing: border-box;
	margin: 0;
	padding: 0;
	font-family: "PingFang SC", "苹方", "Helvetica Neue", Arial, sans-serif;
}
</style>
