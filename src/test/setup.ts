// Mock browser/chrome storage APIs for tests
const storageMock = {
  storage: {
    local: {
      get: async (key: string | string[] | Record<string, unknown>) => {
        const k = typeof key === 'string' ? key : Array.isArray(key) ? key[0] : Object.keys(key)[0];
        return { [k as string]: undefined };
      },
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

// @ts-expect-error - test mock
globalThis.chrome = storageMock;
// @ts-expect-error - test mock
globalThis.browser = storageMock;
