import { PlayerRef, Player } from "@remotion/player";
import { Timeline } from "../../../components/VideoEditor/components/Timeline";
import { KaraokeLine } from "../../../components/VideoEditor/constants";
import { VideoEditor } from "../../../components/VideoEditor/VideoEditor";
import { TVideoSetting } from "../..";
import { useState, useEffect, useCallback } from "react";

interface PreviewTimeLineProps {
  // Player related props
  playerRef: React.RefObject<PlayerRef | null>;
  currentFrame: number;
  durationInFrames: number;
  setDurationInFrames: React.Dispatch<React.SetStateAction<number>>;
  fps: number;
  videoSettings: TVideoSetting;

  // Video content props
  backgroundType: "image" | "video" | "color";
  backgroundSrc: string;
  backgroundColor: string;
  audioSrc: string;
  karaokeLines: KaraokeLine[];
  setKaraokeLines: React.Dispatch<React.SetStateAction<KaraokeLine[]>>;

  // UI control props
  showTimeline: boolean;
  toggleTimeline: () => void;
  handleTimelineTimeChange: (timeInSeconds: number) => void;
}

export default function PreviewTimeLine({
  playerRef,
  currentFrame,
  durationInFrames,
  setDurationInFrames,
  fps,
  videoSettings,
  backgroundType,
  backgroundSrc,
  backgroundColor,
  audioSrc,
  karaokeLines,
  setKaraokeLines,
  showTimeline,
  toggleTimeline,
  handleTimelineTimeChange,
}: PreviewTimeLineProps) {
  // Default player height ratio (70% of the container)
  const [playerHeightRatio, setPlayerHeightRatio] = useState(0.7);
  const [isResizing, setIsResizing] = useState(false);

  // Handle mouse events for resizing
  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResize = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      // Get container bounds
      const container = document.getElementById("preview-timeline-container");
      if (!container) return;

      const { top, height } = container.getBoundingClientRect();

      // Calculate new ratio based on mouse position
      const newRatio = Math.min(Math.max((e.clientY - top) / height, 0.3), 0.9);
      setPlayerHeightRatio(newRatio);
    },
    [isResizing],
  );

  // Add and remove event listeners
  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResize);
    }

    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResize);
    };
  }, [isResizing, resize, stopResize]);

  return (
    <div
      id="preview-timeline-container"
      className="flex-1 p-4 flex flex-col overflow-hidden"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Preview</h2>
        {audioSrc && (
          <button
            className="px-3 py-1 rounded text-sm bg-blue-500 text-white"
            onClick={toggleTimeline}
          >
            {showTimeline ? "Ẩn Timeline" : "Hiện Timeline"}
          </button>
        )}
      </div>

      {/* Phần preview - điều chỉnh kích thước dựa vào timeline */}
      <div
        className="rounded-lg overflow-hidden relative"
        style={{
          flex:
            showTimeline && audioSrc ? `0 0 ${playerHeightRatio * 100}%` : "1",
          minHeight: "200px",
        }}
      >
        <Player
          ref={playerRef}
          component={VideoEditor}
          durationInFrames={durationInFrames}
          fps={fps}
          compositionWidth={videoSettings.width}
          compositionHeight={videoSettings.height}
          style={{
            width: "100%",
            height: "100%",
          }}
          initialFrame={Math.min(currentFrame, durationInFrames - 1)}
          inputProps={{
            backgroundType,
            backgroundSrc,
            backgroundColor,
            audioSrc,
            karaokeLines,
            fps,
          }}
        />
      </div>

      {/* Resizable handle */}
      {audioSrc && showTimeline && (
        <div
          className="h-2 w-full cursor-ns-resize bg-gray-200 hover:bg-gray-300 flex justify-center items-center"
          onMouseDown={startResize}
        >
          <div className="w-16 h-1 bg-gray-400 rounded-full"></div>
        </div>
      )}

      {/* Timeline Component - có thể ẩn/hiện */}
      {audioSrc && showTimeline && (
        <div className="overflow-hidden flex flex-col flex-1">
          <Timeline
            karaokeLines={karaokeLines}
            setKaraokeLines={setKaraokeLines}
            fps={fps}
            durationInFrames={durationInFrames}
            setDurationInFrames={setDurationInFrames}
            audioSrc={audioSrc}
            onTimeChange={handleTimelineTimeChange}
          />
        </div>
      )}
    </div>
  );
}
