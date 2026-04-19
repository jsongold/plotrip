export function initTheme() {
  document.documentElement.setAttribute('data-theme', 'light');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', '#f5f5f5');
}
