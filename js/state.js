const SAVE_KEY = "rickshaw-boy-save-v1";

const STAT_MAX = {
  money: 100,
  stamina: 100,
  dignity: 100,
};

const DEFAULT_STATE = () => ({
  money: 18,
  stamina: 78,
  dignity: 72,
  nodeId: "n1_enter",
  flags: {
    hasCamel: false,
    marriedHuniu: false,
    helpedFuzi: false,
    ownedRickshaw: false,
    borrowed: false,
  },
  pullSessionsDone: 0,
});

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function createState(overrides = {}) {
  const base = DEFAULT_STATE();
  return {
    ...base,
    ...overrides,
    flags: { ...base.flags, ...(overrides.flags || {}) },
  };
}

export function applyDelta(state, delta = {}) {
  const next = { ...state, flags: { ...state.flags } };
  if (typeof delta.money === "number") {
    next.money = clamp(next.money + delta.money, 0, STAT_MAX.money);
  }
  if (typeof delta.stamina === "number") {
    next.stamina = clamp(next.stamina + delta.stamina, 0, STAT_MAX.stamina);
  }
  if (typeof delta.dignity === "number") {
    next.dignity = clamp(next.dignity + delta.dignity, 0, STAT_MAX.dignity);
  }
  if (delta.flags) {
    Object.assign(next.flags, delta.flags);
  }
  if (typeof delta.pullSessionsDone === "number") {
    next.pullSessionsDone = delta.pullSessionsDone;
  }
  if (delta.nodeId) {
    next.nodeId = delta.nodeId;
  }
  return next;
}

export function saveState(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.nodeId !== "string") return null;
    return createState(parsed);
  } catch {
    return null;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}

export function hasSave() {
  return loadState() !== null;
}

export { STAT_MAX };
