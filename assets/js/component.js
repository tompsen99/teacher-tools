/**
 * 教师工具站 - 共享 UI 组件库
 * 版本: 1.0.0
 *
 * 依赖:
 *   - config.js (SITE_CONFIG)
 *   - member.js (member)
 *   - theme.css (CSS classes)
 *   - FontAwesome CDN (icons)
 *
 * 使用方法:
 *   1. 在 <head> 中引入: <link rel="stylesheet" href="../assets/css/theme.css">
 *   2. 在 </body> 前依次引入:
 *      <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"></script>
 *      <script src="../assets/js/config.js"></script>
 *      <script src="../assets/js/member.js"></script>
 *      <script src="../assets/js/component.js"></script>
 *   3. 在 body 中放置占位元素:
 *      <div id="app-navbar"></div>
 *      <!-- 页面内容 -->
 *      <div id="app-footer"></div>
 *      <div id="app-modal"></div>
 *   4. 在 <script> 中调用:
 *      initPage({ title: '工具名称', icon: 'fa-icon-name' });
 *
 * 完整示例:
 *   <!DOCTYPE html>
 *   <html lang="zh-CN">
 *   <head>
 *     <meta charset="UTF-8">
 *     <meta name="viewport" content="width=device-width, initial-scale=1.0">
 *     <title>我的工具 | 教师工具站</title>
 *     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
 *     <link rel="stylesheet" href="../assets/css/theme.css">
 *     <script src="../assets/js/config.js"></script>
 *     <script src="../assets/js/member.js"></script>
 *     <script src="../assets/js/component.js"></script>
 *   </head>
 *   <body>
 *     <div id="app-navbar"></div>
 *     <div class="workspace">...</div>
 *     <div id="app-footer"></div>
 *     <div id="app-modal"></div>
 *     <script>
 *       initPage({ title: '我的工具', icon: 'fa-star' });
 *       // ... 页面逻辑
 *     </script>
 *   </body>
 *   </html>
 */

const PageComponents = (() => {

  /**
   * 渲染导航栏 HTML
   * @param {Object} options
   * @param {string} options.title - 工具名称
   * @param {string} options.icon - FontAwesome 图标类名 (不含 fa- 前缀的也可以)
   * @param {boolean} [options.showMemberStatus=true] - 是否显示会员状态
   * @param {string} [options.extraLeft=''] - 导航栏左侧额外 HTML (如页面标签)
   * @returns {string} HTML 字符串
   */
  function renderNavbar(options = {}) {
    const {
      title = SITE_CONFIG.SITE_NAME,
      icon = 'fa-tools',
      showMemberStatus = true,
      extraLeft = ''
    } = options;

    // 确保图标类名格式正确
    const iconClass = icon.startsWith('fa-') ? icon : `fa-${icon}`;

    let rightHtml = '';
    if (showMemberStatus) {
      rightHtml += `
        <div id="statusBadge" class="status-badge status-free">
          <i class="fas fa-lock"></i> 游客
        </div>
        <button class="btn btn-warning btn-sm" onclick="PageComponents.openActivationModal()">
          <i class="fas fa-crown"></i> 激活会员
        </button>`;
    }
    rightHtml += `
      <a href="/" class="btn btn-secondary btn-sm">
        <i class="fas fa-home"></i> 首页
      </a>`;

    return `
    <nav class="navbar">
      <div class="navbar-left">
        <a href="/" class="logo">
          <i class="fas ${iconClass}"></i>
          ${title}
        </a>
        ${extraLeft}
      </div>
      <div class="navbar-right">
        ${rightHtml}
      </div>
    </nav>`;
  }

  /**
   * 渲染页脚 HTML
   * @returns {string} HTML 字符串
   */
  function renderFooter() {
    const year = new Date().getFullYear();
    return `
    <footer style="text-align:center; padding:24px 16px; color:var(--text-muted); font-size:0.8rem; border-top:1px solid var(--border-light); background:var(--card);">
      © ${year} ${SITE_CONFIG.SITE_NAME} v${SITE_CONFIG.VERSION} · 教师的得力助手
    </footer>`;
  }

  /**
   * 渲染激活弹窗 HTML
   * @returns {string} HTML 字符串
   */
  function renderActivationModal() {
    return `
    <div class="modal-overlay" id="activationModal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">👑 激活会员</h3>
          <p class="modal-desc">输入卡密解锁全部功能，享受无限使用</p>
        </div>
        <input
          type="text"
          class="form-input"
          id="activationKeyInput"
          placeholder="请输入卡密，例如 TEACHERPRO-XXXX-XXXX"
          style="margin-bottom:12px;"
        >
        <button
          class="btn btn-primary btn-lg"
          style="width:100%;"
          onclick="PageComponents.doActivation()"
        >
          <i class="fas fa-check-circle"></i> 立即激活
        </button>
        <div id="activationMsg" style="margin-top:12px; text-align:center; min-height:24px; font-size:0.9rem;"></div>
        <button
          class="btn btn-ghost btn-sm"
          style="display:block; margin:8px auto 0;"
          onclick="PageComponents.closeActivationModal()"
        >
          暂不激活
        </button>
      </div>
    </div>`;
  }

  /**
   * 更新会员状态 UI
   * 需要 member.js 中的 MemberManager 实例
   */
  async function updateMemberUI() {
    if (typeof member === 'undefined') return;
    try {
      await member.init();
    } catch (e) {
      // 静默处理
    }
    const badge = document.getElementById('statusBadge');
    if (!badge) return;

    const status = member.getStatusText();
    badge.innerHTML = `<i class="fas ${member.isPro ? 'fa-crown' : 'fa-lock'}"></i> ${status.text}`;
    badge.className = `status-badge ${status.class}`;
  }

  /**
   * 打开激活弹窗
   */
  function openActivationModal() {
    const modal = document.getElementById('activationModal');
    if (modal) {
      modal.classList.add('active');
      const input = document.getElementById('activationKeyInput');
      if (input) input.focus();
    }
  }

  /**
   * 关闭激活弹窗
   */
  function closeActivationModal() {
    const modal = document.getElementById('activationModal');
    if (modal) {
      modal.classList.remove('active');
      const msg = document.getElementById('activationMsg');
      if (msg) msg.textContent = '';
      const input = document.getElementById('activationKeyInput');
      if (input) input.value = '';
    }
  }

  /**
   * 执行激活操作
   */
  async function doActivation() {
    if (typeof member === 'undefined') {
      showToast('会员模块未加载', 'danger');
      return;
    }
    const input = document.getElementById('activationKeyInput');
    const msg = document.getElementById('activationMsg');
    if (!input || !msg) return;

    const key = input.value.trim();
    if (!key) {
      msg.style.color = 'var(--danger)';
      msg.textContent = '请输入卡密';
      return;
    }

    msg.style.color = 'var(--text-light)';
    msg.textContent = '⏳ 验证中...';

    try {
      const res = await member.activate(key);
      msg.style.color = res.ok ? 'var(--success)' : 'var(--danger)';
      msg.textContent = res.msg;

      if (res.ok) {
        setTimeout(() => {
          closeActivationModal();
          updateMemberUI();
          // 如果页面定义了 onMemberActivated 回调，调用它
          if (typeof window.onMemberActivated === 'function') {
            window.onMemberActivated();
          }
        }, 1500);
      }
    } catch (e) {
      msg.style.color = 'var(--danger)';
      msg.textContent = '❌ 操作失败，请重试';
    }
  }

  /**
   * 显示 Toast 通知
   * @param {string} message - 提示消息
   * @param {'success'|'warning'|'danger'|'info'} [type='success'] - 类型
   * @param {number} [duration=3000] - 显示时长(ms)
   */
  function showToast(message, type = 'success', duration = 3000) {
    // 移除已有 toast
    const existing = document.querySelector('.component-toast');
    if (existing) existing.remove();

    const typeClass = type && type !== 'info' ? `toast-${type}` : '';
    const iconMap = {
      success: 'fa-check-circle',
      danger: 'fa-times-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };
    const icon = iconMap[type] || iconMap.info;

    const toast = document.createElement('div');
    toast.className = `toast ${typeClass} component-toast`;
    toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s, transform 0.3s';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  /**
   * 初始化页面通用结构
   * @param {Object} options
   * @param {string} options.title - 工具名称 (显示在导航栏)
   * @param {string} [options.icon='fa-tools'] - FontAwesome 图标
   * @param {boolean} [options.showMemberStatus=true] - 是否显示会员状态和激活按钮
   * @param {string} [options.extraLeft=''] - 导航栏左侧额外 HTML
   * @param {boolean} [options.showFooter=true] - 是否显示页脚
   * @param {boolean} [options.showActivationModal=true] - 是否显示激活弹窗
   */
  function initPage(options = {}) {
    const {
      title,
      icon,
      showMemberStatus = true,
      extraLeft = '',
      showFooter = true,
      showActivationModal = true
    } = options;

    // 注入导航栏
    const navbarEl = document.getElementById('app-navbar');
    if (navbarEl) {
      navbarEl.innerHTML = renderNavbar({ title, icon, showMemberStatus, extraLeft });
    }

    // 注入页脚
    if (showFooter) {
      const footerEl = document.getElementById('app-footer');
      if (footerEl) {
        footerEl.innerHTML = renderFooter();
      }
    }

    // 注入激活弹窗
    if (showActivationModal) {
      const modalEl = document.getElementById('app-modal');
      if (modalEl) {
        modalEl.innerHTML = renderActivationModal();
        // 绑定 Enter 键
        const keyInput = document.getElementById('activationKeyInput');
        if (keyInput) {
          keyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') doActivation();
          });
        }
        // 点击遮罩关闭
        const overlay = document.getElementById('activationModal');
        if (overlay) {
          overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeActivationModal();
          });
        }
      }
    }

    // 更新会员状态
    if (showMemberStatus) {
      updateMemberUI();
    }
  }

  // 公开 API
  return {
    renderNavbar,
    renderFooter,
    renderActivationModal,
    updateMemberUI,
    openActivationModal,
    closeActivationModal,
    doActivation,
    showToast,
    initPage
  };
})();

// 兼容: 将方法挂载到 window 方便直接调用
window.showToast = PageComponents.showToast;
window.openPayModal = PageComponents.openActivationModal;
