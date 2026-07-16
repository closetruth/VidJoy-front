# VidJoy

基于 Vue 3 + Vite 构建的视频平台前端，对接 VidJoy 后端 API。

## 技术栈

- Vue 3 + Composition API
- Vite 6
- Vue Router 4
- Pinia
- Axios
- HLS.js（视频播放）
- SCSS

## 功能

- 首页推荐轮播 + 视频瀑布流
- 分类导航切换
- 视频搜索 + 热搜词
- 视频播放（HLS 流媒体 + 弹幕）
- 评论系统（发布/回复/点赞）
- 用户登录/注册
- 个人主页
- 历史记录
- 消息中心
- 投稿中心（UI 框架）

## 快速开始

```bash
# 安装 Web 端依赖
npm install --prefix web

# 安装管理端依赖
npm install --prefix admin

# 启动 Web 开发服务器
npm run dev:web
```

访问 http://localhost:3000

也可直接：

```bash
cd web
npm install
npm run dev
```

## 后端配置

确保 VidJoy 后端运行在 `http://localhost:7071`，Vite 已配置代理：

```
/api/* -> http://localhost:7071/*
```

## 管理后台

管理端位于 `admin/` 目录，独立运行：

```bash
cd admin
npm install
npm run dev   # http://localhost:3001
```

或在项目根目录：

```bash
npm run dev:admin
```

管理端代理后端 `http://localhost:7070`，功能包括：

- 数据概览（实时统计 + 周趋势）
- 视频管理（审核、推荐、删除）
- 分类管理（增删改）
- 用户管理（启用/禁用）
- 弹幕 / 评论管理
- 系统设置

## 项目结构

```
├── web/           # Web 端（用户前台）
│   └── src/
│       ├── api/
│       ├── components/
│       ├── views/
│       └── ...
├── admin/         # 管理后台
│   └── src/
│       ├── views/     # Dashboard、Video、Category...
│       └── layouts/   # 侧边栏布局
└── package.json   # 根目录编排脚本（dev:web / dev:admin）
```

## 设计风格

- 主色调：`#FB7299`（VidJoy 粉）
- 圆角卡片布局
- 响应式网格视频列表
- 毛玻璃顶栏
