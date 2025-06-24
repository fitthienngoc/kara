/* eslint-disable @typescript-eslint/no-require-imports */
const { contextBridge, ipcRenderer } = require("electron");

// Expose các API an toàn cho renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  // Thêm flag để kiểm tra xem có đang chạy trong Electron không
  isElectronApp: true,

  // Thêm các phương thức IPC cần thiết
  ipc: {
    send: (channel, data) => {
      // Chỉ cho phép một số kênh cụ thể để đảm bảo an toàn
      const validChannels = ["render-video", "stop-render", "show-save-dialog"];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    invoke: (channel, ...args) => {
      // Thêm "open-output-folder" vào danh sách kênh hợp lệ
      const validChannels = [
        "show-save-dialog",
        "open-output-folder",
        "open-directory",
        "get-default-save-path",
      ];
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }
      return Promise.reject(new Error("Unauthorized IPC channel"));
    },
    on: (channel, callback) => {
      const validChannels = ["render-log", "render-error", "render-complete"];
      console.log("Channel:", channel);
      console.log("validChannels:", validChannels);
      if (validChannels.includes(channel)) {
        // Xóa IPC Event để tránh memory leaks
        ipcRenderer.removeAllListeners(channel);

        // Thiết lập một listener mới và chuyển tiếp dữ liệu thông qua callback
        ipcRenderer.on(channel, (event, ...args) => {
          console.log(`Received data on channel: ${channel}`, args);
          return callback(...args);
        });

        // Trả về hàm để remove listener khi không cần nữa
        return () => {
          ipcRenderer.removeAllListeners(channel);
        };
      }
    },
    removeAllListeners: (channel) => {
      ipcRenderer.removeAllListeners(channel);
    },
  },
});
