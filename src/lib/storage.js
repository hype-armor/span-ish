/* A tiny key/value store over localStorage.
 *
 * The app was first built against a host that provided window.storage, so it
 * still talks to that shape. This fills it in when nothing else has, and falls
 * back to memory where localStorage throws — private windows, mostly, where
 * the app should still work even though nothing survives a reload. */
const PREFIX = "mx-pwa:";

export function installStorage() {
  if (window.storage) return;

  const usable = (() => {
    try {
      const probe = PREFIX + "__probe";
      localStorage.setItem(probe, "1");
      localStorage.removeItem(probe);
      return true;
    } catch {
      return false;
    }
  })();

  const memory = new Map();

  window.storage = {
    async get(key) {
      const value = usable ? localStorage.getItem(PREFIX + key) : memory.get(key);
      return value == null ? null : { key, value, shared: false };
    },
    async set(key, value) {
      const text = String(value);
      if (usable) localStorage.setItem(PREFIX + key, text);
      else memory.set(key, text);
      return { key, value: text, shared: false };
    },
    async delete(key) {
      if (usable) localStorage.removeItem(PREFIX + key);
      else memory.delete(key);
      return { key, deleted: true, shared: false };
    },
    async list(prefix = "") {
      const keys = [];
      if (usable) {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(PREFIX + prefix)) keys.push(k.slice(PREFIX.length));
        }
      } else {
        for (const k of memory.keys()) if (k.startsWith(prefix)) keys.push(k);
      }
      return { keys, prefix, shared: false };
    },
  };
}

/* Keys tried in order, newest first, so progress saved under an older name is
   picked up once and then written back under the current one. */
export const PROGRESS_KEYS = ["mx:progress", "mx-shortcuts:progress", "spanish-shortcuts:scores"];
export const THEME_KEYS = ["mx:theme", "mx-shortcuts:theme"];

export async function readFirst(keys) {
  for (const key of keys) {
    try {
      const hit = await window.storage.get(key);
      if (hit && hit.value) return hit.value;
    } catch {
      /* a storage that throws is the same as one that is empty */
    }
  }
  return null;
}
