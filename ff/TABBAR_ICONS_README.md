# TabBar 图标配置说明

## 方案一：使用 iconfont（推荐）

1. 访问 [iconfont.cn](https://www.iconfont.cn/)
2. 搜索并下载以下图标（PNG格式，建议尺寸 81x81px）：
   - 首页图标（home）
   - 预约/订单图标（booking/order）
   - 我的/用户图标（profile/user）

3. 将图标放到 `static/tabbar/` 目录下，命名为：
   - `home.png` / `home-active.png`
   - `booking.png` / `booking-active.png`
   - `profile.png` / `profile-active.png`

## 方案二：使用 uni-app 自带图标（临时方案）

如果暂时没有图标资源，可以先注释掉 iconPath 配置，使用纯文字 tabBar：

```json
"tabBar": {
    "color": "#7A7E83",
    "selectedColor": "#4A90E2",
    "borderStyle": "white",
    "backgroundColor": "#ffffff",
    "list": [
        {
            "pagePath": "pages/index/index",
            "text": "首页"
        },
        {
            "pagePath": "pages/booking/booking",
            "text": "预约"
        },
        {
            "pagePath": "pages/profile/profile",
            "text": "我的"
        }
    ]
}
```

## 方案三：在线图标链接（不推荐）

uni-app 的 tabBar 图标必须是本地路径，不支持网络图片。

## 当前状态

已配置 tabBar，但需要添加图标文件。建议使用方案二先测试功能，后续再添加美化图标。
