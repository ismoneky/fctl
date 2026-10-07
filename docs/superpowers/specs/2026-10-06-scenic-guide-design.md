# 景区导览第一版设计

用户已确认：管理员在后台选择图片上的位置、维护标记，先实施图片导览版本。2026-10-06 的“可以先按第一版实现”授权实施本范围。

## 范围

- 后台新增“景区导览”：底图上传或 HTTPS 图片链接、地点列表、图片点选/拖动标记、名称/分类/简介/配图/显示开关/排序编辑。
- 点击“保存并更新”一次性保存整个导览配置；未保存修改不影响游客。
- 小程序底部调整为“首页 / 导览 / 预约 / 我的”，保留原有未读消息红点。
- 导览页可拖动、双指缩放、查看全图、分类筛选、点选标记查看地点详情；列表与点位联动。
- 预留可选 GCJ-02 经纬度和地址；只有有效坐标的地点出现导航入口。第一版不显示真实地图、不获取游客定位。
- 用户后续明确：资源使用现有腾讯云 COS bucket，不接受业务服务器存储上传文件。后台直传 COS 后保存 CDN 链接；未配置底图时小程序显示准备中。原图在 docs/scenic-guide/reference.jpg，配置 COS 后由后台上传。
- 现有文字/红点属于图片内容，无法由点位开关移除。交互地点由管理员添加，避免未经核对的点位自动发布。

## 结构与接口

三个现有仓库协同：`nest` 提供接口和持久化，`admin` 提供 React/Ant Design 编辑器，`fctl` 提供 uni-app Vue 3 导览页。遵循各仓库现有样式与请求方式。

新增独立 `scenic_guides` 表，单条 id=1 配置，正文 JSON 保存底图与点位，并有 revision、updatedAt。生产库通过 SQL 建表，开发测试沿用 TypeORM synchronize。所有写入使用现有 serialTransaction，防止参与其他业务事务。

统一配置：`title, imageUrl, imageWidth, imageHeight, points, revision, updatedAt`。
地点：`id, name, categories[], description, imageUrl, x, y, visible, sortOrder, latitude?, longitude?, address`。
图片点坐标 x/y 是 0..1 的原图比例，和地理经纬度分开保存。分类固定为景点、驿站、露营、停车场、卫生间、出入口（spot/station/camp/parking/toilet/entrance）。

- `GET /scenic-guide`：无需登录，仅返回 visible=true 的点位，按 sortOrder 排序。
- `GET /scenic-guide/admin`：管理员密钥验证，返回完整配置。
- `PUT /scenic-guide/admin`：管理员验证，校验并原子保存整个配置；revision 不匹配返回 409，防止覆盖其他管理员的修改。
- `POST /scenic-guide/upload-policy`：管理员验证，只接受 contentType、size，返回10分钟有效的 COS POST 上传策略。策略限定指定 JPEG/PNG/WebP MIME、1..size 字节（size<=10 MiB）、指定 bucket、唯一 key。前端文件直接发往 COS，API 不接收文件字节。
- 接口沿用 `{success:true,data:...}`。策略返回 uploadUrl、fields、imageUrl（CDN 地址）和 expiresAt；浏览器独立 fetch 直传，不带后台密钥或 cookies。

COS_BUCKET/COS_REGION/COS_SECRET_ID/COS_SECRET_KEY/COS_PUBLIC_BASE_URL 由服务端环境变量配置；SecretKey 不发送到浏览器。上传 key 固定在 scenic-guide/YYYY-MM-DD/uuid.ext。依据腾讯云官方 Web 直传文档生成 POST policy。缺少 COS 配置时返回503，仍允许已有 HTTPS CDN 链接。COS 需配置后台域名 CORS POST，CDN 需能读取新增对象。

## 交互

后台左侧地点列表、中间保持图片比例的画布、右侧地点表单；窄屏依次排列。新增进入选点状态，点击图片生成点位并打开表单；选中点可拖动，重新选点按钮支持点击精确定位。所有拖拽计算基于图片真实显示区域，不包含空白边缘。

表单支持多分类、显示开关、排序；删除确认；保存时校验所有点位并指向错误点。保存期间禁用编辑，失败保留本地修改。刷新/关闭有未保存提示，页面内切换菜单时也确认。更换底图时提示现有点需要重新校准，允许明确选择清空或保留；不静默丢弃。

小程序顶部标题与帮助文字、中间图片视口、分类滚动条、下方可收起的地点列表与详情。图片全图适配且不裁剪；点位和底图一起变换，点击选择时调整视口。标记用序号圆点，详细名称放在列表/详情避免覆盖原图文字。

导览公开读取不依赖登录。图片失败显示重试，接口失败保留已加载内容并提示重试；没有点位时仍能浏览底图。列表筛选无结果显示空状态；切换 Tab 后重新请求已保存配置。

## 验证

- 后端真实内存 SQLite + 进程内 HTTP 请求测试：持久化、隐藏点过滤、排序、鉴权、校验、revision 冲突、COS 策略/大小/有效期/缺配置。进程内 transport 不监听端口，保留真实 Nest/Express 路由、守卫与持久化。
- 后台单元测试：不同尺寸的比例坐标、边缘约束、拖动、校验和换图；浏览器验证完整新增/编辑/保存/刷新流程及窄屏布局。
- 小程序单元测试：数据规范化、图片 URL、分类、可导航性、缩放居中几何；编译或 Vue SFC 校验，微信运行时能力另行如实报告验证范围。
- 运行现有测试与构建，保留已有未提交的预约相关改动，不部署、不推送、不操作线上数据。
