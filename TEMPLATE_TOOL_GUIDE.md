# 工具页面开发指南

## 快速开始

### 1. 复制模板

```bash
cp tools/_template.html tools/your-tool-name.html
```

### 2. 修改基本信息

打开新文件，修改以下内容：

| 位置 | 修改内容 | 示例 |
|------|---------|------|
| `<title>` | 页面标题 | `<title>我的工具 \| 教师工具站</title>` |
| `<h1>` | 页面大标题 | `<h1>🎯 我的工具</h1>` |
| 标题下方 `<p>` | 工具简介 | `<p>一句话描述工具功能</p>` |

### 3. 编写工具逻辑

在 `<script>` 标签中实现你的工具功能。模板已包含完整的文字反转器示例，可以直接替换为你自己的逻辑。

---

## 文件结构说明

每个工具页面必须包含以下资源引用（已在模板中写好）：

```html
<!-- 外部图标 -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<!-- 主题样式 -->
<link rel="stylesheet" href="../assets/css/theme.css">

<!-- 核心 JS（按顺序加载） -->
<script src="../assets/js/config.js"></script>   <!-- 配置 -->
<script src="../assets/js/member.js"></script>   <!-- 会员验证 -->
<script src="../assets/js/component.js"></script> <!-- 共享组件 -->
```

### 共享组件占位 div

页面 body 中必须包含这三个空 div：

```html
<div id="app-navbar"></div>  <!-- 导航栏（自动渲染） -->
<div id="app-modal"></div>   <!-- 弹窗容器 -->
<div id="app-footer"></div>  <!-- 页脚（自动渲染） -->
```

### 页面初始化

在页面底部调用 `initPage`：

```html
<script>
  PageComponents.initPage({ title: '工具名称', icon: 'fa-xxx' });
</script>
```

---

## CSS 变量速查

使用 `theme.css` 中的变量保持风格统一：

### 颜色
```css
var(--primary)        /* 主题色 #6366f1 */
var(--primary-light)  /* 主题浅色 */
var(--card)           /* 卡片背景 */
var(--bg)             /* 页面背景 */
var(--bg-secondary)   /* 次要背景 */
var(--text)           /* 主文字色 */
var(--text-light)     /* 浅文字色 */
var(--text-muted)     /* 最浅文字色 */
var(--border)         /* 边框色 */
var(--border-light)   /* 浅边框色 */
var(--success)        /* 成功绿 */
var(--warning)        /* 警告黄 */
var(--danger)         /* 危险红 */
var(--info)           /* 信息蓝 */
```

### 间距（4px 递增）
```css
var(--space-1)  /* 4px  */
var(--space-2)  /* 8px  */
var(--space-3)  /* 12px */
var(--space-4)  /* 16px */
var(--space-5)  /* 20px */
var(--space-6)  /* 24px */
var(--space-7)  /* 28px */
var(--space-8)  /* 32px */
```

### 圆角
```css
var(--radius)      /* 默认 6px  */
var(--radius-md)   /* 中等 10px */
var(--radius-lg)   /* 大号 16px */
var(--radius-xl)   /* 特大 24px */
```

---

## 常用 UI 组件

### 按钮
```html
<button class="btn btn-primary">主要按钮</button>
<button class="btn btn-secondary">次要按钮</button>
<button class="btn btn-ghost">幽灵按钮</button>
<button class="btn btn-primary btn-sm">小按钮</button>
```

### 卡片
```html
<div class="card">
  <div class="card-header">
    <div class="card-title"><i class="fas fa-xxx"></i> 标题</div>
    <button class="btn btn-ghost btn-sm">操作</button>
  </div>
  <!-- 卡片内容 -->
</div>
```

### 表单
```html
<div class="form-group">
  <label class="form-label">标签文字</label>
  <input type="text" class="form-input" placeholder="提示文字">
</div>

<div class="form-group">
  <div class="form-check">
    <input type="checkbox" id="myCheck">
    <label for="myCheck">复选框文字</label>
  </div>
</div>
```

### 标签/徽章
```html
<span class="badge badge-warning"><i class="fas fa-crown"></i> 会员功能</span>
```

---

## 标准布局模板

### 简单布局（无侧边栏）

适合简单工具，内容居中显示：

```html
<div class="workspace">
  <div class="text-center">
    <h1>工具标题</h1>
    <p style="color: var(--text-light);">工具简介</p>
  </div>
  <!-- 工具内容 -->
</div>
```

### 左右分栏布局（带侧边栏）

适合需要设置面板的工具：

```html
<div class="workspace">
  <div class="text-center">
    <h1>工具标题</h1>
    <p style="color: var(--text-light);">工具简介</p>
  </div>

  <div class="tool-layout">
    <!-- 左侧：主操作区 -->
    <div class="main-area">
      <!-- 输入、按钮、结果等 -->
    </div>

    <!-- 右侧：侧边栏 -->
    <div class="sidebar">
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-cog"></i> 设置</div>
        </div>
        <!-- 设置选项 -->
      </div>
    </div>
  </div>
</div>
```

### 响应式断点

`tool-layout` 在 768px 以下自动变为单列。如需自定义：

```css
@media (max-width: 768px) {
  .your-class {
    /* 移动端样式 */
  }
}
```

---

## 会员功能限制

使用 `MemberManager` 判断用户是否为付费会员：

```javascript
// 初始化
const memberManager = new MemberManager();

// 检查会员状态
if (memberManager.isPro) {
  // 付费用户：正常使用高级功能
} else {
  // 免费用户：弹出升级提示
  showMemberUpgrade();
}
```

### 弹出升级提示

```javascript
function showMemberUpgrade() {
  PageComponents.showModal({
    title: '👑 会员专属功能',
    content: '这是会员专属功能，升级后即可使用。',
    confirmText: '立即升级',
    onConfirm: () => {
      window.location.href = '../member.html';
    }
  });
}
```

---

## 注册新工具

创建好工具页面后，需要在 `tools.json` 中注册，工具才会出现在首页。

在 `tools.json` 的对应分类数组中添加：

```json
{
  "name": "工具名称",
  "desc": "一句话描述",
  "icon": "fa-xxx",
  "href": "tools/your-tool-name.html",
  "tags": ["标签1", "标签2"],
  "pro": false
}
```

| 字段 | 说明 |
|------|------|
| `name` | 工具名称（中文） |
| `desc` | 简短描述 |
| `icon` | FontAwesome 图标（如 `fa-calculator`） |
| `href` | 工具页面路径 |
| `tags` | 搜索标签数组 |
| `pro` | `true` = 会员专属，`false` = 免费 |

---

## 图标速查

常用 FontAwesome 图标：

| 图标 | 类名 | 适用场景 |
|------|------|---------|
| 📊 | `fa-chart-bar` | 数据统计 |
| ✏️ | `fa-edit` | 编辑工具 |
| 🔢 | `fa-calculator` | 计算工具 |
| 📝 | `fa-file-alt` | 文本工具 |
| 🎨 | `fa-palette` | 设计工具 |
| 🔐 | `fa-lock` | 安全工具 |
| 📷 | `fa-image` | 图片工具 |
| ⚙️ | `fa-cog` | 设置 |
| 📋 | `fa-clipboard` | 复制操作 |
| 🔄 | `fa-sync-alt` | 刷新/重置 |
| 👑 | `fa-crown` | 会员功能 |

---

## 完整示例流程

1. 复制 `_template.html` 为 `bmi-calculator.html`
2. 修改 `<title>` 为 `BMI 计算器 | 教师工具站`
3. 修改 `<h1>` 为 `🏋️ BMI 计算器`
4. 在输入区添加身高、体重输入框
5. 编写 BMI 计算公式
6. 在侧边栏添加 BMI 标准说明
7. 在 `tools.json` 中添加工具条目
8. 完成！

---

## 常见问题

**Q: 工具页面没有导航栏？**
A: 确认 `component.js` 已正确加载，且页面底部调用了 `PageComponents.initPage()`。

**Q: 样式和主题不一致？**
A: 确认 `theme.css` 路径正确（`../assets/css/theme.css`），并使用 CSS 变量而非硬编码颜色。

**Q: 移动端布局错乱？**
A: 使用 `tool-layout` 类名的 grid 布局会自动响应，检查是否有多余的固定宽度。

**Q: 如何添加新的分类？**
A: 在 `tools.json` 顶层添加新的分类键，并在 `index.html` 中添加对应卡片。
