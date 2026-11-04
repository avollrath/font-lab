// Mock chrome API
const chromeMock = {
  storage: {
    local: {
      get: async (key: string | string[]) => ({ [Array.isArray(key) ? key[0] : key]: undefined }),
      set: async () => {},
      remove: async () => {},
    },
  },
  runtime: {
    onMessage: {
      addListener: () => {},
      removeListener: () => {},
    },
    sendMessage: async () => {},
  },
  tabs: {
    sendMessage: async () => {},
  },
  scripting: {
    executeScript: async () => {},
  },
  action: {
    onClicked: {
      addListener: () => {},
    },
  },
};

Object.defineProperty(global, 'chrome', {
  value: chromeMock,
  writable: true,
});
