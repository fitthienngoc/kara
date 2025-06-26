import React from "react";

interface ControlsProps {
  isPlaying: boolean;
  togglePlay: () => void;
  currentLineIndex: number | null;

  recording: boolean;
  onReady: () => void;
  stopRecording: () => void;
  startRecording: () => void;
  currentTime: number;
  audioDuration: number;
  zoom: number;
  handleZoomChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  optimizeTiming: () => void;
  isEditingDuration: boolean;
  setIsEditingDuration: (isEditing: boolean) => void;
  customDuration: number;
  handleDurationChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  applyCustomDuration: () => void;
  durationInFrames: number;
  fps: number;
}

export default function ControlsTimeline({
  isPlaying,
  togglePlay,
  currentLineIndex,
  onReady,
  recording,
  stopRecording,
  startRecording,
  currentTime,
  audioDuration,
  zoom,
  handleZoomChange,
  optimizeTiming,
  isEditingDuration,
  setIsEditingDuration,
  customDuration,
  handleDurationChange,
  applyCustomDuration,
  durationInFrames,
  fps,
}: ControlsProps) {
  return (
    <div className="flex items-center mb-2 text-xs gap-3">
      <button
        className={`px-1 py-0.5 rounded flex items-center justify-center transition-colors text-[10px] ${
          isPlaying
            ? "bg-red-500 hover:bg-red-600"
            : "bg-blue-500 hover:bg-blue-600"
        } text-white`}
        onClick={togglePlay}
      >
        {isPlaying ? (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 002 0V9a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v2a1 1 0 002 0V9a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Pause
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
            Play
          </>
        )}
      </button>

      {currentLineIndex === null ? (
        <button
          className={`px-1 py-0.5 rounded text-[10px] bg-green-600 text-white`}
          onClick={onReady}
        >
          Sẵn sàng
        </button>
      ) : (
        <button
          className={`px-1 py-0.5 rounded text-[10px] ${recording ? "bg-red-600" : "bg-green-600"} text-white`}
          onClick={recording ? stopRecording : startRecording}
        >
          {recording ? "⏹ Dừng ghi" : "🎙 Ghi từng từ"}
        </button>
      )}
      <div className="text-white font-mono text-[10px]">
        {Math.floor(currentTime / 60)}:
        {Math.floor(currentTime % 60)
          .toString()
          .padStart(2, "0")}{" "}
        /{Math.floor(audioDuration / 60)}:
        {Math.floor(audioDuration % 60)
          .toString()
          .padStart(2, "0")}
      </div>
      <div className="flex items-center">
        <input
          type="range"
          min="0.5"
          max="3.5"
          step="0.1"
          value={zoom}
          onChange={handleZoomChange}
          className="w-20"
        />
        <span className="text-white ml-1 text-[10px]">{zoom.toFixed(1)}x</span>
      </div>
      {/* Add Optimize Timing Button */}
      <button
        className="px-1 py-0.5 rounded text-[10px] bg-yellow-500 text-white"
        onClick={optimizeTiming}
      >
        Optimize Timing
      </button>

      {/* Thêm chức năng điều chỉnh độ dài video */}
      <button
        className="px-1 py-0.5 rounded text-[10px] bg-purple-500 text-white"
        onClick={() => setIsEditingDuration(!isEditingDuration)}
      >
        {isEditingDuration ? "Hủy" : "Điều chỉnh độ dài"}
      </button>

      {isEditingDuration && (
        <div className="flex items-center bg-gray-800 px-2 py-1 rounded">
          <input
            type="number"
            min="1"
            step="0.1"
            className="w-16 h-5 text-[10px] bg-gray-700 text-white border border-gray-600 rounded px-1"
            value={customDuration}
            onChange={handleDurationChange}
          />
          <span className="text-white mx-1 text-[10px]">giây</span>
          <button
            className="px-1 py-0.5 rounded text-[10px] bg-blue-500 text-white ml-1"
            onClick={applyCustomDuration}
          >
            Áp dụng
          </button>
        </div>
      )}

      {/* Hiển thị thông tin độ dài video */}
      <div className="text-white font-mono text-[10px] ml-auto">
        Video: {(durationInFrames / fps).toFixed(1)}s ({durationInFrames}{" "}
        frames)
      </div>
    </div>
  );
}
