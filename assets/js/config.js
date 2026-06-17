// 公共配置 - 不包含敏感信息
const SITE_CONFIG = {
  // 站点信息
  SITE_NAME: "教师工具站",
  VERSION: "2.0.0",

  // 存储键名（前端使用）
  STORAGE: {
    LICENSE: "teacher_pro_license",
    USAGE: "cloudTextUsage",
    ADMIN_AUTH: "admin_auth_session"
  },

  // API 端点 - 自动检测环境
  // 本地开发时使用相对路径（需要代理或本地 API）
  // 生产环境使用完整 URL
  API_BASE: (() => {
    const host = location.hostname;
    // 本地开发
    if (host === 'localhost' || host === '127.0.0.1' || host === '') {
      return '/api';
    }
    // 生产环境 - Cloudflare Workers URL
    // TODO: 部署后替换为实际的 Worker URL
    return 'https://teacher-tools-api.YOUR-SUBDOMAIN.workers.dev/api';
  })(),

  // 会员类型
  MEMBER_TYPES: {
    FREE: "free",
    TRIAL: "trial",
    MONTHLY: "monthly",
    PERMANENT: "permanent"
  }
};

// 防止被直接修改
Object.freeze(SITE_CONFIG);
Object.freeze(SITE_CONFIG.STORAGE);
Object.freeze(SITE_CONFIG.MEMBER_TYPES);
