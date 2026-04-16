export function tick(ms = 10) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(ms);
  }
}

export function pulse() { tick(15); }
export function bump()  { tick(8); }
