"use client";

const HISTORY_KEY = "fg_nav_history_stack";
const MAX_HISTORY_LENGTH = 15;

/**
 * Retrieve the current recorded navigation history stack.
 */
export function getNavigationHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Record a URL into the navigation history stack.
 * Maintains up to MAX_HISTORY_LENGTH past paths and ignores consecutive duplicates.
 */
export function recordNavigation(url: string): void {
  if (typeof window === "undefined" || !url) return;

  // Ignore auth, api, or static endpoints
  if (
    url.startsWith("/api") ||
    url.startsWith("/_next") ||
    url.startsWith("/admin-login") ||
    url.startsWith("/login")
  ) {
    return;
  }

  try {
    const history = getNavigationHistory();
    const lastUrl = history[history.length - 1];

    // Don't record identical consecutive URLs
    if (lastUrl === url) return;

    history.push(url);

    // Limit stack size to maximum length (retaining at least 5-15 past paths)
    if (history.length > MAX_HISTORY_LENGTH) {
      history.splice(0, history.length - MAX_HISTORY_LENGTH);
    }

    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    console.error("Failed to record navigation history:", err);
  }
}

/**
 * Inspect the previous path (prior to the current one) without mutating the history stack.
 */
export function getPreviousPath(currentUrl?: string): string | null {
  if (typeof window === "undefined") return null;
  const history = getNavigationHistory();
  if (history.length === 0) return null;

  const current = currentUrl || `${window.location.pathname}${window.location.search}`;

  for (let i = history.length - 1; i >= 0; i--) {
    const path = history[i];
    if (path && path !== current) {
      return path;
    }
  }

  return null;
}

/**
 * Pop the previous path from history and update the stack in sessionStorage.
 */
export function popPreviousPath(currentUrl?: string): string | null {
  if (typeof window === "undefined") return null;
  const history = getNavigationHistory();
  if (history.length === 0) return null;

  const current = currentUrl || `${window.location.pathname}${window.location.search}`;

  let targetIndex = -1;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i] && history[i] !== current) {
      targetIndex = i;
      break;
    }
  }

  if (targetIndex >= 0) {
    const targetPath = history[targetIndex];
    // Trim the history stack to the target path index
    const newHistory = history.slice(0, targetIndex);
    try {
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    } catch {}
    return targetPath;
  }

  return null;
}
