const listeners = new Map();

export function on(event, callback) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(callback);
  return () => listeners.get(event)?.delete(callback);
}

export function emit(event, payload) {
  listeners.get(event)?.forEach(callback => callback(payload));
}

export const appState = {
  route: 'home',
  moduleCache: new Map(),
  pageCache: new Map()
};
