const PLAN_KEY = "sets_plan";
const SESSIONS_KEY = "sets_sessions";
const ACTIVE_SESSION_KEY = "sets_active_session";

export function getPlan() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function savePlan(plan) {
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
}

export function clearPlan() {
  localStorage.removeItem(PLAN_KEY);
}

export function getSessions() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addSession(session) {
  const sessions = getSessions();
  sessions.push(session);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  return sessions;
}

export function clearSessions() {
  localStorage.removeItem(SESSIONS_KEY);
}

export function getActiveSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveActiveSession(session) {
  if (session) {
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  }
}

export function todayString() {
  return new Date().toISOString().split("T")[0];
}

export function isDayCompletedToday(dayId) {
  const sessions = getSessions();
  const today = todayString();
  return sessions.some((s) => s.dayId === dayId && s.date === today);
}
