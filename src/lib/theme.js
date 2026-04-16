const STORAGE_KEY = 'plotrip_theme';

export function getStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function systemPrefersDark() {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

export function resolvedTheme(stored = getStoredTheme()) {
  if (stored === 'light' || stored === 'dark') return stored;
  return systemPrefersDark() ? 'dark' : 'light';
}

export function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === 'light' || mode === 'dark') {
    root.setAttribute('data-theme', mode);
  } else {
    root.removeAttribute('data-theme');
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', resolvedTheme(mode === 'auto' ? null : mode) === 'dark' ? '#0a0a0a' : '#f5f5f5');
  }
}

export function setTheme(mode) {
  try {
    if (mode === 'auto') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, mode);
  } catch {}
  applyTheme(mode);
}

export function initTheme() {
  const stored = getStoredTheme();
  applyTheme(stored ?? 'auto');

  if (typeof window !== 'undefined') {
    window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (!getStoredTheme()) applyTheme('auto');
    });
  }
}
