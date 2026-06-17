-- Cloudflare D1 数据库结构
-- 在 Cloudflare Dashboard 中创建 D1 数据库后执行此 SQL

-- 会员表
CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL UNIQUE,           -- 设备唯一标识
  member_type TEXT NOT NULL DEFAULT 'free', -- free/trial/monthly/permanent
  activated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expiry_at DATETIME,                       -- NULL 表示永久
  is_active INTEGER DEFAULT 1,              -- 1=有效, 0=失效
  source TEXT,                              -- 激活来源 (key/admin/gift)
  key_used TEXT,                            -- 使用的卡密
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 卡密表
CREATE TABLE IF NOT EXISTS license_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key_value TEXT NOT NULL UNIQUE,           -- 卡密值
  key_type TEXT NOT NULL,                   -- trial/monthly/permanent
  status TEXT DEFAULT 'unused',             -- unused/used/expired
  note TEXT,                                -- 备注
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  used_at DATETIME,
  used_by_device TEXT,                      -- 使用者设备ID
  expires_at DATETIME                       -- 卡密本身过期时间（可选）
);

-- 使用记录表
CREATE TABLE IF NOT EXISTS usage_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  feature TEXT NOT NULL,                    -- 功能名称 (png/pdf/tool)
  used_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 支付记录表（预留）
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT UNIQUE,                     -- 订单号
  device_id TEXT,
  amount REAL,
  currency TEXT DEFAULT 'CNY',
  status TEXT DEFAULT 'pending',            -- pending/paid/refunded
  payment_method TEXT,                      -- 支付方式
  key_assigned TEXT,                        -- 分配的卡密
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  paid_at DATETIME
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_members_device ON members(device_id);
CREATE INDEX IF NOT EXISTS idx_members_active ON members(is_active);
CREATE INDEX IF NOT EXISTS idx_keys_status ON license_keys(status);
CREATE INDEX IF NOT EXISTS idx_keys_value ON license_keys(key_value);
CREATE INDEX IF NOT EXISTS idx_usage_device ON usage_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_usage_date ON usage_logs(used_at);
