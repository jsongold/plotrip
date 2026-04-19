const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

let initialized = false;

export function initAnalytics() {
  if (initialized) return;
  initialized = true;

  if (!MEASUREMENT_ID) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID);
}

export function track(eventName, params = {}) {
  if (MEASUREMENT_ID && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  } else if (import.meta.env.DEV) {
    console.debug('[analytics]', eventName, params);
  }
}
