1|/**
2| * 教师工具站 API - Cloudflare Worker
3| *
4| * 环境变量配置：
5| * - ADMIN_KEY: 管理员 API 密钥
6| * - JWT_SECRET: JWT 签名密钥
7| *
8| * D1 数据库绑定：
9| * - DB: D1 数据库实例
10| */
11|
12|// ================= 配置 =================
13|function getCorsHeaders(env) {
14|  const origin = env.ALLOWED_ORIGIN || '*'; // 生产环境务必设置 ALLOWED_ORIGIN
15|  return {
16|    'Access-Control-Allow-Origin': origin,
17|    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
18|    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
19|  };
20|}
21|
22|// ================= 工具函数 =================
23|
24|// 简单的 JWT 实现（生产环境建议使用成熟的库）
25|async function generateToken(payload, secret, expiresIn = 30 * 24 * 60 * 60) {
26|  const header = { alg: 'HS256', typ: 'JWT' };
27|  const now = Math.floor(Date.now() / 1000);
28|  const tokenPayload = {
29|    ...payload,
30|    iat: now,
31|    exp: now + expiresIn,
32|  };
33|
34|  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '');
35|  const payloadB64 = btoa(JSON.stringify(tokenPayload)).replace(/=/g, '');
36|  const message = `${headerB64}.${payloadB64}`;
37|
38|  const key = await crypto.subtle.importKey(
39|    'raw',
40|    new TextEncoder().encode(secret),
41|    { name: 'HMAC', hash: 'SHA-256' },
42|    false,
43|    ['sign']
44|  );
45|
46|  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
47|  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
48|    .replace(/\+/g, '-')
49|    .replace(/\//g, '_')
50|    .replace(/=/g, '');
51|
52|  return `${message}.${sigB64}`;
53|}
54|
55|async function verifyToken(token, secret) {
56|  try {
57|    const parts = token.split('.');
58|    if (parts.length !== 3) return null;
59|
60|    const [headerB64, payloadB64, sigB64] = parts;
61|    const message = `${headerB64}.${payloadB64}`;
62|
63|    const key = await crypto.subtle.importKey(
64|      'raw',
65|      new TextEncoder().encode(secret),
66|      { name: 'HMAC', hash: 'SHA-256' },
67|      false,
68|      ['verify']
69|    );
70|
71|    const sigStr = sigB64.replace(/-/g, '+').replace(/_/g, '/');
72|    const padded = sigStr + '='.repeat((4 - sigStr.length % 4) % 4);
73|    const sigBytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0));
74|
75|    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(message));
76|    if (!valid) return null;
77|
78|    const payloadStr = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
79|    const paddedPayload = payloadStr + '='.repeat((4 - payloadStr.length % 4) % 4);
80|    const payload = JSON.parse(atob(paddedPayload));
81|
82|    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
83|      return null; // Token 已过期
84|    }
85|
86|    return payload;
87|  } catch (e) {
88|    return null;
89|  }
90|}
91|
92|function generateDeviceId(request) {
93|  const ua = request.headers.get('User-Agent') || '';
94|  const ip = request.headers.get('CF-Connecting-IP') || '';
95|  const raw = `${ua}:${ip}:${Date.now()}`;
96|
97|  // 简单哈希
98|  let hash = 0;
99|  for (let i = 0; i < raw.length; i++) {
100|    const char = raw.charCodeAt(i);
101|    hash = ((hash << 5) - hash) + char;
102|    hash = hash & hash;
103|  }
104|  return 'dev_' + Math.abs(hash).toString(36);
105|}
106|
107|function jsonResponse(data, status = 200, corsHeaders = {}) {
108|  return new Response(JSON.stringify(data), {
109|    status,
110|    headers: {
111|      'Content-Type': 'application/json',
112|      ...corsHeaders,
113|    },
114|  });
115|}
116|
117|// ================= 路由处理 =================
118|
119|async function handleRequest(request, env) {
120|  const url = new URL(request.url);
121|  const path = url.pathname;
122|  const method = request.method;
123|  const CORS = getCorsHeaders(env);
124|
125|  // 处理 CORS 预检请求
126|  if (method === 'OPTIONS') {
127|    return new Response(null, { headers: CORS });
128|  }
129|
130|  // 必须通过环境变量配置密钥，不提供 fallback
131|  const adminKey = env.ADMIN_KEY;
132|  const jwtSecret = env.JWT_SECRET;
133|
134|  if (!jwtSecret) {
135|    return jsonResponse({ error: '服务端未配置 JWT_SECRET' }, 500, CORS);
136|  }
137|
138|  try {
139|    // 局部 JSON 响应函数，自动携带 CORS 头
140|    const json = (data, status) => jsonResponse(data, status, CORS);
141|
142|    // 路由匹配
143|    if (path === '/api/activate' && method === 'POST') {
144|      return await handleActivate(request, env, jwtSecret, json);
145|    }
146|
147|    if (path === '/api/check' && method === 'GET') {
148|      return await handleCheck(request, env, jwtSecret, json);
149|    }
150|
151|    if (path === '/api/usage' && method === 'POST') {
152|      return await handleUsage(request, env, jwtSecret, json);
153|    }
154|
155|    // 管理员接口
156|    if (path.startsWith('/api/admin/')) {
157|      if (!adminKey) {
158|        return json({ error: '管理员密钥未配置' }, 500);
159|      }
160|      const authHeader = request.headers.get('Authorization');
161|      if (!authHeader || authHeader !== `Bearer ${adminKey}`) {
162|        return json({ error: '未授权访问' }, 401);
163|      }
164|
165|      if (path === '/api/admin/keys' && method === 'POST') {
166|        return await handleGenerateKeys(request, env, json);
167|      }
168|
169|      if (path === '/api/admin/keys' && method === 'GET') {
170|        return await handleListKeys(request, env, json);
171|      }
172|
173|      if (path === '/api/admin/members' && method === 'GET') {
174|        return await handleListMembers(request, env, json);
175|      }
176|
177|      if (path === '/api/admin/stats' && method === 'GET') {
178|        return await handleStats(request, env, json);
179|      }
180|    }
181|
182|    return json({ error: '接口不存在' }, 404);
183|
184|  } catch (error) {
185|    console.error('API Error:', error);
186|    return jsonResponse({ error: '服务器内部错误' }, 500, CORS);
187|  }
188|}
189|
190|// ================= 业务逻辑 =================
191|
192|// 激活卡密
193|async function handleActivate(request, env, jwtSecret, json) {
194|  const { key } = await request.json();
195|
196|  if (!key || !key.startsWith('TEACHERPRO-')) {
197|    return json({ success: false, error: '卡密格式错误' });
198|  }
199|
200|  const db = env.DB;
201|  const deviceId = generateDeviceId(request);
202|
203|  // 查询卡密
204|  const licenseKey = await db.prepare(
205|    'SELECT * FROM license_keys WHERE key_value = ?'
206|  ).bind(key).first();
207|
208|  if (!licenseKey) {
209|    return json({ success: false, error: '卡密不存在' });
210|  }
211|
212|  if (licenseKey.status === 'used') {
213|    return json({ success: false, error: '卡密已被使用' });
214|  }
215|
216|  if (licenseKey.expires_at && new Date(licenseKey.expires_at) < new Date()) {
217|    return json({ success: false, error: '卡密已过期' });
218|  }
219|
220|  // 计算会员到期时间
221|  let expiryAt = null;
222|  const now = new Date();
223|
224|  switch (licenseKey.key_type) {
225|    case 'trial':
226|      expiryAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
227|      break;
228|    case 'monthly':
229|      expiryAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
230|      break;
231|    case 'permanent':
232|      expiryAt = null; // 永久
233|      break;
234|  }
235|
236|  // 开始事务
237|  await db.batch([
238|    // 更新卡密状态
239|    db.prepare(
240|      'UPDATE license_keys SET status = ?, used_at = CURRENT_TIMESTAMP, used_by_device = ? WHERE id = ?'
241|    ).bind('used', deviceId, licenseKey.id),
242|
243|    // 创建或更新会员
244|    db.prepare(`
245|      INSERT INTO members (device_id, member_type, activated_at, expiry_at, is_active, source, key_used)
246|      VALUES (?, ?, CURRENT_TIMESTAMP, ?, 1, 'key', ?)
247|      ON CONFLICT(device_id) DO UPDATE SET
248|        member_type = excluded.member_type,
249|        activated_at = CURRENT_TIMESTAMP,
250|        expiry_at = excluded.expiry_at,
251|        is_active = 1,
252|        key_used = excluded.key_used,
253|        updated_at = CURRENT_TIMESTAMP
254|    `).bind(deviceId, licenseKey.key_type, expiryAt ? expiryAt.toISOString() : null, key),
255|  ]);
256|
257|  // 生成 JWT Token
258|  const token = await generateToken(
259|    {
260|      deviceId,
261|      memberType: licenseKey.key_type,
262|      expiry: expiryAt ? expiryAt.toISOString() : null,
263|    },
264|    jwtSecret,
265|    licenseKey.key_type === 'permanent' ? 365 * 24 * 60 * 60 : 30 * 24 * 60 * 60
266|  );
267|
268|  // 计算剩余天数
269|  const daysLeft = expiryAt
270|    ? Math.ceil((expiryAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
271|    : null;
272|
273|  return json({
274|    success: true,
275|    token,
276|    member: {
277|      type: licenseKey.key_type,
278|      expiry: expiryAt ? expiryAt.toISOString() : null,
279|      daysLeft,
280|      isActive: true,
281|    },
282|  });
283|}
284|
285|// 检查会员状态
286|async function handleCheck(request, env, jwtSecret, json) {
287|  const authHeader = request.headers.get('Authorization');
288|  if (!authHeader || !authHeader.startsWith('Bearer ')) {
289|    return json({ success: false, error: '未提供认证信息' });
290|  }
291|
292|  const token = authHeader.substring(7);
293|  const payload = await verifyToken(token, jwtSecret);
294|
295|  if (!payload) {
296|    return json({ success: false, error: 'Token 无效或已过期' });
297|  }
298|
299|  const db = env.DB;
300|  const member = await db.prepare(
301|    'SELECT * FROM members WHERE device_id = ? AND is_active = 1'
302|  ).bind(payload.deviceId).first();
303|
304|  if (!member) {
305|    return json({ success: true, member: null });
306|  }
307|
308|  const now = new Date();
309|  const expiry = member.expiry_at ? new Date(member.expiry_at) : null;
310|  const isActive = !expiry || expiry > now;
311|  const daysLeft = expiry ? Math.ceil((expiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)) : null;
312|
313|  // 如果会员已过期，更新状态
314|  if (!isActive) {
315|    await db.prepare(
316|      'UPDATE members SET is_active = 0 WHERE id = ?'
317|    ).bind(member.id).run();
318|  }
319|
320|  return json({
321|    success: true,
322|    member: {
323|      type: member.member_type,
324|      expiry: member.expiry_at,
325|      daysLeft,
326|      isActive,
327|    },
328|  });
329|}
330|
331|// 记录使用
332|async function handleUsage(request, env, jwtSecret, json) {
333|  const authHeader = request.headers.get('Authorization');
334|  if (!authHeader || !authHeader.startsWith('Bearer ')) {
335|    return json({ success: false, error: '未提供认证信息' });
336|  }
337|
338|  const token = authHeader.substring(7);
339|  const payload = await verifyToken(token, jwtSecret);
340|
341|  if (!payload) {
342|    return json({ success: false, error: 'Token 无效' });
343|  }
344|
345|  const { feature } = await request.json();
346|  const db = env.DB;
347|
348|  await db.prepare(
349|    'INSERT INTO usage_logs (device_id, feature) VALUES (?, ?)'
350|  ).bind(payload.deviceId, feature).run();
351|
352|  return json({ success: true });
353|}
354|
355|// 管理员：批量生成卡密
356|async function handleGenerateKeys(request, env, json) {
357|  const { type, count, note } = await request.json();
358|
359|  if (!type || !count || count < 1 || count > 100) {
360|    return json({ error: '参数错误' }, 400);
361|  }
362|
363|  const db = env.DB;
364|  const keys = [];
365|
366|  for (let i = 0; i < count; i++) {
367|    const keyData = {
368|      t: type,
369|      i: Date.now(),
370|      e: type === 'permanent' ? null : Date.now() + (type === 'trial' ? 7 : 30) * 24 * 60 * 60 * 1000,
371|      d: Math.random().toString(36).substring(2, 10),
372|    };
373|
374|    // 生成签名
375|    const secret = env.JWT_SECRET || 'default-secret';
376|    const signData = JSON.stringify(keyData);
377|    const enc = new TextEncoder();
378|    const key = await crypto.subtle.importKey(
379|      'raw',
380|      enc.encode(secret),
381|      { name: 'HMAC', hash: 'SHA-256' },
382|      false,
383|      ['sign']
384|    );
385|    const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(signData));
386|    keyData.s = Array.from(new Uint8Array(sigBuffer))
387|      .map(b => b.toString(16).padStart(2, '0'))
388|      .join('');
389|
390|    const keyValue = `TEACHERPRO-${btoa(JSON.stringify(keyData))}`;
391|
392|    // 计算卡密过期时间（30天后自动失效）
393|    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
394|
395|    await db.prepare(
396|      'INSERT INTO license_keys (key_value, key_type, note, expires_at) VALUES (?, ?, ?, ?)'
397|    ).bind(keyValue, type, note || null, expiresAt.toISOString()).run();
398|
399|    keys.push({
400|      key: keyValue,
401|      type,
402|      createdAt: new Date().toISOString(),
403|    });
404|  }
405|
406|  return json({ success: true, keys, count: keys.length });
407|}
408|
409|// 管理员：获取卡密列表
410|async function handleListKeys(request, env, json) {
411|  const url = new URL(request.url);
412|  const status = url.searchParams.get('status');
413|  const limit = parseInt(url.searchParams.get('limit') || '100');
414|  const offset = parseInt(url.searchParams.get('offset') || '0');
415|
416|  const db = env.DB;
417|
418|  let query = 'SELECT * FROM license_keys';
419|  const params = [];
420|
421|  if (status && status !== 'all') {
422|    query += ' WHERE status = ?';
423|    params.push(status);
424|  }
425|
426|  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
427|  params.push(limit, offset);
428|
429|  const keys = await db.prepare(query).bind(...params).all();
430|
431|  return json({
432|    success: true,
433|    keys: keys.results,
434|    total: keys.results.length,
435|  });
436|}
437|
438|// 管理员：获取会员列表
439|async function handleListMembers(request, env, json) {
440|  const db = env.DB;
441|
442|  const members = await db.prepare(
443|    'SELECT * FROM members ORDER BY created_at DESC LIMIT 100'
444|  ).all();
445|
446|  return json({
447|    success: true,
448|    members: members.results,
449|  });
450|}
451|
452|// 管理员：获取统计数据
453|async function handleStats(request, env, json) {
454|  const db = env.DB;
455|
456|  const [totalMembers, unusedKeys, todayActivations] = await Promise.all([
457|    db.prepare('SELECT COUNT(*) as count FROM members WHERE is_active = 1').first(),
458|    db.prepare("SELECT COUNT(*) as count FROM license_keys WHERE status = 'unused'").first(),
459|    db.prepare("SELECT COUNT(*) as count FROM members WHERE DATE(activated_at) = DATE('now')").first(),
460|  ]);
461|
462|  return json({
463|    success: true,
464|    stats: {
465|      totalMembers: totalMembers.count,
466|      unusedKeys: unusedKeys.count,
467|      todayActivations: todayActivations.count,
468|    },
469|  });
470|}
471|
472|// ================= Worker 入口 =================
473|export default {
474|  async fetch(request, env, ctx) {
475|    return handleRequest(request, env);
476|  },
477|};
478|