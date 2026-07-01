/**
 * LeksaLaw — Konfigurasi Mata Kuliah & Quiz
 * ============================================
 * Untuk menambah mata kuliah baru:
 *   1. Tambahkan entri pada array COURSES
 *   2. Letakkan file quiz di folder yang sesuai
 *   3. Daftarkan quiz di array quizzes pada mata kuliah tersebut
 *
 * Untuk menambah quiz baru:
 *   1. Salin file quiz yang sudah ada
 *   2. Edit soal/jawaban sesuai kebutuhan
 *   3. Tambahkan entri pada array quizzes di mata kuliah yang sesuai
 */

const APP_CONFIG = {
  name: "LeksaLaw",
  subtitle: "Platform Belajar Hukum Offline",
  version: "1.0.0",
  author: "Marhansyah — 049875526",
  description: "Sistem kuis mandiri untuk mahasiswa Ilmu Hukum",
  lastUpdated: "2026"
};

/**
 * Daftar Semester & Mata Kuliah
 * id: unik, tidak boleh berulang
 * slug: untuk URL dan nama file
 * semester: nomor semester (1-8)
 * color: warna aksen kartu mata kuliah
 */
const COURSES = [
  // ─── SEMESTER 6 ───────────────────────────────────────────
  {
    id: "BIK",
    slug: "bahasa-inggris-komunikasi",
    name: "Bahasa Inggris Komunikasi II",
    semester: 6,
    code: "BING4329",
    color: "#2563eb",
    icon: "🌐",
    description: "Grammar, indirect speech, passive voice, comparative & superlative, paragraph writing.",
    quizzes: [
      {
        id: "BIK_Q1",
        title: "Quiz 1 — Test Formatif & Variation",
        subtitle: "84 soal · Tingkat Sedang",
        totalQuestions: 84,
        level: "sedang",
        file: "quizzes/BIK_quiz1.html",
        createdAt: "2026-06-20"
      }
    ]
  },
  {
    id: "HDAGK",
    slug: "hukum-dagang-kepailitan",
    name: "Hukum Dagang & Kepailitan",
    semester: 6,
    code: "HKUM4309",
    color: "#7c3aed",
    icon: "⚖️",
    description: "Hukum Perdata, Hukum Dagang, Perikatan, Badan Usaha, dan Kepailitan.",
    quizzes: [
      {
        id: "HDAGK_Q1",
        title: "Quiz 1 — Bank Soal Modul 1–6",
        subtitle: "70 soal · Tingkat Sedang",
        totalQuestions: 70,
        level: "sedang",
        file: "quizzes/HDAGK_quiz1.html",
        createdAt: "2026-06-21"
      }
    ]
  },
  {
    id: "HIPA",
    slug: "hukum-islam-pengadilan-agama",
    name: "Hukum Islam & Acara PA",
    semester: 6,
    code: "HKUM4408",
    color: "#059669",
    icon: "📖",
    description: "Hukum Islam, Zakat, Wakaf, LJK Syariah, Perkawinan, Kewarisan, dan Peradilan Agama.",
    quizzes: [
      {
        id: "HIPA_Q1",
        title: "Quiz 1 — Modul 1–9",
        subtitle: "70 soal · Tingkat Sedang",
        totalQuestions: 70,
        level: "sedang",
        file: "quizzes/HIPA_quiz1.html",
        createdAt: "2026-06-23"
      }
    ]
  },
  {
    id: "TIPISUS",
    slug: "tindak-pidana-khusus",
    name: "Tindak Pidana Khusus",
    semester: 6,
    code: "HKUM4309",
    color: "#dc2626",
    icon: "🔍",
    description: "Korupsi, TPPU, HAM Berat, Terorisme, Narkotika, Perpajakan, dan SDA.",
    quizzes: [
      {
        id: "TIPISUS_Q1",
        title: "Quiz 1 — Materi Modul 1–9",
        subtitle: "50 soal · Tingkat Advance",
        totalQuestions: 50,
        level: "advance",
        file: "quizzes/TIPISUS_quiz1.html",
        createdAt: "2026-06-28"
      },
      {
        id: "TIPISUS_Q2",
        title: "Quiz 2 — Latihan Sedang",
        subtitle: "70 soal · Tingkat Sedang",
        totalQuestions: 70,
        level: "sedang",
        file: "quizzes/TIPISUS_quiz2.html",
        createdAt: "2026-06-28"
      },
      {
        id: "TIPISUS_Q3",
        title: "Quiz 3 — Referensi Advance",
        subtitle: "70 soal · Tingkat Advance",
        totalQuestions: 70,
        level: "advance",
        file: "quizzes/TIPISUS_quiz3.html",
        createdAt: "2026-06-28"
      }
    ]
  },
  {
    id: "HPIDIN",
    slug: "hukum-pidana-internasional",
    name: "Hukum Pidana Internasional",
    semester: 6,
    code: "HKUM4408",
    color: "#0891b2",
    icon: "🌍",
    description: "Yurisdiksi, kedaulatan, kejahatan internasional, ICC, Statuta Roma, ekstradisi, dan kerja sama.",
    quizzes: [
      {
        id: "HPIDIN_Q1",
        title: "Quiz 1 — Modul 1–9",
        subtitle: "75 soal · Tingkat Sedang",
        totalQuestions: 75,
        level: "sedang",
        file: "quizzes/HPidIn_quiz1.html",
        createdAt: "2026-06-28"
      }
    ]
  },
  {
    id: "PERBANKAN",
    slug: "perbankan-umum-syariah",
    name: "Perbankan Umum & Syariah",
    semester: 6,
    code: "EKMA4213",
    color: "#d97706",
    icon: "🏦",
    description: "Kelembagaan perbankan, produk dana, jasa, perkreditan, akad syariah, bagi hasil, dan manajemen risiko.",
    quizzes: [
      {
        id: "PERBANKAN_Q1",
        title: "Quiz 1 — Persiapan UAS",
        subtitle: "65 soal · Tingkat Sedang",
        totalQuestions: 65,
        level: "sedang",
        file: "quizzes/Perbankan_quiz1.html",
        createdAt: "2026-06-28"
      }
    ]
  },
  {
    id: "AKP",
    slug: "advokasi-kebijakan-publik",
    name: "Advokasi Kebijakan Publik",
    semester: 6,
    code: "ADPU4533",
    color: "#be185d",
    icon: "📋",
    description: "Konsep kebijakan publik, aktor advokasi, strategi, riset, komunikasi, lobi, dan policy brief.",
    quizzes: [
      {
        id: "AKP_Q1",
        title: "Quiz 1 — Latihan Menengah",
        subtitle: "98 soal · Tingkat Menengah",
        totalQuestions: 98,
        level: "menengah",
        file: "quizzes/AKP_quiz1.html",
        createdAt: "2026-06-20"
      },
      {
        id: "AKP_Q2",
        title: "Quiz 2 — Modul 1–9 Advance",
        subtitle: "75 soal · Tingkat Sedang",
        totalQuestions: 75,
        level: "sedang",
        file: "quizzes/AKP_quiz2.html",
        createdAt: "2026-06-28"
      }
    ]
  }
];

// ─────────────────────────────────────────────
// Helper: hitung statistik global
// ─────────────────────────────────────────────
function getStats() {
  const totalCourses = COURSES.length;
  const totalQuizzes = COURSES.reduce((sum, c) => sum + c.quizzes.length, 0);
  const totalQuestions = COURSES.reduce((sum, c) =>
    sum + c.quizzes.reduce((qs, q) => qs + q.totalQuestions, 0), 0);
  const semesters = [...new Set(COURSES.map(c => c.semester))].sort();
  return { totalCourses, totalQuizzes, totalQuestions, semesters };
}

// ─────────────────────────────────────────────
// Helper: ambil progress dari localStorage
// ─────────────────────────────────────────────
function getProgress() {
  try {
    return JSON.parse(localStorage.getItem('leksalaw_progress') || '{}');
  } catch { return {}; }
}

function saveProgress(quizId, data) {
  try {
    const progress = getProgress();
    progress[quizId] = { ...data, updatedAt: new Date().toISOString() };
    localStorage.setItem('leksalaw_progress', JSON.stringify(progress));
  } catch (e) { console.warn('localStorage tidak tersedia'); }
}

function getQuizProgress(quizId) {
  return getProgress()[quizId] || null;
}

// ─────────────────────────────────────────────
// Helper: favorit
// ─────────────────────────────────────────────
function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem('leksalaw_favorites') || '[]');
  } catch { return []; }
}

function toggleFavorite(quizId) {
  const favs = getFavorites();
  const idx = favs.indexOf(quizId);
  if (idx >= 0) favs.splice(idx, 1);
  else favs.push(quizId);
  localStorage.setItem('leksalaw_favorites', JSON.stringify(favs));
  return favs.includes(quizId);
}

function isFavorite(quizId) {
  return getFavorites().includes(quizId);
}
