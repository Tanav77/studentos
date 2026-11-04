export const DATA_VERSION = 1;
export const BACKUP_KIND = "studentos-backup";

const STORAGE_KEY = "studentos:data";
const RECOVERY_KEY = "studentos:recovery";
const MAX_BACKUP_CHARS = 5_000_000;

export function createDefaultData() {
  return {
    schemaVersion: DATA_VERSION,
    profile: { name: "Student", reducedMotion: false, largeText: false },
    subjects: [],
    schedule: [],
    attendance: [],
    tasks: [],
    notes: [],
    focus: { workMinutes: 25, breakMinutes: 5 },
    xp: 0,
    focusSessions: 0
  };
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function validId(value) {
  return typeof value === "string" && value.length > 0 && value.length <= 80 && /^[\w-]+$/.test(value);
}

function migrate(data, version) {
  let next = data;
  let current = version;
  while (current < DATA_VERSION) {
    if (current === 0) {
      // Version 0 was the prototype shape. Preserve recognized fields and add current defaults.
      const defaults = createDefaultData();
      const profile = isRecord(next.profile) ? next.profile : {};
      defaults.profile.name = typeof profile.name === "string"
        ? profile.name
        : (typeof next.userName === "string" ? next.userName : defaults.profile.name);
      for (const key of ["subjects", "schedule", "attendance", "tasks", "notes", "focus", "xp", "focusSessions"]) {
        if (Object.hasOwn(next, key)) defaults[key] = next[key];
      }
      defaults.profile.reducedMotion = profile.reducedMotion === true;
      defaults.profile.largeText = profile.largeText === true;
      next = defaults;
      current = 1;
      continue;
    }
    throw new Error("This StudentOS data version cannot be migrated.");
  }
  return { ...next, schemaVersion: DATA_VERSION };
}

function normalizeData(input, strict = false) {
  const fail = (message) => { throw new Error(message); };
  if (!isRecord(input)) fail("The backup must contain a StudentOS data object.");

  const rawVersion = input.schemaVersion ?? input.version ?? 0;
  if (!Number.isInteger(rawVersion) || rawVersion < 0) fail("The data version is not valid.");
  if (rawVersion > DATA_VERSION) fail("This backup was created by a newer StudentOS version. Update the app before restoring it.");

  let source;
  try {
    source = migrate(input, rawVersion);
  } catch (error) {
    if (strict) throw error;
    source = createDefaultData();
  }

  const defaults = createDefaultData();
  const text = (value, field, max, allowEmpty = false) => {
    if (typeof value !== "string" || value.length > max || (!allowEmpty && !value.trim())) {
      fail(`${field} is missing or too long.`);
    }
    return value;
  };
  const id = (value, field) => {
    if (!validId(value)) fail(`${field} has an invalid ID.`);
    return value;
  };
  const numberIn = (value, field, min, max) => {
    if (!Number.isInteger(value) || value < min || value > max) fail(`${field} is outside the allowed range.`);
    return value;
  };
  const list = (key, parse, maxCount = 2000) => {
    const values = source[key];
    if (!Array.isArray(values)) {
      if (strict) fail(`${key} must be a list.`);
      return [];
    }
    if (values.length > maxCount) fail(`${key} contains too many items.`);
    const result = [];
    const seenIds = new Set();
    for (const value of values) {
      try {
        const item = parse(value);
        if (seenIds.has(item.id)) fail(`${key} contains a duplicate ID.`);
        seenIds.add(item.id);
        result.push(item);
      } catch (error) {
        if (strict) throw error;
      }
    }
    return result;
  };

  const rawProfile = isRecord(source.profile) ? source.profile : {};
  let profile = { ...defaults.profile };
  try {
    profile = {
      name: text(rawProfile.name ?? defaults.profile.name, "Profile name", 30),
      reducedMotion: rawProfile.reducedMotion === true,
      largeText: rawProfile.largeText === true
    };
  } catch (error) {
    if (strict) throw error;
  }

  const subjects = list("subjects", (value) => {
    if (!isRecord(value)) fail("A subject entry is not valid.");
    const color = value.color ?? "#a6ff4d";
    if (typeof color !== "string" || !/^#[\da-fA-F]{6}$/.test(color)) fail("A subject color is not valid.");
    return {
      id: id(value.id, "Subject"),
      name: text(value.name, "Subject name", 50),
      room: text(value.room ?? "", "Subject room", 50, true),
      color: color.toLowerCase()
    };
  }, 500);
  const subjectIds = new Set(subjects.map((subject) => subject.id));
  const linkedSubject = (value, field) => {
    const subjectId = value ?? "";
    if (subjectId !== "" && !subjectIds.has(subjectId)) fail(`${field} links to a subject that does not exist.`);
    return subjectId;
  };

  const schedule = list("schedule", (value) => {
    if (!isRecord(value)) fail("A timetable entry is not valid.");
    if (!Number.isInteger(value.day) || value.day < 0 || value.day > 6) fail("A timetable day is not valid.");
    if (typeof value.start !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.start)) fail("A class start time is not valid.");
    if (typeof value.end !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.end) || value.end <= value.start) fail("A class end time is not valid.");
    return {
      id: id(value.id, "Timetable entry"),
      subjectId: linkedSubject(value.subjectId, "A timetable entry"),
      day: value.day,
      start: value.start,
      end: value.end,
      room: text(value.room ?? "", "Timetable room", 50, true)
    };
  });
  const attendance = list("attendance", (value) => {
    if (!isRecord(value)) fail("An attendance entry is not valid.");
    if (!isDate(value.date)) fail("An attendance date is not valid.");
    if (!["present", "late", "absent"].includes(value.status)) fail("An attendance status is not valid.");
    return {
      id: id(value.id, "Attendance entry"),
      subjectId: linkedSubject(value.subjectId, "An attendance entry"),
      date: value.date,
      status: value.status
    };
  });
  const tasks = list("tasks", (value) => {
    if (!isRecord(value)) fail("A task entry is not valid.");
    const dueDate = value.dueDate ?? "";
    if (dueDate !== "" && !isDate(dueDate)) fail("A task due date is not valid.");
    if (!["low", "medium", "high"].includes(value.priority)) fail("A task priority is not valid.");
    return {
      id: id(value.id, "Task"),
      title: text(value.title, "Task title", 120),
      subjectId: linkedSubject(value.subjectId, "A task"),
      dueDate,
      priority: value.priority,
      done: value.done === true,
      xpAwarded: value.xpAwarded === true,
      createdAt: typeof value.createdAt === "string" && value.createdAt.length <= 40 ? value.createdAt : ""
    };
  });
  const notes = list("notes", (value) => {
    if (!isRecord(value)) fail("A note entry is not valid.");
    return {
      id: id(value.id, "Note"),
      title: text(value.title, "Note title", 100),
      content: text(value.content ?? "", "Note content", 15000, true),
      subjectId: linkedSubject(value.subjectId, "A note"),
      updatedAt: typeof value.updatedAt === "string" && value.updatedAt.length <= 40 ? value.updatedAt : ""
    };
  });

  const rawFocus = isRecord(source.focus) ? source.focus : defaults.focus;
  let focus = { ...defaults.focus };
  try {
    focus = {
      workMinutes: numberIn(rawFocus.workMinutes ?? defaults.focus.workMinutes, "Work duration", 1, 90),
      breakMinutes: numberIn(rawFocus.breakMinutes ?? defaults.focus.breakMinutes, "Break duration", 1, 30)
    };
  } catch (error) {
    if (strict) throw error;
  }

  const counters = {};
  for (const [key, label] of [["xp", "XP"], ["focusSessions", "Focus sessions"]]) {
    const value = source[key] ?? 0;
    try {
      counters[key] = numberIn(value, label, 0, 10_000_000);
    } catch (error) {
      if (strict) throw error;
      counters[key] = 0;
    }
  }

  return { schemaVersion: DATA_VERSION, profile, subjects, schedule, attendance, tasks, notes, focus, ...counters };
}

export function validateData(input) {
  return normalizeData(input, true);
}

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { data: createDefaultData(), recovered: false, storageAvailable: true };
    try {
      return { data: normalizeData(JSON.parse(raw)), recovered: false, storageAvailable: true };
    } catch (error) {
      try { localStorage.setItem(RECOVERY_KEY, raw); } catch { /* Keep the app usable if storage is full. */ }
      return { data: createDefaultData(), recovered: true, storageAvailable: true };
    }
  } catch {
    return { data: createDefaultData(), recovered: false, storageAvailable: false };
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validateData(data)));
    return true;
  } catch {
    return false;
  }
}

export function makeBackup(data) {
  const cleanData = validateData(data);
  return JSON.stringify({
    kind: BACKUP_KIND,
    schemaVersion: DATA_VERSION,
    exportedAt: new Date().toISOString(),
    data: cleanData
  }, null, 2);
}

export function readBackup(raw) {
  if (typeof raw !== "string" || raw.length > MAX_BACKUP_CHARS) throw new Error("This backup is too large to import.");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("That file is not valid JSON.");
  }
  if (!isRecord(parsed) || parsed.kind !== BACKUP_KIND) throw new Error("This file is not a StudentOS backup.");
  if (parsed.schemaVersion !== DATA_VERSION) {
    if (parsed.schemaVersion > DATA_VERSION) throw new Error("This backup is from a newer StudentOS version.");
    throw new Error("This backup version is not supported.");
  }
  return validateData(parsed.data);
}

export function getRecoveryText() {
  try { return localStorage.getItem(RECOVERY_KEY) ?? ""; } catch { return ""; }
}

export function clearRecoveryCopy() {
  try { localStorage.removeItem(RECOVERY_KEY); } catch { /* Clearing the main app can still continue. */ }
}
