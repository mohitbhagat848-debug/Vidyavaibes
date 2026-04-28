/**
 * AMEP Shared Navigation Bar
 * Inject once from every HTML page — automatically adapts paths.
 *
 * Usage:  <script src="../js/navbar.js"></script>   (or "js/navbar.js" from root)
 *
 * The script:
 *  1. Detects whether the page lives in a sub-folder (/lessons/) and 
 *     sets a path prefix so all hrefs resolve correctly.
 *  2. Reads the logged-in user from localStorage (amep_user / amep_token).
 *  3. Marks the currently active link.
 *  4. Wires up the hamburger menu for mobile.
 *  5. Exposes  window.amepLogout()  globally.
 */
(function () {
  /* ─── 1. Resolve path prefix ──────────────────────────────────────────── */
  const depth = window.location.pathname.split('/').filter(Boolean).length;
  // If page is inside a subfolder (e.g. /frontend/lessons/foo.html) add an
  // extra "../".  Works for any single-level sub-folder.
  const isSubfolder = window.location.pathname.includes('/lessons/');
  const ROOT = isSubfolder ? '../' : '';

  /* ─── 2. Auth helpers ─────────────────────────────────────────────────── */
  const token = localStorage.getItem('amep_token');
  const userStr = localStorage.getItem('amep_user');
  let user = null;
  try { user = userStr ? JSON.parse(userStr) : null; } catch (e) { }

  window.amepLogout = function () {
    localStorage.removeItem('amep_token');
    localStorage.removeItem('amep_user');
    localStorage.removeItem('amep_python_progress');
    localStorage.removeItem('amep_python_synced');
    localStorage.removeItem('amep_analytics');
    window.location.href = ROOT + 'login.html';
  };

  /* ─── 3. Build nav links ──────────────────────────────────────────────── */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  function isActive(page) {
    if (Array.isArray(page)) return page.includes(currentPage);
    return currentPage === page;
  }

  const navLinks = [
    { label: 'Dashboard', href: ROOT + 'student_dashboard.html', icon: 'dashboard', pages: ['student_dashboard.html'] },
    { label: 'Resources', href: ROOT + 'resources.html', icon: 'folder_open', pages: ['resources.html'] },

    { label: 'AI Tutor', href: ROOT + 'ai_assistant.html', icon: 'smart_toy', pages: ['ai_assistant.html'] },
    { label: 'Analytics', href: ROOT + 'analytics.html', icon: 'analytics', pages: ['analytics.html'] },
    { label: 'Feedback', href: ROOT + 'feedback.html', icon: 'feedback', pages: ['feedback.html'] },
  ];

  // Pages that shouldn't show the main nav (auth pages)
  const authPages = ['login.html', 'signup.html', 'student_dashboard.html', 'index.html'];
  if (authPages.includes(currentPage)) return; // skip nav injection

  /* ─── 4. Inject CSS custom properties & styles ────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
    /* ── AMEP Shared Navbar ── */
    #amep-navbar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
      height: 64px;
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(0,0,0,0.07);
      box-shadow: 0 1px 12px rgba(0,38,27,0.07);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 24px;
      font-family: 'Inter', system-ui, sans-serif;
    }
    #amep-navbar .nav-brand {
      font-size: 1.25rem; font-weight: 900;
      color: #00261b; text-decoration: none; letter-spacing: -0.5px;
      white-space: nowrap;
    }
    #amep-navbar .nav-brand span { color: #059669; }
    #amep-navbar .nav-links {
      display: flex; align-items: center; gap: 4px;
    }
    #amep-navbar .nav-links a {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 14px; border-radius: 10px;
      font-size: 0.8125rem; font-weight: 600; text-decoration: none;
      color: #4b5563; transition: all 0.18s ease;
      white-space: nowrap;
    }
    #amep-navbar .nav-links a .material-symbols-outlined {
      font-size: 18px; flex-shrink: 0;
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20;
    }
    #amep-navbar .nav-links a:hover {
      background: #f0fdf4; color: #059669;
    }
    #amep-navbar .nav-links a.active {
      background: #dcfce7; color: #065f46; font-weight: 700;
    }
    #amep-navbar .nav-links a.active .material-symbols-outlined {
      font-variation-settings: 'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 20;
    }
    /* Right side actions */
    #amep-navbar .nav-actions {
      display: flex; align-items: center; gap: 8px;
    }
    #amep-navbar .nav-actions .nav-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: linear-gradient(135deg, #059669, #00261b);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 0.75rem; font-weight: 800;
      border: 2px solid #dcfce7; cursor: pointer;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    #amep-navbar .nav-actions .nav-icon-btn {
      width: 36px; height: 36px; border-radius: 10px; border: none;
      background: transparent; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #6b7280; transition: all 0.18s;
    }
    #amep-navbar .nav-actions .nav-icon-btn:hover {
      background: #f0fdf4; color: #059669;
    }
    #amep-navbar .nav-actions .nav-icon-btn .material-symbols-outlined {
      font-size: 20px;
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20;
    }
    #amep-navbar .nav-logout {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 14px; border-radius: 10px;
      font-size: 0.8125rem; font-weight: 600;
      color: #dc2626; background: transparent;
      border: 1.5px solid #fecaca; cursor: pointer;
      transition: all 0.18s; text-decoration: none;
      white-space: nowrap;
    }
    #amep-navbar .nav-logout:hover {
      background: #fef2f2; border-color: #dc2626;
    }
    #amep-navbar .nav-logout .material-symbols-outlined {
      font-size: 16px;
      font-variation-settings: 'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 20;
    }
    /* Hamburger */
    #amep-hamburger {
      display: none; flex-direction: column; justify-content: center;
      align-items: center; gap: 5px;
      width: 40px; height: 40px; border-radius: 10px;
      background: transparent; border: none; cursor: pointer;
      padding: 8px; transition: background 0.18s;
    }
    #amep-hamburger:hover { background: #f0fdf4; }
    #amep-hamburger .bar {
      width: 22px; height: 2px; background: #374151;
      border-radius: 2px; transition: all 0.28s cubic-bezier(0.4,0,0.2,1);
      transform-origin: center;
    }
    #amep-hamburger.open .bar:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    #amep-hamburger.open .bar:nth-child(2) { opacity: 0; transform: scaleX(0); }
    #amep-hamburger.open .bar:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

    /* Mobile drawer */
    #amep-mobile-menu {
      display: none; position: fixed; top: 64px; left: 0; right: 0;
      background: rgba(255,255,255,0.98);
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(0,0,0,0.07);
      box-shadow: 0 8px 32px rgba(0,38,27,0.1);
      z-index: 9998; flex-direction: column;
      padding: 12px 16px 20px; gap: 4px;
      transform: translateY(-8px); opacity: 0;
      transition: opacity 0.22s ease, transform 0.22s ease;
      font-family: 'Inter', system-ui, sans-serif;
    }
    #amep-mobile-menu.open {
      display: flex; opacity: 1; transform: translateY(0);
    }
    #amep-mobile-menu a {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px; border-radius: 12px;
      font-size: 0.9375rem; font-weight: 600; text-decoration: none;
      color: #374151; transition: all 0.18s;
    }
    #amep-mobile-menu a .material-symbols-outlined {
      font-size: 20px;
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20;
    }
    #amep-mobile-menu a:hover { background: #f0fdf4; color: #059669; }
    #amep-mobile-menu a.active {
      background: #dcfce7; color: #065f46;
    }
    #amep-mobile-menu a.active .material-symbols-outlined {
      font-variation-settings: 'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 20;
    }
    #amep-mobile-menu .mobile-divider {
      height: 1px; background: #f3f4f6; margin: 8px 0;
    }
    #amep-mobile-menu .mobile-user-row {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px; border-radius: 12px;
      background: #f9fafb;
    }
    #amep-mobile-menu .mobile-user-row .mobile-avatar {
      width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #059669, #00261b);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 0.75rem; font-weight: 800;
      text-transform: uppercase;
    }
    #amep-mobile-menu .mobile-user-row .mobile-user-info .mobile-user-name {
      font-size: 0.875rem; font-weight: 700; color: #111827;
    }
    #amep-mobile-menu .mobile-user-row .mobile-user-info .mobile-user-role {
      font-size: 0.75rem; color: #6b7280;
    }
    #amep-mobile-menu .mobile-logout {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px; border-radius: 12px;
      color: #dc2626; cursor: pointer; background: transparent;
      border: none; text-align: left; width: 100%;
      font-size: 0.9375rem; font-weight: 600;
      font-family: 'Inter', system-ui, sans-serif;
      transition: background 0.18s;
    }
    #amep-mobile-menu .mobile-logout:hover { background: #fef2f2; }
    #amep-mobile-menu .mobile-logout .material-symbols-outlined {
      font-size: 20px;
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20;
    }

    /* Push page content below fixed navbar */
    body { padding-top: 64px !important; }

    /* Responsive breakpoints */
    @media (max-width: 900px) {
      #amep-navbar .nav-links { display: none; }
      #amep-navbar .nav-logout { display: none; }
      #amep-hamburger { display: flex !important; }
    }
    @media (max-width: 480px) {
      #amep-navbar { padding: 0 16px; }
    }
  `;
  document.head.appendChild(style);

  /* ─── 5. Build initials / avatar ─────────────────────────────────────── */
  function getInitials(name) {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? parts[0][0] + parts[parts.length - 1][0]
      : parts[0][0];
  }
  const userName = user?.name || user?.fullName || user?.email?.split('@')[0] || 'User';
  const userRole = user?.role || 'Student';
  const initials = getInitials(userName);

  /* ─── 6. Render desktop navbar ───────────────────────────────────────── */
  function renderNavLink(link, isMobile) {
    const active = isActive(link.pages) ? 'active' : '';
    return `<a href="${link.href}" class="${active}">
      <span class="material-symbols-outlined">${link.icon}</span>
      ${link.label}
    </a>`;
  }

  const navbar = document.createElement('nav');
  navbar.id = 'amep-navbar';
  navbar.setAttribute('role', 'navigation');
  navbar.setAttribute('aria-label', 'Main navigation');
  navbar.innerHTML = `
    <a href="${ROOT}student_dashboard.html" class="nav-brand" aria-label="AMEP Home">
      AMEP <span>·</span> EduAI
    </a>

    <div class="nav-links" id="amep-nav-links">
      ${navLinks.map(l => renderNavLink(l, false)).join('')}
    </div>

    <div class="nav-actions">
      <button class="nav-icon-btn" title="Notifications" aria-label="Notifications">
        <span class="material-symbols-outlined">notifications</span>
      </button>
      <div class="nav-avatar" title="${userName}" aria-label="Logged in as ${userName}">
        ${initials}
      </div>
      <button class="nav-logout" onclick="window.amepLogout()" title="Logout" aria-label="Logout">
        <span class="material-symbols-outlined">logout</span>
        Logout
      </button>
      <button id="amep-hamburger" aria-label="Toggle menu" aria-expanded="false">
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
      </button>
    </div>
  `;

  /* ─── 7. Render mobile drawer ────────────────────────────────────────── */
  const mobileMenu = document.createElement('div');
  mobileMenu.id = 'amep-mobile-menu';
  mobileMenu.setAttribute('role', 'dialog');
  mobileMenu.setAttribute('aria-label', 'Mobile navigation');
  mobileMenu.innerHTML = `
    <div class="mobile-user-row">
      <div class="mobile-avatar">${initials}</div>
      <div class="mobile-user-info">
        <div class="mobile-user-name">${userName}</div>
        <div class="mobile-user-role">${userRole}</div>
      </div>
    </div>
    <div class="mobile-divider"></div>
    ${navLinks.map(l => renderNavLink(l, true)).join('')}
    <div class="mobile-divider"></div>
    <button class="mobile-logout" onclick="window.amepLogout()">
      <span class="material-symbols-outlined">logout</span>
      Logout
    </button>
  `;

  /* ─── 8. Mount to DOM ─────────────────────────────────────────────────── */
  // Remove any existing nav elements to avoid duplicates
  const existingNav = document.querySelector('header, nav:first-of-type, #amep-navbar');
  if (existingNav && existingNav.id !== 'amep-navbar') {
    // Try to hide old nav instead of removing (in case it has sidebar too)
    existingNav.style.display = 'none';
  }

  document.body.insertBefore(mobileMenu, document.body.firstChild);
  document.body.insertBefore(navbar, mobileMenu);

  /* ─── 9. Wire hamburger toggle ────────────────────────────────────────── */
  const hamburger = document.getElementById('amep-hamburger');
  hamburger.addEventListener('click', function () {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen.toString());
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close mobile menu when a link is clicked
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Close on click outside
  document.addEventListener('click', function (e) {
    if (
      mobileMenu.classList.contains('open') &&
      !navbar.contains(e.target) &&
      !mobileMenu.contains(e.target)
    ) {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

  /* ─── 10. Auth guard ──────────────────────────────────────────────────── */
  if (!token) {
    window.location.href = ROOT + 'login.html';
  }
})();
