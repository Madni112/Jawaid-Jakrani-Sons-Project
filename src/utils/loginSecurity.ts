/**
 * Login Security Service
 * Tiered Rate Limiting & Exponential Backoff Protection
 * 
 * Rules:
 * 1. 5 failed attempts at Tier 1 -> 90 seconds real-time lockout
 * 2. 5 failed attempts at Tier 2 -> 180 seconds real-time lockout
 * 3. 5 failed attempts at Tier 3+ -> 300 seconds (5 mins) lockout
 * 4. 10 minutes of inactivity -> Failed attempts decay back to 0
 * 5. 4 hours of inactivity -> Tier demotes back to Level 1
 * 6. Successful login -> Immediate full reset of all counters & tiers
 */

export interface LoginSecurityState {
  attempts: number;        // Failed attempts count in current tier (0 to 5)
  tier: number;            // Current lockout tier (1 = 90s, 2 = 180s, 3+ = 300s)
  lockedUntilMs: number;   // Timestamp (ms) until which sign in is blocked (0 if not locked)
  lastAttemptMs: number;   // Timestamp (ms) of the most recent failed attempt
  lastLockoutMs: number;   // Timestamp (ms) of when the last lockout occurred
}

export interface SecurityStatus {
  isLocked: boolean;
  remainingSeconds: number;
  currentAttempts: number;
  remainingAttempts: number;
  tier: number;
  lockoutDurationSec: number;
}

const STORAGE_PREFIX = 'zac_login_sec_';
const MAX_ATTEMPTS_PER_TIER = 5;
const INACTIVITY_ATTEMPTS_RESET_MS = 10 * 60 * 1000; // 10 minutes
const INACTIVITY_TIER_RESET_MS = 4 * 60 * 60 * 1000;   // 4 hours

const getTierDurationSec = (tier: number): number => {
  if (tier <= 1) return 90;
  if (tier === 2) return 180;
  return 300; // Tier 3 or higher: 5 minutes
};

const getStorageKey = (email?: string): string => {
  const norm = (email || '').toLowerCase().trim();
  return norm ? `${STORAGE_PREFIX}${norm}` : `${STORAGE_PREFIX}global`;
};

/**
 * Retrieve raw security state from storage, applying inactivity decay rules
 */
export const getLoginSecurityState = (email?: string): LoginSecurityState => {
  const key = getStorageKey(email);
  const now = Date.now();

  const defaultState: LoginSecurityState = {
    attempts: 0,
    tier: 1,
    lockedUntilMs: 0,
    lastAttemptMs: 0,
    lastLockoutMs: 0
  };

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultState;

    const state: LoginSecurityState = JSON.parse(raw);

    // Rule 5: 4-5 hours inactivity demotes tier back to Level 1 (if not currently locked)
    if (state.lockedUntilMs <= now && state.lastLockoutMs > 0 && (now - state.lastLockoutMs > INACTIVITY_TIER_RESET_MS)) {
      state.tier = 1;
    }

    // Rule 4: 10 minutes of inactivity resets failed attempts counter back to 0 (if not currently locked)
    if (state.lockedUntilMs <= now && state.lastAttemptMs > 0 && (now - state.lastAttemptMs > INACTIVITY_ATTEMPTS_RESET_MS)) {
      state.attempts = 0;
    }

    return state;
  } catch (_) {
    return defaultState;
  }
};

/**
 * Save updated state to storage
 */
const saveLoginSecurityState = (state: LoginSecurityState, email?: string): void => {
  const key = getStorageKey(email);
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch (_) {}
};

/**
 * Get current public security status for an email (for UI rendering & countdown)
 */
export const checkLoginSecurityStatus = (email?: string): SecurityStatus => {
  const state = getLoginSecurityState(email);
  const now = Date.now();
  const isLocked = state.lockedUntilMs > now;
  const remainingSeconds = isLocked ? Math.ceil((state.lockedUntilMs - now) / 1000) : 0;
  const currentAttempts = state.attempts;
  const remainingAttempts = Math.max(0, MAX_ATTEMPTS_PER_TIER - currentAttempts);
  const lockoutDurationSec = getTierDurationSec(state.tier);

  return {
    isLocked,
    remainingSeconds,
    currentAttempts,
    remainingAttempts,
    tier: state.tier,
    lockoutDurationSec
  };
};

/**
 * Record a failed login attempt. Returns updated security status.
 */
export const recordFailedLoginAttempt = (email?: string): SecurityStatus => {
  const state = getLoginSecurityState(email);
  const now = Date.now();

  state.attempts += 1;
  state.lastAttemptMs = now;

  let lockoutDurationSec = 0;

  // Check if threshold reached
  if (state.attempts >= MAX_ATTEMPTS_PER_TIER) {
    lockoutDurationSec = getTierDurationSec(state.tier);
    state.lockedUntilMs = now + (lockoutDurationSec * 1000);
    state.lastLockoutMs = now;
    state.attempts = 0; // Reset counter for next round
    // Advance tier for next failure series (Tier 1 -> Tier 2 -> Tier 3)
    state.tier = state.tier + 1;
  }

  saveLoginSecurityState(state, email);

  const isLocked = state.lockedUntilMs > now;
  const remainingSeconds = isLocked ? Math.ceil((state.lockedUntilMs - now) / 1000) : 0;

  return {
    isLocked,
    remainingSeconds,
    currentAttempts: state.attempts,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS_PER_TIER - state.attempts),
    tier: isLocked ? (state.tier - 1) : state.tier, // Show active tier that triggered the lock
    lockoutDurationSec: lockoutDurationSec || getTierDurationSec(state.tier)
  };
};

/**
 * Reset all security counters immediately upon successful authentication
 */
export const resetLoginSecurity = (email?: string): void => {
  const key = getStorageKey(email);
  const globalKey = getStorageKey();
  try {
    localStorage.removeItem(key);
    if (key !== globalKey) {
      localStorage.removeItem(globalKey);
    }
  } catch (_) {}
};

/**
 * Format remaining seconds into MM:SS display
 */
export const formatLockoutTime = (seconds: number): string => {
  if (seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};
