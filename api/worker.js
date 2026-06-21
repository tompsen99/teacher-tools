/**
 * 教师工具站 API - Cloudflare Worker
 *
 * 环境变量配置：
 * - ADMIN_KEY: 管理员 API 密钥
 * - JWT_SECRET: JWT 签名密钥
 *
 * D1 数据库绑定：
 * - DB: D1 数据库实例
 */

// ================= 配置 =================
function getCorsHeaders(env) {
  const origin = env.ALLOWED_ORIGIN || '*'; // 生产环境务必设置 ALLOWED_ORIGIN
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// ================= 工具函数 =================

// 简单的 JWT 实现（生产环境建议使用成熟的库）
async function generateToken(payload, secret, expiresIn = 30 * 24 * 60 * 60) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn,
  };

  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '');
  const payloadB64 = btoa(JSON.stringify(tokenPayload)).replace(/=/g, '');
  const message = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${message}.${sigB64}`;
}

async function verifyToken(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;
    const message = `${headerB64}.${payloadB64}`;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigStr = sigB64.replace(/-/g, '+').replace(/_/g, '/');
    const padded = sigStr + '='.repeat((4 - sigStr.length % 4) % 4);
    const sigBytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0));

    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(message));
    if (!valid) return null;

    const payloadStr = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = payloadStr + '='.repeat((4 - payloadStr.length % 4) % 4);
    const payload = JSON.parse(atob(paddedPayload));

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token 已过期
    }

    return payload;
  } catch (e) {
    return null;
  }
}

function generateDeviceId(request) {
  const ua = request.headers.get('User-Agent') || '';
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const raw = `${ua}:${ip}`;
  // 简单哈希（不含时间戳，同一浏览器+IP 生成相同 ID）
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'dev_' + Math.abs(hash).toString(36);
}

function jsonResponse(data, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

// ================= 路由处理 =================

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  const CORS = getCorsHeaders(env);

  // 处理 CORS 预检请求
  if (method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  // 必须通过环境变量配置密钥，不提供 fallback
  const adminKey = env.ADMIN_KEY;
  const jwtSecret = env.JWT_SECRET;

  if (!jwtSecret) {
    return jsonResponse({ error: '服务端未配置 JWT_SECRET' }, 500, CORS);
  }

  try {
    // 局部 JSON 响应函数，自动携带 CORS 头
    const json = (data, status) => jsonResponse(data, status, CORS);

    // 路由匹配
    if (path === '/api/activate' && method === 'POST') {
      return await handleActivate(request, env, jwtSecret, json);
    }

    if (path === '/api/check' && method === 'GET') {
      return await handleCheck(request, env, jwtSecret, json);
    }

    if (path === '/api/usage' && method === 'POST') {
      return await handleUsage(request, env, jwtSecret, json);
    }

    // 管理员登录（不需要 ADMIN_KEY 验证）
    if (path === '/api/admin/login' && method === 'POST') {
      return await handleAdminLogin(request, env, jwtSecret, json);
    }

    // 管理员接口
    if (path.startsWith('/api/admin/')) {
      if (!adminKey) {
        return json({ error: '管理员密钥未配置' }, 500);
      }
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return json({ error: '未授权访问' }, 401);
      }
      const token = authHeader.substring(7);

      // 支持两种认证方式：ADMIN_KEY 直接匹配 或 JWT 管理 Token
      const isAdminKey = token === adminKey;
      let isJwtAdmin = false;
      if (!isAdminKey) {
        const payload = await verifyToken(token, jwtSecret);
        isJwtAdmin = payload && payload.role === 'admin';
      }
      if (!isAdminKey && !isJwtAdmin) {
        return json({ error: '未授权访问' }, 401);
      }

      if (path === '/api/admin/keys' && method === 'POST') {
        return await handleGenerateKeys(request, env, json);
      }

      if (path === '/api/admin/keys' && method === 'GET') {
        return await handleListKeys(request, env, json);
      }

      if (path === '/api/admin/keys' && method === 'DELETE') {
        return await handleDeleteKey(request, env, json);
      }

      if (path === '/api/admin/members' && method === 'GET') {
        return await handleListMembers(request, env, json);
      }

      if (path === '/api/admin/members' && method === 'DELETE') {
        return await handleDeleteMember(request, env, json);
      }

      if (path === '/api/admin/stats' && method === 'GET') {
        return await handleStats(request, env, json);
      }
    }

    return json({ error: '接口不存在' }, 404);

  } catch (error) {
    console.error('API Error:', error);
    return jsonResponse({ error: '服务器内部错误' }, 500, CORS);
  }
}

// ================= 业务逻辑 =================

// 激活卡密
async function handleActivate(request, env, jwtSecret, json) {
  const { key, deviceId: clientDeviceId } = await request.json();

  if (!key || !key.startsWith('TEACHERPRO-')) {
    return json({ success: false, error: '卡密格式错误' });
  }

  const db = env.DB;
  // 优先使用客户端提供的设备 ID（浏览器指纹），否则用服务端生成的
  const deviceId = clientDeviceId || generateDeviceId(request);

  // 查询卡密
  const licenseKey = await db.prepare(
    'SELECT * FROM license_keys WHERE key_value = ?'
  ).bind(key).first();

  if (!licenseKey) {
    return json({ success: false, error: '卡密不存在' });
  }

  if (licenseKey.status === 'used') {
    return json({ success: false, error: '卡密已被使用' });
  }

  if (licenseKey.expires_at && new Date(licenseKey.expires_at) < new Date()) {
    return json({ success: false, error: '卡密已过期' });
  }

  // 计算会员到期时间
  let expiryAt = null;
  const now = new Date();

  switch (licenseKey.key_type) {
    case 'trial':
      expiryAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;
    case 'monthly':
      expiryAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      break;
    case 'permanent':
      expiryAt = null; // 永久
      break;
  }

  // 开始事务
  await db.batch([
    // 更新卡密状态
    db.prepare(
      'UPDATE license_keys SET status = ?, used_at = CURRENT_TIMESTAMP, used_by_device = ? WHERE id = ?'
    ).bind('used', deviceId, licenseKey.id),

    // 创建或更新会员
    db.prepare(`
      INSERT INTO members (device_id, member_type, activated_at, expiry_at, is_active, source, key_used)
      VALUES (?, ?, CURRENT_TIMESTAMP, ?, 1, 'key', ?)
      ON CONFLICT(device_id) DO UPDATE SET
        member_type = excluded.member_type,
        activated_at = CURRENT_TIMESTAMP,
        expiry_at = excluded.expiry_at,
        is_active = 1,
        key_used = excluded.key_used,
        updated_at = CURRENT_TIMESTAMP
    `).bind(deviceId, licenseKey.key_type, expiryAt ? expiryAt.toISOString() : null, key),
  ]);

  // 生成 JWT Token
  const token = await generateToken(
    {
      deviceId,
      memberType: licenseKey.key_type,
      expiry: expiryAt ? expiryAt.toISOString() : null,
    },
    jwtSecret,
    licenseKey.key_type === 'permanent' ? 365 * 24 * 60 * 60 : 30 * 24 * 60 * 60
  );

  // 计算剩余天数
  const daysLeft = expiryAt
    ? Math.ceil((expiryAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
    : null;

  return json({
    success: true,
    token,
    member: {
      type: licenseKey.key_type,
      expiry: expiryAt ? expiryAt.toISOString() : null,
      daysLeft,
      isActive: true,
    },
  });
}

// 检查会员状态
async function handleCheck(request, env, jwtSecret, json) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return json({ success: false, error: '未提供认证信息', code: 'NO_TOKEN' });
  }

  const token = authHeader.substring(7);
  const payload = await verifyToken(token, jwtSecret);

  if (!payload) {
    return json({ success: false, error: 'Token 无效或已过期', code: 'INVALID_TOKEN' });
  }

  if (!payload.deviceId) {
    return json({ success: false, error: 'Token 格式错误', code: 'BAD_PAYLOAD' });
  }

  const db = env.DB;
  const member = await db.prepare(
    'SELECT * FROM members WHERE device_id = ? AND is_active = 1'
  ).bind(payload.deviceId).first();

  if (!member) {
    return json({ success: true, member: null, deviceId: payload.deviceId });
  }

  const now = new Date();
  const expiry = member.expiry_at ? new Date(member.expiry_at) : null;
  const isActive = !expiry || expiry > now;
  const daysLeft = expiry ? Math.ceil((expiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)) : null;

  // 如果会员已过期，更新状态
  if (!isActive) {
    await db.prepare(
      'UPDATE members SET is_active = 0 WHERE id = ?'
    ).bind(member.id).run();
  }

  return json({
    success: true,
    member: {
      type: member.member_type,
      expiry: member.expiry_at,
      daysLeft,
      isActive,
    },
  });
}

// 记录使用
async function handleUsage(request, env, jwtSecret, json) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return json({ success: false, error: '未提供认证信息' });
  }

  const token = authHeader.substring(7);
  const payload = await verifyToken(token, jwtSecret);

  if (!payload) {
    return json({ success: false, error: 'Token 无效' });
  }

  const { feature } = await request.json();
  const db = env.DB;

  await db.prepare(
    'INSERT INTO usage_logs (device_id, feature) VALUES (?, ?)'
  ).bind(payload.deviceId, feature).run();

  return json({ success: true });
}

// 管理员：批量生成卡密
async function handleGenerateKeys(request, env, json) {
  const { type, count, note } = await request.json();

  if (!type || !count || count < 1 || count > 100) {
    return json({ error: '参数错误' }, 400);
  }

  const db = env.DB;
  const keys = [];

  for (let i = 0; i < count; i++) {
    const keyData = {
      t: type,
      i: Date.now(),
      e: type === 'permanent' ? null : Date.now() + (type === 'trial' ? 7 : 30) * 24 * 60 * 60 * 1000,
      d: Math.random().toString(36).substring(2, 10),
    };

    // 生成签名
    const secret = env.JWT_SECRET || 'default-secret';
    const signData = JSON.stringify(keyData);
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(signData));
    keyData.s = Array.from(new Uint8Array(sigBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const keyValue = `TEACHERPRO-${btoa(JSON.stringify(keyData))}`;

    // 计算卡密过期时间（30天后自动失效）
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.prepare(
      'INSERT INTO license_keys (key_value, key_type, note, expires_at) VALUES (?, ?, ?, ?)'
    ).bind(keyValue, type, note || null, expiresAt.toISOString()).run();

    keys.push({
      key: keyValue,
      type,
      createdAt: new Date().toISOString(),
    });
  }

  return json({ success: true, keys, count: keys.length });
}

// 管理员：获取卡密列表
async function handleListKeys(request, env, json) {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const limit = parseInt(url.searchParams.get('limit') || '100');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  const db = env.DB;

  let query = 'SELECT * FROM license_keys';
  const params = [];

  if (status && status !== 'all') {
    query += ' WHERE status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const keys = await db.prepare(query).bind(...params).all();

  return json({
    success: true,
    keys: keys.results,
    total: keys.results.length,
  });
}

// 管理员登录（密码验证在后端，密码哈希存在 Cloudflare 环境变量）
async function handleAdminLogin(request, env, jwtSecret, json) {
  const { password } = await request.json();

  if (!password) {
    return json({ success: false, error: '请输入密码' }, 400);
  }

  // 管理密码哈希存在环境变量 ADMIN_PWD_HASH 中
  const storedHash = env.ADMIN_PWD_HASH;
  if (!storedHash) {
    return json({ success: false, error: '服务端未配置管理密码' }, 500);
  }

  // 计算输入密码的 SHA-256 哈希
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(password));
  const inputHash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  if (inputHash !== storedHash) {
    return json({ success: false, error: '密码错误' }, 401);
  }

  // 生成管理会话 Token（有效期 2 小时）
  const token = await generateToken(
    { role: 'admin', iat: Date.now() },
    jwtSecret,
    2 * 60 * 60 // 2小时
  );

  return json({ success: true, token });
}

// 管理员：删除卡密 + 吊销关联会员
async function handleDeleteKey(request, env, json) {
  const { keyValue } = await request.json();

  if (!keyValue) {
    return json({ error: '缺少卡密值' }, 400);
  }

  const db = env.DB;

  // 先查询卡密信息
  const key = await db.prepare(
    'SELECT * FROM license_keys WHERE key_value = ?'
  ).bind(keyValue).first();

  if (!key) {
    return json({ error: '卡密不存在' }, 404);
  }

  // 如果卡密已被使用，吊销关联的会员
  if (key.status === 'used' && key.used_by_device) {
    await db.prepare(
      'UPDATE members SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE key_used = ? OR device_id = ?'
    ).bind(keyValue, key.used_by_device).run();
  }

  // 删除卡密
  await db.prepare(
    'DELETE FROM license_keys WHERE key_value = ?'
  ).bind(keyValue).run();

  return json({
    success: true,
    message: key.status === 'used'
      ? '卡密已删除，关联会员已吊销'
      : '卡密已删除',
    revoked: key.status === 'used'
  });
}

// 管理员：获取会员列表
async function handleListMembers(request, env, json) {
  const db = env.DB;

  const members = await db.prepare(
    'SELECT * FROM members ORDER BY created_at DESC LIMIT 100'
  ).all();

  return json({
    success: true,
    members: members.results,
  });
}

// 管理员：删除/吊销会员
async function handleDeleteMember(request, env, json) {
  const { deviceId } = await request.json();

  if (!deviceId) {
    return json({ error: '缺少设备ID' }, 400);
  }

  const db = env.DB;

  // 将会员设为无效
  const result = await db.prepare(
    'UPDATE members SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE device_id = ?'
  ).bind(deviceId).run();

  if (result.meta.changes === 0) {
    return json({ error: '会员不存在' }, 404);
  }

  return json({ success: true, message: '会员已吊销' });
}

// 管理员：获取统计数据
async function handleStats(request, env, json) {
  const db = env.DB;

  const [totalMembers, unusedKeys, todayActivations] = await Promise.all([
    db.prepare('SELECT COUNT(*) as count FROM members WHERE is_active = 1').first(),
    db.prepare("SELECT COUNT(*) as count FROM license_keys WHERE status = 'unused'").first(),
    db.prepare("SELECT COUNT(*) as count FROM members WHERE DATE(activated_at) = DATE('now')").first(),
  ]);

  return json({
    success: true,
    stats: {
      totalMembers: totalMembers.count,
      unusedKeys: unusedKeys.count,
      todayActivations: todayActivations.count,
    },
  });
}

// ================= Worker 入口 =================
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  },
};
