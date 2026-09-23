const STORAGE_KEY = 'reposweep.theme';
const PREFERS_DARK = window.matchMedia('(prefers-color-scheme: dark)');

export function readTheme() {
  return localStorage.getItem(STORAGE_KEY) || 'system';
}

export function writeTheme(theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}

export function applyTheme(theme) {
  const dark = theme === 'dark' || (theme === 'system' && PREFERS_DARK.matches);
  document.documentElement.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
}

export function initTheme() {
  applyTheme(readTheme());
  PREFERS_DARK.addEventListener('change', () => {
    if (readTheme() === 'system') applyTheme('system');
  });
}