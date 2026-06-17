# 页面模板使用指南

## 统一主题系统

所有工具页面使用统一的主题样式，确保整个网站风格一致。

### 文件位置

```
assets/
├── css/
│   └── theme.css      # 统一主题样式
├── js/
│   ├── config.js      # 公共配置
│   └── member.js      # 会员模块
```

### 引入方式

在每个工具页面的 `<head>` 中添加：

```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<link rel="stylesheet" href="../assets/css/theme.css">
<script src="../assets/js/config.js"></script>
```

---

## 页面模板

### 基础模板

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>工具名称 | 教师工具站</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="stylesheet" href="../assets/css/theme.css">
  <script src="../assets/js/config.js"></script>
  <style>
    /* 页面特定样式写在这里 */
    .workspace {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: var(--space-5);
      padding: var(--space-5);
      height: calc(100vh - 57px);
    }

    .main-area {
      /* 主区域样式 */
    }

    .sidebar {
      background: var(--card);
      border-left: 1px solid var(--border);
      padding: var(--space-5);
      overflow-y: auto;
    }

    @media (max-width: 768px) {
      .workspace {
        grid-template-columns: 1fr;
        height: auto;
      }
    }
  </style>
</head>
<body>
  <!-- 导航栏 -->
  <nav class="navbar">
    <div class="navbar-left">
      <a href="/" class="logo">
        <i class="fas fa-icon-name"></i>
        工具名称
      </a>
    </div>
    <div class="navbar-right">
      <a href="/" class="btn btn-secondary btn-sm">
        <i class="fas fa-home"></i> 返回首页
      </a>
    </div>
  </nav>

  <!-- 主工作区 -->
  <div class="workspace">
    <!-- 左侧主区域 -->
    <div class="main-area">
      <!-- 内容区域 -->
    </div>

    <!-- 右侧边栏 -->
    <aside class="sidebar">
      <!-- 控制面板 -->
    </aside>
  </div>

  <!-- 引入会员模块（如果需要限制功能） -->
  <script src="../assets/js/member.js"></script>

  <script>
    // 页面逻辑
  </script>
</body>
</html>
```

---

## 常用组件

### 1. 按钮

```html
<!-- 主要按钮 -->
<button class="btn btn-primary">
  <i class="fas fa-check"></i> 确认
</button>

<!-- 次要按钮 -->
<button class="btn btn-secondary">
  <i class="fas fa-times"></i> 取消
</button>

<!-- 成功按钮 -->
<button class="btn btn-success">
  <i class="fas fa-save"></i> 保存
</button>

<!-- 警告按钮 -->
<button class="btn btn-warning">
  <i class="fas fa-exclamation"></i> 警告
</button>

<!-- 危险按钮 -->
<button class="btn btn-danger">
  <i class="fas fa-trash"></i> 删除
</button>

<!-- 小按钮 -->
<button class="btn btn-primary btn-sm">小按钮</button>

<!-- 大按钮 -->
<button class="btn btn-primary btn-lg">大按钮</button>

<!-- 图标按钮 -->
<button class="btn btn-icon btn-secondary">
  <i class="fas fa-edit"></i>
</button>

<!-- 禁用状态 -->
<button class="btn btn-primary" disabled>禁用</button>
```

### 2. 表单

```html
<!-- 输入框 -->
<div class="form-group">
  <label class="form-label">标签</label>
  <input type="text" class="form-input" placeholder="请输入...">
</div>

<!-- 下拉框 -->
<div class="form-group">
  <label class="form-label">选择</label>
  <select class="form-select">
    <option>选项1</option>
    <option>选项2</option>
  </select>
</div>

<!-- 文本域 -->
<div class="form-group">
  <label class="form-label">内容</label>
  <textarea class="form-textarea" rows="4"></textarea>
</div>

<!-- 颜色选择器 -->
<div class="form-group">
  <label class="form-label">颜色</label>
  <input type="color" class="form-color" value="#6366f1">
</div>
```

### 3. 卡片

```html
<div class="card">
  <div class="card-header">
    <div class="card-title">
      <i class="fas fa-star"></i> 标题
    </div>
    <button class="btn btn-ghost btn-sm">操作</button>
  </div>
  <div class="card-body">
    内容区域
  </div>
  <div class="card-footer">
    底部内容
  </div>
</div>
```

### 4. 统计卡片

```html
<div class="stats-grid">
  <div class="stat-card">
    <div class="stat-value primary">128</div>
    <div class="stat-label">总数量</div>
  </div>
  <div class="stat-card">
    <div class="stat-value success">96</div>
    <div class="stat-label">已完成</div>
  </div>
  <div class="stat-card">
    <div class="stat-value warning">32</div>
    <div class="stat-label">进行中</div>
  </div>
  <div class="stat-card">
    <div class="stat-value danger">8</div>
    <div class="stat-label">异常</div>
  </div>
</div>
```

### 5. 徽章

```html
<span class="badge badge-primary">主要</span>
<span class="badge badge-success">成功</span>
<span class="badge badge-warning">警告</span>
<span class="badge badge-danger">危险</span>
<span class="badge badge-info">信息</span>
```

### 6. 面板

```html
<div class="panel">
  <div class="panel-title">
    <i class="fas fa-cog"></i> 设置
  </div>
  <!-- 内容 -->
</div>
```

### 7. 提示框

```html
<div class="alert alert-success">
  <i class="fas fa-check-circle"></i>
  <div>操作成功！</div>
</div>

<div class="alert alert-warning">
  <i class="fas fa-exclamation-triangle"></i>
  <div>请注意！</div>
</div>

<div class="alert alert-danger">
  <i class="fas fa-times-circle"></i>
  <div>操作失败！</div>
</div>
```

### 8. 弹窗

```html
<!-- 弹窗遮罩 -->
<div class="modal-overlay" id="myModal">
  <div class="modal">
    <div class="modal-header">
      <h3 class="modal-title">弹窗标题</h3>
      <p class="modal-desc">弹窗描述</p>
    </div>

    <!-- 弹窗内容 -->
    <div class="form-group">
      <input type="text" class="form-input" placeholder="输入内容">
    </div>

    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" onclick="confirm()">确认</button>
    </div>
  </div>
</div>
```

### 9. Toast 提示

```javascript
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// 使用
showToast('操作成功');
showToast('请注意', 'warning');
showToast('操作失败', 'danger');
```

### 10. 文件上传

```html
<div class="file-upload" id="uploadArea">
  <div class="file-upload-icon">
    <i class="fas fa-cloud-upload-alt"></i>
  </div>
  <div class="file-upload-text">点击或拖拽文件到此处</div>
  <div class="file-upload-hint">支持 .xlsx, .xls 格式</div>
  <input type="file" id="fileInput" style="display: none;">
</div>
```

---

## 颜色使用规范

| 场景 | 颜色变量 | 说明 |
|------|----------|------|
| 主要操作 | `var(--primary)` | 按钮、链接、重点元素 |
| 成功状态 | `var(--success)` | 完成、通过、正向 |
| 警告状态 | `var(--warning)` | 注意、提醒、待处理 |
| 危险状态 | `var(--danger)` | 错误、删除、危险操作 |
| 信息提示 | `var(--info)` | 普通信息、帮助 |
| 正文文字 | `var(--text)` | 主要文字内容 |
| 次要文字 | `var(--text-secondary)` | 说明文字 |
| 浅色文字 | `var(--text-light)` | 辅助信息 |
| 占位文字 | `var(--text-muted)` | 输入框占位符 |
| 背景 | `var(--bg)` | 页面背景 |
| 卡片背景 | `var(--card)` | 卡片、面板 |
| 边框 | `var(--border)` | 分割线、边框 |

---

## 布局模式

### 1. 左右布局（最常用）

```html
<div class="workspace">
  <div class="main-area">主内容</div>
  <aside class="sidebar">侧边栏</aside>
</div>
```

### 2. 上下布局

```html
<div class="container">
  <header>顶部</header>
  <main>内容</main>
  <footer>底部</footer>
</div>
```

### 3. 三栏布局

```html
<div class="workspace" style="grid-template-columns: 250px 1fr 300px;">
  <aside class="sidebar">左栏</aside>
  <div class="main-area">中栏</div>
  <aside class="sidebar">右栏</aside>
</div>
```

---

## 会员功能集成

如果需要限制某些功能（如导出次数），引入会员模块：

```html
<script src="../assets/js/member.js"></script>
```

然后在代码中使用：

```javascript
// 检查是否是会员
if (member.isPro) {
  // 会员功能
} else {
  // 免费功能限制
}

// 显示会员状态
const status = member.getStatusText();
// { text: '👑 会员用户', class: 'status-pro' }

// 激活卡密
const result = await member.activate(key);
// { ok: true, msg: '激活成功' }
```

---

## 注意事项

1. **路径问题**：工具页面在 `tools/` 目录下，引用 `assets/` 需要用 `../assets/`
2. **字体图标**：统一使用 FontAwesome 6.x
3. **响应式**：确保在移动端也能正常使用
4. **中文**：界面文字使用中文，代码注释使用中文
5. **命名规范**：CSS 类名使用 kebab-case，JavaScript 使用 camelCase
