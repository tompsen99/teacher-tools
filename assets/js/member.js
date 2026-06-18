/**
 * 会员验证模块 v2.0
 * 使用服务端验证，防止本地篡改
 */
class MemberManager {
  constructor() {
    this.token = localStorage.getItem(SITE_CONFIG.STORAGE.LICENSE);
    this.memberData = null;
    this.isPro = false;
    this.init();
  }

  // 初始化，检查本地缓存的会员状态
  async init() {
    if (this.token) {
      try {
        await this.checkStatus();
      } catch (e) {
        console.warn('会员状态检查失败:', e);
        this.clearLocal();
      }
    }
  }

  // 激活卡密
  async activate(key) {
    key = key.trim();

    // 基础格式验证
    if (!key.startsWith('TEACHERPRO-')) {
      return { ok: false, msg: '❌ 卡密格式错误' };
    }

    try {
      const response = await fetch(`${SITE_CONFIG.API_BASE}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });

      const data = await response.json();

      if (data.success) {
        this.token = data.token;
        this.memberData = data.member;
        this.isPro = true;
        localStorage.setItem(SITE_CONFIG.STORAGE.LICENSE, this.token);
        return {
          ok: true,
          msg: data.member.type === 'permanent'
            ? '✅ 永久会员激活成功！'
            : `✅ ${data.member.daysLeft}天会员激活成功！`
        };
      } else {
        return { ok: false, msg: `❌ ${data.error}` };
      }
    } catch (e) {
      // 离线模式：降级到本地验证（可选）
      console.warn('服务端验证失败，尝试离线验证:', e);
      return { ok: false, msg: '❌ 网络错误，请检查网络连接' };
    }
  }

  // 检查会员状态
  async checkStatus() {
    if (!this.token) {
      this.isPro = false;
      return { isPro: false, type: 'free' };
    }

    try {
      const response = await fetch(`${SITE_CONFIG.API_BASE}/check`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      const data = await response.json();

      if (data.success && data.member) {
        this.memberData = data.member;
        this.isPro = data.member.isActive;

        // 如果会员过期，清除本地
        if (!this.isPro) {
          this.clearLocal();
        }

        return {
          isPro: this.isPro,
          type: data.member.type,
          daysLeft: data.member.daysLeft,
          expiry: data.member.expiry
        };
      } else {
        this.clearLocal();
        return { isPro: false, type: 'free' };
      }
    } catch (e) {
      // 离线时使用缓存的过期时间
      if (this.memberData && this.memberData.expiry) {
        const now = Date.now();
        const expiry = new Date(this.memberData.expiry).getTime();
        this.isPro = expiry > now;
        return {
          isPro: this.isPro,
          type: this.memberData.type,
          daysLeft: Math.max(0, Math.ceil((expiry - now) / 86400000))
        };
      }
      throw e;
    }
  }

  // 获取每日使用限制
  async getUsageLimit(feature) {
    // 检查管理后台覆盖：如果当前工具设为"免费"，直接返回无限
    if (this._isCurrentToolFree()) {
      return { allowed: true, remaining: Infinity };
    }

    if (this.isPro) {
      return { allowed: true, remaining: Infinity };
    }

    const usageKey = `${SITE_CONFIG.STORAGE.USAGE}_${feature}`;
    const today = new Date().toISOString().slice(0, 10);
    let usage = JSON.parse(localStorage.getItem(usageKey) || '{}');

    // 重置每日计数
    if (usage.date !== today) {
      usage = { date: today, count: 0 };
    }

    const limit = 1; // 免费用户每日限制
    const remaining = Math.max(0, limit - usage.count);

    return {
      allowed: remaining > 0,
      remaining,
      limit
    };
  }

  // 检查当前工具是否被管理后台设为免费
  _isCurrentToolFree() {
    try {
      const overrides = JSON.parse(localStorage.getItem('tool_pro_overrides') || '{}');
      const currentFile = window.location.pathname.split('/').pop();
      return overrides[currentFile] === 'none';
    } catch (e) {
      return false;
    }
  }

  // 工具页面应使用此方法代替直接检查 isPro
  // 如果管理后台把工具设为免费，即使不是会员也返回 true
  isToolAccessible() {
    return this.isPro || this._isCurrentToolFree();
  }

  // 记录使用
  async recordUsage(feature) {
    const usageKey = `${SITE_CONFIG.STORAGE.USAGE}_${feature}`;
    const today = new Date().toISOString().slice(0, 10);
    let usage = JSON.parse(localStorage.getItem(usageKey) || '{}');

    if (usage.date !== today) {
      usage = { date: today, count: 0 };
    }

    usage.count++;
    localStorage.setItem(usageKey, JSON.stringify(usage));

    // 同步到服务端（可选）
    if (this.token) {
      try {
        await fetch(`${SITE_CONFIG.API_BASE}/usage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
          },
          body: JSON.stringify({ feature })
        });
      } catch (e) {
        // 静默失败
      }
    }
  }

  // 清除本地数据
  clearLocal() {
    localStorage.removeItem(SITE_CONFIG.STORAGE.LICENSE);
    this.token = null;
    this.memberData = null;
    this.isPro = false;
  }

  // 获取会员状态显示文本
  getStatusText() {
    if (!this.memberData || !this.isPro) {
      return { text: '🔒 游客', class: 'status-free' };
    }

    switch (this.memberData.type) {
      case 'permanent':
        return { text: '👑 永久会员', class: 'status-pro' };
      case 'monthly':
        return { text: `👑 会员 (${this.memberData.daysLeft}天)`, class: 'status-pro' };
      case 'trial':
        return { text: `⏱️ 试用 (${this.memberData.daysLeft}天)`, class: 'status-trial' };
      default:
        return { text: '🔒 游客', class: 'status-free' };
    }
  }
}

// 创建全局实例
const member = new MemberManager();

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MemberManager, member };
}
