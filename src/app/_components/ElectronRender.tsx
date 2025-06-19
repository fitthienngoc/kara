"use client";

import React, { useState, useEffect } from "react";
import { isDev } from "../../../types/constants";

// Kiểm tra xem có đang chạy trong Electron không
const isElectron = () => {
  if (!isDev) return true; // Trong môi trường phát triển, không cần kiểm tra Electron
  if (typeof window === "undefined") return false;
  // Kiểm tra sự tồn tại của biến isElectronApp đã được expose từ preload.js
  return window?.electronAPI?.isElectronApp === true;
};

// Định nghĩa các tùy chọn chất lượng video
interface VideoQualityOption {
  id: string;
  label: string;
  crf: number; // Constant Rate Factor (thấp = chất lượng cao hơn)
  preset: string; // FFmpeg preset (veryslow, slower, slow, medium, fast, faster, veryfast, superfast, ultrafast)
  description: string; // Mô tả ngắn
}

// Danh sách các tùy chọn chất lượng
const VIDEO_QUALITY_OPTIONS: VideoQualityOption[] = [
  {
    id: "draft",
    label: "Nháp (Nhanh)",
    crf: 28,
    preset: "veryfast",
    description:
      "Chất lượng thấp, thời gian render nhanh, phù hợp để xem trước",
  },
  {
    id: "medium",
    label: "Trung bình",
    crf: 23,
    preset: "medium",
    description: "Cân bằng giữa chất lượng và thời gian render",
  },
  {
    id: "high",
    label: "Cao",
    crf: 18,
    preset: "slow",
    description: "Chất lượng cao, thời gian render lâu hơn",
  },
  {
    id: "ultra",
    label: "Siêu cao",
    crf: 12,
    preset: "veryslow",
    description: "Chất lượng tốt nhất, thời gian render rất lâu",
  },
];

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
  const [outputPath, setOutputPath] = useState("rendered-video.mp4");
  const [progress, setProgress] = useState(0);
  // Thêm state cho chất lượng video, mặc định là "high"
  const [selectedQuality, setSelectedQuality] = useState<string>("high");

  useEffect(() => {
    // Chỉ thiết lập các listener nếu đang chạy trong Electron
    if (isElectron()) {
      const ipc = window.electronAPI?.ipc;
      if (!ipc) {
        console.error(
          "Electron IPC not available. Make sure you are running in Electron.",
        );
        return;
      }
      // Lắng nghe các sự kiện từ main process
      ipc.on("render-log", (message) => {
        setRenderLog((prev) => [...prev, message as string]);

        // Phân tích log để cập nhật tiến trình

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

      ipc.on("render-error", (_event, message) => {
        setRenderLog((prev) => [...prev, `ERROR: ${message}`]);
      });

      ipc.on("render-complete", (_event, success) => {
        setIsRendering(false);
        setRenderLog((prev) => [
          ...prev,
          success ? "Render completed successfully!" : "Render failed!",
        ]);
      });

      // Cleanup khi component unmount
      return () => {
        ipc.removeAllListeners("render-log");
        ipc.removeAllListeners("render-error");
        ipc.removeAllListeners("render-complete");
      };
    }
  }, []);

  // Hàm mới để hiển thị hộp thoại chọn nơi lưu file
  const handleBrowse = async () => {
    if (!isElectron()) return;

    try {
      const ipc = window.electronAPI?.ipc;
      if (!ipc) {
        console.error(
          "Electron IPC not available. Make sure you are running in Electron.",
        );
        return;
      }
      const filePath = await ipc.invoke("show-save-dialog", {
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
      const ipc = window.electronAPI?.ipc;
      if (!ipc) {
        console.error(
          "Electron IPC not available. Make sure you are running in Electron.",
        );
        return;
      }

      // Lấy thông tin chất lượng từ tùy chọn được chọn
      const qualitySettings = VIDEO_QUALITY_OPTIONS.find(
        (option) => option.id === selectedQuality,
      );

      // Đọc file audio thành ArrayBuffer
      const arrayBuffer = await audioFile.arrayBuffer();

      // Gửi file audio, cấu hình video và thông tin chất lượng đến main process
      ipc.send("render-video", {
        outputPath,
        videoSettings,
        audioFile: Array.from(new Uint8Array(arrayBuffer)),
        audioFileName: audioFile.name,
        qualitySettings, // Thêm cài đặt chất lượng vào dữ liệu gửi đi
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
      const ipc = window.electronAPI?.ipc;
      if (!ipc) {
        console.error(
          "Electron IPC not available. Make sure you are running in Electron.",
        );
        return;
      }
      ipc.send("stop-render"); // Gửi sự kiện "stop-render" đến main process
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

      {/* Thêm phần chọn chất lượng video */}
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">
          Chất lượng video:
        </label>
        <div className="grid grid-cols-2 gap-2">
          {VIDEO_QUALITY_OPTIONS.map((option) => (
            <div
              key={option.id}
              className={`border p-2 rounded cursor-pointer ${
                selectedQuality === option.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
              onClick={() => !isRendering && setSelectedQuality(option.id)}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  id={`quality-${option.id}`}
                  name="videoQuality"
                  checked={selectedQuality === option.id}
                  onChange={() => setSelectedQuality(option.id)}
                  disabled={isRendering}
                  className="mr-2"
                />
                <label
                  htmlFor={`quality-${option.id}`}
                  className="font-medium cursor-pointer"
                >
                  {option.label}
                </label>
              </div>
              <p className="text-xs text-gray-600 mt-1">{option.description}</p>
            </div>
          ))}
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
