/**
 * LeksaLaw — App Core JavaScript
 * Handles: sidebar, theme, search, navigation, rendering
 */

/* ── Theme Management ── */
const Theme = {
  get() { return localStorage.getItem('leksalaw_theme') || 'light'; },
  set(t) {
    localStorage.setItem('leksalaw_theme', t);
    document.documentElement.setAttribute('data-theme', t);
    const btn = document.getElementById('theme-btn');
    if (btn) btn.textContent = t === 'dark' ? '☀️' : '🌙';
  },
  toggle() { Theme.set(Theme.get() === 'dark' ? 'light' : 'dark'); },
  init()   { Theme.set(Theme.get()); }
};

/* ── Sidebar Management ── */
const Sidebar = {
  collapsed: false,
  mobileOpen: false,

  init() {
    this.collapsed = localStorage.getItem('sidebar_collapsed') === 'true';
    this._apply();
    this._buildNav();

    // Toggle button
    const toggleBtn = document.getElementById('sidebar-toggle');
    if (toggleBtn) toggleBtn.addEventListener('click', () => this.toggle());

    // Mobile overlay
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) overlay.addEventListener('click', () => this.closeMobile());

    // Mark active nav item
    this._markActive();
  },

  toggle() {
    if (window.innerWidth <= 768) {
      this.mobileOpen = !this.mobileOpen;
      this._applyMobile();
    } else {
      this.collapsed = !this.collapsed;
      localStorage.setItem('sidebar_collapsed', this.collapsed);
      this._apply();
    }
  },

  closeMobile() {
    this.mobileOpen = false;
    this._applyMobile();
  },

  _apply() {
    const sidebar = document.getElementById('app-sidebar');
    const main = document.getElementById('main-content');
    if (!sidebar) return;
    sidebar.classList.toggle('collapsed', this.collapsed);
    if (main) main.classList.toggle('sidebar-collapsed', this.collapsed);
  },

  _applyMobile() {
    const sidebar = document.getElementById('app-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (!sidebar) return;
    sidebar.classList.toggle('mobile-open', this.mobileOpen);
    if (overlay) overlay.classList.toggle('active', this.mobileOpen);
  },

  _buildNav() {
    const semContainer = document.getElementById('nav-semesters');
    if (!semContainer || typeof COURSES === 'undefined') return;

    // Group by semester
    const bySem = {};
    COURSES.forEach(c => {
      if (!bySem[c.semester]) bySem[c.semester] = [];
      bySem[c.semester].push(c);
    });

    let html = '';
    Object.keys(bySem).sort((a,b) => a-b).forEach(sem => {
      const courses = bySem[sem];
      html += `
        <div class="nav-item" onclick="Sidebar._toggleSem(this, 'sem-${sem}')">
          <span class="nav-icon">📚</span>
          <span class="nav-label">Semester ${sem}</span>
          <span class="nav-badge">${courses.length}</span>
        </div>
        <div class="nav-submenu" id="nav-sem-${sem}">
          ${courses.map(c => `
            <a class="nav-subitem" href="index.html#course-${c.id}">
              ${c.icon} ${c.name}
            </a>
          `).join('')}
        </div>`;
    });
    semContainer.innerHTML = html;
  },

  _toggleSem(el, semId) {
    const menu = document.getElementById(`nav-${semId}`);
    if (!menu) return;
    const isOpen = menu.classList.contains('open');
    // Close all
    document.querySelectorAll('.nav-submenu').forEach(m => m.classList.remove('open'));
    if (!isOpen) menu.classList.add('open');
  },

  _markActive() {
    const page = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });
  }
};

/* ── Search ── */
const Search = {
  open() {
    const overlay = document.getElementById('search-overlay');
    if (overlay) {
      overlay.classList.add('open');
      setTimeout(() => document.getElementById('search-input')?.focus(), 50);
    }
  },
  close() {
    const overlay = document.getElementById('search-overlay');
    if (overlay) overlay.classList.remove('open');
  },
  query(q) {
    if (typeof COURSES === 'undefined') return [];
    const term = q.toLowerCase().trim();
    if (!term) return [];
    const results = [];
    COURSES.forEach(course => {
      if (course.name.toLowerCase().includes(term) ||
          course.code.toLowerCase().includes(term) ||
          (course.description || '').toLowerCase().includes(term)) {
        results.push({ type: 'course', course, quiz: null });
      }
      course.quizzes.forEach(quiz => {
        if (quiz.title.toLowerCase().includes(term) ||
            quiz.subtitle.toLowerCase().includes(term)) {
          results.push({ type: 'quiz', course, quiz });
        }
      });
    });
    return results.slice(0, 8);
  },
  render(results) {
    const container = document.getElementById('search-results');
    if (!container) return;
    if (!results.length) {
      container.innerHTML = `<div class="search-empty">
        <div style="font-size:32px;margin-bottom:8px">🔍</div>
        <div>Tidak ada hasil ditemukan</div>
      </div>`;
      return;
    }
    container.innerHTML = results.map(r => {
      if (r.type === 'course') {
        return `<div class="search-result-item" onclick="Search.close(); Dashboard.showCourse('${r.course.id}')">
          <span class="search-result-icon">${r.course.icon}</span>
          <div class="search-result-info">
            <div class="search-result-title">${r.course.name}</div>
            <div class="search-result-sub">Semester ${r.course.semester} · ${r.course.quizzes.length} Quiz</div>
          </div>
        </div>`;
      } else {
        return `<div class="search-result-item" onclick="Search.close(); window.location.href='${r.quiz.file}'">
          <span class="search-result-icon">📝</span>
          <div class="search-result-info">
            <div class="search-result-title">${r.quiz.title}</div>
            <div class="search-result-sub">${r.course.name} · ${r.quiz.totalQuestions} soal</div>
          </div>
        </div>`;
      }
    }).join('');
  },
  init() {
    const input = document.getElementById('search-input');
    if (input) {
      input.addEventListener('input', e => {
        const results = Search.query(e.target.value);
        Search.render(results);
      });
    }
    // Keyboard shortcut Ctrl+K / Cmd+K
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        Search.open();
      }
      if (e.key === 'Escape') Search.close();
    });
    // Header search click
    const headerSearchTrigger = document.getElementById('header-search-trigger');
    if (headerSearchTrigger) {
      headerSearchTrigger.addEventListener('click', () => Search.open());
    }
  }
};

/* ── Toast Notifications ── */
const Toast = {
  show(msg, duration = 2500) {
    let t = document.getElementById('app-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'app-toast';
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), duration);
  }
};

/* ── Dashboard Renderer ── */
const Dashboard = {
  currentSem: 'all',

  init() {
    if (!document.getElementById('course-grid')) return;
    this._renderStats();
    this._renderSemTabs();
    this._renderCourses('all');
    this._renderRecent();
    this._renderFavorites();
  },

  _renderStats() {
    if (typeof getStats === 'undefined') return;
    const stats = getStats();
    const progress = getProgress();
    const doneCount = Object.keys(progress).length;

    const el = id => document.getElementById(id);
    if (el('stat-courses'))   el('stat-courses').textContent   = stats.totalCourses;
    if (el('stat-quizzes'))   el('stat-quizzes').textContent   = stats.totalQuizzes;
    if (el('stat-questions')) el('stat-questions').textContent = stats.totalQuestions;
    if (el('stat-done'))      el('stat-done').textContent      = doneCount;
  },

  _renderSemTabs() {
    const tabs = document.getElementById('sem-tabs');
    if (!tabs || typeof COURSES === 'undefined') return;
    const sems = [...new Set(COURSES.map(c => c.semester))].sort((a,b) => a-b);
    tabs.innerHTML = `<button class="sem-tab active" onclick="Dashboard.filterSem('all', this)">Semua</button>`
      + sems.map(s => `<button class="sem-tab" onclick="Dashboard.filterSem(${s}, this)">Semester ${s}</button>`).join('');
  },

  filterSem(sem, btn) {
    this.currentSem = sem;
    document.querySelectorAll('.sem-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    this._renderCourses(sem);
  },

  _renderCourses(sem) {
    const grid = document.getElementById('course-grid');
    if (!grid || typeof COURSES === 'undefined') return;
    const filtered = sem === 'all' ? COURSES : COURSES.filter(c => c.semester === sem);
    if (!filtered.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">📚</div>
        <div class="empty-title">Belum ada mata kuliah</div>
        <div class="empty-sub">Semester ini belum memiliki mata kuliah terdaftar.</div>
      </div>`;
      return;
    }
    grid.innerHTML = filtered.map(c => this._courseCard(c)).join('');
    // Animate
    grid.querySelectorAll('.course-card').forEach((el, i) => {
      el.style.animationDelay = `${i * 60}ms`;
      el.classList.add('animate-in');
    });
  },

  _courseCard(course) {
    const progress = getProgress();
    const done = course.quizzes.filter(q => progress[q.id]).length;
    const pct = course.quizzes.length ? Math.round(done / course.quizzes.length * 100) : 0;
    const totalQ = course.quizzes.reduce((s, q) => s + q.totalQuestions, 0);
    return `
      <div class="course-card" onclick="Dashboard.showCourse('${course.id}')" id="course-${course.id}">
        <div class="course-header">
          <div class="course-icon-wrap" style="background:${course.color}20">
            <span style="font-size:22px">${course.icon}</span>
          </div>
          <div class="course-info">
            <div class="course-code">${course.code}</div>
            <div class="course-name">${course.name}</div>
            <div class="course-sem">Semester ${course.semester}</div>
          </div>
        </div>
        <div class="course-desc">${course.description || ''}</div>
        <div class="course-footer">
          <div class="quiz-count">📝 ${course.quizzes.length} Quiz · ${totalQ} soal</div>
          ${pct > 0 ? `
            <div class="progress-mini">
              <div class="progress-bar-mini">
                <div class="progress-fill-mini" style="width:${pct}%"></div>
              </div>
              <span class="progress-text-mini">${pct}%</span>
            </div>` : ''}
        </div>
      </div>`;
  },

  showCourse(courseId) {
    if (typeof COURSES === 'undefined') return;
    const course = COURSES.find(c => c.id === courseId);
    if (!course) return;

    const modal = document.getElementById('course-modal');
    const modalContent = document.getElementById('course-modal-content');
    if (!modal || !modalContent) return;

    const progress = getProgress();
    const totalQ = course.quizzes.reduce((s, q) => s + q.totalQuestions, 0);

    modalContent.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:20px;">
        <div style="width:56px;height:56px;border-radius:14px;background:${course.color}20;display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0">${course.icon}</div>
        <div>
          <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.8px">${course.code}</div>
          <div style="font-size:20px;font-weight:800;color:var(--text);margin:2px 0">${course.name}</div>
          <div style="font-size:13px;color:var(--text-muted)">Semester ${course.semester} · ${course.quizzes.length} Quiz · ${totalQ} soal</div>
        </div>
      </div>
      <p style="font-size:14px;color:var(--text-sec);margin-bottom:20px;line-height:1.6">${course.description || ''}</p>
      <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px">Daftar Quiz</div>
      <div class="quiz-list">
        ${course.quizzes.map((quiz, i) => {
          const prog = progress[quiz.id];
          const favs = getFavorites();
          const isFav = favs.includes(quiz.id);
          return `
            <a href="${quiz.file}" class="quiz-item">
              <div class="quiz-num">${i+1}</div>
              <div class="quiz-info">
                <div class="quiz-title">${quiz.title}</div>
                <div class="quiz-sub">${quiz.subtitle}</div>
              </div>
              <div class="quiz-meta">
                <span class="level-badge level-${quiz.level}">${quiz.level}</span>
                ${prog ? `<span class="quiz-score">Nilai: ${prog.score}%</span>` : ''}
                <button onclick="event.preventDefault();event.stopPropagation();Dashboard._toggleFav('${quiz.id}',this)" 
                  style="background:none;border:none;cursor:pointer;font-size:16px;padding:2px 4px"
                  title="${isFav ? 'Hapus dari favorit' : 'Tambah ke favorit'}">${isFav ? '⭐' : '☆'}</button>
              </div>
              <span class="quiz-arrow">→</span>
            </a>`;
        }).join('')}
      </div>`;

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  _toggleFav(quizId, btn) {
    const isNowFav = toggleFavorite(quizId);
    btn.textContent = isNowFav ? '⭐' : '☆';
    Toast.show(isNowFav ? '⭐ Ditambahkan ke Favorit' : '☆ Dihapus dari Favorit');
    this._renderFavorites();
  },

  hideModal() {
    const modal = document.getElementById('course-modal');
    if (modal) modal.classList.remove('open');
    document.body.style.overflow = '';
  },

  _renderRecent() {
    const container = document.getElementById('recent-list');
    if (!container || typeof COURSES === 'undefined') return;
    const progress = getProgress();
    const recentEntries = Object.entries(progress)
      .sort((a, b) => new Date(b[1].updatedAt) - new Date(a[1].updatedAt))
      .slice(0, 4);
    if (!recentEntries.length) {
      container.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px">Belum ada aktivitas belajar</div>`;
      return;
    }
    let html = '';
    recentEntries.forEach(([quizId, data]) => {
      let found = null, foundCourse = null;
      COURSES.forEach(c => { const q = c.quizzes.find(q => q.id === quizId); if (q) { found = q; foundCourse = c; } });
      if (!found) return;
      const date = new Date(data.updatedAt).toLocaleDateString('id-ID', { day:'numeric', month:'short' });
      html += `<a href="${found.file}" class="quiz-item" style="margin-bottom:8px">
        <span style="font-size:20px">${foundCourse.icon}</span>
        <div class="quiz-info">
          <div class="quiz-title">${found.title}</div>
          <div class="quiz-sub">${foundCourse.name} · ${date}</div>
        </div>
        <span class="quiz-score">Nilai: ${data.score}%</span>
        <span class="quiz-arrow">→</span>
      </a>`;
    });
    container.innerHTML = html || `<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px">Belum ada aktivitas</div>`;
  },

  _renderFavorites() {
    const container = document.getElementById('favorites-list');
    if (!container || typeof COURSES === 'undefined') return;
    const favs = getFavorites();
    if (!favs.length) {
      container.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px">Belum ada quiz favorit</div>`;
      return;
    }
    let html = '';
    favs.forEach(quizId => {
      let found = null, foundCourse = null;
      COURSES.forEach(c => { const q = c.quizzes.find(q => q.id === quizId); if (q) { found = q; foundCourse = c; } });
      if (!found) return;
      html += `<a href="${found.file}" class="quiz-item" style="margin-bottom:8px">
        <span style="font-size:20px">⭐</span>
        <div class="quiz-info">
          <div class="quiz-title">${found.title}</div>
          <div class="quiz-sub">${foundCourse.name}</div>
        </div>
        <span class="quiz-arrow">→</span>
      </a>`;
    });
    container.innerHTML = html || `<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px">Belum ada favorit</div>`;
  }
};

/* ── Course Modal ── */
function initModal() {
  const modal = document.getElementById('course-modal');
  if (!modal) return;
  modal.addEventListener('click', e => {
    if (e.target === modal) Dashboard.hideModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') Dashboard.hideModal();
  });
}

/* ── Init All ── */
document.addEventListener('DOMContentLoaded', () => {
  Theme.init();
  Sidebar.init();
  Search.init();
  Dashboard.init();
  initModal();

  // Theme button
  const themeBtn = document.getElementById('theme-btn');
  if (themeBtn) themeBtn.addEventListener('click', () => Theme.toggle());

  // Search open
  const searchBtn = document.getElementById('search-btn');
  if (searchBtn) searchBtn.addEventListener('click', () => Search.open());

  // Header search box click
  const headerSearch = document.querySelector('.header-search');
  if (headerSearch) headerSearch.addEventListener('click', () => Search.open());
});
