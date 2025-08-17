const store = new Map();

const ttl = jest.fn(async (key) => (store.has(key) ? 30 : -2));
const set = jest.fn(async (key, val, opts) => { store.set(key, val); });
const get = jest.fn(async (key) => (store.has(key) ? store.get(key) : null));
const del = jest.fn(async (key) => { const had = store.delete(key); return had ? 1 : 0; });

module.exports = { ttl, set, get, del, __reset: () => store.clear() };
