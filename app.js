import { featureCatalog, featureCategories } from "./catalog.js";
import { clearRecoveryCopy, createDefaultData, getRecoveryText, loadData, makeBackup, readBackup, saveData } from "./store.js";

const loaded = loadData();
let data = loaded.data;
let storageAvailable = loaded.storageAvailable;
let recoveredData = loaded.recovered;
let route = "home";
let studyTab = "subjects";
let discoverQuery = "";
let discoverCategory = "All";
let taskFilter = "open";
let focusPhase = "work";
let focusSeconds = null;
let focusRunning = false;
let focusInterval = null;
let focusTab = "timer";
let memoryCards = [];
let memoryOpen = [];
let memoryMatched = new Set();
let memoryMoves = 0;
let memoryLocked = false;
let oddCards = [];
let oddMessage = "Find the diamond among the circles.";
let oddSolved = false;
let oddTimeout = null;
let breathingPhase = "Ready";
let breathingRound = 0;
let breathingSeconds = 0;
let breathingRunning = false;
let breathingInterval = null;
let installPrompt = null;
let toastTimeout = null;

const app = document.getElementById("app");
const modal = document.getElementById("global-modal");
const liveRegion = document.getElementById("live-region");

const icons = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/><path d="M9 21v-6h6v6"/>',
  study: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/><path d="M8 7h8M8 11h8"/>',
  focus: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/><path d="M12 2v2M4.9 4.9l1.4 1.4M2 12h2"/>',
  discover: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4M11 8v6M8 11h6"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  sparkle: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5z"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20M8 7h8M8 11h6"/>',
  note: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="m8.2 13-1.2 9 5-3 5 3-1.2-9"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
  shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
  settings: '<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.6.9L16 20.5h-3l-.3-1.8a8 8 0 0 1-1.7-.9l-1.6.7L8 16.1l1.4-1.1a7 7 0 0 1 0-1.9L8 12l1.4-2.4 1.6.7a8 8 0 0 1 1.7-.9L13 7.5h3l.3 1.8a8 8 0 0 1 1.6.9l1.7-.7L21 12l-1.5 1.1a7 7 0 0 1-.1 1.9Z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/>',
  close: '<path d="m18 6-12 12M6 6l12 12"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  zap: '<path d="m13 2-3 8h7l-6 12 2-9H6z"/>',
  leaf: '<path d="M20 4c-7 0-13 2-13 9a5 5 0 0 0 5 5c7 0 8-7 8-14Z"/><path d="M5 21c2-5 6-8 11-11"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
  light: '<path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M3 12h2m14 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/><circle cx="12" cy="12" r="5"/>',
  document: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="m8 5 12 7-12 7z"/>',
  refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.5 9a7 7 0 0 1 11.6-2.6L20 12M4 12l2.9 5.6A7 7 0 0 0 18.5 15"/>',
  circle: '<circle cx="12" cy="12" r="9"/>',
  cloud: '<path d="M20 16.2A4 4 0 0 0 18 8.5h-1.3A6 6 0 1 0 5 16.8"/><path d="M8 17h8"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  pin: '<path d="M12 17v5M8 3h8l-1 7 3 3H6l3-3z"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.7 6.6-4.4m-6.6 8 6.6 4.4"/>',
  sparkleSmall: '<path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  heart: '<path d="M20.8 8.9c0 5-8.8 10.1-8.8 10.1S3.2 13.9 3.2 8.9A4.4 4.4 0 0 1 12 6.7a4.4 4.4 0 0 1 8.8 2.2Z"/>',
  suitcase: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3M3 12h18m-11 0v2h4v-2"/>',
  wallet: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M16 14h5M3 9h18M7 5V3h10v2"/><circle cx="16" cy="14" r=".5"/>',
  cart: '<circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M2 3h2l2.5 12.5A2 2 0 0 0 8.5 17H18a2 2 0 0 0 2-1.6L22 8H5"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  bolt: '<path d="m13 2-3 8h7l-6 12 2-9H6z"/>',
  accessibility: '<circle cx="12" cy="4" r="2"/><path d="m4 8 8 2 8-2M12 10v5l-3 6m3-6 4 6"/>',
  bookOpen: '<path d="M12 7v14M3 18V5a2 2 0 0 1 2-2h4a3 3 0 0 1 3 3 3 3 0 0 1 3-3h4a2 2 0 0 1 2 2v13h-6a3 3 0 0 0-3 2 3 3 0 0 0-3-2H3Z"/>',
  coins: '<circle cx="8" cy="8" r="5"/><path d="M16 13a5 5 0 1 1-3 9M8 5v6m-2-3h4m6 1v7m-2-3.5h4"/>',
  badge: '<path d="M12 3 14.6 8.3 20.5 9l-4.3 4.1 1 5.9L12 16.2l-5.2 2.8 1-5.9L3.5 9l5.9-.7L12 3Z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9a2.5 2.5 0 1 1 4.3 1.7c-1.1 1.1-1.9 1.5-1.9 3M12 17h.01"/>',
  calendarCheck: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18m4 5 2 2 4-4"/>',
  laptop: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M2 21h20M9 17l-1 4m7-4 1 4"/>',
  flask: '<path d="M9 3h6m-5 0v7l-5.5 9.2A2 2 0 0 0 6.2 22h11.6a2 2 0 0 0 1.7-2.8L14 10V3M8 16h8"/>',
  chart: '<path d="M3 3v18h18"/><path d="m7 14 4-4 4 3 6-7"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  shieldCheck: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
  moon: '<path d="M20.9 13A8.7 8.7 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'
};

function icon(name, className = "") {
  const content = icons[name] ?? icons.sparkleSmall;
  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${content}</svg>`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function todayISO() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function prettyDate(dateString, options = { month: "short", day: "numeric" }) {
  if (!dateString) return "No due date";
  const date = new Date(`${dateString}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "Date not set" : new Intl.DateTimeFormat(undefined, options).format(date);
}

function getSubject(id) {
  return data.subjects.find((subject) => subject.id === id) ?? null;
}

function getAttendance(subjectId = null) {
  const records = subjectId ? data.attendance.filter((item) => item.subjectId === subjectId) : data.attendance;
  const attended = records.filter((item) => item.status === "present" || item.status === "late").length;
  return { total: records.length, attended, absent: records.filter((item) => item.status === "absent").length, rate: records.length ? Math.round((attended / records.length) * 100) : null };
}

function initials(name) {
  return (name || "Student").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "S";
}

function pageTitle() {
  return ({ home: "Home", study: "Study", focus: "Study timer", discover: "Find a tool", profile: "Profile & backup" })[route] ?? "StudentOS";
}

function activeTasks() {
  return data.tasks.filter((task) => !task.done).sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
}

function dueStatus(task) {
  if (task.done) return "Done";
  if (!task.dueDate) return "No date";
  if (task.dueDate < todayISO()) return "Overdue";
  if (task.dueDate === todayISO()) return "Today";
  return prettyDate(task.dueDate);
}

function subjectOptions(selected = "") {
  return `<option value="">No subject</option>${data.subjects.map((subject) => `<option value="${escapeHtml(subject.id)}" ${subject.id === selected ? "selected" : ""}>${escapeHtml(subject.name)}</option>`).join("")}`;
}

function navButton(page, label, iconName) {
  const current = route === page;
  return `<button class="nav-link" type="button" data-route="${page}" aria-current="${current ? "page" : "false"}" aria-label="${label}">${icon(iconName)}<span>${label}</span></button>`;
}

function mobileNavButton(page, label, iconName) {
  const current = route === page;
  return `<button type="button" data-route="${page}" aria-current="${current ? "page" : "false"}">${icon(iconName)}<span>${label}</span></button>`;
}

function renderShell() {
  const online = navigator.onLine;
  const openCount = activeTasks().length;
  app.innerHTML = `
    <div class="app-shell ${data.profile.largeText ? "large-text" : ""} ${data.profile.reducedMotion ? "reduce-motion" : ""}">
      <aside class="sidebar" aria-label="Main navigation">
        <a class="brand" href="#main-content" aria-label="StudentOS home" data-route="home">
          <span class="brand-mark">${icon("grid")}</span><span class="brand-copy"><span class="brand-name">StudentOS</span><span class="brand-tagline">Student life, in sync</span></span>
        </a>
        <p class="sidebar-label">Workspace</p>
        <nav class="nav-list" aria-label="Workspace">
          ${navButton("home", "Home", "home")}
          ${navButton("study", "Study", "study")}
          ${navButton("focus", "Focus", "focus")}
          ${navButton("discover", "Discover", "discover")}
          ${navButton("profile", "Profile", "profile")}
        </nav>
        <div class="sidebar-spacer"></div>
        <div class="sidebar-card">
          <p class="eyebrow">Made for your momentum</p>
          <p class="sidebar-card-text">A calmer place for classes, goals and everything in between.</p>
          <button class="sidebar-card-link" type="button" data-route="discover">Explore features ${icon("arrow")}</button>
        </div>
        <button class="sidebar-profile" type="button" data-route="profile" aria-label="Open profile and settings">
          <span class="avatar">${escapeHtml(initials(data.profile.name))}</span><span class="sidebar-profile-copy"><span class="sidebar-profile-name">${escapeHtml(data.profile.name)}</span><span class="sidebar-profile-meta">${data.xp.toLocaleString()} points earned</span></span>${icon("chevron")}
        </button>
      </aside>
      <div class="main-area">
        <header class="topbar">
          <div class="topbar-title"><p class="topbar-kicker">StudentOS <span aria-hidden="true">/</span> Your planner</p><h1>${escapeHtml(pageTitle())}</h1></div>
          <div class="topbar-actions">
            <span class="online-indicator ${online ? "" : "offline"}" aria-label="${online ? "Online; saved data is local" : "Offline; saved data is available locally"}">${online ? "Online" : "Offline"}</span>
            ${installPrompt ? `<button class="secondary-button button-small install-button" type="button" data-action="install">${icon("download")} Install</button>` : ""}
            <button class="secondary-button button-small help-button" type="button" data-action="open-help" aria-label="How to use StudentOS">${icon("help")}<span class="help-label">How to use</span></button>
            <button class="icon-button" type="button" data-route="discover" aria-label="Search the feature library">${icon("discover")}</button>
            <button class="avatar" type="button" data-route="profile" aria-label="Open profile">${escapeHtml(initials(data.profile.name))}</button>
          </div>
        </header>
        <main id="main-content" class="main-content" tabindex="-1">
          ${storageAvailable ? "" : `<div class="recovery-box" role="status"><p>Browser storage is unavailable. StudentOS is running for this visit, but changes may not survive a reload.</p></div>`}
          ${recoveredData ? `<div class="recovery-box" role="status"><p>StudentOS could not read the last saved data. A copy is preserved on this device; open Profile to download it before making changes.</p></div>` : ""}
          ${renderPage()}
        </main>
      </div>
      <nav class="mobile-nav" aria-label="Main navigation">${mobileNavButton("home", "Home", "home")}${mobileNavButton("study", "Study", "study")}${mobileNavButton("focus", "Focus", "focus")}${mobileNavButton("discover", "Discover", "discover")}${mobileNavButton("profile", "Profile", "profile")}</nav>
    </div>`;
}

function pageIntro(title, description, action = "") {
  return `<div class="page-intro"><div class="page-intro-copy"><h2>${title}</h2><p>${description}</p></div>${action}</div>`;
}

function sectionHeading(title, description = "", action = "") {
  return `<div class="section-heading"><div><h2>${title}</h2>${description ? `<p>${description}</p>` : ""}</div>${action}</div>`;
}

function emptyState(iconName, title, description, actionHtml = "") {
  return `<div class="empty-state"><span class="empty-state-icon">${icon(iconName)}</span><h3>${title}</h3><p>${description}</p>${actionHtml ? `<div class="button-row">${actionHtml}</div>` : ""}</div>`;
}

function renderTaskRow(task, compact = false) {
  const subject = getSubject(task.subjectId);
  const due = dueStatus(task);
  const dueClass = due === "Overdue" ? "pill-rose" : due === "Today" ? "pill-amber" : "";
  const priorityColor = task.priority === "high" ? "var(--rose)" : task.priority === "medium" ? "var(--amber)" : "var(--green)";
  return `<div class="task-row ${compact ? "" : "card-compact"}">
    <button class="task-check ${task.done ? "is-done" : ""}" type="button" data-action="toggle-task" data-id="${escapeHtml(task.id)}" aria-label="${task.done ? "Mark incomplete" : "Complete"}: ${escapeHtml(task.title)}" aria-pressed="${task.done}">${task.done ? icon("check") : ""}</button>
    <div class="task-content"><p class="task-title ${task.done ? "is-done" : ""}">${escapeHtml(task.title)}</p><div class="task-meta"><span class="pill ${dueClass}">${escapeHtml(due)}</span>${subject ? `<span>${escapeHtml(subject.name)}</span>` : ""}<span class="priority-dot" style="--priority:${priorityColor}">${escapeHtml(task.priority)}</span></div></div>
    ${compact ? "" : `<button class="mini-action" type="button" data-action="delete-task" data-id="${escapeHtml(task.id)}" aria-label="Delete task ${escapeHtml(task.title)}">${icon("trash")}</button>`}
  </div>`;
}

function renderAgendaItem(item) {
  const subject = getSubject(item.subjectId);
  if (!subject) return "";
  return `<div class="agenda-item" style="--item-color:${escapeHtml(subject.color)}"><span class="agenda-time">${escapeHtml(item.start)}</span><span class="agenda-line"></span><div><p class="agenda-subject">${escapeHtml(subject.name)}</p><p class="agenda-room">${escapeHtml(item.room || subject.room || "Class")}</p></div><span class="agenda-tag">${escapeHtml(item.end)}</span></div>`;
}

function renderHome() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstVisit = data.subjects.length === 0 && data.tasks.length === 0 && data.notes.length === 0;
  const todaySchedule = data.schedule.filter((entry) => entry.day === new Date().getDay()).sort((a, b) => a.start.localeCompare(b.start));
  const openTasks = activeTasks();
  const subjectSummary = data.subjects.slice(0, 5);
  const attendance = getAttendance();
  const nextTasks = openTasks.slice(0, 4);
  const recentNotes = [...data.notes].sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "")).slice(0, 3);
  return `
    <section class="welcome-card" aria-labelledby="welcome-title">
      <div class="welcome-copy"><span class="welcome-tag">${icon("sparkleSmall")} ${escapeHtml(new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date()))}</span>
        <h2 id="welcome-title">${firstVisit ? "Welcome," : `${greeting},`}<br/><span>${escapeHtml(data.profile.name)}.</span></h2>
        <p>${firstVisit ? "StudentOS keeps your classes, attendance, assignments and notes together. Start by adding one class below." : "Check what is coming up, then choose one small thing to do next."}</p>
        <div class="button-row"><button class="primary-button" type="button" ${firstVisit ? `data-modal="subject"` : `data-route="study" data-study-tab="subjects"`}>${icon("plus")} ${firstVisit ? "Add my first subject" : "Open my classes"}</button><button class="quiet-button" type="button" data-action="open-help">How this app works ${icon("arrow")}</button></div>
      </div>
      <div class="welcome-visual" aria-hidden="true">${icon("grid")}</div>
    </section>
    ${renderGettingStarted()}
    <section class="grid grid-4" style="margin-top:15px" aria-label="Your progress">
      <article class="metric-card"><span class="metric-icon">${icon("award")}</span><p class="metric-value">${data.xp.toLocaleString()}</p><p class="metric-label">Points earned</p></article>
      <article class="metric-card"><span class="metric-icon">${icon("clock")}</span><p class="metric-value">${data.focusSessions}</p><p class="metric-label">Focus sessions completed</p></article>
      <article class="metric-card"><span class="metric-icon">${icon("book")}</span><p class="metric-value">${data.subjects.length}</p><p class="metric-label">Subjects added</p></article>
      <article class="metric-card"><span class="metric-icon">${icon("calendar")}</span><p class="metric-value">${openTasks.length}</p><p class="metric-label">Assignments to do</p></article>
    </section>
    <div class="dashboard-grid" style="margin-top:16px">
      <div class="stack">
        <section class="card" aria-labelledby="today-title">
          <div class="card-topline"><div><h2 id="today-title" class="card-title">Today's timetable</h2><p class="card-subtitle">${todaySchedule.length ? `${todaySchedule.length} ${todaySchedule.length === 1 ? "class" : "classes"} on your schedule` : "A clear view of what's ahead"}</p></div><span class="card-icon">${icon("calendar")}</span></div>
          ${todaySchedule.length ? `<div class="agenda-list">${todaySchedule.map(renderAgendaItem).join("")}</div><button class="text-link" type="button" data-route="study" data-study-tab="timetable">View full timetable ${icon("arrow")}</button>` : emptyState("calendar", "Nothing scheduled today", "Add your weekly class times and they will appear here.", `<button class="secondary-button button-small" type="button" data-modal="schedule">${icon("plus")} Add a class time</button>`)}
        </section>
        <section class="card" aria-labelledby="tasks-title">
          <div class="card-topline"><div><h2 id="tasks-title" class="card-title">Assignments to do</h2><p class="card-subtitle">Your next deadlines, all in one place</p></div><span class="card-icon">${icon("check")}</span></div>
          ${nextTasks.length ? `<div class="list-stack">${nextTasks.map((task) => renderTaskRow(task, true)).join("")}</div><button class="text-link" type="button" data-route="study" data-study-tab="tasks" style="margin-top:10px">View all tasks ${icon("arrow")}</button>` : emptyState("check", "You're all caught up", "Add a task whenever something needs a spot on your list.", `<button class="secondary-button button-small" type="button" data-modal="task">${icon("plus")} Add a task</button>`)}
        </section>
      </div>
      <div class="stack">
        <section class="card" aria-labelledby="attendance-title">
          <div class="card-topline"><div><h2 id="attendance-title" class="card-title">Attendance so far</h2><p class="card-subtitle">${attendance.total ? `${attendance.attended} of ${attendance.total} classes attended` : "Your recorded classes at a glance"}</p></div><span class="card-icon">${icon("target")}</span></div>
          <div class="attendance-line"><div class="attendance-number">${attendance.rate === null ? "—" : `${attendance.rate}%`} <small>overall</small></div><button class="text-link" type="button" data-route="study" data-study-tab="attendance">Track attendance ${icon("arrow")}</button></div>
          <div class="progress-track" role="progressbar" aria-label="Overall attendance" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${attendance.rate ?? 0}"><div class="progress-fill" style="width:${attendance.rate ?? 0}%"></div></div>
          ${data.subjects.length ? `<div class="subject-list">${subjectSummary.map((subject) => { const metric = getAttendance(subject.id); return `<div class="subject-row"><span class="subject-swatch" style="--subject-color:${escapeHtml(subject.color)}"></span><span class="subject-row-name">${escapeHtml(subject.name)}</span><span class="subject-row-meta">${metric.rate === null ? "No logs" : `${metric.rate}%`}</span></div>`; }).join("")}</div>` : `<p class="card-subtitle" style="margin-top:13px">Add a subject to start tracking attendance.</p>`}
        </section>
        <section class="card" aria-labelledby="notes-title">
          <div class="card-topline"><div><h2 id="notes-title" class="card-title">Recent notes</h2><p class="card-subtitle">Ideas you have saved for later</p></div><span class="card-icon">${icon("note")}</span></div>
          ${recentNotes.length ? `<div class="list-stack">${recentNotes.map((note) => `<button class="task-row" type="button" data-action="edit-note" data-id="${escapeHtml(note.id)}" style="width:100%;cursor:pointer;text-align:left"><span class="card-icon" style="width:28px;height:28px">${icon("note")}</span><span class="task-content"><span class="task-title">${escapeHtml(note.title)}</span><span class="task-meta">${escapeHtml(getSubject(note.subjectId)?.name ?? "Personal note")}</span></span>${icon("chevron")}</button>`).join("")}</div>` : emptyState("note", "No notes yet", "Save a quick thought or lesson summary.", `<button class="secondary-button button-small" type="button" data-modal="note">${icon("plus")} Write a note</button>`)}
        </section>
      </div>
    </div>`;
}

function renderGettingStarted() {
  const steps = [
    { title: "Add a subject", description: "A subject is a class or course, like Biology.", complete: data.subjects.length > 0, action: `<button class="secondary-button button-small" type="button" data-modal="subject">${icon("plus")} Add subject</button>` },
    { title: "Add your class times", description: "Choose a day and time. It repeats each week.", complete: data.schedule.length > 0, action: `<button class="secondary-button button-small" type="button" data-modal="schedule" ${data.subjects.length ? "" : "disabled"}>${icon("calendar")} Add class time</button>` },
    { title: "Track attendance", description: "Mark a class present, late or absent to see your percentage.", complete: data.attendance.length > 0, action: `<button class="secondary-button button-small" type="button" data-modal="attendance" ${data.subjects.length ? "" : "disabled"}>${icon("target")} Log a class</button>` },
    { title: "Save an assignment or note", description: "Tasks hold due dates. Notes hold things you want to remember.", complete: data.tasks.length > 0 || data.notes.length > 0, action: `<div class="button-row"><button class="secondary-button button-small" type="button" data-modal="task">${icon("check")} Add assignment</button><button class="quiet-button button-small" type="button" data-modal="note">${icon("note")} Write a note</button></div>` }
  ];
  const completeCount = steps.filter((step) => step.complete).length;
  return `<section class="card getting-started" aria-labelledby="getting-started-title"><div class="card-topline"><div><span class="eyebrow">A simple place to start</span><h2 id="getting-started-title" class="card-title" style="margin-top:5px">Set up the basics</h2><p class="card-subtitle">You can do these one at a time. The rest can wait.</p></div><span class="setup-progress">${completeCount} of 4 done</span></div><div class="setup-list">${steps.map((step, index) => `<div class="setup-step"><span class="setup-number ${step.complete ? "is-complete" : ""}" aria-hidden="true">${step.complete ? icon("check") : index + 1}</span><div class="setup-copy"><strong>${escapeHtml(step.title)}${step.complete ? `<span class="setup-done-label">Done</span>` : ""}</strong><span>${escapeHtml(step.description)}</span></div><div class="setup-action">${step.action}</div></div>`).join("")}</div><p class="setup-footnote">Home is your overview · Study holds classes and assignments · Focus has the timer and break games · Profile has your backup.</p></section>`;
}

const studyTabs = [
  ["subjects", "Subjects"], ["timetable", "Timetable"], ["attendance", "Attendance"], ["tasks", "Tasks"], ["notes", "Notes"]
];

function renderStudy() {
  const tabContent = ({ subjects: renderSubjects, timetable: renderTimetable, attendance: renderAttendance, tasks: renderTasks, notes: renderNotes })[studyTab] ?? renderSubjects;
  return `${pageIntro("Your classes and schoolwork", "Add your classes, class times, attendance, assignments and notes here.")}
    <div class="tab-list" role="tablist" aria-label="Study workspace sections">${studyTabs.map(([id, label]) => `<button class="tab-button" id="tab-${id}" type="button" role="tab" data-study-tab="${id}" aria-selected="${studyTab === id}" aria-controls="study-panel">${label}${id === "tasks" && activeTasks().length ? `<span class="nav-count" style="display:inline;margin-left:5px">${activeTasks().length}</span>` : ""}</button>`).join("")}</div>
    <section id="study-panel" role="tabpanel" aria-labelledby="tab-${studyTab}">${tabContent()}</section>`;
}

function renderSubjects() {
  const action = `<button class="primary-button button-small" type="button" data-modal="subject">${icon("plus")} Add subject</button>`;
  return `<div class="study-toolbar"><div><h3>Subjects</h3><p>A subject is one class or course, for example Biology or Math.</p></div>${action}</div>
    ${data.subjects.length ? `<div class="grid grid-3">${data.subjects.map((subject) => {
      const metric = getAttendance(subject.id);
      const classCount = data.schedule.filter((item) => item.subjectId === subject.id).length;
      return `<article class="card subject-card"><div class="subject-card-header"><span class="subject-card-color" style="--subject-color:${escapeHtml(subject.color)}"></span><div style="min-width:0"><h4>${escapeHtml(subject.name)}</h4><p class="room">${escapeHtml(subject.room || "No room added")}</p></div></div><div class="attendance-line"><span class="subject-row-meta">Attendance</span><strong style="font-size:12px">${metric.rate === null ? "—" : `${metric.rate}%`}</strong></div><div class="progress-track"><div class="progress-fill" style="width:${metric.rate ?? 0}%;background:${escapeHtml(subject.color)}"></div></div><div class="subject-card-footer"><span>${classCount} weekly ${classCount === 1 ? "class" : "classes"}</span><button class="mini-action" type="button" data-action="delete-subject" data-id="${escapeHtml(subject.id)}" aria-label="Delete ${escapeHtml(subject.name)}">${icon("trash")}</button></div></article>`;
    }).join("")}</div>` : `<div class="card">${emptyState("book", "Start with your first subject", "Add a subject once. Then connect it to timetable, attendance, tasks and notes.", action)}</div>`}`;
}

function renderTimetable() {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const action = `<button class="primary-button button-small" type="button" data-modal="schedule" ${data.subjects.length ? "" : "disabled"}>${icon("plus")} Add class time</button>`;
  const rows = days.map((day, index) => {
    const entries = data.schedule.filter((item) => item.day === index).sort((a, b) => a.start.localeCompare(b.start));
    return `<div class="schedule-day"><span class="schedule-day-label ${new Date().getDay() === index ? "is-today" : ""}">${day}${new Date().getDay() === index ? " · Today" : ""}</span><div class="schedule-slots">${entries.length ? entries.map((item) => {
      const subject = getSubject(item.subjectId);
      return `<div class="schedule-slot" style="--item-color:${escapeHtml(subject?.color ?? "var(--green)")}"><div class="schedule-slot-main"><p class="schedule-slot-title">${escapeHtml(subject?.name ?? "Subject removed")}</p><p class="schedule-slot-meta">${escapeHtml(item.room || subject?.room || "Class")}</p></div><span class="schedule-slot-time">${escapeHtml(item.start)}–${escapeHtml(item.end)}</span><button class="mini-action" type="button" data-action="delete-schedule" data-id="${escapeHtml(item.id)}" aria-label="Delete timetable item">${icon("trash")}</button></div>`;
    }).join("") : `<span class="inline-empty" style="padding:5px;text-align:left">No classes scheduled</span>`}</div></div>`;
  }).join("");
  return `<div class="study-toolbar"><div><h3>Weekly timetable</h3><p>Add when each class starts and ends. These times repeat each week.</p></div>${action}</div><div class="card">${data.subjects.length ? rows : emptyState("calendar", "Add a subject first", "Each class time needs a subject, such as Biology or Math.", `<button class="secondary-button button-small" type="button" data-modal="subject">${icon("plus")} Add subject</button>`)}</div>`;
}

function renderAttendance() {
  const overall = getAttendance();
  const action = `<button class="primary-button button-small" type="button" data-modal="attendance" ${data.subjects.length ? "" : "disabled"}>${icon("plus")} Log a class</button>`;
  const recent = [...data.attendance].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
  return `<div class="study-toolbar"><div><h3>Attendance</h3><p>After each class, record whether you were present, late or absent.</p></div>${action}</div>
    <div class="attendance-summary"><div class="attendance-stat"><strong>${overall.rate === null ? "—" : `${overall.rate}%`}</strong><span>Overall attendance</span></div><div class="attendance-stat"><strong>${overall.attended}</strong><span>Attended classes</span></div><div class="attendance-stat"><strong>${overall.total}</strong><span>Logged sessions</span></div></div>
    ${data.subjects.length ? `<div class="grid grid-2" style="margin-bottom:15px">${data.subjects.map((subject) => { const metric = getAttendance(subject.id); return `<article class="card card-compact"><div class="subject-row"><span class="subject-swatch" style="--subject-color:${escapeHtml(subject.color)}"></span><span class="subject-row-name">${escapeHtml(subject.name)}</span><strong style="font-size:12px">${metric.rate === null ? "—" : `${metric.rate}%`}</strong></div><div class="progress-track"><div class="progress-fill" style="width:${metric.rate ?? 0}%;background:${escapeHtml(subject.color)}"></div></div><p class="card-subtitle">${metric.attended} attended of ${metric.total} logged</p></article>`; }).join("")}</div>` : `<div class="card" style="margin-bottom:15px">${emptyState("book", "Add a subject to begin", "Attendance is calculated separately for each subject.", `<button class="secondary-button button-small" type="button" data-modal="subject">${icon("plus")} Add subject</button>`)}</div>`}
    <section class="card"><div class="card-topline"><div><h2 class="card-title">Recent records</h2><p class="card-subtitle">A simple log of your class sessions</p></div><span class="card-icon">${icon("target")}</span></div>
      ${recent.length ? recent.map((item) => { const subject = getSubject(item.subjectId); const label = item.status[0].toUpperCase() + item.status.slice(1); const pill = item.status === "absent" ? "pill-rose" : item.status === "late" ? "pill-amber" : "pill-green"; return `<div class="attendance-record"><div class="attendance-record-name"><strong>${escapeHtml(subject?.name ?? "Subject")}</strong><span>${escapeHtml(prettyDate(item.date, { weekday: "short", month: "short", day: "numeric", year: "numeric" }))}</span></div><span class="pill ${pill}">${label}</span><button class="mini-action" type="button" data-action="delete-attendance" data-id="${escapeHtml(item.id)}" aria-label="Delete attendance record">${icon("trash")}</button></div>`; }).join("") : `<div class="inline-empty">No attendance records yet. Add a class to calculate your percentage.</div>`}
      <p class="field-hint" style="margin:13px 0 0">Formula: (present + late sessions) ÷ all logged sessions × 100. With no logged sessions, the result is shown as —.</p>
    </section>`;
}

function renderTasks() {
  const all = [...data.tasks].sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
  const visible = taskFilter === "all" ? all : taskFilter === "done" ? all.filter((task) => task.done) : all.filter((task) => !task.done);
  return `<div class="study-toolbar"><div><h3>Assignments & reminders</h3><p>Add homework, projects or anything you need to remember.</p></div><button class="primary-button button-small" type="button" data-modal="task">${icon("plus")} Add assignment</button></div>
    <div class="tab-list" role="tablist" aria-label="Filter tasks" style="width:max-content;max-width:100%;margin:0 0 13px">${[["open", "To do"], ["all", "All"], ["done", "Completed"]].map(([key, label]) => `<button class="tab-button" type="button" role="tab" data-task-filter="${key}" aria-selected="${taskFilter === key}">${label}${key === "open" ? ` (${activeTasks().length})` : key === "done" ? ` (${data.tasks.filter((task) => task.done).length})` : ""}</button>`).join("")}</div>
    <section class="card"><div class="list-stack" style="margin-top:0">${visible.length ? visible.map((task) => renderTaskRow(task)).join("") : `<div class="inline-empty">${taskFilter === "done" ? "Completed tasks will show here." : "Nothing in this list yet. Add a task when something needs doing."}</div>`}</div></section>`;
}

function renderNotes() {
  const notes = [...data.notes].sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  return `<div class="study-toolbar"><div><h3>Notes</h3><p>Write down lesson notes, ideas or reminders. They stay on this device.</p></div><button class="primary-button button-small" type="button" data-modal="note">${icon("plus")} Write a note</button></div>
    ${notes.length ? `<div class="grid grid-3">${notes.map((note) => `<article class="card subject-card"><div class="card-topline"><span class="card-icon">${icon("note")}</span><button class="mini-action" type="button" data-action="delete-note" data-id="${escapeHtml(note.id)}" aria-label="Delete note ${escapeHtml(note.title)}">${icon("trash")}</button></div><h3 style="overflow:hidden;margin:12px 0 4px;font-size:12px;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(note.title)}</h3><p class="card-subtitle" style="display:-webkit-box;overflow:hidden;-webkit-line-clamp:3;-webkit-box-orient:vertical;white-space:pre-wrap">${escapeHtml(note.content || "No text in this note yet.")}</p><div class="subject-card-footer"><span>${escapeHtml(getSubject(note.subjectId)?.name ?? "Personal note")}</span><button class="text-link" type="button" data-action="edit-note" data-id="${escapeHtml(note.id)}">Open ${icon("arrow")}</button></div></article>`).join("")}</div>` : `<div class="card">${emptyState("note", "Your notes start here", "Save lecture takeaways, ideas or a quick reminder for later.", `<button class="secondary-button button-small" type="button" data-modal="note">${icon("plus")} Write a note</button>`)}</div>`}`;
}

function formatTimer(seconds) {
  const safe = Math.max(0, seconds ?? 0);
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

function currentTimerDuration() {
  return (focusPhase === "work" ? data.focus.workMinutes : data.focus.breakMinutes) * 60;
}

function renderFocusTimer() {
  const duration = currentTimerDuration();
  const seconds = focusSeconds ?? duration;
  const angle = duration ? Math.round(((duration - seconds) / duration) * 360) : 0;
  const untilNext = data.focusSessions % 4 === 3 ? "One more session to your next 4-session milestone" : `${Math.max(0, 4 - (data.focusSessions % 4))} sessions to your next milestone`;
  return `<div class="focus-layout">
      <section class="card focus-card" aria-label="Focus timer">
        <p class="focus-phase">${focusPhase === "work" ? "Focus session" : "Short break"}</p>
        <div class="timer-ring" id="timer-ring" style="--timer-angle:${angle}deg" role="timer" aria-label="${formatTimer(seconds)} remaining"><div class="timer-content"><p class="timer-value" id="timer-value">${formatTimer(seconds)}</p><p class="timer-caption">${focusPhase === "work" ? "Stay with one thing" : "Step away for a moment"}</p></div></div>
        <div class="focus-controls"><button class="primary-button focus-control-button" id="focus-toggle" type="button" data-action="focus-toggle" aria-label="${focusRunning ? "Pause timer" : "Start timer"}">${icon(focusRunning ? "pause" : "play")} ${focusRunning ? "Pause" : "Start focus"}</button><button class="secondary-button focus-control-button" type="button" data-action="focus-reset">${icon("refresh")} Reset</button></div>
        <p class="focus-note">Finish a study timer to earn 10 points. The timer pauses when you leave this page.</p>
      </section>
      <aside class="card focus-side-card" aria-label="Focus progress and settings">
        <div class="card-topline"><div><h2 class="card-title">Your momentum</h2><p class="card-subtitle">Small sessions add up.</p></div><span class="card-icon">${icon("zap")}</span></div>
        <div class="focus-stat"><span class="focus-stat-icon">${icon("clock")}</span><div class="focus-stat-copy"><strong>${data.focusSessions}</strong><span>Study timers finished</span></div></div>
        <div class="focus-stat"><span class="focus-stat-icon">${icon("award")}</span><div class="focus-stat-copy"><strong>${data.xp.toLocaleString()} points</strong><span>5 for an assignment, 10 for a study timer</span></div></div>
        <div class="xp-progress"><div class="xp-progress-top"><span>Next milestone</span><strong>${Math.max(0, 4 - (data.focusSessions % 4)) || 4} sessions</strong></div><div class="progress-track"><div class="progress-fill" style="width:${(data.focusSessions % 4) * 25}%"></div></div><p class="field-hint" style="margin:7px 0 0">${untilNext}</p></div>
        <form class="field-grid" data-form="focus-settings"><div class="field"><label for="work-minutes">Focus minutes</label><input id="work-minutes" name="workMinutes" type="number" min="1" max="90" value="${data.focus.workMinutes}" required /></div><div class="field"><label for="break-minutes">Break minutes</label><input id="break-minutes" name="breakMinutes" type="number" min="1" max="30" value="${data.focus.breakMinutes}" required /></div><div class="field field-full"><button class="secondary-button button-small" type="submit">Save timer lengths</button></div></form>
      </aside>
    </div>`;
}

function renderFocus() {
  const tabs = [["timer", "Study timer"], ["relax", "Relax"]];
  return `${pageIntro("Study & break", "Use a study timer or choose a relaxing break activity.")}
    <div class="tab-list" role="tablist" aria-label="Study and break choices">${tabs.map(([id, label]) => `<button class="tab-button" id="focus-tab-${id}" type="button" role="tab" data-focus-tab="${id}" aria-selected="${focusTab === id}" aria-controls="focus-panel">${label}</button>`).join("")}</div>
    <section id="focus-panel" role="tabpanel" aria-labelledby="focus-tab-${focusTab}">${focusTab === "relax" ? renderRelax() : renderFocusTimer()}</section>`;
}

const memoryFaces = [
  { key: "leaf", emoji: "🌿", label: "leaf" }, { key: "sun", emoji: "☀️", label: "sun" },
  { key: "moon", emoji: "🌙", label: "moon" }, { key: "flower", emoji: "🌼", label: "flower" },
  { key: "cloud", emoji: "☁️", label: "cloud" }, { key: "star", emoji: "⭐", label: "star" }
];

function resetMemoryGame() {
  const deck = [...memoryFaces, ...memoryFaces].map((face, index) => ({ ...face, cardId: `${face.key}-${index}` }));
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }
  memoryCards = deck;
  memoryOpen = [];
  memoryMatched = new Set();
  memoryMoves = 0;
  memoryLocked = false;
}

function renderMemoryMatch() {
  if (!memoryCards.length) resetMemoryGame();
  const complete = memoryMatched.size === memoryCards.length;
  return `<section class="card relax-card" aria-labelledby="memory-title"><div class="card-topline"><div><h2 id="memory-title" class="card-title">Memory match</h2><p class="card-subtitle">Turn over two cards and find the matching pictures. No timer, no score pressure.</p></div><span class="card-icon">${icon("sparkle")}</span></div>
    <div class="memory-stats"><span>${memoryMatched.size / 2} of 6 pairs found</span><span>${memoryMoves} turns</span></div>
    <div class="memory-grid" role="group" aria-label="Memory match cards">${memoryCards.map((card, index) => { const isOpen = memoryOpen.includes(index) || memoryMatched.has(index); const isMatched = memoryMatched.has(index); return `<button class="memory-card ${isOpen ? "is-open" : ""} ${isMatched ? "is-matched" : ""}" type="button" data-action="memory-card" data-index="${index}" aria-label="${isOpen ? `${card.label}, card ${index + 1}` : `Hidden card ${index + 1}`}" aria-pressed="${isOpen}" ${isMatched || memoryLocked ? "disabled" : ""}><span aria-hidden="true">${isOpen ? card.emoji : "✦"}</span></button>`; }).join("")}</div>
    <div class="game-footer"><p class="field-hint">${complete ? "You found every pair. Nice work—take your time." : "Turn over any two cards. Matching cards stay open."}</p><button class="secondary-button button-small" type="button" data-action="memory-reset">${icon("refresh")} Shuffle cards</button></div></section>`;
}

function resetOddGame() {
  oddCards = Array(16).fill("●");
  const answer = Math.floor(Math.random() * oddCards.length);
  oddCards[answer] = "◆";
  oddSolved = false;
  oddMessage = "Find the diamond among the circles.";
}

function renderOddGame() {
  if (!oddCards.length) resetOddGame();
  return `<section class="card relax-card" aria-labelledby="odd-title"><div class="card-topline"><div><h2 id="odd-title" class="card-title">Find the odd one</h2><p class="card-subtitle">Tap the diamond among the circles. No timer.</p></div><span class="card-icon">${icon("target")}</span></div>
    <div class="odd-grid" role="group" aria-label="Find the different shape">${oddCards.map((shape, index) => `<button class="odd-card ${oddSolved && shape === "◆" ? "is-answer" : ""}" type="button" data-action="odd-choice" data-index="${index}" aria-label="${shape === "◆" ? "Diamond" : "Circle"}" ${oddSolved ? "disabled" : ""}>${shape}</button>`).join("")}</div>
    <div class="game-footer"><p class="field-hint" aria-live="polite">${oddMessage}</p><button class="quiet-button button-small" type="button" data-action="odd-reset">New puzzle</button></div></section>`;
}

function renderBreathingBreak() {
  const status = breathingRunning ? `${breathingPhase} · round ${Math.min(3, breathingRound + 1)} of 3` : breathingPhase === "Done" ? "Finished · take your time" : breathingPhase === "Ready" ? "About 30 seconds · no score" : "Paused · continue when ready";
  return `<section class="card relax-card breathing-card" aria-labelledby="breathing-title"><div class="card-topline"><div><h2 id="breathing-title" class="card-title">Breathing break</h2><p class="card-subtitle">Follow the circle for three slow breaths.</p></div><span class="card-icon">${icon("leaf")}</span></div>
    <div class="breath-orb-wrap"><div id="breath-orb" class="breath-orb ${breathingRunning ? `is-${breathingPhase.toLowerCase()}` : ""}" aria-hidden="true"><span>${breathingRunning ? breathingPhase : "Easy does it"}</span></div></div>
    <p class="breathing-status" id="breathing-status" aria-live="polite">${status}</p><p class="breathing-help">As the circle grows, breathe in gently. As it shrinks, breathe out. Stop any time if it feels uncomfortable.</p>
    <div class="game-footer"><span class="field-hint">No points or tracking.</span><button class="secondary-button button-small" type="button" data-action="breathing-toggle">${icon(breathingRunning ? "pause" : "play")} ${breathingRunning ? "Pause" : breathingPhase === "Ready" || breathingPhase === "Done" ? "Start" : "Continue"}</button></div></section>`;
}

function renderRelax() {
  return `<div class="relax-intro"><span class="card-icon">${icon("leaf")}</span><p>Take a short break. These activities are free, work offline, and don’t affect your points.</p></div><div class="relax-grid">${renderMemoryMatch()}${renderOddGame()}${renderBreathingBreak()}</div>`;
}

function handleMemoryPick(index) {
  if (!Number.isInteger(index) || index < 0 || index >= memoryCards.length || memoryLocked || memoryMatched.has(index) || memoryOpen.includes(index)) return;
  if (memoryOpen.length === 0) {
    memoryOpen = [index];
    render();
    return;
  }

  const firstIndex = memoryOpen[0];
  memoryMoves += 1;
  if (memoryCards[firstIndex].key === memoryCards[index].key) {
    memoryMatched.add(firstIndex);
    memoryMatched.add(index);
    memoryOpen = [];
    render();
    if (memoryMatched.size === memoryCards.length) showToast("You found every pair. Take your time.");
    return;
  }

  memoryOpen = [firstIndex, index];
  memoryLocked = true;
  render();
  setTimeout(() => {
    memoryOpen = [];
    memoryLocked = false;
    if (route === "focus" && focusTab === "relax") render();
  }, 900);
}

function handleOddPick(index) {
  if (!Number.isInteger(index) || index < 0 || index >= oddCards.length || oddSolved) return;
  if (oddCards[index] !== "◆") {
    oddMessage = "Not that one. Take your time and try again.";
    render();
    return;
  }
  oddSolved = true;
  oddMessage = "You found it. A new puzzle is coming.";
  render();
  clearTimeout(oddTimeout);
  oddTimeout = setTimeout(() => {
    resetOddGame();
    if (route === "focus" && focusTab === "relax") render();
  }, 1100);
}

function updateBreathingDisplay() {
  const orb = document.getElementById("breath-orb");
  const status = document.getElementById("breathing-status");
  const button = document.querySelector('[data-action="breathing-toggle"]');
  if (!orb || !status || !button) return;
  orb.className = `breath-orb ${breathingRunning ? `is-${breathingPhase.toLowerCase()}` : ""}`;
  orb.querySelector("span").textContent = breathingRunning ? breathingPhase : "Easy does it";
  status.textContent = breathingRunning ? `${breathingPhase} · round ${Math.min(3, breathingRound + 1)} of 3` : breathingPhase === "Done" ? "Finished · take your time" : breathingPhase === "Ready" ? "About 30 seconds · no score" : "Paused · continue when ready";
  button.innerHTML = `${icon(breathingRunning ? "pause" : "play")} ${breathingRunning ? "Pause" : breathingPhase === "Ready" || breathingPhase === "Done" ? "Start" : "Continue"}`;
}

function toggleBreathingBreak() {
  if (breathingRunning) {
    breathingRunning = false;
    clearInterval(breathingInterval);
    breathingInterval = null;
    updateBreathingDisplay();
    return;
  }
  if (breathingPhase === "Ready" || breathingPhase === "Done") {
    breathingPhase = "Inhale";
    breathingRound = 0;
    breathingSeconds = 4;
  }
  breathingRunning = true;
  breathingInterval = setInterval(() => {
    breathingSeconds -= 1;
    if (breathingSeconds <= 0) {
      if (breathingPhase === "Inhale") {
        breathingPhase = "Exhale";
        breathingSeconds = 6;
      } else if (breathingRound >= 2) {
        breathingPhase = "Done";
        breathingRound = 3;
        breathingRunning = false;
        clearInterval(breathingInterval);
        breathingInterval = null;
        showToast("Break finished. Take your time.");
      } else {
        breathingRound += 1;
        breathingPhase = "Inhale";
        breathingSeconds = 4;
      }
    }
    updateBreathingDisplay();
  }, 1000);
  updateBreathingDisplay();
}

function categoryIcon(category) {
  return ({ "Academics": "bookOpen", "Planning": "calendarCheck", "Focus & growth": "target", "Money": "wallet", "Career": "suitcase", "Community": "users", "Marketplace": "cart", "Wellness": "heart", "Relaxation": "sparkle", "Premium ideas": "award", "Utilities": "grid", "Access & personalization": "accessibility", "Backup & advanced": "shield" })[category] ?? "sparkle";
}

function filteredFeatures() {
  const query = discoverQuery.trim().toLowerCase();
  return featureCatalog.filter((feature) => {
    const matchesCategory = discoverCategory === "All" || feature.category === discoverCategory;
    const haystack = `${feature.name} ${feature.description} ${feature.category} ${feature.tags}`.toLowerCase();
    return matchesCategory && (!query || haystack.includes(query));
  });
}

function featureCardsHtml() {
  const results = filteredFeatures();
  if (!results.length) return `<div class="card">${emptyState("discover", "No matching features", "Try a different search or category.")}</div>`;
  return results.map((feature) => `<article class="feature-card"><div class="feature-card-top"><span class="feature-card-icon">${icon(categoryIcon(feature.category))}</span><span class="feature-status ${feature.status === "planned" ? "planned" : ""}">${feature.status === "planned" ? "Planned" : "Available"}</span></div><h3>${escapeHtml(feature.name)}</h3><p>${escapeHtml(feature.description)}</p><div class="feature-card-bottom"><span class="feature-category">${escapeHtml(feature.category)}</span>${feature.status === "available" ? `<button class="feature-open" type="button" data-feature-route="${escapeHtml(feature.route)}" data-feature-tab="${escapeHtml(feature.tab ?? "")}">Open ${icon("arrow")}</button>` : ""}</div></article>`).join("");
}

function updateFeatureResults() {
  const results = filteredFeatures();
  const container = document.getElementById("feature-results");
  const count = document.getElementById("feature-count");
  if (container) container.innerHTML = featureCardsHtml();
  if (count) count.textContent = `${results.length} feature${results.length === 1 ? "" : "s"}`;
  document.querySelectorAll("[data-feature-category]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.featureCategory === discoverCategory)));
}

function renderDiscover() {
  const totalAvailable = featureCatalog.filter((item) => item.status === "available").length;
  return `${pageIntro("Find a tool", `${totalAvailable} tools work now. “Planned” means a feature may come in a future update.`)}
    <div class="card" style="padding:17px 18px;margin-bottom:15px"><div class="discover-header"><div><span class="eyebrow">Search StudentOS</span><p style="margin:5px 0 0;color:var(--muted);font-size:10px">Try words like “attendance”, “notes” or “timer”.</p></div><div class="search-wrap">${icon("discover")}<input id="discover-search" class="search-input" type="search" placeholder="What do you want to do?" value="${escapeHtml(discoverQuery)}" aria-label="Search feature library" /></div></div>
      <div class="category-pills" role="group" aria-label="Feature categories">${featureCategories.map((category) => `<button class="category-pill" type="button" data-feature-category="${escapeHtml(category)}" aria-pressed="${discoverCategory === category}">${escapeHtml(category)}</button>`).join("")}</div>
      <p class="search-meta" id="feature-count">${filteredFeatures().length} features</p>
      <p class="premium-note"><strong>Premium ideas:</strong> this version is free. Nothing is for sale here; there are no subscriptions or payments.</p>
    </div>
    <div class="feature-grid" id="feature-results">${featureCardsHtml()}</div>`;
}

function settingRow(title, description, key) {
  return `<div class="setting-row"><div class="setting-copy"><strong>${title}</strong><span>${description}</span></div><button class="switch" type="button" role="switch" aria-checked="${Boolean(data.profile[key])}" data-setting="${key}" aria-label="${title}"></button></div>`;
}

function renderProfile() {
  const recoveryText = getRecoveryText();
  return `${pageIntro("Your profile & settings", "Change your name or text size, or save a backup of your information.")}
    <div class="profile-header"><span class="profile-avatar">${escapeHtml(initials(data.profile.name))}</span><div><h2>${escapeHtml(data.profile.name)}</h2><p>Your personal StudentOS workspace · stored on this device</p></div></div>
    <div class="grid grid-2 profile-grid">
      <section class="card"><div class="section-heading" style="margin-top:0"><div><h2>Profile</h2><p>Just a name for your dashboard.</p></div><span class="card-icon">${icon("profile")}</span></div><form data-form="profile"><div class="field"><label for="profile-name">Display name</label><input id="profile-name" name="name" type="text" maxlength="30" value="${escapeHtml(data.profile.name)}" required autocomplete="nickname" /></div><div class="form-footer"><button class="primary-button button-small" type="submit">Save name</button></div></form>
        <div class="settings-list" style="margin-top:10px">${settingRow("Larger text", "Increase interface text size across the app.", "largeText")}${settingRow("Reduce motion", "Limit animated transitions and movement.", "reducedMotion")}</div>
      </section>
      <section class="card backup-card"><div class="section-heading" style="margin-top:0"><div><h2>Backup & restore</h2><p>Your information is saved in this browser.</p></div><span class="card-icon">${icon("shield")}</span></div>
        <div class="backup-info"><span class="card-icon">${icon("lock")}</span><div><strong style="font-size:11px">Saved on this device</strong><p>Your information stays in this browser. There is no account or online sync in this release.</p></div></div>
        <div class="button-row"><button class="primary-button button-small" type="button" data-action="export-backup">${icon("download")} Download backup</button><label class="file-input-label">${icon("upload")} Restore backup<input id="backup-file" type="file" accept="application/json,.json" aria-label="Choose a StudentOS JSON backup" /></label></div>
        ${recoveredData && recoveryText ? `<div class="recovery-box"><p>A copy of the unreadable saved text is preserved here. Download it before continuing, then review it or keep it with your records.</p><button class="secondary-button button-small" type="button" data-action="export-recovery">${icon("download")} Download recovery copy</button></div>` : ""}
        <div class="privacy-note">${icon("shieldCheck")}<span>Backups include your subjects, class times, attendance, assignments, notes, name and points. Keep backup files somewhere private. Browser data can be cleared by your device or browser settings.</span></div>
      </section>
      <section class="card"><div class="section-heading" style="margin-top:0"><div><h2>Your points</h2><p>Earn 5 for an assignment and 10 for a finished study timer.</p></div><span class="card-icon">${icon("award")}</span></div><div class="attendance-summary"><div class="attendance-stat"><strong>${data.xp.toLocaleString()}</strong><span>Total points</span></div><div class="attendance-stat"><strong>${data.focusSessions}</strong><span>Study timers finished</span></div><div class="attendance-stat"><strong>${data.tasks.filter((task) => task.done).length}</strong><span>Assignments completed</span></div></div></section>
      <section class="card"><div class="section-heading" style="margin-top:0"><div><h2>Local data</h2><p>Start over if this is a shared or demo device.</p></div><span class="card-icon">${icon("settings")}</span></div><p class="card-subtitle" style="margin-bottom:14px">${data.subjects.length} subjects · ${data.tasks.length} tasks · ${data.notes.length} notes · ${data.attendance.length} attendance records</p><button class="danger-button button-small" type="button" data-action="reset-data">${icon("trash")} Clear all StudentOS data</button></section>
    </div>`;
}

function renderPage() {
  return ({ home: renderHome, study: renderStudy, focus: renderFocus, discover: renderDiscover, profile: renderProfile })[route]?.() ?? renderHome();
}

function render() {
  renderShell();
}

function showToast(message, isError = false) {
  clearTimeout(toastTimeout);
  document.querySelector(".toast")?.remove();
  const toast = document.createElement("div");
  toast.className = `toast ${isError ? "is-error" : ""}`;
  toast.setAttribute("role", isError ? "alert" : "status");
  toast.innerHTML = `${icon(isError ? "help" : "check")}<span></span>`;
  toast.querySelector("span").textContent = message;
  document.body.append(toast);
  liveRegion.textContent = message;
  toastTimeout = setTimeout(() => toast.remove(), 3800);
}

function saveAndRender(message = "Saved on this device.") {
  const saved = saveData(data);
  storageAvailable = storageAvailable && saved;
  render();
  if (!saved) showToast("This change is visible now, but the browser could not save it. Export a backup or check browser storage.", true);
  else showToast(message);
}

function navigate(nextRoute, nextTab = "") {
  if (!["home", "study", "focus", "discover", "profile"].includes(nextRoute)) return;
  if (route === "focus" && nextRoute !== "focus") {
    if (focusRunning) stopFocusTimer();
    if (breathingRunning) {
      breathingRunning = false;
      clearInterval(breathingInterval);
      breathingInterval = null;
    }
  }
  route = nextRoute;
  if (nextRoute === "study" && studyTabs.some(([id]) => id === nextTab)) studyTab = nextTab;
  if (nextRoute === "focus") focusTab = nextTab === "relax" ? "relax" : "timer";
  render();
  window.scrollTo({ top: 0, behavior: data.profile.reducedMotion ? "instant" : "smooth" });
  document.getElementById("main-content")?.focus({ preventScroll: true });
}

function openModal(title, subtitle, content) {
  modal.innerHTML = `<div class="modal-inner"><div class="modal-heading"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(subtitle)}</p></div><button class="modal-close" type="button" data-action="close-modal" aria-label="Close dialog">${icon("close")}</button></div>${content}</div>`;
  modal.showModal();
  modal.querySelector("input:not([type=hidden]),select,textarea,button")?.focus();
}

function closeModal() {
  if (modal.open) modal.close();
  modal.innerHTML = "";
}

function openHelpModal() {
  openModal("How to use StudentOS", "Start with one small step. You can add more later.", `<div class="quick-guide">
    <div class="guide-item"><span class="guide-number">1</span><div><strong>Add a subject</strong><p>A subject is a class or course, such as Biology. Add it from the Home guide or Study → Subjects.</p></div></div>
    <div class="guide-item"><span class="guide-number">2</span><div><strong>Put your schoolwork in Study</strong><p>Add class times, mark attendance, add assignments and write notes in the Study section.</p></div></div>
    <div class="guide-item"><span class="guide-number">3</span><div><strong>Use Focus to study or take a break</strong><p>Choose Study timer, or tap Relax for two simple games and a breathing break. A finished study timer earns 10 points.</p></div></div>
    <div class="guide-item"><span class="guide-number">4</span><div><strong>Find things in Discover</strong><p>Search for a tool. “Available” tools work now; “Planned” tools are ideas for later.</p></div></div>
    <div class="guide-item"><span class="guide-number">5</span><div><strong>Keep a backup in Profile</strong><p>Your information is saved in this browser. In Profile, choose Download backup to keep your own copy.</p></div></div>
    <div class="guide-tip">Points are just a small reward: 5 points for completing an assignment the first time, and 10 for each finished study timer.</div>
    <div class="form-footer"><button class="primary-button button-small" type="button" data-action="close-modal">Got it</button></div>
  </div>`);
}

function openSubjectModal() {
  openModal("Add a subject", "Give a class a home in your study space.", `<form data-form="subject"><div class="field-grid"><div class="field field-full"><label for="subject-name">Subject name</label><input id="subject-name" name="name" type="text" maxlength="50" placeholder="e.g. Biology" required /></div><div class="field"><label for="subject-room">Room or location</label><input id="subject-room" name="room" type="text" maxlength="50" placeholder="Optional" /></div><div class="field"><label for="subject-color">Subject color</label><input id="subject-color" name="color" type="color" value="#a6ff4d" /></div></div><div class="form-footer"><button class="secondary-button button-small" type="button" data-action="close-modal">Cancel</button><button class="primary-button button-small" type="submit">Add subject</button></div></form>`);
}

function openScheduleModal() {
  if (!data.subjects.length) return showToast("Add a subject before setting a class time.", true);
  const day = new Date().getDay();
  openModal("Add a class time", "This class will repeat on the selected weekday.", `<form data-form="schedule"><div class="field-grid"><div class="field"><label for="schedule-subject">Subject</label><select id="schedule-subject" name="subjectId" required>${data.subjects.map((subject) => `<option value="${escapeHtml(subject.id)}">${escapeHtml(subject.name)}</option>`).join("")}</select></div><div class="field"><label for="schedule-day">Day</label><select id="schedule-day" name="day">${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((label, index) => `<option value="${index}" ${index === day ? "selected" : ""}>${label}</option>`).join("")}</select></div><div class="field"><label for="schedule-start">Starts</label><input id="schedule-start" name="start" type="time" value="09:00" required /></div><div class="field"><label for="schedule-end">Ends</label><input id="schedule-end" name="end" type="time" value="10:00" required /></div><div class="field field-full"><label for="schedule-room">Room or location</label><input id="schedule-room" name="room" type="text" maxlength="50" placeholder="Optional" /></div></div><div class="form-footer"><button class="secondary-button button-small" type="button" data-action="close-modal">Cancel</button><button class="primary-button button-small" type="submit">Add to timetable</button></div></form>`);
}

function openAttendanceModal() {
  if (!data.subjects.length) return showToast("Add a subject before logging attendance.", true);
  openModal("Log attendance", "Record one class session for a subject.", `<form data-form="attendance"><div class="field-grid"><div class="field field-full"><label for="attendance-subject">Subject</label><select id="attendance-subject" name="subjectId" required>${data.subjects.map((subject) => `<option value="${escapeHtml(subject.id)}">${escapeHtml(subject.name)}</option>`).join("")}</select></div><div class="field"><label for="attendance-date">Class date</label><input id="attendance-date" name="date" type="date" value="${todayISO()}" required /></div><div class="field"><label for="attendance-status">Status</label><select id="attendance-status" name="status"><option value="present">Present</option><option value="late">Late</option><option value="absent">Absent</option></select></div></div><div class="form-footer"><button class="secondary-button button-small" type="button" data-action="close-modal">Cancel</button><button class="primary-button button-small" type="submit">Save attendance</button></div></form>`);
}

function openTaskModal() {
  openModal("Add a task", "Capture a deadline or a next step.", `<form data-form="task"><div class="field-grid"><div class="field field-full"><label for="task-title">What needs doing?</label><input id="task-title" name="title" type="text" maxlength="120" placeholder="e.g. Review chapter 4" required /></div><div class="field"><label for="task-subject">Subject</label><select id="task-subject" name="subjectId">${subjectOptions()}</select></div><div class="field"><label for="task-due">Due date</label><input id="task-due" name="dueDate" type="date" /></div><div class="field"><label for="task-priority">Priority</label><select id="task-priority" name="priority"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option></select></div></div><div class="form-footer"><button class="secondary-button button-small" type="button" data-action="close-modal">Cancel</button><button class="primary-button button-small" type="submit">Add task</button></div></form>`);
}

function openNoteModal(note = null) {
  const title = note ? "Edit note" : "Write a note";
  const subjectSelect = subjectOptions(note?.subjectId ?? "");
  openModal(title, "Saved locally on this device. Keep personal details out of shared devices.", `<form data-form="note" data-id="${escapeHtml(note?.id ?? "")}"><div class="field-grid"><div class="field field-full"><label for="note-title">Note title</label><input id="note-title" name="title" type="text" maxlength="100" value="${escapeHtml(note?.title ?? "")}" placeholder="e.g. Lecture recap" required /></div><div class="field field-full"><label for="note-content">Your note</label><textarea id="note-content" name="content" maxlength="15000" placeholder="Write a thought, summary or reminder…">${escapeHtml(note?.content ?? "")}</textarea><span class="field-hint">Up to 15,000 characters. Export a backup if you want a copy outside this browser.</span></div><div class="field field-full"><label for="note-subject">Subject</label><select id="note-subject" name="subjectId">${subjectSelect}</select></div></div><div class="form-footer"><button class="secondary-button button-small" type="button" data-action="close-modal">Cancel</button><button class="primary-button button-small" type="submit">${note ? "Save note" : "Save note"}</button></div></form>`);
}

function handleModalSubmit(form) {
  const fields = new FormData(form);
  if (form.dataset.form === "subject") {
    const name = String(fields.get("name") ?? "").trim();
    if (!name || name.length > 50) return showToast("Enter a subject name up to 50 characters.", true);
    data.subjects.push({ id: makeId(), name, room: String(fields.get("room") ?? "").trim(), color: String(fields.get("color") ?? "#a6ff4d") });
    studyTab = "subjects";
    closeModal();
    saveAndRender("Subject added.");
  } else if (form.dataset.form === "schedule") {
    const start = String(fields.get("start") ?? "");
    const end = String(fields.get("end") ?? "");
    if (end <= start) return showToast("The end time must be after the start time.", true);
    data.schedule.push({ id: makeId(), subjectId: String(fields.get("subjectId") ?? ""), day: Number(fields.get("day")), start, end, room: String(fields.get("room") ?? "").trim() });
    studyTab = "timetable";
    closeModal();
    saveAndRender("Class time added.");
  } else if (form.dataset.form === "attendance") {
    data.attendance.push({ id: makeId(), subjectId: String(fields.get("subjectId") ?? ""), date: String(fields.get("date") ?? ""), status: String(fields.get("status") ?? "present") });
    studyTab = "attendance";
    closeModal();
    saveAndRender("Attendance saved.");
  } else if (form.dataset.form === "task") {
    const title = String(fields.get("title") ?? "").trim();
    if (!title || title.length > 120) return showToast("Enter a task title up to 120 characters.", true);
    data.tasks.push({ id: makeId(), title, subjectId: String(fields.get("subjectId") ?? ""), dueDate: String(fields.get("dueDate") ?? ""), priority: String(fields.get("priority") ?? "medium"), done: false, xpAwarded: false, createdAt: new Date().toISOString() });
    studyTab = "tasks";
    closeModal();
    saveAndRender("Task added.");
  } else if (form.dataset.form === "note") {
    const title = String(fields.get("title") ?? "").trim();
    const content = String(fields.get("content") ?? "");
    if (!title || title.length > 100 || content.length > 15000) return showToast("Check the note title and character limit.", true);
    const existingId = form.dataset.id;
    if (existingId) {
      const existing = data.notes.find((item) => item.id === existingId);
      if (existing) Object.assign(existing, { title, content, subjectId: String(fields.get("subjectId") ?? ""), updatedAt: new Date().toISOString() });
    } else {
      data.notes.push({ id: makeId(), title, content, subjectId: String(fields.get("subjectId") ?? ""), updatedAt: new Date().toISOString() });
    }
    studyTab = "notes";
    closeModal();
    saveAndRender(existingId ? "Note updated." : "Note saved.");
  }
}

function downloadText(filename, content, mime = "application/json") {
  const url = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportBackup() {
  try {
    downloadText(`studentos-backup-${todayISO()}.json`, makeBackup(data));
    showToast("Backup downloaded. Keep it somewhere private.");
  } catch {
    showToast("StudentOS could not create a backup from the current data.", true);
  }
}

function startFocusTimer() {
  if (focusRunning) return;
  focusSeconds ??= currentTimerDuration();
  focusRunning = true;
  focusInterval = setInterval(() => {
    focusSeconds = Math.max(0, (focusSeconds ?? currentTimerDuration()) - 1);
    updateTimerDisplay();
    if (focusSeconds === 0) finishFocusPhase();
  }, 1000);
  updateTimerDisplay();
}

function stopFocusTimer() {
  focusRunning = false;
  clearInterval(focusInterval);
  focusInterval = null;
  updateTimerDisplay();
}

function resetFocusTimer() {
  stopFocusTimer();
  focusPhase = "work";
  focusSeconds = data.focus.workMinutes * 60;
  render();
}

function updateTimerDisplay() {
  const value = document.getElementById("timer-value");
  const ring = document.getElementById("timer-ring");
  const toggle = document.getElementById("focus-toggle");
  const phase = document.querySelector(".focus-phase");
  const duration = currentTimerDuration();
  const seconds = focusSeconds ?? duration;
  if (value) value.textContent = formatTimer(seconds);
  if (ring) {
    ring.style.setProperty("--timer-angle", `${Math.round(((duration - seconds) / duration) * 360)}deg`);
    ring.setAttribute("aria-label", `${formatTimer(seconds)} remaining`);
  }
  if (phase) phase.textContent = focusPhase === "work" ? "Focus session" : "Short break";
  if (toggle) {
    toggle.innerHTML = `${icon(focusRunning ? "pause" : "play")} ${focusRunning ? "Pause" : "Start focus"}`;
    toggle.setAttribute("aria-label", focusRunning ? "Pause timer" : "Start timer");
  }
}

function finishFocusPhase() {
  stopFocusTimer();
  if (focusPhase === "work") {
    focusPhase = "break";
    focusSeconds = data.focus.breakMinutes * 60;
    data.focusSessions = Math.min(10_000_000, data.focusSessions + 1);
    data.xp = Math.min(10_000_000, data.xp + 10);
    saveData(data);
    showToast("Study timer finished. You earned 10 points. Take a short break.");
  } else {
    focusPhase = "work";
    focusSeconds = data.focus.workMinutes * 60;
    showToast("Break complete. Start again whenever you're ready.");
  }
  render();
}

function handleClick(event) {
  const routeControl = event.target.closest("[data-route]");
  if (routeControl) {
    event.preventDefault();
    closeModal();
    navigate(routeControl.dataset.route, routeControl.dataset.studyTab ?? "");
    return;
  }

  const featureRoute = event.target.closest("[data-feature-route]");
  if (featureRoute) {
    navigate(featureRoute.dataset.featureRoute, featureRoute.dataset.featureTab ?? "");
    return;
  }

  const tabControl = event.target.closest("[data-study-tab]");
  if (tabControl) {
    const tab = tabControl.dataset.studyTab;
    if (studyTabs.some(([id]) => id === tab)) { studyTab = tab; render(); }
    return;
  }

  const focusTabControl = event.target.closest("[data-focus-tab]");
  if (focusTabControl) {
    const nextTab = focusTabControl.dataset.focusTab;
    if (["timer", "relax"].includes(nextTab)) {
      if (nextTab === "relax" && focusRunning) stopFocusTimer();
      if (nextTab === "timer" && breathingRunning) {
        breathingRunning = false;
        clearInterval(breathingInterval);
        breathingInterval = null;
      }
      focusTab = nextTab;
      render();
    }
    return;
  }

  const category = event.target.closest("[data-feature-category]");
  if (category) {
    discoverCategory = category.dataset.featureCategory;
    updateFeatureResults();
    return;
  }

  const filter = event.target.closest("[data-task-filter]");
  if (filter) {
    taskFilter = filter.dataset.taskFilter;
    render();
    return;
  }

  const modalControl = event.target.closest("[data-modal]");
  if (modalControl) {
    ({ subject: openSubjectModal, schedule: openScheduleModal, attendance: openAttendanceModal, task: openTaskModal, note: () => openNoteModal() })[modalControl.dataset.modal]?.();
    return;
  }

  const setting = event.target.closest("[data-setting]");
  if (setting) {
    const key = setting.dataset.setting;
    if (["largeText", "reducedMotion"].includes(key)) {
      data.profile[key] = !data.profile[key];
      saveAndRender(`${key === "largeText" ? "Text size" : "Motion setting"} updated.`);
    }
    return;
  }

  const control = event.target.closest("[data-action]");
  if (!control) return;
  const id = control.dataset.id;
  switch (control.dataset.action) {
    case "close-modal": closeModal(); break;
    case "open-help": openHelpModal(); break;
    case "edit-note": {
      const note = data.notes.find((item) => item.id === id);
      if (note) openNoteModal(note);
      break;
    }
    case "toggle-task": {
      const task = data.tasks.find((item) => item.id === id);
      if (task) {
        task.done = !task.done;
        const earnedXp = task.done && !task.xpAwarded;
        if (earnedXp) {
          task.xpAwarded = true;
          data.xp = Math.min(10_000_000, data.xp + 5);
        }
        saveAndRender(task.done ? (earnedXp ? "Assignment complete. You earned 5 points." : "Assignment complete.") : "Moved back to your to-do list.");
      }
      break;
    }
    case "delete-task":
      if (confirm("Delete this task?")) { data.tasks = data.tasks.filter((item) => item.id !== id); saveAndRender("Task deleted."); }
      break;
    case "delete-note":
      if (confirm("Delete this note? This cannot be undone unless you have a backup.")) { data.notes = data.notes.filter((item) => item.id !== id); saveAndRender("Note deleted."); }
      break;
    case "delete-attendance":
      if (confirm("Delete this attendance record? Your percentage will be recalculated.")) { data.attendance = data.attendance.filter((item) => item.id !== id); saveAndRender("Attendance record deleted."); }
      break;
    case "delete-schedule":
      if (confirm("Remove this class time from the timetable?")) { data.schedule = data.schedule.filter((item) => item.id !== id); saveAndRender("Class time removed."); }
      break;
    case "delete-subject": {
      const subject = getSubject(id);
      if (subject && confirm(`Delete ${subject.name}? Its attendance and timetable entries will also be removed. Related tasks and notes will stay, without a subject link.`)) {
        data.subjects = data.subjects.filter((item) => item.id !== id);
        data.schedule = data.schedule.filter((item) => item.subjectId !== id);
        data.attendance = data.attendance.filter((item) => item.subjectId !== id);
        data.tasks.forEach((item) => { if (item.subjectId === id) item.subjectId = ""; });
        data.notes.forEach((item) => { if (item.subjectId === id) item.subjectId = ""; });
        saveAndRender("Subject and linked class records deleted.");
      }
      break;
    }
    case "focus-toggle": focusRunning ? stopFocusTimer() : startFocusTimer(); break;
    case "focus-reset": resetFocusTimer(); break;
    case "memory-card": handleMemoryPick(Number(control.dataset.index)); break;
    case "memory-reset": resetMemoryGame(); render(); break;
    case "odd-choice": handleOddPick(Number(control.dataset.index)); break;
    case "odd-reset": clearTimeout(oddTimeout); resetOddGame(); render(); break;
    case "breathing-toggle": toggleBreathingBreak(); break;
    case "export-backup": exportBackup(); break;
    case "export-recovery": {
      const raw = getRecoveryText();
      if (raw) downloadText(`studentos-recovery-copy-${todayISO()}.txt`, raw, "text/plain");
      else showToast("There is no recovery copy available.", true);
      break;
    }
    case "reset-data":
      if (confirm("Clear all StudentOS subjects, timetable entries, attendance, tasks, notes and progress from this browser? Export a backup first if you may want this data later.")) {
        data = createDefaultData();
        clearRecoveryCopy();
        saveData(data);
        studyTab = "subjects";
        focusPhase = "work";
        focusSeconds = null;
        render();
        showToast("StudentOS is clear and ready for a fresh start.");
      }
      break;
    case "install":
      if (installPrompt) {
        installPrompt.prompt();
        installPrompt.userChoice.finally(() => { installPrompt = null; render(); });
      }
      break;
  }
}

function handleSubmit(event) {
  const form = event.target.closest("form[data-form]");
  if (!form) return;
  event.preventDefault();
  const formName = form.dataset.form;
  if (["subject", "schedule", "attendance", "task", "note"].includes(formName)) {
    handleModalSubmit(form);
  } else if (formName === "profile") {
    const name = String(new FormData(form).get("name") ?? "").trim();
    if (!name || name.length > 30) return showToast("Enter a display name up to 30 characters.", true);
    data.profile.name = name;
    saveAndRender("Profile name saved.");
  } else if (formName === "focus-settings") {
    const fields = new FormData(form);
    const workMinutes = Number(fields.get("workMinutes"));
    const breakMinutes = Number(fields.get("breakMinutes"));
    if (!Number.isInteger(workMinutes) || workMinutes < 1 || workMinutes > 90 || !Number.isInteger(breakMinutes) || breakMinutes < 1 || breakMinutes > 30) return showToast("Choose a focus length from 1–90 minutes and a break from 1–30 minutes.", true);
    data.focus = { workMinutes, breakMinutes };
    if (!focusRunning) { focusPhase = "work"; focusSeconds = null; }
    saveAndRender("Timer lengths saved.");
  }
}

async function handleFileChange(event) {
  if (event.target.id !== "backup-file") return;
  const file = event.target.files?.[0];
  if (!file) return;
  if (file.size > 2_500_000) {
    showToast("That file is too large to import.", true);
    event.target.value = "";
    return;
  }
  try {
    const imported = readBackup(await file.text());
    if (!confirm("Restore this backup? It will replace the StudentOS data currently in this browser.")) return;
    data = imported;
    recoveredData = false;
    saveAndRender("Backup restored successfully.");
  } catch (error) {
    showToast(error instanceof Error ? error.message : "The backup could not be read.", true);
  } finally {
    event.target.value = "";
  }
}

document.addEventListener("click", handleClick);
document.addEventListener("submit", handleSubmit);
document.addEventListener("change", handleFileChange);
document.addEventListener("input", (event) => {
  if (event.target.id === "discover-search") {
    discoverQuery = event.target.value;
    updateFeatureResults();
  }
});

modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

window.addEventListener("online", () => {
  document.querySelector(".online-indicator")?.classList.remove("offline");
  const label = document.querySelector(".online-indicator");
  if (label) { label.textContent = "Online"; label.setAttribute("aria-label", "Online; saved data is local"); }
});
window.addEventListener("offline", () => {
  const label = document.querySelector(".online-indicator");
  if (label) { label.classList.add("offline"); label.textContent = "Offline"; label.setAttribute("aria-label", "Offline; saved data is available locally"); }
});
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  render();
});

render();
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {
    showToast("Offline app files could not be cached yet. Use the app online once and try again.", true);
  }));
}
