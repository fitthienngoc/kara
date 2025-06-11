import React from "react";

interface VideoSettingsProps {
  fps: number;
  setFps: (fps: number) => void;
  durationInFrames: number;
  setDurationInFrames: (frames: number) => void;
}

export const VideoSettings: React.FC<VideoSettingsProps> = ({
  fps,
  setFps,
  durationInFrames,
  setDurationInFrames,
}) => {
  // Xử lý thay đổi FPS
  const handleFpsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFps = parseInt(e.target.value);
    setFps(newFps);

    // Điều chỉnh durationInFrames để giữ nguyên thời lượng thực tế
    const currentDurationInSeconds = durationInFrames / fps;
    setDurationInFrames(Math.round(currentDurationInSeconds * newFps));
  };

  return (
    <div className="mb-6">
      <h3 className="font-semibold mb-2">Video Settings</h3>
      <label className="block text-sm mb-1">FPS:</label>
      <select
        value={fps}
        onChange={handleFpsChange}
        className="w-full p-2 border rounded mb-2"
      >
        <option value="24">24 FPS (Cinematic)</option>
        <option value="30">30 FPS (Standard)</option>
        <option value="60">60 FPS (High Quality)</option>
      </select>

      <div className="text-xs text-gray-500 mb-4">
        Note: Changing FPS will adjust timing automatically.
      </div>
    </div>
  );
};