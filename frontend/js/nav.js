/**
 * AMEP — Shared Navigation Component
 * Injects a consistent sidebar + mobile bottom nav into every page.
 * Usage: <script src="js/nav.js" data-page="dashboard"></script>
 *    data-page values: dashboard | course | quiz | ai | resources | community | analytics | settings
 */
(function () {
  // ── Nav links (only pages that actually exist) ──────────────────────────────
  const LINKS = [
    { id: 'dashboard', href: 'student_dashboard.html', icon: 'dashboard',    label: 'Dashboard'     },
    { id: 'course',    href: 'python_course.html',     icon: 'code',         label: 'Python Course' },
    { id: 'ai',        href: 'ai_assistant.html',      icon: 'smart_toy',    label: 'AI Assistant'  },
    { id: 'resources', href: 'resources.html',         icon: 'library_books',label: 'Resources'     },

    { id: 'analytics', href: 'analytics.html',         icon: 'analytics',    label: 'Analytics'     },
  ];

  const BOTTOM = [
    { id: 'dashboard', href: 'student_dashboard.html', icon: 'dashboard',  label: 'Home'   },
    { id: 'course',    href: 'python_course.html',     icon: 'code',       label: 'Course' },
    { id: 'ai',        href: 'ai_assistant.html',      icon: 'smart_toy',  label: '',       fab: true },
    { id: 'analytics', href: 'analytics.html',         icon: 'analytics',  label: 'Stats'  },
  ];

  // Detect current page from script tag attribute OR from filename
  const scriptEl = document.currentScript || document.querySelector('script[data-page]');
  const currentPage = scriptEl ? scriptEl.getAttribute('data-page') : null;
  const currentFile = window.location.pathname.split('/').pop().replace('.html', '');
  const activePage  = currentPage || LINKS.find(l => l.href.replace('.html','') === currentFile)?.id || 'dashboard';

  // ── Build sidebar ────────────────────────────────────────────────────────────
  const activeBase  = 'flex items-center gap-3 rounded-lg px-4 py-3 mb-1 transition-all';
  const activeClass = `${activeBase} bg-emerald-50 dark:bg-emerald-900/40 text-emerald-900 dark:text-lime-400 border-r-4 border-emerald-900 dark:border-lime-400 font-bold`;
  const inactClass  = `${activeBase} text-gray-500 dark:text-emerald-300/60 hover:bg-gray-50 dark:hover:bg-emerald-900/20 hover:text-emerald-900 dark:hover:text-emerald-100 active:translate-x-1 duration-200`;

  const sideLinks = LINKS.map(l => `
    <a class="${l.id === activePage ? activeClass : inactClass}" href="${l.href}">
      <span class="material-symbols-outlined text-[20px]" style="${l.id === activePage ? "font-variation-settings:'FILL' 1;" : ''}">${l.icon}</span>
      <span>${l.label}</span>
    </a>`).join('');

  const sidebar = `
<aside id="amep-sidebar" class="hidden md:flex bg-white dark:bg-emerald-950 text-emerald-900 dark:text-emerald-50 font-inter text-sm font-medium fixed left-0 top-0 h-full w-64 border-r border-gray-100 dark:border-emerald-900/50 shadow-xl flex-col p-4 z-50">
  <div class="flex flex-col items-start gap-1 mb-8 px-4 py-2">
    <span class="text-lg font-black text-emerald-900 dark:text-lime-400">AMEP</span>
    <span class="text-[10px] uppercase tracking-widest text-gray-400">AI Education Platform</span>
  </div>
  <nav class="flex-1 space-y-0.5 overflow-y-auto">${sideLinks}</nav>
  <div class="pt-4 border-t border-gray-100 dark:border-emerald-900/50 space-y-0.5">
    <a class="${inactClass}" href="settings.html">
      <span class="material-symbols-outlined text-[20px]">settings</span>
      <span>Settings</span>
    </a>
    <button onclick="amepLogout ? amepLogout() : (window.location='login.html')" class="w-full flex items-center gap-3 text-red-500 dark:text-red-400 rounded-lg px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all active:translate-x-1 duration-200">
      <span class="material-symbols-outlined text-[20px]">logout</span>
      <span>Logout</span>
    </button>
  </div>
</aside>`;

  // ── Build mobile hamburger drawer ────────────────────────────────────────────
  const drawerLinks = LINKS.map(l => `
    <a class="${l.id === activePage ? 'flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-emerald-50 text-emerald-900 font-bold' : 'flex items-center gap-4 px-5 py-3.5 rounded-2xl text-slate-600 hover:bg-slate-50'}" href="${l.href}">
      <span class="material-symbols-outlined" style="${l.id === activePage ? "font-variation-settings:'FILL' 1;" : ''}">${l.icon}</span>
      <span class="font-semibold">${l.label}</span>
    </a>`).join('');

  const drawer = `
<div id="amep-drawer-overlay" class="fixed inset-0 bg-black/40 z-[60] hidden md:hidden" onclick="toggleDrawer()"></div>
<div id="amep-drawer" class="fixed left-0 top-0 h-full w-72 bg-white dark:bg-emerald-950 z-[70] shadow-2xl transform -translate-x-full transition-transform duration-300 ease-out md:hidden flex flex-col">
  <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100">
    <div>
      <span class="text-xl font-black text-emerald-900 dark:text-lime-400">AMEP</span>
      <p class="text-[10px] text-slate-400 uppercase tracking-widest">AI Education</p>
    </div>
    <button onclick="toggleDrawer()" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
      <span class="material-symbols-outlined text-slate-500">close</span>
    </button>
  </div>
  <div class="flex-1 overflow-y-auto p-3 space-y-1">${drawerLinks}</div>
  <div class="p-3 border-t border-gray-100 space-y-1">
    <a class="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-slate-600 hover:bg-slate-50" href="settings.html">
      <span class="material-symbols-outlined">settings</span><span class="font-semibold">Settings</span>
    </a>
    <button onclick="amepLogout ? amepLogout() : (window.location='login.html')" class="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-red-500 hover:bg-red-50 transition-colors">
      <span class="material-symbols-outlined">logout</span><span class="font-semibold">Logout</span>
    </button>
  </div>
</div>`;

  // ── Build bottom nav ─────────────────────────────────────────────────────────
  const bottomItems = BOTTOM.map(l => {
    if (l.fab) return `
      <a href="${l.href}" class="flex flex-col items-center gap-1 -translate-y-4">
        <div class="w-14 h-14 bg-gradient-to-br from-emerald-700 to-emerald-900 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-900/30 hover:scale-110 active:scale-95 transition-all">
          <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1;">${l.icon}</span>
        </div>
      </a>`;
    const isAct = l.id === activePage;
    return `
      <a href="${l.href}" class="flex flex-col items-center gap-1 p-2 ${isAct ? 'text-emerald-700' : 'text-gray-400 hover:text-emerald-600'} transition-colors">
        <span class="material-symbols-outlined text-[22px]" style="${isAct ? "font-variation-settings:'FILL' 1;" : ''}">${l.icon}</span>
        <span class="text-[10px] font-bold">${l.label}</span>
      </a>`;
  }).join('');

  const bottomNav = `
<nav id="amep-bottom-nav" class="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 flex justify-around items-center h-20 px-2 z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
  ${bottomItems}
</nav>`;

  // ── Hamburger button in top bar (mobile only) ────────────────────────────────
  const hamburger = `
<button id="amep-hamburger" onclick="toggleDrawer()" class="md:hidden flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 transition-colors">
  <span class="material-symbols-outlined text-emerald-900">menu</span>
</button>`;

  // ── Toggle drawer ────────────────────────────────────────────────────────────
  window.toggleDrawer = function () {
    const drawer  = document.getElementById('amep-drawer');
    const overlay = document.getElementById('amep-drawer-overlay');
    const isOpen  = !drawer.classList.contains('-translate-x-full');
    if (isOpen) {
      drawer.classList.add('-translate-x-full');
      overlay.classList.add('hidden');
    } else {
      drawer.classList.remove('-translate-x-full');
      overlay.classList.remove('hidden');
    }
  };

  // ── Inject HTML ──────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    // Inject sidebar
    if (!document.getElementById('amep-sidebar')) {
      document.body.insertAdjacentHTML('afterbegin', sidebar);
    }
    // Inject drawer & overlay
    if (!document.getElementById('amep-drawer')) {
      document.body.insertAdjacentHTML('afterbegin', drawer);
    }
    // Inject bottom nav
    if (!document.getElementById('amep-bottom-nav')) {
      document.body.insertAdjacentHTML('beforeend', bottomNav);
    }
    // Inject hamburger into header if exists and not already there
    const header = document.querySelector('header');
    if (header && !document.getElementById('amep-hamburger')) {
      const firstChild = header.querySelector('div');
      if (firstChild) {
        firstChild.insertAdjacentHTML('afterbegin', hamburger);
      }
    }
  });
})();
