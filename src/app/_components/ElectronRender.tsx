"use client";

import React, { useState, useEffect } from "react";

// Kiểm tra xem có đang chạy trong Electron không
const isElectron = () => {
  if (typeof window === 'undefined') return false;
  // Kiểm tra sự tồn tại của biến isElectronApp đã được expose từ preload.js
  return window?.electron?.isElectronApp === true;
};

interface ElectronRenderProps {
  saveSettings: () => void;
  videoSettings: unknown;
  audioFile: File | null;
}

export const ElectronRender: React.FC<ElectronRenderProps> = ({
  videoSettings,
  audioFile,
}) => {
  const [isRendering, setIsRendering] = useState(false);
  const [renderLog, setRenderLog] = useState<string[]>([]);
  const [outputPath, setOutputPath] = useState("/videos/rendered-video.mp4");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Chỉ thiết lập các listener nếu đang chạy trong Electron
    if (isElectron()) {
      const { ipcRenderer } = window.require("electron");

      // Lắng nghe các sự kiện từ main process
      ipcRenderer.on("render-log", (_event: unknown, message: string) => {
        setRenderLog((prev) => [...prev, message]);

        // Phân tích log để cập nhật tiến trình
        console.log(message);

        if (message.includes("Rendered")) {
          const match = message.match(
            /Rendered (\d+)\/(\d+), time remaining: (\d+m )?\d+s/,
          );
          console.log({ match });
          if (match && match.length >= 3) {
            const current = parseInt(match[1]);
            const total = parseInt(match[2]);
            setProgress(Math.floor((current / total) * 100));
          }
        }
      });

      ipcRenderer.on("render-error", (_event: unknown, message: unknown) => {
        setRenderLog((prev) => [...prev, `ERROR: ${message}`]);
      });

      ipcRenderer.on("render-complete", (_event: unknown, success: unknown) => {
        setIsRendering(false);
        setRenderLog((prev) => [
          ...prev,
          success ? "Render completed successfully!" : "Render failed!",
        ]);
      });

      // Cleanup khi component unmount
      return () => {
        ipcRenderer.removeAllListeners("render-log");
        ipcRenderer.removeAllListeners("render-error");
        ipcRenderer.removeAllListeners("render-complete");
      };
    }
  }, []);

  // Hàm mới để hiển thị hộp thoại chọn nơi lưu file
  const handleBrowse = async () => {
    if (!isElectron()) return;

    try {
      const { ipcRenderer } = window.require("electron");
      const filePath = await ipcRenderer.invoke("show-save-dialog", {
        defaultPath: outputPath,
      });

      if (filePath) {
        setOutputPath(filePath);
      }
    } catch (error) {
      console.error("Error showing save dialog:", error);
    }
  };

  const startRender = async () => {
    if (!isElectron()) {
      alert("Chức năng này chỉ hoạt động trong ứng dụng Electron!");
      return;
    }

    if (!audioFile) {
      alert("Vui lòng tải lên file audio trước khi render!");
      return;
    }

    setIsRendering(true);
    setRenderLog([]);
    setProgress(0);

    try {
      const { ipcRenderer } = window.require("electron");

      // Đọc file audio thành ArrayBuffer
      const arrayBuffer = await audioFile.arrayBuffer();

      // Gửi file audio và cấu hình video đến main process
      ipcRenderer.send("render-video", {
        outputPath,
        videoSettings,
        audioFile: Array.from(new Uint8Array(arrayBuffer)),
        audioFileName: audioFile.name,
      });
    } catch (error) {
      setIsRendering(false);
      setRenderLog((prev) => [...prev, `ERROR: ${error}`]);
      console.error("Error starting render:", error);
    }
  };

  // Hàm để dừng quá trình render
  const stopRender = () => {
    if (!isElectron()) return;

    try {
      const { ipcRenderer } = window.require("electron");
      ipcRenderer.send("stop-render"); // Gửi sự kiện "stop-render" đến main process
      setIsRendering(false); // Dừng trạng thái render
      setRenderLog((prev) => [...prev, "Render stopped by user."]);
    } catch (error) {
      console.error("Error stopping render:", error);
    }
  };

  if (!isElectron()) {
    return (
      <div className="mt-4 p-3 bg-yellow-100 rounded border border-yellow-300">
        <p className="text-sm">
          Chức năng render trực tiếp chỉ khả dụng khi chạy trong ứng dụng . Hãy
          tải/ cài đặt ứng dụng.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 p-3 bg-gray-100 rounded border border-gray-300">
      <h3 className="text-lg font-bold mb-2">Render Video với Electron</h3>

      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">
          Đường dẫn xuất file:
        </label>
        <div className="flex">
          <input
            type="text"
            value={outputPath}
            onChange={(e) => setOutputPath(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded-l text-sm"
            disabled={isRendering}
          />
          <button
            onClick={handleBrowse}
            disabled={isRendering}
            className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-r border border-l-0 border-gray-300 text-sm"
          >
            Chọn...
          </button>
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          className={`px-3 py-2 rounded text-sm ${
            isRendering
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600"
          } text-white`}
          onClick={startRender}
          disabled={isRendering}
        >
          {isRendering ? "Đang render..." : "Bắt đầu render"}
        </button>
        {isRendering && (
          <button
            className="px-3 py-2 rounded text-sm bg-red-500 hover:bg-red-600 text-white"
            onClick={stopRender}
          >
            Dừng
          </button>
        )}
      </div>

      {isRendering && (
        <div className="mt-4">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block text-blue-600">
                  Loading... {progress}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-4 text-xs flex rounded bg-gray-200">
              <div
                style={{ width: `${progress}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-300"
              ></div>
            </div>
          </div>
        </div>
      )}

      {renderLog.length > 0 && (
        <div className="mt-3">
          <h4 className="text-sm font-medium mb-1">Log:</h4>
          <div className="bg-black text-green-400 p-2 rounded h-40 overflow-y-auto text-xs font-mono">
            {renderLog.reverse().map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
