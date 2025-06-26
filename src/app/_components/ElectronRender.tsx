"use client";

import React, { useState, useEffect } from "react";
import { isDev } from "../../../types/constants";
import { KaraokeLine } from "../../constants";
import { TVideoSetting } from "./VideoEditorApp";

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

// Định nghĩa interface cho tùy chọn độ phân giải
interface ResolutionOption {
  id: string;
  label: string;
  width: number;
  height: number;
  aspectRatio: string; // Tỷ lệ khung hình, ví dụ: "16:9", "9:16", "1:1"
  description: string;
}

// Danh sách các tùy chọn độ phân giải
const RESOLUTION_OPTIONS: ResolutionOption[] = [
  // Tỷ lệ ngang 16:9 (Landscape)
  {
    id: "hd",
    label: "HD (720p)",
    width: 1280,
    height: 720,
    aspectRatio: "16:9",
    description: "Độ phân giải chuẩn HD (1280x720)",
  },
  {
    id: "fullhd",
    label: "Full HD (1080p)",
    width: 1920,
    height: 1080,
    aspectRatio: "16:9",
    description: "Độ phân giải Full HD (1920x1080)",
  },
  {
    id: "4k",
    label: "4K Ultra HD",
    width: 3840,
    height: 2160,
    aspectRatio: "16:9",
    description: "Độ phân giải 4K (3840x2160)",
  },

  // Tỷ lệ dọc 9:16 (Vertical - dành cho điện thoại, TikTok, Stories)
  {
    id: "vertical-hd",
    label: "Dọc HD (720p)",
    width: 720,
    height: 1280,
    aspectRatio: "9:16",
    description: "Dạng dọc cho điện thoại (720x1280)",
  },
  {
    id: "vertical-fullhd",
    label: "Dọc Full HD (1080p)",
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    description: "Dạng dọc Full HD (1080x1920)",
  },

  // Vuông 1:1 (Instagram, dạng vuông)
  {
    id: "square-hd",
    label: "Vuông HD",
    width: 1080,
    height: 1080,
    aspectRatio: "1:1",
    description: "Dạng vuông chuẩn (1080x1080)",
  },
];

type VideoSetting = {
  width: number;
  height: number;
  backgroundType: "image" | "video" | "color";
  backgroundSrc: string;
  backgroundColor: string;
  karaokeLines: KaraokeLine[];
  fps: number;
  durationInFrames: number;
};
interface ElectronRenderProps {
  saveSettings: () => void;
  videoSettings: VideoSetting;
  audioFile: File | null;
  setVideoSettings: React.Dispatch<React.SetStateAction<TVideoSetting>>;
  setFps: React.Dispatch<React.SetStateAction<number>>;
}

// Component popup cho tiến trình rendering
const RenderProgressPopup: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  progress: number;
  renderLog: string[];
  isRendering: boolean;
  onStopRender: () => void;
}> = ({ isOpen, onClose, progress, renderLog, isRendering, onStopRender }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center border-b p-4">
          <h3 className="text-lg font-semibold">Tiến trình render video</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-grow">
          <div className="mb-4">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-sm font-semibold inline-block text-blue-600">
                    {isRendering ? `Đang render... ${progress}%` : "Hoàn thành"}
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

          <div>
            <h4 className="text-sm font-medium mb-1">Log:</h4>
            <div className="bg-black text-green-400 p-2 rounded h-60 overflow-y-auto text-xs font-mono">
              {renderLog.reverse().map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t p-4 flex justify-end gap-2">
          {isRendering && (
            <button
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              onClick={onStopRender}
            >
              Dừng render
            </button>
          )}
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export const ElectronRender: React.FC<ElectronRenderProps> = ({
  videoSettings,
  audioFile,
  setVideoSettings,
}) => {
  const [isRendering, setIsRendering] = useState(false);
  const [renderLog, setRenderLog] = useState<string[]>([]);
  const [outputPath, setOutputPath] = useState("");
  const [progress, setProgress] = useState(0);
  // Thêm state cho chất lượng video, mặc định là "high"
  const [selectedQuality, setSelectedQuality] = useState<string>("high");
  // Thêm state cho độ phân giải, mặc định là "fullhd"
  const [selectedResolution, setSelectedResolution] =
    useState<string>("fullhd");
  // Thêm state cho việc hiển thị popup
  const [showProgressPopup, setShowProgressPopup] = useState(false);

  useEffect(() => {
    // Chỉ thiết lập các listener nếu đang chạy trong Electron
    if (isElectron()) {
      const setDefaultOutputPath = async () => {
        try {
          const ipc = window.electronAPI?.ipc;
          if (!ipc) {
            console.error("Electron IPC not available");
            return;
          }

          // Get default path from main process
          const defaultPath = await ipc.invoke("get-default-save-path");
          setOutputPath(defaultPath);
        } catch (error) {
          console.error("Error getting default save path:", error);
          // Fallback to a generic path
          setOutputPath("rendered-video.mp4");
        }
      };
      setDefaultOutputPath();
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

      ipc.on("render-error", (message) => {
        setRenderLog((prev) => [...prev, `ERROR: ${message}`]);
      });

      ipc.on("render-complete", (success) => {
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

  // Hàm mới để mở thư mục chứa file đã render
  const openOutputFolder = async () => {
    if (!isElectron() || !outputPath) return;

    try {
      const ipc = window.electronAPI?.ipc;
      if (!ipc) {
        console.error(
          "Electron IPC not available. Make sure you are running in Electron.",
        );
        return;
      }

      // Xử lý đường dẫn thư mục phù hợp với cả Windows và macOS
      let directory;
      if (outputPath.includes("/")) {
        // macOS hoặc Linux style path
        directory = outputPath.substring(0, outputPath.lastIndexOf("/"));
      } else if (outputPath.includes("\\")) {
        // Windows style path
        directory = outputPath.substring(0, outputPath.lastIndexOf("\\"));
      } else {
        // Trường hợp chỉ có tên file không có đường dẫn
        directory = ".";
      }

      // Gọi đến main process để mở thư mục (không chọn file)
      await ipc.invoke("open-directory", directory);
    } catch (error) {
      console.error("Error opening output folder:", error);
    }
  };

  // Nhóm các tùy chọn độ phân giải theo tỷ lệ khung hình
  const resolutionsByRatio = RESOLUTION_OPTIONS.reduce(
    (acc, option) => {
      if (!acc[option.aspectRatio]) {
        acc[option.aspectRatio] = [];
      }
      acc[option.aspectRatio].push(option);
      return acc;
    },
    {} as Record<string, ResolutionOption[]>,
  );

  const handleSettingVideo = (selectedResolutionId: string) => {
    // Lấy thông tin độ phân giải từ tùy chọn được chọn
    const resolutionSettings = RESOLUTION_OPTIONS.find(
      (option) => option.id === selectedResolutionId,
    );
    if (!resolutionSettings) {
      return;
    }
    setSelectedResolution(selectedResolutionId);
    setVideoSettings((prev) => ({
      ...prev,
      width: resolutionSettings.width,
      height: resolutionSettings.height,
    }));
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
    setShowProgressPopup(true); // Hiển thị popup khi bắt đầu render

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

      console.log({
        outputPath,
        videoSettings,
        audioFile: Array.from(new Uint8Array(arrayBuffer)),
        audioFileName: audioFile.name,
        qualitySettings, // Thêm cài đặt chất lượng vào dữ liệu gửi đi
      });

      // Gửi file audio, cấu hình video, thông tin chất lượng và độ phân giải đến main process
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

  // Lấy thông tin độ phân giải hiện tại
  const currentResolution = RESOLUTION_OPTIONS.find(
    (option) => option.id === selectedResolution,
  );

  // Hàm trả về icon cho từng tỷ lệ khung hình
  const getAspectRatioIcon = (ratio: string) => {
    switch (ratio) {
      case "16:9":
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <rect x="2" y="5" width="20" height="14" rx="2" />
          </svg>
        );
      case "9:16":
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <rect x="7" y="2" width="10" height="20" rx="2" />
          </svg>
        );
      case "1:1":
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <rect x="4" y="4" width="16" height="16" rx="2" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Hàm trả về icon cho từng mức chất lượng
  const getQualityIcon = (qualityId: string) => {
    switch (qualityId) {
      case "draft":
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.071 19.071c3.898-3.899 3.898-10.243 0-14.142-3.899-3.899-10.243-3.898-14.142 0-3.899 3.899-3.899 10.243 0 14.142 3.899 3.898 10.243 3.898 14.142 0zM8.5 11.5L11 14l4.5-4.5" />
          </svg>
        );
      case "medium":
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.071 19.071c3.898-3.899 3.898-10.243 0-14.142-3.899-3.899-10.243-3.898-14.142 0-3.899 3.899-3.899 10.243 0 14.142 3.899 3.898 10.243 3.898 14.142 0zM8.5 11.5L11 14l4.5-4.5M8.5 7.5L11 10l4.5-4.5" />
          </svg>
        );
      case "high":
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.071 19.071c3.898-3.899 3.898-10.243 0-14.142-3.899-3.899-10.243-3.898-14.142 0-3.899 3.899-3.899 10.243 0 14.142 3.899 3.898 10.243 3.898 14.142 0zM8.5 11.5L11 14l4.5-4.5M8.5 7.5L11 10l4.5-4.5M8.5 3.5L11 6l4.5-4.5" />
          </svg>
        );
      case "ultra":
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-12h2v6h-2zm0 8h2v2h-2z" />
          </svg>
        );
      default:
        return null;
    }
  };

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

        <div className="mt-2">
          <button
            onClick={openOutputFolder}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm inline-flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
              />
            </svg>
            Mở thư mục chứa file
          </button>
        </div>
      </div>

      {/* Phần hiển thị cấu hình hiện tại (độ phân giải + chất lượng) */}
      <div className="mb-3 flex items-center bg-blue-50 p-2 rounded border border-blue-200">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-blue-500 mr-2"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <span className="font-medium text-sm">Cấu hình hiện tại:</span>
          <span className="ml-1 text-sm">
            {currentResolution?.width}x{currentResolution?.height} (
            {currentResolution?.aspectRatio}) - Chất lượng{" "}
            {VIDEO_QUALITY_OPTIONS.find((q) => q.id === selectedQuality)?.label}
          </span>
        </div>
      </div>

      {/* Phần chọn độ phân giải video - phiên bản tối ưu */}
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
              clipRule="evenodd"
            />
          </svg>
          Độ phân giải:
        </label>
        {Object.entries(resolutionsByRatio).map(([ratio, options]) => (
          <div key={ratio} className="mb-2">
            <div className="flex items-center text-xs text-gray-600 mb-1">
              {getAspectRatioIcon(ratio)}
              <span className="ml-1 font-medium">
                {ratio === "16:9"
                  ? "Ngang"
                  : ratio === "9:16"
                    ? "Dọc"
                    : "Vuông"}{" "}
                ({ratio})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {options.map((option) => (
                <div
                  key={option.id}
                  onClick={() => !isRendering && handleSettingVideo(option.id)}
                  className={`flex items-center py-1 px-3 rounded cursor-pointer text-sm transition-all ${
                    selectedResolution === option.id
                      ? "bg-blue-100 border-blue-500 border text-blue-700 font-medium"
                      : "bg-white border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    id={`resolution-${option.id}`}
                    name="videoResolution"
                    checked={selectedResolution === option.id}
                    onChange={() => handleSettingVideo(option.id)}
                    disabled={isRendering}
                    className="mr-2 w-3 h-3"
                  />
                  <div>
                    <div>{option.label}</div>
                    <div className="text-xs text-gray-500">
                      {option.width}x{option.height}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Phần chọn chất lượng video - phiên bản tối ưu */}
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
              clipRule="evenodd"
            />
          </svg>
          Chất lượng video:
        </label>
        <div className="flex flex-wrap gap-2">
          {VIDEO_QUALITY_OPTIONS.map((option) => (
            <div
              key={option.id}
              onClick={() => !isRendering && setSelectedQuality(option.id)}
              className={`flex items-center gap-2 py-2 px-3 rounded cursor-pointer transition-all ${
                selectedQuality === option.id
                  ? "bg-blue-100 border-blue-500 border text-blue-700"
                  : "bg-white border border-gray-300 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                id={`quality-${option.id}`}
                name="videoQuality"
                checked={selectedQuality === option.id}
                onChange={() => setSelectedQuality(option.id)}
                disabled={isRendering}
                className="w-3 h-3"
              />
              <div className="text-blue-600">{getQualityIcon(option.id)}</div>
              <div>
                <div className="text-sm font-medium">{option.label}</div>
                <div className="text-xs text-gray-500">
                  {option.preset === "veryfast"
                    ? "Nhanh"
                    : option.preset === "veryslow"
                      ? "Rất chậm"
                      : option.preset === "slow"
                        ? "Chậm"
                        : "Trung bình"}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-1 text-xs text-gray-500 italic">
          Chất lượng cao hơn sẽ yêu cầu thời gian render lâu hơn
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          className={`px-4 py-2 rounded text-sm flex items-center ${
            isRendering
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600"
          } text-white`}
          onClick={startRender}
          disabled={isRendering}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
          {isRendering ? "Đang render..." : "Bắt đầu render"}
        </button>

        {isRendering && (
          <button
            className="px-4 py-2 rounded text-sm bg-blue-500 hover:bg-blue-600 text-white flex items-center"
            onClick={() => setShowProgressPopup(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            Xem tiến trình
          </button>
        )}
      </div>

      {/* Popup hiển thị tiến trình và log */}
      <RenderProgressPopup
        isOpen={showProgressPopup}
        onClose={() => setShowProgressPopup(false)}
        progress={progress}
        renderLog={renderLog}
        isRendering={isRendering}
        onStopRender={stopRender}
      />
    </div>
  );
};
