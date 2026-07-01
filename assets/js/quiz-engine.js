/**
 * LeksaLaw — Quiz Engine
 * Handles: mode, shuffle, navigation, scoring, persistence
 * 
 * USAGE: Setiap file quiz men-inject `QUIZ_DATA` lalu memanggil QuizEngine.init()
 * 
 * QUIZ_DATA format:
 * {
 *   quizId: "BIK_Q1",
 *   courseId: "BIK",
 *   title: "Quiz 1",
 *   questions: [
 *     {
 *       topic: "...",         // tag topik
 *       q: "...",             // teks pertanyaan (boleh HTML)
 *       opts: ["a","b","c","d","e"],
 *       correct: 0,           // index jawaban benar (0-based)
 *       source: "...",        // opsional: referensi sumber
 *       explanation: "..."    // opsional: penjelasan
 *     }
 *   ]
 * }
 */

const QuizEngine = {
  // State
  data: null,
  questions: [],
  answers: {},
  flagged: new Set(),
  mode: 'study',       // 'study' | 'exam'
  shuffle: false,
  currentIdx: 0,
  reviewMode: false,
  started: false,
  _origMapping: [],    // maps display index → original index (for shuffle)

  /* ═══════════════════ INIT ═══════════════════ */
  init(quizData) {
    this.data = quizData;
    Theme.init();
    this._renderSetup();
    this._bindSetup();
    this._loadSavedSession();
  },

  /* ═══════════════════ SETUP ═══════════════════ */
  _renderSetup() {
    const d = this.data;
    const totalQ = d.questions.length;
    const topics = [...new Set(d.questions.map(q => q.topic).filter(Boolean))];

    document.getElementById('setup-quiz-title').textContent  = d.title || 'Quiz';
    document.getElementById('setup-quiz-course').textContent = d.courseName || '';
    document.getElementById('setup-stat-q').textContent      = totalQ;
    document.getElementById('setup-stat-t').textContent      = topics.length || '-';

    // Score history
    const prog = getQuizProgress(d.quizId);
    const histEl = document.getElementById('score-history');
    if (prog && histEl) {
      histEl.style.display = 'block';
      histEl.innerHTML = `<div class="score-hist-title">📊 Riwayat Nilai</div>
        <div class="score-hist-items">
          <span class="score-hist-badge">Nilai Terakhir: ${prog.score}%</span>
          <span class="score-hist-badge">Benar: ${prog.correct}/${prog.total}</span>
          <span class="score-hist-badge">${new Date(prog.updatedAt).toLocaleDateString('id-ID')}</span>
        </div>`;
    }
  },

  _bindSetup() {
    document.getElementById('btn-start-quiz')?.addEventListener('click', () => this.start());

    // Mode radio
    document.querySelectorAll('.mode-opt').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('.mode-opt').forEach(m => m.classList.remove('selected'));
        el.classList.add('selected');
        const radio = el.querySelector('input[type="radio"]');
        if (radio) { radio.checked = true; this.mode = radio.value; }
      });
    });

    // Shuffle
    const shuffleChk = document.getElementById('opt-shuffle');
    if (shuffleChk) shuffleChk.addEventListener('change', e => { this.shuffle = e.target.checked; });
  },

  _loadSavedSession() {
    try {
      const key = `leksalaw_session_${this.data.quizId}`;
      const saved = localStorage.getItem(key);
      if (!saved) return;
      const d = JSON.parse(saved);
      if (!d || !d.answers) return;
      if (confirm('Lanjutkan sesi sebelumnya?')) {
        this.answers = d.answers || {};
        this.flagged = new Set(d.flagged || []);
        this.mode    = d.mode || 'study';
        this.shuffle = d.shuffle || false;
        this._buildQuestions(d.questionOrder);
        this.currentIdx = d.currentIdx || 0;
        this._startQuiz();
        this.renderQuestion(this.currentIdx);
      }
    } catch(e) {}
  },

  /* ═══════════════════ START ═══════════════════ */
  start() {
    this.answers   = {};
    this.flagged   = new Set();
    this.reviewMode = false;
    this.currentIdx = 0;
    this._buildQuestions();
    this._startQuiz();
    this.renderQuestion(0);
  },

  _buildQuestions(savedOrder) {
    const orig = this.data.questions;
    if (savedOrder) {
      this.questions = savedOrder.map(i => ({ ...orig[i], _origIdx: i }));
      return;
    }
    if (this.shuffle) {
      const shuffled = [...orig.map((q, i) => ({ ...q, _origIdx: i }))];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      if (this.shuffle) {
        this.questions = shuffled.map(q => {
          const opts = [...q.opts];
          const correctText = opts[q.correct];
          for (let i = opts.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [opts[i], opts[j]] = [opts[j], opts[i]];
          }
          return { ...q, opts, correct: opts.indexOf(correctText) };
        });
      } else {
        this.questions = shuffled;
      }
    } else {
      this.questions = orig.map((q, i) => ({ ...q, _origIdx: i }));
    }
  },

  _startQuiz() {
    this.started = true;
    document.getElementById('quiz-setup-screen').style.display  = 'none';
    document.getElementById('quiz-main-screen').style.display   = 'block';
    document.getElementById('quiz-result-screen').style.display = 'none';
    document.getElementById('quiz-footer').classList.add('visible');
    this._buildNavGrid();
    this._updateProgress();
    this._saveSession();
  },

  /* ═══════════════════ RENDER QUESTION ═══════════════════ */
  renderQuestion(idx) {
    this.currentIdx = idx;
    const q        = this.questions[idx];
    const answered = this.answers[idx] !== undefined;
    const total    = this.questions.length;
    const LETTERS  = ['A','B','C','D','E'];

    // Progress bar & label
    document.getElementById('progress-label').textContent = `Soal ${idx+1} / ${total}`;
    const pct = ((idx+1) / total * 100).toFixed(0);
    document.getElementById('quiz-progress-fill').style.width = pct + '%';
    document.getElementById('quiz-label').textContent = `Soal ${idx+1} dari ${total}`;

    // Options HTML
    const optHtml = (q.opts || []).map((opt, i) => {
      let cls = 'option';
      const isAnswered = answered || this.reviewMode;
      if (isAnswered) {
        if (i === q.correct)                    cls += ' correct disabled';
        else if (i === this.answers[idx])        cls += ' wrong disabled';
        else                                     cls += ' disabled';
      } else if (this.answers[idx] === i) {
        cls += ' selected';
      }
      const clickable = (!answered && !this.reviewMode) ? `onclick="QuizEngine.selectOption(${i})"` : '';
      return `<div class="${cls}" ${clickable} role="button">
        <span class="opt-letter">${LETTERS[i]}</span>
        <span>${opt}</span>
      </div>`;
    }).join('');

    // Explanation
    const showExp = (this.mode === 'study' && answered) || this.reviewMode;
    let expHtml = '';
    if (showExp) {
      const isCorrect = this.answers[idx] === q.correct;
      expHtml = `<div class="explanation show">
        <div class="explanation-title">${isCorrect ? '✅ Jawaban Benar' : `❌ Jawaban Benar: ${LETTERS[q.correct]}`}</div>
        ${q.explanation ? `<div>${q.explanation}</div>` : ''}
        ${q.source ? `<div class="explanation-source">📖 ${q.source}</div>` : ''}
      </div>`;
    }

    // Render
    document.getElementById('q-container').innerHTML = `
      <div class="q-card animate-in">
        <div class="q-meta">
          ${q.topic ? `<span class="q-topic-tag">${q.topic}</span>` : ''}
          ${q.source ? `<span class="q-src">${q.source}</span>` : ''}
          <span class="q-num">Soal ${idx+1}</span>
        </div>
        <div class="q-text">${q.q}</div>
        <div class="options">${optHtml}</div>
        ${expHtml}
      </div>`;

    // Footer buttons
    document.getElementById('btn-prev').disabled = idx === 0;
    const isLast = idx === total - 1;
    document.getElementById('btn-next').style.display   = isLast ? 'none' : '';
    document.getElementById('btn-finish').style.display = isLast ? '' : 'none';

    const flagBtn = document.getElementById('btn-flag-toggle');
    if (flagBtn) {
      flagBtn.classList.toggle('active', this.flagged.has(idx));
      flagBtn.textContent = this.flagged.has(idx) ? '🚩 Ditandai' : '🚩 Tandai Ragu';
    }

    this._updateNavGrid();
    this._saveSession();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /* ═══════════════════ SELECT OPTION ═══════════════════ */
  selectOption(optIdx) {
    if (this.reviewMode) return;
    if (this.mode === 'study' && this.answers[this.currentIdx] !== undefined) return;
    this.answers[this.currentIdx] = optIdx;

    const q     = this.questions[this.currentIdx];
    const LETTERS = ['A','B','C','D','E'];

    document.querySelectorAll('.option').forEach((el, i) => {
      el.classList.remove('selected','correct','wrong');
      el.onclick = null;
      el.classList.add('disabled');
      if (i === q.correct) el.classList.add('correct');
      else if (i === optIdx && i !== q.correct) el.classList.add('wrong');
    });

    if (this.mode === 'study') {
      const isCorrect = optIdx === q.correct;
      let expHtml = `<div class="explanation show">
        <div class="explanation-title">${isCorrect ? '✅ Benar!' : `❌ Jawaban Benar: ${LETTERS[q.correct]}`}</div>
        ${q.explanation ? `<div>${q.explanation}</div>` : ''}
        ${q.source ? `<div class="explanation-source">📖 ${q.source}</div>` : ''}
      </div>`;
      const existing = document.querySelector('.explanation');
      if (existing) existing.outerHTML = expHtml;
      else document.querySelector('.q-card').insertAdjacentHTML('beforeend', expHtml);
    }

    this._updateNavGrid();
    this._saveSession();
  },

  /* ═══════════════════ NAV GRID ═══════════════════ */
  _buildNavGrid() {
    const grid = document.getElementById('nav-grid');
    if (!grid) return;
    grid.innerHTML = this.questions.map((_, i) =>
      `<button class="nav-btn" id="nav-btn-${i}" onclick="QuizEngine.renderQuestion(${i})">${i+1}</button>`
    ).join('');
  },

  _updateNavGrid() {
    this.questions.forEach((_, i) => {
      const el = document.getElementById(`nav-btn-${i}`);
      if (!el) return;
      el.className = 'nav-btn';
      if (i === this.currentIdx)           el.classList.add('active');
      if (this.flagged.has(i))             el.classList.add('flagged');
      else if (this.answers[i] !== undefined) el.classList.add('answered');
    });
  },

  /* ═══════════════════ NAVIGATION ═══════════════════ */
  prev() {
    if (this.currentIdx > 0) this.renderQuestion(this.currentIdx - 1);
  },
  next() {
    if (this.currentIdx < this.questions.length - 1) this.renderQuestion(this.currentIdx + 1);
  },
  toggleFlag() {
    const idx = this.currentIdx;
    if (this.flagged.has(idx)) this.flagged.delete(idx); else this.flagged.add(idx);
    this.renderQuestion(idx);
  },
  _updateProgress() {
    const pct = ((this.currentIdx+1) / this.questions.length * 100).toFixed(0);
    const fill = document.getElementById('quiz-progress-fill');
    if (fill) fill.style.width = pct + '%';
  },

  /* ═══════════════════ FINISH ═══════════════════ */
  finish() {
    const unanswered = this.questions.filter((_, i) => this.answers[i] === undefined).length;
    if (unanswered > 0) {
      if (!confirm(`Masih ada ${unanswered} soal belum dijawab. Selesaikan kuis?`)) return;
    }
    this._showResult();
  },

  _showResult() {
    let correct = 0;
    const topicMap = {};
    const LETTERS  = ['A','B','C','D','E'];

    this.questions.forEach((q, i) => {
      const t = q.topic || 'Umum';
      if (!topicMap[t]) topicMap[t] = { total: 0, correct: 0 };
      topicMap[t].total++;
      if (this.answers[i] === q.correct) { correct++; topicMap[t].correct++; }
    });

    const total = this.questions.length;
    const pct   = Math.round(correct / total * 100);

    // Save progress
    if (typeof saveProgress !== 'undefined') {
      saveProgress(this.data.quizId, { score: pct, correct, total });
    }
    this._clearSession();

    // Screens
    document.getElementById('quiz-setup-screen').style.display  = 'none';
    document.getElementById('quiz-main-screen').style.display   = 'none';
    document.getElementById('quiz-footer').classList.remove('visible');
    document.getElementById('quiz-result-screen').style.display = 'block';

    // Grade
    let grade, gradeClass;
    if      (pct >= 85) { grade = '🏆 Sangat Baik!';   gradeClass = 'verdict-a'; }
    else if (pct >= 70) { grade = '✅ Baik';            gradeClass = 'verdict-b'; }
    else if (pct >= 55) { grade = '📚 Cukup';          gradeClass = 'verdict-c'; }
    else                { grade = '💪 Perlu Belajar Lagi'; gradeClass = 'verdict-d'; }

    document.getElementById('result-pct').textContent  = pct + '%';
    document.getElementById('result-detail').textContent = `${correct} benar dari ${total} soal`;
    const verdict = document.getElementById('result-verdict');
    verdict.textContent  = grade;
    verdict.className    = `score-verdict ${gradeClass}`;

    // Topic stats
    const topicsEl = document.getElementById('result-topics');
    topicsEl.innerHTML = Object.entries(topicMap)
      .sort((a,b) => (b[1].correct/b[1].total) - (a[1].correct/a[1].total))
      .map(([t, s]) => {
        const p = Math.round(s.correct / s.total * 100);
        const color = p >= 70 ? 'var(--correct)' : p >= 40 ? 'var(--flag)' : 'var(--wrong)';
        return `<div class="topic-row">
          <span class="topic-name">${t}</span>
          <div class="topic-bar-bg"><div class="topic-bar-fill" style="width:${p}%;background:${color}"></div></div>
          <span class="topic-pct">${s.correct}/${s.total} (${p}%)</span>
        </div>`;
      }).join('');

    // Wrong answers
    const wrongEl = document.getElementById('result-wrongs');
    const wrongs = this.questions.map((q, i) => ({q, i}))
      .filter(({q,i}) => this.answers[i] !== undefined && this.answers[i] !== q.correct);
    if (!wrongs.length) {
      wrongEl.innerHTML = '<div style="color:var(--correct);padding:12px 0;font-weight:600">✅ Semua soal dijawab dengan benar!</div>';
    } else {
      wrongEl.innerHTML = wrongs.map(({q, i}) => `
        <div class="wrong-item">
          <div class="wrong-q-label">Soal ${i+1} · ${q.topic || ''}</div>
          <div class="wrong-text">${q.q.length > 100 ? q.q.slice(0,100)+'…' : q.q}</div>
          <div class="wrong-yours">❌ Jawaban Anda: ${LETTERS[this.answers[i]]}. ${q.opts[this.answers[i]] || '(tidak dijawab)'}</div>
          <div class="wrong-correct">✅ Benar: ${LETTERS[q.correct]}. ${q.opts[q.correct]}</div>
        </div>`).join('');
    }
  },

  review() {
    this.reviewMode = true;
    this.currentIdx = 0;
    document.getElementById('quiz-setup-screen').style.display  = 'none';
    document.getElementById('quiz-main-screen').style.display   = 'block';
    document.getElementById('quiz-result-screen').style.display = 'none';
    document.getElementById('quiz-footer').classList.add('visible');
    document.getElementById('btn-finish').style.display = 'none';
    this._buildNavGrid();
    this.renderQuestion(0);
  },

  restart() {
    location.reload();
  },

  /* ═══════════════════ SESSION PERSISTENCE ═══════════════════ */
  _saveSession() {
    try {
      const key = `leksalaw_session_${this.data.quizId}`;
      localStorage.setItem(key, JSON.stringify({
        currentIdx: this.currentIdx,
        answers:    this.answers,
        flagged:    [...this.flagged],
        mode:       this.mode,
        shuffle:    this.shuffle,
        questionOrder: this.questions.map(q => q._origIdx)
      }));
    } catch(e) {}
  },

  _clearSession() {
    try {
      localStorage.removeItem(`leksalaw_session_${this.data.quizId}`);
    } catch(e) {}
  }
};

/* ── Global keyboard shortcuts for quiz ── */
document.addEventListener('keydown', e => {
  if (!QuizEngine.started) return;
  if (['1','2','3','4','5'].includes(e.key)) QuizEngine.selectOption(parseInt(e.key)-1);
  if (e.key === 'ArrowRight') QuizEngine.next();
  if (e.key === 'ArrowLeft')  QuizEngine.prev();
  if (e.key === 'f' || e.key === 'F') QuizEngine.toggleFlag();
});
