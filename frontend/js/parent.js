/**
 * AMEP Parent Portal — Dynamic Data Manager
 * Handles all API calls and DOM rendering for parent_portal.html
 */
(function () {
  'use strict';

  const API_BASE = 'http://127.0.0.1:5000/api';

  // ── State ────────────────────────────────────────────────────────────────────
  let childrenData = [];   // all linked children with overview
  let activeChildIdx = 0;  // which child tab is showing
  let weeklyReport = null; // weekly report for active child

  // ── Token ────────────────────────────────────────────────────────────────────
  function getToken() {
    return localStorage.getItem('amep_token');
  }

  // ── Toast ─────────────────────────────────────────────────────────────────────
  function showToast(msg, type = 'success') {
    let toast = document.getElementById('parentToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'parentToast';
      toast.style.cssText = `
        position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;
        padding:.75rem 1.5rem;border-radius:.75rem;
        font-size:.875rem;font-weight:600;color:#fff;
        opacity:0;transform:translateY(10px);
        transition:opacity .3s,transform .3s;pointer-events:none;
        font-family:'Inter',sans-serif;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.background = type === 'error' ? '#ba1a1a' : '#059669';
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'none';
    });
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
    }, 3500);
  }

  // ── Avatar helpers ────────────────────────────────────────────────────────────
  const AVATAR_PALETTES = [
    { bg: '#d1fae5', text: '#065f46' },
    { bg: '#dbeafe', text: '#1e40af' },
    { bg: '#ede9fe', text: '#5b21b6' },
    { bg: '#fef3c7', text: '#92400e' },
    { bg: '#fee2e2', text: '#991b1b' },
    { bg: '#e0f2fe', text: '#075985' },
  ];

  function avatarPalette(name) {
    return AVATAR_PALETTES[(name?.charCodeAt(0) || 0) % AVATAR_PALETTES.length];
  }

  function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : parts[0][0];
  }

  // ── Score helpers ─────────────────────────────────────────────────────────────
  function scoreColor(score) {
    if (score === null || score === undefined) return '#94a3b8';
    if (score >= 80) return '#059669';
    if (score >= 60) return '#d97706';
    return '#ba1a1a';
  }

  function scoreLabel(score) {
    if (score === null || score === undefined) return '—';
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Review';
  }

  function formatTime(mins) {
    if (!mins) return '0h';
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  // ── API: Fetch Parent Dashboard ───────────────────────────────────────────────
  async function fetchParentDashboard() {
    const res = await fetch(`${API_BASE}/parent/dashboard`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  // ── API: Fetch Weekly Report ──────────────────────────────────────────────────
  async function fetchWeeklyReport(childId) {
    const res = await fetch(`${API_BASE}/parent/weekly-report/${childId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  // ── API: Link Child ───────────────────────────────────────────────────────────
  async function linkChild(email) {
    const res = await fetch(`${API_BASE}/parent/link-child`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ childEmail: email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to link child');
    return data;
  }

  // ── Render: Skeleton State ────────────────────────────────────────────────────
  function showSkeletons() {
    const ids = [
      'childNameDisplay', 'childGradeDisplay', 'childStyleBadge',
      'overallMasteryPct', 'avgScoreValue', 'topicsCompletedValue',
      'studyTimeValue', 'weeklyQuizCount', 'weeklyAvgScore',
      'weeklyTopicsCount', 'weeklySummaryText',
    ];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.add('skeleton-pulse');
        el.textContent = '—';
      }
    });
  }

  // ── Render: Child Switcher Tabs ───────────────────────────────────────────────
  function renderChildTabs(children) {
    const container = document.getElementById('childTabsContainer');
    if (!container) return;

    if (children.length <= 1) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'flex';
    container.innerHTML = children.map((c, i) => {
      const p = avatarPalette(c.child.name);
      return `
        <button
          id="childTab_${i}"
          onclick="window.parentSwitchChild(${i})"
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2
            ${i === activeChildIdx
              ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
              : 'border-transparent bg-white text-slate-600 hover:bg-slate-50'}"
          style="cursor:pointer"
        >
          <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
               style="background:${p.bg};color:${p.text}">
            ${getInitials(c.child.name)}
          </div>
          ${c.child.name.split(' ')[0]}
        </button>`;
    }).join('');
  }

  // ── Render: Child Overview Header ─────────────────────────────────────────────
  function renderChildOverview(data) {
    const { child, overview } = data;
    const p = avatarPalette(child.name);

    // Avatar
    const avatarEl = document.getElementById('childAvatarCircle');
    if (avatarEl) {
      avatarEl.style.background = `${p.bg}`;
      avatarEl.style.color = `${p.text}`;
      avatarEl.textContent = getInitials(child.name);
    }

    setText('childNameDisplay', child.name || '—');
    setText('childGradeDisplay', child.grade ? `Grade ${child.grade}` : 'N/A');

    const styleBadge = document.getElementById('childStyleBadge');
    if (styleBadge) {
      styleBadge.textContent = child.learningStyle
        ? `${capitalise(child.learningStyle)} Learner`
        : 'Learner';
    }

    // Progress bar
    const pct = overview.progressPercent ?? 0;
    setText('overallMasteryPct', `${pct}%`);
    const bar = document.getElementById('overallMasteryBar');
    if (bar) bar.style.width = `${pct}%`;

    // Stat cards
    setText('avgScoreValue', overview.averageScore !== null ? `${overview.averageScore}%` : '—');
    setText('topicsCompletedValue', `${overview.completedTopics ?? 0}/${overview.totalTopics ?? 0}`);
    setText('studyTimeValue', formatTime(overview.totalTimeSpentMins));

    // Streak
    const streakEl = document.getElementById('streakValue');
    if (streakEl) streakEl.textContent = `${overview.currentStreak ?? 0} 🔥`;
  }

  // ── Render: Weekly Summary ────────────────────────────────────────────────────
  function renderWeeklySummary(data) {
    const { weeklySummary } = data;
    setText('weeklyQuizCount', weeklySummary.quizzesTaken ?? 0);
    setText('weeklyAvgScore', weeklySummary.averageScore !== null
      ? `${weeklySummary.averageScore}%` : 'N/A');
    setText('weeklyTopicsCount', weeklySummary.topicsCompleted ?? 0);

    const summaryText = document.getElementById('weeklySummaryText');
    if (summaryText) {
      const name = data.child.name?.split(' ')[0] || 'Your child';
      const q = weeklySummary.quizzesTaken ?? 0;
      const avg = weeklySummary.averageScore;
      const t = weeklySummary.topicsCompleted ?? 0;

      let insight = '';
      if (q === 0) {
        insight = `${name} hasn't taken any quizzes this week. Encourage them to log in!`;
      } else if (avg !== null && avg >= 80) {
        insight = `${name} is doing great this week — ${q} quiz${q !== 1 ? 'zes' : ''} with an average of ${avg}%. Keep it up!`;
      } else if (avg !== null && avg >= 60) {
        insight = `${name} completed ${q} quiz${q !== 1 ? 'zes' : ''} this week averaging ${avg}%. A bit more practice will help.`;
      } else {
        insight = `${name} needs more focus — ${q} quiz${q !== 1 ? 'zes' : ''} taken with a ${avg ?? '—'}% average. Consider extra sessions.`;
      }
      if (t > 0) insight += ` ${t} topic${t !== 1 ? 's' : ''} completed.`;
      summaryText.textContent = insight;
    }
  }

  // ── Render: Strengths & Weak Areas ───────────────────────────────────────────
  function renderStrengthsWeakAreas(data) {
    const { strengths = [], weakAreas = [] } = data;

    const sContainer = document.getElementById('strengthsList');
    const wContainer = document.getElementById('weakAreasList');

    if (sContainer) {
      if (strengths.length === 0) {
        sContainer.innerHTML = `<p class="text-sm text-slate-400 text-center py-4">No strength data yet.</p>`;
      } else {
        sContainer.innerHTML = strengths.map(s => `
          <div class="space-y-1">
            <div class="flex justify-between text-sm">
              <span class="font-medium text-emerald-900">${s.subject}</span>
              <span class="font-bold text-emerald-600">${s.averageScore}%</span>
            </div>
            <div class="w-full bg-emerald-100 h-2 rounded-full overflow-hidden">
              <div class="bg-emerald-500 h-full rounded-full transition-all duration-700"
                   style="width:${s.averageScore}%"></div>
            </div>
          </div>`).join('');
      }
    }

    if (wContainer) {
      if (weakAreas.length === 0) {
        wContainer.innerHTML = `<p class="text-sm text-slate-400 text-center py-4">No weak areas — great work! 🎉</p>`;
      } else {
        wContainer.innerHTML = weakAreas.map(w => `
          <div class="space-y-1">
            <div class="flex justify-between text-sm">
              <span class="font-medium text-orange-900">${w.subject}</span>
              <span class="font-bold text-orange-600">${w.averageScore}%</span>
            </div>
            <div class="w-full bg-orange-100 h-2 rounded-full overflow-hidden">
              <div class="bg-orange-400 h-full rounded-full transition-all duration-700"
                   style="width:${w.averageScore}%"></div>
            </div>
          </div>`).join('');
      }
    }
  }

  // ── Render: Recent Activity ───────────────────────────────────────────────────
  function renderRecentActivity(data) {
    const { recentResults = [] } = data;
    const container = document.getElementById('recentActivityList');
    if (!container) return;

    if (recentResults.length === 0) {
      container.innerHTML = `
        <div class="p-6 text-center text-slate-400 text-sm">No recent activity yet.</div>`;
      return;
    }

    const ICONS = { quiz: 'quiz', lesson: 'school', history_edu: 'history_edu', science: 'science' };
    const subjectIcon = (subj = '') => {
      const s = subj.toLowerCase();
      if (s.includes('history')) return 'history_edu';
      if (s.includes('science') || s.includes('physics') || s.includes('chem')) return 'science';
      if (s.includes('math') || s.includes('algebra') || s.includes('geo')) return 'calculate';
      return 'quiz';
    };

    container.innerHTML = recentResults.map(r => {
      const color = r.score >= 80 ? 'emerald' : r.score >= 60 ? 'yellow' : 'red';
      const label = r.score >= 80 ? 'Excellent' : r.score >= 60 ? 'Good' : 'Needs Review';
      const icon = subjectIcon(r.subject);
      const dateStr = r.date ? new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
      return `
        <div class="p-5 flex justify-between items-center hover:bg-slate-50 transition-colors">
          <div class="flex items-center gap-4">
            <div class="h-10 w-10 bg-${color}-100 text-${color}-700 rounded-full flex items-center justify-center">
              <span class="material-symbols-outlined">${icon}</span>
            </div>
            <div>
              <div class="font-bold text-slate-900">${r.subject || 'Activity'}</div>
              <div class="text-xs text-slate-400">${dateStr}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-lg font-black" style="color:${scoreColor(r.score)}">${r.score ?? '—'}%</div>
            <div class="text-[10px] font-bold uppercase" style="color:${scoreColor(r.score)};opacity:.7">${label}</div>
          </div>
        </div>`;
    }).join('');
  }

  // ── Render: Python 7-Day Course Chart ──────────────────────────────────────
  function renderPythonCourseChart(data) {
    const chart = document.getElementById('weeklyActivityChart');
    if (!chart) return;

    const PYTHON_DAY_LABELS = [
      'Variables & Data Types',
      'Control Flow',
      'Functions & Scope',
      'Lists, Tuples & Strings',
      'Dictionaries & Sets',
      'File Handling & Modules',
      'OOP: Classes & Objects'
    ];

    // Build per-day scores from the child's recent quiz results
    const { recentResults = [] } = data;
    const dayScores = {};
    for (let d = 1; d <= 7; d++) dayScores[d] = null;

    // Match results to Python course days by topic
    recentResults.forEach(r => {
      if (!r.subject || r.subject.toLowerCase() !== 'python') return;
      for (let i = 0; i < PYTHON_DAY_LABELS.length; i++) {
        const topicLower = (r.topic || r.subject || '').toLowerCase();
        const labelLower = PYTHON_DAY_LABELS[i].toLowerCase();
        if (topicLower.includes(labelLower.substring(0, 8)) || labelLower.includes(topicLower.substring(0, 8))) {
          dayScores[i + 1] = r.score;
          break;
        }
      }
    });

    // Fallback: use overview average if no per-day breakdown found
    const hasPerDayData = Object.values(dayScores).some(v => v !== null);
    const overallAvg = data.overview?.averageScore;
    const totalAttempts = data.overview?.totalQuizAttempts || 0;

    const MAX_H = 160;

    chart.innerHTML = Array.from({length: 7}, (_, i) => {
      const day = i + 1;
      let score = dayScores[day];

      // If no per-day results but student has attempts, use overall avg for completed days
      if (score === null && !hasPerDayData && overallAvg !== null && day <= totalAttempts) {
        score = overallAvg;
      }

      const barH = score !== null && score > 0 ? Math.max(Math.round((score / 100) * MAX_H), 8) : 6;
      const color = score === null || score === 0 ? '#e2e8f0'
        : score >= 80 ? '#10b981'
        : score >= 60 ? '#f59e0b'
        : '#ef4444';
      const label = PYTHON_DAY_LABELS[i];

      return `
        <div class="flex flex-col items-center gap-1 group relative" style="flex:1">
          <div class="relative w-full flex items-end justify-center" style="height:${MAX_H}px">
            <div class="w-3/4 rounded-t-md transition-all duration-500"
                 style="height:${barH}px; background:${color}"
                 title="Day ${day}: ${label}${score !== null ? ' — ' + score + '%' : ' — Not started'}"></div>
            ${score !== null && score > 0 ? `
              <span class="absolute bottom-full mb-1 text-[10px] font-black" style="color:${color}">${score}%</span>` : ''}
          </div>
          <span class="text-[9px] text-slate-500 font-semibold text-center leading-tight" title="${label}">Day ${day}</span>
          <!-- Tooltip -->
          <div class="absolute bottom-full mb-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2.5 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
            <b>Day ${day}:</b> ${label}<br/>
            ${score !== null ? 'Score: ' + score + '%' : 'Not completed yet'}
          </div>
        </div>`;
    }).join('');

    // If no data at all, show empty state
    if (totalAttempts === 0 && !hasPerDayData) {
      chart.innerHTML = `
        <div class="w-full flex flex-col items-center justify-center text-center py-6 gap-2">
          <span class="material-symbols-outlined text-3xl text-slate-300">bar_chart</span>
          <p class="text-sm text-slate-400">No Python course data yet.</p>
          <p class="text-xs text-slate-300">Your child hasn't started the course.</p>
        </div>`;
    }
  }

  // ── Render: Smart Suggestion ──────────────────────────────────────────────────
  function renderSmartSuggestion(data) {
    const el = document.getElementById('smartSuggestionText');
    if (!el) return;
    const name = data.child.name?.split(' ')[0] || 'Your child';
    const { weakAreas = [], overview } = data;

    if (weakAreas.length > 0) {
      el.textContent = `Focus on ${weakAreas[0].subject} this week — ${name} scored ${weakAreas[0].averageScore}% there. Short daily practice sessions will help!`;
    } else if (overview.currentStreak > 0) {
      el.textContent = `${name} has a ${overview.currentStreak}-day streak! Keep the momentum going by logging in daily.`;
    } else {
      el.textContent = `Encourage ${name} to complete at least one topic per day to build a consistent study habit.`;
    }
  }

  // ── Render: No Children Linked ────────────────────────────────────────────────
  function renderEmptyState() {
    const main = document.getElementById('parentMainContent');
    if (!main) return;
    main.innerHTML = `
      <div class="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div class="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
          <span class="material-symbols-outlined text-emerald-500 text-4xl">child_care</span>
        </div>
        <div class="text-center max-w-sm">
          <h2 class="text-xl font-bold text-emerald-900 mb-2">No children linked yet</h2>
          <p class="text-slate-500 text-sm">Link your child's AMEP account to start monitoring their progress.</p>
        </div>
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 w-full max-w-sm">
          <label class="block text-sm font-semibold text-slate-700 mb-2">Child's Email Address</label>
          <input id="linkChildEmailEmpty" type="email" placeholder="student@example.com"
            class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-3" />
          <button onclick="window.parentLinkChild()" id="linkChildBtnEmpty"
            class="w-full bg-emerald-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-emerald-800 transition-colors">
            Link Child Account
          </button>
          <p id="linkChildErrorEmpty" class="text-red-500 text-xs mt-2 hidden"></p>
        </div>
      </div>`;
  }

  // ── Render Full Child View ────────────────────────────────────────────────────
  async function renderChild(idx) {
    activeChildIdx = idx;
    const data = childrenData[idx];
    if (!data) return;

    // Update tab highlights
    renderChildTabs(childrenData);

    // Render all sections
    renderChildOverview(data);
    renderWeeklySummary(data);
    renderStrengthsWeakAreas(data);
    renderRecentActivity(data);
    renderSmartSuggestion(data);

    // Render Python Course chart
    const weeklySection = document.getElementById('weeklyChartSection');
    if (weeklySection) weeklySection.style.display = 'block';
    renderPythonCourseChart(data);

    // Remove skeleton pulses
    document.querySelectorAll('.skeleton-pulse').forEach(el => el.classList.remove('skeleton-pulse'));
  }

  // ── Public: Switch Child ──────────────────────────────────────────────────────
  window.parentSwitchChild = async function (idx) {
    activeChildIdx = idx;
    await renderChild(idx);
  };

  // ── Public: Link Child ────────────────────────────────────────────────────────
  window.parentLinkChild = async function () {
    const emailEl = document.getElementById('linkChildEmail') || document.getElementById('linkChildEmailEmpty');
    const btn = document.getElementById('linkChildBtn') || document.getElementById('linkChildBtnEmpty');
    const errEl = document.getElementById('linkChildError') || document.getElementById('linkChildErrorEmpty');

    const email = emailEl?.value?.trim();
    if (!email) {
      if (errEl) { errEl.textContent = 'Please enter an email address.'; errEl.classList.remove('hidden'); }
      return;
    }

    if (btn) { btn.textContent = 'Linking…'; btn.disabled = true; }
    if (errEl) errEl.classList.add('hidden');

    try {
      await linkChild(email);
      showToast('Child account linked! Refreshing…');
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      if (errEl) { errEl.textContent = e.message; errEl.classList.remove('hidden'); }
      showToast(e.message, 'error');
    } finally {
      if (btn) { btn.textContent = 'Link Child Account'; btn.disabled = false; }
    }
  };

  // ── Sidebar child info ────────────────────────────────────────────────────────
  function renderSidebarChild(data) {
    const p = avatarPalette(data.child.name);
    const sideAvatar = document.getElementById('sidebarChildAvatar');
    if (sideAvatar) {
      sideAvatar.style.background = p.bg;
      sideAvatar.style.color = p.text;
      sideAvatar.textContent = getInitials(data.child.name);
    }
    setText('sidebarChildName', `${data.child.name}`);
    setText('sidebarChildGrade', `Grade ${data.child.grade || '?'}`);
  }

  // ── Init ──────────────────────────────────────────────────────────────────────
  async function init() {
    showSkeletons();
    try {
      const result = await fetchParentDashboard();
      childrenData = result.children || [];

      if (childrenData.length === 0) {
        renderEmptyState();
        return;
      }

      // Show the main content area (hidden by default behind a loading veil)
      const veil = document.getElementById('parentLoadingVeil');
      if (veil) veil.style.display = 'none';

      // Render tabs if multiple children
      renderChildTabs(childrenData);

      // Render sidebar for first child
      renderSidebarChild(childrenData[0]);

      // Render first child
      await renderChild(0);

    } catch (e) {
      console.error('[parent.js] init error:', e);
      showToast('Failed to load dashboard: ' + e.message, 'error');
    }
  }

  // ── Utility ───────────────────────────────────────────────────────────────────
  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function capitalise(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
