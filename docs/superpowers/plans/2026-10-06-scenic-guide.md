# Scenic Guide Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 后台图片选点维护和小程序可交互导览。
**Architecture:** 独立 NestJS 模块保存带版本号的配置并签发 COS 策略。React 管理编辑草稿并直传 COS；uni-app 公开读取配置并渲染比例坐标。
**Tech Stack:** NestJS/TypeORM/SQLite、React/Ant Design、uni-app/Vue 3。
**Spec:** ../specs/2026-10-06-scenic-guide-design.md

## Global Constraints

- 保留既有预约相关未提交改动。
- 上传 JPEG/PNG/WebP 最大 10 MiB；坐标 x/y 在 0..1；latitude/longitude 同时设置或同时缺省。
- 第一版不显示真实地图、不获取游客定位。
- 不部署、不推送、不操作线上数据。

## Review Focus

- 不同长宽比和缩放后的点位对齐，点在边缘也可操作。
- 保存失败/版本冲突保留未保存修改，不覆盖其他管理员。
- 隐藏点位不能出现在游客接口；上传和写入必须管理员验证。
- 无点位/图加载失败/接口失败仍提供明确状态与重试。
- 自定义 tab 索引和未读角标在新增页面后保持一致。

## Task 1: 后端接口与图片

Files: nest/src/entities/scenic-guide.entity.ts, nest/src/modules/scenic-guide/*, nest/src/app.module.ts, nest/docs/scenic-guide-deployment.md。
Consumes: AdminAuthGuard、serialTransaction。
Produces: spec 中 GET/PUT/POST 接口及配置字段。

- [ ] 先写内存 SQLite HTTP 测试，覆盖读写过滤、鉴权、校验、冲突和图片，运行并确认缺少模块导致失败。
- [ ] 实现独立实体、DTO 校验、服务、控制器、COS 直传策略与生产建表 SQL。
- [ ] 运行导览测试和 Nest 构建。

## Task 2: 后台编辑器

Files: admin/src/api/scenicGuide.ts, admin/src/pages/scenic-guide/*, admin/src/App.tsx, admin/src/layouts/MainLayout.tsx, admin/tests/scenic-guide.test.mjs。
Consumes: Task 1 API。
Produces: 完整可保存的 ScenicGuide 配置，比例坐标与版本原样传递。

- [ ] 编写并运行几何和校验测试，确认新模块缺失时失败。
- [ ] 实现图片选点/拖动、列表/表单、上传/URL、换图、保存/冲突与未保存保护。
- [ ] 运行后台测试、构建，并用浏览器进行交互与响应式验证。

## Task 3: 小程序导览

Files: fctl/pages/guide/guide.vue, fctl/components/guide-map.vue, fctl/utils/scenic-guide.js, fctl/tests/scenic-guide.test.js, fctl/pages.json, fctl/components/my-tab-bar.vue, tab 页 current 索引, static/svg/tab-guide-*.svg。
Consumes: Task 1 public API。
Produces: 导览 Tab、分类筛选、图上点位、详情与可选导航。

- [ ] 先写数据/比例/缩放与导航可用性测试并确认失败。
- [ ] 实现导览组件/页面与四个底部导航，沿用原未读消息机制。
- [ ] 运行全量小程序测试，执行可用的编译/SFC 验证。

## Task 4: 集成验证与交付

- [ ] 全量后端与后台测试/构建，复核COS 配置、生产 SQL 和部署说明。
- [ ] 使用 executing-plans 要求的一次独立代码审查，修复影响使用的问题并验证。
- [ ] 整理改动、测试结果、部署所需步骤与无法验证的平台限制。
