# 教师工具站 — 完整站点指南

> 本文档是教师在线工具合集网站的完整技术与使用文档，适用于开发者、运维人员和内容管理员。

---

## 目录

1. [项目概述与目标](#1-项目概述与目标)
2. [系统架构图](#2-系统架构图)
3. [目录结构说明](#3-目录结构说明)
4. [工具清单（27 个）](#4-工具清单27-个)
5. [会员系统说明](#5-会员系统说明)
6. [管理后台使用指南](#6-管理后台使用指南)
7. [如何添加新工具](#7-如何添加新工具)
8. [技术栈详情](#8-技术栈详情)
9. [文件命名规范](#9-文件命名规范)
10. [CSS 设计系统参考](#10-css-设计系统参考)

---

## 1. 项目概述与目标

### 项目简介

教师工具站是一个面向中小学教师的在线工具合集平台，提供 **27 个实用工具**，覆盖教学、设计、办公和数学四大领域。所有工具均可在浏览器中直接使用，无需安装任何软件。

### 核心目标

- **零门槛使用**：纯前端工具无需注册即可使用基础功能
- **教师友好**：所有工具针对教学场景优化，界面简洁直观
- **轻量部署**：基于静态站点 + Cloudflare Workers，成本极低
- **可扩展**：遵循模板规范，可快速添加新工具
- **离线可用**：通过 Service Worker 实现关键资源缓存，弱网环境也能使用

### 用户画像

- 中小学各科教师
- 教务管理人员
- 班主任（座位表、评语、点名等场景）

---

## 2. 系统架构图

### 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户浏览器                                │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐    │
│  │  index.html│  │ tools/*.  │  │ _internal/ │  │ SW 缓存层  │    │
│  │  (主页)    │  │ (各工具页) │  │ (管理后台) │  │ (离线支持) │    │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └───────────┘    │
│        │              │              │                           │
│  ┌─────┴──────────────┴──────────────┴─────┐                    │
│  │          assets/js/                     │                    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ │                    │
│  │  │ config.js│ │member.js │ │component │ │                    │
│  │  │ (API配置) │ │(会员逻辑)│ │   .js    │ │                    │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ │                    │
│  └───────┼────────────┼────────────┼───────┘                    │
└──────────┼────────────┼────────────┼────────────────────────────┘
           │            │            │
           ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare Workers API                        │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │  /api/member   │  │  /api/admin   │  │  /api/tools   │       │
│  │  (会员验证)    │  │  (管理接口)   │  │  (工具数据)   │       │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘       │
│          │                  │                  │                 │
│  ┌───────┴──────────────────┴──────────────────┴───────┐       │
│  │              Cloudflare D1 数据库                    │       │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │       │
│  │  │  users   │  │  tools   │  │  logs    │           │       │
│  │  │  (用户)  │  │  (工具)  │  │  (日志)  │           │       │
│  │  └──────────┘  └──────────┘  └──────────┘           │       │
│  └─────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘

           ┌──────────────────────────────────────────┐
           │            静态资源托管                    │
           │  ┌────────────────────────────────────┐  │
           │  │         GitHub Pages               │  │
           │  │  HTML / CSS / JS / 图片 / JSON      │  │
           │  └────────────────────────────────────┘  │
           └──────────────────────────────────────────┘
```

### 数据流

```
用户操作 ──► 工具页面 HTML
                │
                ├──► 本地 JS 计算（大多数工具）
                │         └──► 结果直接显示 / 下载
                │
                ├──► config.js ──► Cloudflare API（需要后端的工具）
                │                       └──► D1 数据库
                │
                └──► member.js ──► /api/member（会员功能）
                                       └──► 验证权限 ──► 开放 / 提示升级
```

---

## 3. 目录结构说明

```
教师工具站/
│
├── index.html                 # 主页（工具列表、搜索、分类筛选）
├── tools.json                 # 工具元数据清单（名称、分类、图标、链接）
├── 404.html                   # 自定义 404 页面
├── sw.js → assets/js/sw.js   # Service Worker（根路径注册需要）
│
├── tools/                     # 各工具页面（每个工具一个 HTML 文件）
│   ├── chicken-rabbit.html    # 鸡兔同笼动画
│   ├── comment-generator.html # 评语生成器
│   ├── score-stats.html       # 成绩统计
│   ├── random-group.html      # 随机分组
│   ├── lucky-wheel.html       # 幸运转盘
│   ├── pinyin.html            # 拼音标注
│   ├── answer-sheet.html      # 答题卡
│   ├── cloud-text-pro.html    # 云朵字Pro
│   ├── certificate-batch.html # 奖状批量生成
│   ├── seat-map.html          # 座位表
│   ├── random-call.html       # 随机点名
│   ├── class-timer.html       # 课堂计时器
│   ├── timetable.html         # 课程表
│   ├── triangle-piece.html    # 三角形拼接
│   ├── triangle-build.html    # 三角形构筑
│   ├── average.html           # 平均数工具
│   ├── edge-relation.html     # 边的关系
│   ├── cloud-text.html        # 云朵字
│   ├── color-tool.html        # 颜色工具
│   ├── unit-convert.html      # 单位换算
│   ├── word-count.html        # 字数统计
│   ├── date-calc.html         # 日期计算器
│   ├── password-gen.html      # 密码生成器
│   ├── qr-code.html           # 二维码生成
│   ├── image-compress.html    # 图片压缩
│   ├── image-merge.html       # 图片拼接
│   └── pdf-tool.html          # PDF 工具
│
├── assets/
│   ├── css/
│   │   ├── theme.css          # 设计系统（变量、通用组件样式）
│   │   └── icons.css          # Font Awesome 图标子集
│   ├── js/
│   │   ├── config.js          # API 地址、站点配置常量
│   │   ├── member.js          # 会员系统逻辑（登录态、权限判断）
│   │   ├── component.js       # 共享 UI 组件（导航栏、弹窗、Toast）
│   │   └── sw.js              # Service Worker（缓存策略）
│   ├── images/                # 站点图片资源
│   └── fonts/                 # 自定义字体（如有）
│
├── _internal/                 # 管理后台（需登录）
│   ├── index.html             # 管理面板主页
│   ├── login.html             # 管理员登录页
│   ├── tools-manage.html      # 工具管理
│   ├── users-manage.html      # 用户管理
│   └── settings.html          # 站点设置
│
├── api/                       # Cloudflare Worker 源码
│   ├── index.js               # Worker 入口（路由分发）
│   ├── member.js              # 会员相关接口
│   ├── admin.js               # 管理接口
│   └── schema.sql             # D1 数据库建表语句
│
├── tools.json                 # 工具注册表（主页读取此文件渲染卡片）
└── manifest.json              # PWA 清单文件
```

### 关键文件说明

| 文件 | 作用 | 修改频率 |
|------|------|----------|
| `index.html` | 网站主页，加载 tools.json 渲染工具卡片网格 | 低 |
| `tools.json` | 工具元数据（名称、分类、图标、路径、标签） | 添加新工具时修改 |
| `assets/css/theme.css` | 全站设计系统，所有工具共享 | 低 |
| `assets/js/config.js` | API 基础地址、版本号等配置 | 低 |
| `assets/js/member.js` | 会员状态检测、权限控制 | 低 |
| `assets/js/component.js` | 复用组件（导航、弹窗、加载动画） | 中 |
| `tools/*.html` | 各工具独立页面 | 新增工具时创建 |

---

## 4. 工具清单（27 个）

### 📚 教学类（18 个）

| 工具名称 | 文件名 | 会员要求 | 功能描述 |
|----------|--------|----------|----------|
| 鸡兔同笼动画 | chicken-rabbit.html | 免费 | 可视化演示经典鸡兔同笼问题的解题过程，支持自定义数量 |
| 评语生成器 | comment-generator.html | 免费 | 根据学生表现关键词自动生成个性化评语，支持多种风格 |
| 成绩统计 | score-stats.html | 免费 | 输入成绩数据，自动计算平均分、最高/最低分、分布图表 |
| 随机分组 | random-group.html | 免费 | 输入学生名单，按指定人数随机分成若干小组 |
| 幸运转盘 | lucky-wheel.html | 免费 | 自定义选项的转盘工具，可用于课堂互动或随机选择 |
| 拼音标注 | pinyin.html | 免费 | 为汉字自动添加拼音标注，支持声调显示 |
| 答题卡 | answer-sheet.html | 免费 | 生成可打印的标准答题卡模板 |
| 云朵字Pro | cloud-text-pro.html | 付费 | 云朵字高级版，更多样式、更大画布、导出高清图片 |
| 奖状批量生成 | certificate-batch.html | 免费 | 批量生成个性化奖状，支持导入名单和自定义模板 |
| 座位表 | seat-map.html | 免费 | 可视化编辑教室座位表，支持拖拽调整、打印导出 |
| 随机点名 | random-call.html | 免费 | 导入学生名单后随机抽取，带动画效果 |
| 课堂计时器 | class-timer.html | 免费 | 倒计时/正计时工具，支持自定义时间和提醒音效 |
| 课程表 | timetable.html | 免费 | 在线编辑课程表，支持自定义节数和时间段 |
| 三角形拼接 | triangle-piece.html | 免费 | 交互式三角形拼接演示，帮助理解几何概念 |
| 三角形构筑 | triangle-build.html | 免费 | 通过拖拽顶点构建三角形，实时显示角度和边长 |
| 平均数 | average.html | 免费 | 计算算术平均数、加权平均数，带可视化展示 |
| 边的关系 | edge-relation.html | 免费 | 演示三角形三边关系定理（两边之和大于第三边） |
| 云朵字 | cloud-text.html | 免费 | 将文字转换为云朵形状的艺术字效果 |

### 🎨 设计类（5 个）

| 工具名称 | 文件名 | 会员要求 | 功能描述 |
|----------|--------|----------|----------|
| 云朵字 | cloud-text.html | 免费 | 将文字转换为云朵形状的艺术字效果 |
| 云朵字Pro | cloud-text-pro.html | 付费 | 高级云朵字，更多模板和导出选项 |
| 颜色工具 | color-tool.html | 免费 | 颜色选择器、HEX/RGB/HSL 转换、调色板生成 |
| 奖状批量生成 | certificate-batch.html | 免费 | 设计并批量生成个性化奖状 |
| 图片拼接 | image-merge.html | 免费 | 多张图片拼接为一张，支持横向/纵向/网格布局 |

### 🏢 办公类（14 个）

| 工具名称 | 文件名 | 会员要求 | 功能描述 |
|----------|--------|----------|----------|
| 单位换算 | unit-convert.html | 免费 | 长度、重量、面积、体积、温度等常用单位换算 |
| 字数统计 | word-count.html | 免费 | 统计中英文字符数、单词数、行数、段落数 |
| 日期计算器 | date-calc.html | 免费 | 计算两个日期之间的天数差，或推算 N 天后的日期 |
| 颜色工具 | color-tool.html | 免费 | 颜色格式转换和调色板工具 |
| 密码生成器 | password-gen.html | 免费 | 生成安全随机密码，支持自定义长度和字符类型 |
| 二维码生成 | qr-code.html | 免费 | 将文本/URL 生成二维码图片，支持下载 |
| 图片压缩 | image-compress.html | 免费 | 在浏览器端压缩图片文件大小，支持质量调节 |
| 图片拼接 | image-merge.html | 免费 | 将多张图片拼接为一张大图 |
| PDF 工具 | pdf-tool.html | 免费 | PDF 合并、拆分、页面提取等基本操作 |
| 座位表 | seat-map.html | 免费 | 编辑和打印教室座位表 |
| 课程表 | timetable.html | 免费 | 在线课程表编辑和打印 |

### 🔢 数学类（5 个）

| 工具名称 | 文件名 | 会员要求 | 功能描述 |
|----------|--------|----------|----------|
| 鸡兔同笼 | chicken-rabbit.html | 免费 | 鸡兔同笼问题的交互式动画演示 |
| 三角形拼接 | triangle-piece.html | 免费 | 三角形拼接的交互式几何演示 |
| 三角形构筑 | triangle-build.html | 免费 | 通过拖拽顶点构建三角形并观察性质 |
| 平均数 | average.html | 免费 | 算术平均数和加权平均数的计算与可视化 |
| 边的关系 | edge-relation.html | 免费 | 三角形三边关系定理的交互式验证 |

> **说明**：部分工具同时归属多个分类（如云朵字同时属于教学和设计），在主页可通过分类标签筛选。

---

## 5. 会员系统说明

### 会员等级

```
┌─────────────────────────────────────────────┐
│              会员等级体系                     │
├─────────────┬───────────────────────────────┤
│  免费用户    │  付费会员（Pro）               │
├─────────────┼───────────────────────────────┤
│ ✓ 所有基础   │ ✓ 免费用户全部功能             │
│   工具使用   │ ✓ 云朵字Pro 高级功能           │
│ ✓ 基础功能   │ ✓ 批量导出无限制              │
│ ✗ 高级导出   │ ✓ 高分辨率图片导出             │
│ ✗ 批量操作   │ ✓ 优先技术支持                │
│   限制次数   │ ✓ 去除水印（如有）             │
└─────────────┴───────────────────────────────┘
```

### 免费功能

- 所有 27 个工具均可使用基础功能
- 单次操作（如单张奖状生成、单次成绩统计）
- 标准分辨率导出
- 基础模板选择

### 付费功能（Pro）

- **云朵字Pro**：高级样式模板、大画布、高清导出
- **批量操作**：奖状批量生成无数量限制
- **高清导出**：图片类工具支持 2x/3x 高分辨率输出
- **去水印**：导出结果无站点水印

### 技术实现

```
用户访问工具页面
        │
        ▼
  member.js 检查登录状态
        │
        ├── 未登录 → 显示登录提示（如需会员功能）
        │              │
        │              └── 基础功能 → 直接可用
        │
        ├── 已登录（免费）→ 基础功能可用
        │                    │
        │                    └── 点击高级功能 → 弹窗引导升级
        │
        └── 已登录（Pro）→ 全部功能可用
```

**member.js 核心方法**：

```javascript
// 检查是否已登录
Member.isLoggedIn()

// 获取会员等级: 'free' | 'pro'
Member.getLevel()

// 检查是否有某项权限
Member.hasPermission('feature_name')

// 显示升级提示弹窗
Member.showUpgradePrompt()
```

---

## 6. 管理后台使用指南

### 访问方式

- 地址：`/_internal/login.html`
- 仅管理员账号可登录
- 登录后跳转至管理面板主页

### 功能模块

```
管理后台
├── 📊 仪表盘（Dashboard）
│   ├── 今日访问量
│   ├── 注册用户数
│   ├── 工具使用排行
│   └── 收入统计（如有付费）
│
├── 🔧 工具管理
│   ├── 查看所有工具列表
│   ├── 编辑工具信息（名称、描述、分类）
│   ├── 启用/禁用工具
│   └── 调整工具排序
│
├── 👥 用户管理
│   ├── 用户列表（搜索、筛选）
│   ├── 查看用户详情
│   ├── 修改会员等级
│   └── 封禁/解封用户
│
└── ⚙️ 站点设置
    ├── 站点标题、描述
    ├── 公告管理
    └── 功能开关
```

### 常用操作

#### 添加新公告

1. 进入「站点设置」
2. 在公告栏输入内容（支持 HTML）
3. 选择显示时间范围
4. 点击保存，主页将自动显示公告条

#### 将用户升级为 Pro

1. 进入「用户管理」
2. 搜索目标用户（邮箱/手机号）
3. 点击「编辑」
4. 将会员等级改为「Pro」
5. 设置有效期（可选）
6. 保存

#### 禁用某个工具

1. 进入「工具管理」
2. 找到目标工具
3. 将状态从「启用」切换为「禁用」
4. 主页将不再显示该工具卡片

---

## 7. 如何添加新工具

### 第一步：创建工具页面

在 `tools/` 目录下创建新的 HTML 文件，遵循以下模板：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>工具名称 - 教师工具站</title>
    <link rel="stylesheet" href="../assets/css/theme.css">
    <link rel="stylesheet" href="../assets/css/icons.css">
</head>
<body>
    <!-- 共享导航栏 -->
    <nav id="navbar"></nav>

    <main class="container">
        <div class="tool-header">
            <h1><i class="fa fa-icon-name"></i> 工具名称</h1>
            <p class="tool-desc">工具的简短描述</p>
        </div>

        <div class="tool-body">
            <!-- 工具内容区 -->
            <div class="tool-input">
                <!-- 输入区域 -->
            </div>
            <div class="tool-output">
                <!-- 结果区域 -->
            </div>
        </div>
    </main>

    <!-- 共享页脚 -->
    <footer id="footer"></footer>

    <!-- 引入共享脚本 -->
    <script src="../assets/js/config.js"></script>
    <script src="../assets/js/member.js"></script>
    <script src="../assets/js/component.js"></script>

    <!-- 工具自身的脚本 -->
    <script>
        // 初始化共享组件
        Component.initNavbar();
        Component.initFooter();

        // 工具逻辑
        // ...
    </script>
</body>
</html>
```

### 第二步：在 tools.json 中注册

编辑根目录的 `tools.json`，添加新工具条目：

```json
{
    "id": "tool-id",
    "name": "工具名称",
    "desc": "工具的简短描述，一句话说明功能",
    "icon": "fa-icon-name",
    "category": "teaching",
    "tags": ["标签1", "标签2", "标签3"],
    "url": "tools/tool-id.html",
    "member": "free",
    "new": true,
    "order": 28
}
```

**字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 工具唯一标识，与文件名对应 |
| `name` | string | 显示名称 |
| `desc` | string | 简短描述（显示在卡片上） |
| `icon` | string | Font Awesome 图标类名 |
| `category` | string | 分类：`teaching` / `design` / `office` / `math` |
| `tags` | array | 搜索标签，帮助用户搜索到工具 |
| `url` | string | 相对于根目录的文件路径 |
| `member` | string | 权限要求：`free` / `pro` |
| `new` | boolean | 是否标记为「新工具」（可选） |
| `order` | number | 排序权重，数字越小越靠前 |

### 第三步：使用 CSS 变量保持一致

工具页面应使用 `theme.css` 中定义的 CSS 变量，确保视觉一致：

```css
/* 在工具的 <style> 中使用变量 */
.tool-card {
    background: var(--bg-card);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    padding: var(--spacing-lg);
}

.btn-primary {
    background: var(--color-primary);
    color: var(--color-white);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-sm);
}
```

### 第四步：测试

1. 在本地打开 `tools/your-tool.html` 测试功能
2. 检查响应式布局（手机/平板/桌面）
3. 确认导航栏和页脚正常加载
4. 验证在主页工具列表中正确显示

---

## 8. 技术栈详情

### 前端

| 技术 | 用途 | 版本/说明 |
|------|------|-----------|
| **HTML5** | 页面结构 | 语义化标签，`<canvas>` 用于图形工具 |
| **CSS3** | 样式 | CSS 变量、Flexbox、Grid 布局 |
| **Vanilla JavaScript** | 交互逻辑 | 无框架依赖，原生 ES6+ |
| **Font Awesome** | 图标 | CSS 子集，仅包含使用的图标（icons.css） |
| **Canvas API** | 图形渲染 | 鸡兔同笼、云朵字、三角形等图形工具 |
| **Service Worker** | 离线缓存 | 缓存核心资源，支持弱网使用 |

### 后端

| 技术 | 用途 | 说明 |
|------|------|------|
| **Cloudflare Workers** | API 服务 | Serverless 函数，处理会员验证、管理接口 |
| **Cloudflare D1** | 数据库 | SQLite 兼容的边缘数据库，存储用户和工具数据 |
| **Cloudflare R2** | 对象存储 | 存储用户上传的图片等文件（如有） |

### 部署与托管

| 平台 | 用途 |
|------|------|
| **GitHub Pages** | 静态站点托管（HTML/CSS/JS/图片） |
| **GitHub Actions** | 自动化部署（push 后自动构建部署） |
| **Cloudflare** | Workers API + D1 数据库 + CDN 加速 |

### 开发工具

| 工具 | 用途 |
|------|------|
| **Git** | 版本控制 |
| **Wrangler** | Cloudflare Workers 本地开发和部署 CLI |
| **VS Code** | 代码编辑器（推荐） |

### 关键依赖

本项目**零前端依赖**，不使用任何 npm 包。所有功能通过原生浏览器 API 实现：

- 无 React / Vue / Angular
- 无 jQuery
- 无打包工具（Webpack / Vite）
- 无 CSS 预处理器（Sass / Less）

这种设计确保了：
- 极快的加载速度
- 零构建步骤
- 最简单的部署方式
- 最低的维护成本

---

## 9. 文件命名规范

### 工具页面文件

```
格式：kebab-case.html
示例：chicken-rabbit.html、score-stats.html、cloud-text-pro.html
```

- 全小写，单词用连字符 `-` 分隔
- 使用英文，简短且有意义
- 与 `tools.json` 中的 `id` 字段一致

### CSS 文件

```
格式：kebab-case.css
示例：theme.css、icons.css
```

### JS 文件

```
格式：camelCase.js 或 kebab-case.js
示例：config.js、member.js、component.js、sw.js
```

### 图片资源

```
格式：kebab-case.{png|jpg|svg|webp}
示例：logo.png、bg-pattern.svg、tool-preview.webp
```

### 分类标识符

| 中文名 | 英文标识 | 用于 JSON 和 CSS 类 |
|--------|----------|---------------------|
| 教学 | `teaching` | `.category-teaching` |
| 设计 | `design` | `.category-design` |
| 办公 | `office` | `.category-office` |
| 数学 | `math` | `.category-math` |

### 工具 ID 命名规则

```
小写英文，多个单词用连字符连接，尽量简短

✓ chicken-rabbit    （鸡兔同笼）
✓ score-stats       （成绩统计）
✓ cloud-text-pro    （云朵字Pro）
✓ qr-code           （二维码）

✗ ChickenRabbit     （不要驼峰）
✗ chicken_rabbit    （不要下划线）
✗ chrab             （不要过度缩写）
```

---

## 10. CSS 设计系统参考

### 颜色变量

```css
:root {
    /* 主色调 */
    --color-primary: #4A90D9;       /* 主色 - 蓝色 */
    --color-primary-dark: #3A7BC8;  /* 主色 - 深色（悬停） */
    --color-primary-light: #6BA5E7; /* 主色 - 浅色 */

    /* 功能色 */
    --color-success: #52C41A;       /* 成功 - 绿色 */
    --color-warning: #FAAD14;       /* 警告 - 黄色 */
    --color-danger: #FF4D4F;        /* 危险/错误 - 红色 */
    --color-info: #1890FF;          /* 信息 - 蓝色 */

    /* 中性色 */
    --color-white: #FFFFFF;
    --color-gray-50: #FAFAFA;
    --color-gray-100: #F5F5F5;
    --color-gray-200: #E8E8E8;
    --color-gray-300: #D9D9D9;
    --color-gray-500: #999999;
    --color-gray-700: #666666;
    --color-gray-900: #333333;
    --color-black: #000000;

    /* 背景色 */
    --bg-body: #F0F2F5;             /* 页面背景 */
    --bg-card: #FFFFFF;             /* 卡片背景 */
    --bg-sidebar: #FAFBFC;          /* 侧边栏背景 */
}
```

### 字体

```css
:root {
    --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
                   'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei',
                   'Helvetica Neue', Helvetica, Arial, sans-serif;
    --font-mono: 'SFMono-Regular', Consolas, 'Liberation Mono',
                 Menlo, Courier, monospace;

    --font-size-xs: 12px;
    --font-size-sm: 14px;
    --font-size-base: 16px;
    --font-size-lg: 18px;
    --font-size-xl: 20px;
    --font-size-2xl: 24px;
    --font-size-3xl: 30px;
}
```

### 间距系统

```css
:root {
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;
    --spacing-2xl: 48px;
}
```

### 圆角

```css
:root {
    --radius-xs: 2px;
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    --radius-full: 9999px;  /* 胶囊形 */
}
```

### 阴影

```css
:root {
    --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
    --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
    --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.12);
    --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.16);
}
```

### 常用 CSS 类

#### 布局

```css
.container          /* 居中容器，max-width: 1200px */
.flex               /* display: flex */
.flex-center        /* flex + 居中对齐 */
.flex-between       /* flex + 两端对齐 */
.grid               /* display: grid */
.grid-2             /* 两列网格 */
.grid-3             /* 三列网格 */
.grid-4             /* 四列网格（响应式） */
```

#### 卡片

```css
.card               /* 基础卡片：白底、圆角、阴影 */
.card-header        /* 卡片头部 */
.card-body          /* 卡片内容区 */
.card-footer        /* 卡片底部 */
.card-hover         /* 悬停时上浮效果 */
```

#### 按钮

```css
.btn                /* 基础按钮样式 */
.btn-primary        /* 主色按钮 */
.btn-success        /* 绿色按钮 */
.btn-danger         /* 红色按钮 */
.btn-outline        /* 边框按钮（无背景） */
.btn-sm             /* 小号按钮 */
.btn-lg             /* 大号按钮 */
.btn-block          /* 块级按钮（撑满宽度） */
```

#### 表单

```css
.form-group         /* 表单项容器 */
.form-label         /* 标签 */
.form-input         /* 输入框 */
.form-select        /* 下拉选择 */
.form-textarea      /* 多行文本 */
.form-check         /* 复选框/单选框 */
```

#### 工具页面专用

```css
.tool-header        /* 工具页头部（标题 + 描述） */
.tool-body          /* 工具主体区域 */
.tool-input         /* 输入区域 */
.tool-output        /* 输出/结果区域 */
.tool-controls      /* 控制按钮区 */
.tool-preview       /* 预览区域 */
.tool-settings      /* 设置面板 */
```

#### 通用

```css
.text-center        /* 文本居中 */
.text-primary       /* 主色文字 */
.text-muted         /* 弱化文字 */
.text-success       /* 成功色文字 */
.text-danger        /* 危险色文字 */
.mt-md              /* 上边距 16px */
.mb-md              /* 下边距 16px */
.p-md               /* 内边距 16px */
.hidden             /* display: none */
.visible            /* display: block */
```

### 响应式断点

```css
/* 移动端优先，默认样式面向手机 */
/* 小屏幕手机：< 576px（默认） */

@media (min-width: 576px) {
    /* 大手机 / 小平板 */
}

@media (min-width: 768px) {
    /* 平板 */
}

@media (min-width: 1024px) {
    /* 桌面 */
}

@media (min-width: 1200px) {
    /* 大桌面 */
}
```

### 动画

```css
/* 过渡 */
transition: all 0.2s ease;

/* 悬停上浮 */
.card-hover:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

/* 淡入 */
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* 脉冲（加载状态） */
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
```

---

## 附录 A：tools.json 完整示例

```json
{
    "site": {
        "name": "教师工具站",
        "desc": "教师必备在线工具合集",
        "version": "1.0.0"
    },
    "tools": [
        {
            "id": "chicken-rabbit",
            "name": "鸡兔同笼动画",
            "desc": "可视化演示经典鸡兔同笼问题",
            "icon": "fa-paw",
            "category": "teaching",
            "tags": ["数学", "动画", "小学", "趣味"],
            "url": "tools/chicken-rabbit.html",
            "member": "free",
            "new": false,
            "order": 1
        }
    ]
}
```

## 附录 B：常用开发命令

```bash
# 本地预览（需要安装任意 HTTP 服务器）
python -m http.server 8080
# 或
npx serve .

# Cloudflare Workers 本地开发
npx wrangler dev

# 部署 Worker
npx wrangler deploy

# D1 数据库操作
npx wrangler d1 execute teacher-tools-db --file=api/schema.sql
```

## 附录 C：浏览器兼容性

| 浏览器 | 最低版本 | 说明 |
|--------|----------|------|
| Chrome | 80+ | 完整支持 |
| Firefox | 78+ | 完整支持 |
| Safari | 14+ | 完整支持 |
| Edge | 80+ | 完整支持 |
| IE | ❌ | 不支持 |

---

> 文档版本：v1.0
> 最后更新：2026 年 6 月
> 维护者：教师工具站开发团队
