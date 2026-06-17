# Cloudflare Workers 部署指南

## 前置准备

1. 注册 [Cloudflare](https://cloudflare.com) 账号
2. 安装 Node.js (推荐 v18+)
3. 安装 Wrangler CLI：

```bash
npm install -g wrangler
```

## 部署步骤

### 1. 登录 Cloudflare

```bash
wrangler login
```

### 2. 创建 D1 数据库

```bash
wrangler d1 create teacher-tools-db
```

执行后会输出类似：
```
✅ Successfully created DB 'teacher-tools-db'
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

将 `database_id` 填入 `wrangler.toml` 的 `database_id` 字段。

### 3. 初始化数据库

```bash
wrangler d1 execute teacher-tools-db --file=schema.sql
```

### 4. 配置环境变量

编辑 `wrangler.toml`，修改以下配置：

```toml
[vars]
ADMIN_KEY = "你的管理员密钥（用于管理后台）"
JWT_SECRET = "随机生成的JWT密钥（至少32位）"
```

或使用命令行设置（更安全）：

```bash
wrangler secret put ADMIN_KEY
wrangler secret put JWT_SECRET
```

### 5. 部署 Worker

```bash
cd api
wrangler deploy
```

部署成功后会显示：
```
✨ Success! Uploaded teacher-tools-api
🌍 https://teacher-tools-api.your-subdomain.workers.dev
```

### 6. 更新前端配置

编辑 `assets/js/config.js`，更新 API 地址：

```javascript
API_BASE: "https://teacher-tools-api.your-subdomain.workers.dev/api",
```

## 验证部署

### 测试 API

```bash
# 测试健康检查
curl https://your-worker-url/api/check

# 生成测试卡密（需要管理员密钥）
curl -X POST https://your-worker-url/api/admin/keys \
  -H "Authorization: Bearer your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{"type":"monthly","count":5,"note":"test"}'
```

### 测试激活流程

1. 使用管理后台生成卡密
2. 在前台激活卡密
3. 验证会员状态

## 常见问题

### Q: 如何修改管理员密码？

编辑 `_internal/a9f3e2b1.html` 中的 `ADMIN_PASSWORD_HASH`。

生成新密码的哈希：
```javascript
// 在浏览器控制台执行
async function hash(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
hash('your-new-password').then(console.log);
```

### Q: 如何备份数据库？

```bash
wrangler d1 export teacher-tools-db --output=backup.sql
```

### Q: 如何查看日志？

```bash
wrangler tail
```

## 安全建议

1. **修改默认密码**：部署前务必修改管理员密码和 API 密钥
2. **使用 HTTPS**：确保所有请求通过 HTTPS
3. **限制 CORS**：生产环境将 `Access-Control-Allow-Origin` 改为你的域名
4. **定期备份**：定期导出 D1 数据库备份
5. **监控使用**：使用 Cloudflare Dashboard 监控 API 调用

## 目录结构

```
api/
├── worker.js       # Cloudflare Worker 代码
├── schema.sql      # D1 数据库结构
├── wrangler.toml   # Wrangler 配置
└── DEPLOY.md       # 本文档
```
