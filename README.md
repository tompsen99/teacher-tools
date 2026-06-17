# 教师工具站 v2.0

为教师打造的专业在线工具集合，让教学更轻松、更高效。

## 📁 项目结构

```
教师工具站/
├── index.html              # 主页入口
├── activate.html           # 会员激活页面
├── tools.json              # 工具配置文件
│
├── assets/                 # 静态资源
│   ├── css/               # 样式文件
│   └── js/
│       ├── config.js      # 公共配置（无敏感信息）
│       └── member.js      # 统一会员验证模块
│
├── tools/                  # 工具页面
│   ├── cloud-text.html    # 云朵字生成器
│   ├── triangle.html      # 三角形拼接实验室
│   ├── triangle-build.html # 三角形构筑练习
│   ├── certificate.html   # 奖状生成器
│   ├── average.html       # 平均数计算器
│   ├── seating.html       # 座位表生成器
│   └── edges.html         # 边的关系探索
│
├── _internal/              # 内部管理（不对外公开）
│   ├── a9f3e2b1.html      # 管理登录页（需密码）
│   └── dashboard.html     # 管理后台
│
├── api/                    # Cloudflare Workers API
│   ├── worker.js          # Worker 代码
│   ├── schema.sql         # D1 数据库结构
│   ├── wrangler.toml      # 部署配置
│   └── DEPLOY.md          # 部署指南
│
├── CARD_SYSTEM.md          # 卡密发卡系统说明
└── README.md               # 本文件
```

## 🚀 快速开始

### 1. 本地运行

直接用浏览器打开 `index.html` 即可预览。

> 注意：部分功能需要部署后才能使用。

### 2. 部署到 GitHub Pages

1. Fork 本项目
2. 在 Settings 中开启 GitHub Pages
3. 访问 `https://your-username.github.io/repo-name/`

### 3. 部署 API（可选）

参考 [API 部署指南](api/DEPLOY.md) 部署 Cloudflare Workers。

## 🔑 管理后台

### 访问地址

```
https://your-domain/_internal/a9f3e2b1.html
```

### 默认密码

```
admin2026
```

> ⚠️ 部署前务必修改密码！

### 修改密码

1. 打开 `_internal/a9f3e2b1.html`
2. 找到 `ADMIN_PASSWORD_HASH` 变量
3. 生成新密码的 SHA-256 哈希值
4. 替换原有值

生成哈希值（浏览器控制台）：
```javascript
async function hash(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
hash('your-new-password').then(console.log);
```

## 💰 会员系统

### 会员类型

| 类型 | 时长 | 功能 |
|------|------|------|
| 免费用户 | - | 每日限用1次 |
| 试用会员 | 7天 | 无限使用 |
| 月度会员 | 30天 | 无限使用 + 优先支持 |
| 永久会员 | 永久 | 全部功能 |

### 激活流程

1. 用户购买卡密
2. 访问 `activate.html`
3. 输入卡密
4. 系统验证并激活

### 卡密购买渠道

- 小红书店铺：搜索"教师工具站"
- 微信公众号：关注后回复"购买"
- 客服咨询：添加客服微信

详见 [卡密发卡系统说明](CARD_SYSTEM.md)

## 🛠️ 工具列表

| 工具 | 描述 | 分类 |
|------|------|------|
| 云朵字生成器 | 制作云朵风格文字 | 设计、教学 |
| 三角形拼接实验室 | 互动式三角形教学 | 数学、教学 |
| 三角形构筑练习 | 三边关系练习 | 数学、教学 |
| 奖状生成器 | 生成电子奖状 | 设计、教学 |
| 平均数计算器 | 平均数教学工具 | 数学、教学 |
| 座位表生成器 | 生成教室座位表 | 教学、办公 |
| 边的关系探索 | 多边形边的性质 | 数学、教学 |

## 📝 添加新工具

1. 在 `tools/` 目录创建 HTML 文件
2. 在 `tools.json` 中添加配置
3. 在管理后台也可以添加

### 工具配置格式

```json
{
  "name": "工具名称",
  "file": "tool-file.html",
  "icon": "fa-icon-name",
  "gradient": "linear-gradient(135deg, #color1, #color2)",
  "category": ["design", "teaching"],
  "description": "工具描述",
  "tags": ["标签1", "标签2"],
  "memberOnly": false
}
```

## 🔒 安全特性

1. **后台隐藏**：管理页面使用随机路径
2. **密码保护**：管理后台需要密码登录
3. **服务端验证**：会员状态由服务端验证
4. **设备绑定**：卡密与设备绑定，防止滥用
5. **签名验证**：卡密使用 HMAC 签名，防止伪造

## 📦 技术栈

- **前端**：原生 HTML/CSS/JavaScript
- **后端**：Cloudflare Workers
- **数据库**：Cloudflare D1
- **部署**：GitHub Pages / Cloudflare Pages

## 📄 许可证

MIT License

## 📞 联系方式

- 公众号：教师工具站
- 小红书：教师工具站

---

如有问题或建议，欢迎反馈！
