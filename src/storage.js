// Simple localStorage wrapper
const storage = {
  get: async (key) => {
    const value = localStorage.getItem(key);
    return value ? { value } : null;
  },
  set: async (key, value) => {
    localStorage.setItem(key, value);
    return true;
  }
};

window.storage = storage;