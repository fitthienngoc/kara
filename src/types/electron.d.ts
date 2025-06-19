interface Window {
  electronAPI?: {
    isElectronApp: boolean;
    ipc: {
      send: (channel: string, data?: unknown) => void;
      invoke: (channel: string, ...args: unknown[]) => Promise<string>;
      on: (
        channel: string,
        callback: (...args: string[]) => void,
      ) => () => void;
      removeAllListeners: (channel) => void;
    };
  };
  webkitAudioContext?: typeof AudioContext;
}
