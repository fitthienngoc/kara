type TValidInvokeChannels =
  | "show-save-dialog"
  | "open-output-folder"
  | "open-directory"
  | "get-default-save-path";

type TValidOnChannels = "render-log" | "render-error" | "render-complete";
type TValidSendChannels = "render-video" | "stop-render" | "show-save-dialog";
interface Window {
  electronAPI?: {
    isElectronApp: boolean;
    ipc: {
      send: (channel: TValidSendChannels, data?: unknown) => void;
      invoke: (
        channel: TValidInvokeChannels,
        ...args: unknown[]
      ) => Promise<string>;
      on: (
        channel: TValidOnChannels,
        callback: (...args: string[]) => void,
      ) => () => void;
      removeAllListeners: (
        channel: "render-log" | "render-error" | "render-complete",
      ) => void;
    };
  };
  webkitAudioContext?: typeof AudioContext;
}
