interface Window {
  electron?: {
    isElectronApp: boolean;
    ipc: {
      send: (channel: string, data: unknown) => void;
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
      on: (channel: string, callback: (...args: unknown[]) => void) => () => void;
    };
  };
}