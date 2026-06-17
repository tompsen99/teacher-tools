# 教师工具站 — 完整部署指南

> 本文档覆盖从前端到后端的全部部署流程，适用于全新环境从零搭建。

---

## 目录

1. [环境准备](#1-环境准备)
2. [前端部署（GitHub Pages）](#2-前端部署github-pages)
3. [后端部署（Cloudflare Workers）](#3-后端部署cloudflare-workers)
4. [D1 数据库创建与迁移](#4-d1-数据库创建与迁移)
5. [环境变量 / Secret 配置](#5-环境变量--secret-配置)
6. [管理员面板与密码管理](#6-管理员面板与密码管理)
7. [会员系统配置](#7-会员系统配置)
8. [自定义域名](#8-自定义域名)
9. [常见问题排查](#9-常见问题排查)

---

## 1. 环境准备

### 1.1 Node.js

最低要求 **Node.js 18+**（推荐 20 LTS）。

```bash
# 检查版本
node -v
npm -v
```

> 📸 *截图占位：Node.js 安装成功提示*

Windows 用户前往 https://nodejs.org 下载 LTS 安装包，勾选"自动添加到 PATH"。

### 1.2 Git

```bash
git --version
```

Windows 用户安装 Git for Windows：https://git-scm.com/download/win

### 1.3 Cloudflare 账号

1. 访问 https://dash.cloudflare.com 注册
2. 免费套餐即可使用 Workers + D1

> 📸 *截图占位：Cloudflare Dashboard 首页*

### 1.4 GitHub 账号

1. 访问 https://github.com 注册
2. 新建一个仓库，例如 `teacher-tools`

### 1.5 Wrangler CLI（Cloudflare 命令行工具）

```bash
npm install -g wrangler
wrangler --version
```

首次使用需要登录：

```bash
wrangler login
```

浏览器会弹出 Cloudflare 授权页面，点击"允许"即可。

> 📸 *截图占位：wrangler login 授权页面*

---

## 2. 前端部署（GitHub Pages）

### 2.1 项目结构

```
teacher-tools/
├── index.html          # 工具站首页
├── activate.html       # 会员激活页面
├── _internal/
│   └── a9f3e2b1.html   # 管理员面板（隐秘路径）
├── assets/             # CSS / JS / 图片
└── ...
```

### 2.2 推送到 GitHub

```bash
cd /c/Users/yuanx/Desktop/工具站复原

# 初始化仓库（如果还没有）
git init
git remote add origin https://github.com/<你的用户名>/teacher-tools.git

# 推送
git add -A
git commit -m "初始提交"
git branch -M main
git push -u origin main
```

### 2.3 开启 GitHub Pages

1. 进入仓库 → **Settings** → **Pages**
2. **Source** 选择 `Deploy from a branch`
3. **Branch** 选择 `main`，目录选 `/ (root)`
4. 点击 **Save**

> 📸 *截图占位：GitHub Pages 设置页面*

等待 1-2 分钟后访问：

```
https://<你的用户名>.github.io/teacher-tools/
```

### 2.4 自定义域名（可选，见第 8 节）

---

## 3. 后端部署（Cloudflare Workers）

### 3.1 wrangler.toml 配置

在后端目录下（通常是 `worker/` 或项目根目录的 `wrangler.toml`）：

```toml
name = "teacher-tools-api"
main = "src/index.js"
compatibility_date = "2024-01-01"

# D1 数据库绑定
[[d1_databases]]
binding = "DB"
database_name = "teacher-tools-db"
database_id = "<在第4步创建后填入>"
```

### 3.2 部署到 Cloudflare

```bash
# 进入后端目录
cd /c/Users/yuanx/Desktop/工具站复原/worker

# 首次部署
wrangler deploy
```

> 📸 *截图占位：wrangler deploy 成功输出*

部署成功后会得到一个地址：

```
https://teacher-tools-api.<你的子域>.workers.dev
```

### 3.3 验证后端

```bash
curl https://teacher-tools-api.<你的子域>.workers.dev/api/health
```

应返回 `{"status":"ok"}` 或类似成功响应。

---

## 4. D1 数据库创建与迁移

### 4.1 创建数据库

```bash
wrangler d1 create teacher-tools-db
```

输出示例：

```
✅ Successfully created DB 'teacher-tools-db'
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

> ⚠️ **将输出的 `database_id` 填入 `wrangler.toml` 中的 `database_id` 字段。**

### 4.2 执行迁移脚本

假设迁移文件为 `schema.sql`：

```bash
wrangler d1 execute teacher-tools-db --file=./schema.sql
```

### 4.3 schema.sql 核心表结构

```sql
-- 用户/会员表
CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_key TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'trial',       -- trial / monthly / permanent
  activated_at TEXT,
  expires_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 激活日志
CREATE TABLE IF NOT EXISTS activation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_key TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  activated_at TEXT DEFAULT (datetime('now'))
);

-- 管理员配置（如需数据库存储密码哈希）
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

### 4.4 验证数据库

```bash
wrangler d1 execute teacher-tools-db --command "SELECT COUNT(*) FROM members"
```

---

## 5. 环境变量 / Secret 配置

Cloudflare Workers 的敏感信息使用 **Secret** 存储，不会出现在代码中。

### 5.1 设置 ADMIN_KEY（管理员 API 密钥）

```bash
wrangler secret put ADMIN_KEY
# 提示输入值时，输入一个强密码，例如：
# MyStr0ng!AdminKey2026
```

### 5.2 设置 JWT_SECRET（JWT 签名密钥）

```bash
wrangler secret put JWT_SECRET
# 输入一个随机长字符串，例如：
# a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5
```

### 5.3 设置 ALLOWED_ORIGIN（允许的前端域名）

```bash
wrangler secret put ALLOWED_ORIGIN
# 输入你的前端地址，例如：
# https://yourusername.github.io
```

> ⚠️ 如果使用自定义域名，改为你的自定义域名：
> `https://tools.example.com`

### 5.4 查看已设置的 Secret

```bash
wrangler secret list
```

输出应显示三个 Secret：`ADMIN_KEY`、`JWT_SECRET`、`ALLOWED_ORIGIN`。

---

## 6. 管理员面板与密码管理

### 6.1 访问管理员面板

管理员面板地址为隐秘路径：

```
https://<你的前端地址>/_internal/a9f3e2b1.html
```

> 📸 *截图占位：管理员登录页面*

### 6.2 默认密码

| 项目 | 值 |
|---|---|
| 默认密码 | `admin2026` |
| 存储方式 | SHA-256 哈希 |

### 6.3 修改管理员密码

**方式一：修改前端代码中的哈希值**

1. 计算新密码的 SHA-256：

```bash
echo -n "你的新密码" | sha256sum
```

2. 在 `a9f3e2b1.html` 中找到密码哈希对比处，替换为新哈希值。

**方式二：通过管理员面板修改**（如果面板内置了修改功能）

1. 登录管理面板
2. 找到"设置"或"修改密码"
3. 输入旧密码和新密码
4. 保存

### 6.4 管理员面板功能

- ✅ 生成卡密（批量/单个）
- ✅ 查看已激活会员列表
- ✅ 查看激活日志
- ✅ 系统配置

> 📸 *截图占位：管理员面板主界面*

---

## 7. 会员系统配置

### 7.1 卡密类型说明

| 类型 | 代码 | 有效期 | 说明 |
|---|---|---|---|
| 试用 | `trial` | 7 天 | 新用户体验 |
| 月卡 | `monthly` | 30 天 | 付费会员 |
| 永久 | `permanent` | 永久 | 一次购买终身使用 |

### 7.2 生成卡密

**管理员面板操作：**

1. 登录管理面板（`/_internal/a9f3e2b1.html`）
2. 选择卡密类型
3. 输入生成数量
4. 点击"生成"
5. 复制或导出卡密列表

> 📸 *截图占位：卡密生成界面*

**API 方式（高级）：**

```bash
curl -X POST https://<worker地址>/api/admin/cards \
  -H "Authorization: Bearer <你的ADMIN_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"type":"monthly","count":10}'
```

### 7.3 用户激活流程

1. 用户访问 `https://<前端地址>/activate.html`
2. 输入卡密
3. 点击"激活"
4. 系统验证卡密有效性
5. 激活成功，开始计时

> 📸 *截图占位：用户激活页面*

### 7.4 激活状态检查

会员功能通过后端 API 验证：

```bash
curl https://<worker地址>/api/member/check \
  -H "Authorization: Bearer <用户token>"
```

---

## 8. 自定义域名

### 8.1 前端自定义域名（GitHub Pages）

1. 在域名 DNS 添加 CNAME 记录：

```
tools.example.com  →  <你的用户名>.github.io
```

2. 在 GitHub 仓库 Settings → Pages → Custom domain 填入 `tools.example.com`
3. 勾选 **Enforce HTTPS**
4. 在项目根目录创建 `CNAME` 文件：

```
tools.example.com
```

> 📸 *截图占位：GitHub Pages 自定义域名设置*

### 8.2 后端自定义域名（Cloudflare Workers）

1. 确保域名已托管在 Cloudflare（NS 指向 Cloudflare）
2. 进入 Cloudflare Dashboard → Workers & Pages → 你的 Worker → Settings → Domains & Routes
3. 添加自定义路由：

```
api.example.com/*
```

> 📸 *截图占位：Workers 自定义域名设置*

4. 更新前端代码中的 API 地址为新域名

### 8.3 更新 ALLOWED_ORIGIN

```bash
wrangler secret put ALLOWED_ORIGIN
# 输入新的前端域名
# https://tools.example.com
```

---

## 9. 常见问题排查

### Q1: GitHub Pages 部署后页面空白

**原因**：资源路径错误或 JS 报错。

**解决**：
1. 打开浏览器 F12 → Console 查看错误
2. 确认所有资源路径使用相对路径（`./assets/...`）而非绝对路径（`/assets/...`）
3. 如果仓库名不是根目录，需要设置 `<base href="/仓库名/">`

### Q2: 前端请求后端 CORS 报错

**原因**：`ALLOWED_ORIGIN` 未设置或与前端域名不匹配。

**解决**：
```bash
# 确认当前设置
wrangler secret list

# 重新设置（注意不要有尾部斜杠）
wrangler secret put ALLOWED_ORIGIN
# 输入: https://yourusername.github.io
```

### Q3: wrangler deploy 报权限错误

**原因**：未登录或账号无 Workers 权限。

**解决**：
```bash
wrangler logout
wrangler login
```

### Q4: D1 执行 SQL 报 "database not found"

**原因**：`wrangler.toml` 中的 `database_id` 与实际不匹配。

**解决**：
```bash
wrangler d1 list
# 找到正确的 database_id，更新 wrangler.toml
```

### Q5: 管理员面板 404

**原因**：GitHub Pages 无法识别 `_internal` 下划线开头的目录。

**解决**：
1. 在仓库根目录创建 `.nojekyll` 文件（空文件即可）
2. 推送后重新访问

```bash
touch .nojekyll
git add .nojekyll
git commit -m "添加 .nojekyll"
git push
```

### Q6: 卡密激活失败，提示"已使用"

**原因**：卡密已被其他用户激活。

**解决**：在管理员面板查看该卡密状态，如需重置可删除该记录后重新生成。

### Q7: Worker 超时或 500 错误

**排查步骤**：
```bash
# 查看 Worker 日志
wrangler tail

# 触发请求后观察实时日志输出
```

### Q8: 如何本地开发调试

```bash
# 本地启动 Worker 开发服务器
wrangler dev

# 默认运行在 http://localhost:8787
# 修改前端 API 地址指向 localhost:8787 进行联调
```

### Q9: 如何备份 D1 数据库

```bash
# 导出数据
wrangler d1 export teacher-tools-db --output=./backup.sql

# 导入恢复
wrangler d1 execute teacher-tools-db --file=./backup.sql
```

---

## 附录：快速命令速查

| 操作 | 命令 |
|---|---|
| 部署 Worker | `wrangler deploy` |
| 查看日志 | `wrangler tail` |
| 本地调试 | `wrangler dev` |
| 创建数据库 | `wrangler d1 create teacher-tools-db` |
| 执行 SQL | `wrangler d1 execute teacher-tools-db --command "SELECT * FROM members"` |
| 执行 SQL 文件 | `wrangler d1 execute teacher-tools-db --file=./schema.sql` |
| 设置 Secret | `wrangler secret put <NAME>` |
| 列出 Secret | `wrangler secret list` |
| 备份数据库 | `wrangler d1 export teacher-tools-db --output=./backup.sql` |

---

*文档版本：v1.0 | 最后更新：2026-06-17*
