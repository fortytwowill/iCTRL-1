import "@testing-library/jest-dom";

// Node ≥22 exposes an experimental global `localStorage` getter that returns
// undefined without --localstorage-file, shadowing jsdom's Storage in this
// environment. Install a Map-backed Web Storage implementation so tests get
// the browser contract (getItem/setItem/removeItem/clear/key/length).
class MemoryStorage {
  #store = new Map<string, string>();

  get length() {
    return this.#store.size;
  }

  key(index: number) {
    return [...this.#store.keys()][index] ?? null;
  }

  getItem(key: string) {
    return this.#store.has(key) ? this.#store.get(key)! : null;
  }

  setItem(key: string, value: string) {
    this.#store.set(String(key), String(value));
  }

  removeItem(key: string) {
    this.#store.delete(key);
  }

  clear() {
    this.#store.clear();
  }
}

// Assign on both the Node global (bare `localStorage` in modules) and the
// test `window` object; the targets may or may not be the same object.
const storage = new MemoryStorage();
(globalThis as Record<string, unknown>).localStorage = storage;
(window as unknown as Record<string, unknown>).localStorage = storage;

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => {
    const listeners = new Set<(event: { matches: boolean }) => void>();
    return {
      matches: false,
      media: query,
      onchange: null,
      // Route the deprecated MediaQueryList API into the same set as
      // addEventListener so legacy-API consumers receive change events.
      addListener: (cb: (event: { matches: boolean }) => void) => {
        listeners.add(cb);
      },
      removeListener: (cb: (event: { matches: boolean }) => void) => {
        listeners.delete(cb);
      },
      addEventListener: (_: string, cb: (event: { matches: boolean }) => void) => {
        listeners.add(cb);
      },
      removeEventListener: (_: string, cb: (event: { matches: boolean }) => void) => {
        listeners.delete(cb);
      },
      dispatchEvent: () => false,
    };
  },
});
