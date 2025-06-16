import React, { useState, useEffect, useRef } from "react";
import { Player, PlayerRef } from "@remotion/player";
import { VideoEditor } from "./components/VideoEditor/VideoEditor";
import {
  SAMPLE_KARAOKE_LINES,
  DEFAULT_FPS,
} from "./components/VideoEditor/constants";
import { KaraokeLine } from "./components/VideoEditor/constants";
import { BackgroundSettings } from "./components/VideoEditor/components/BackgroundSettings";
import { AudioSettings } from "./components/VideoEditor/components/AudioSettings";
import { VideoSettings } from "./components/VideoEditor/components/VideoSettings";
import { LyricsEditor } from "./components/VideoEditor/components/LyricsEditor";
import { Timeline } from "./components/VideoEditor/components/Timeline";
import {
  VIETNAMESE_FONTS,
  GOOGLE_FONTS_URL,
} from "./components/VideoEditor/constants/fonts";

import { saveAs } from "file-saver";
import { ElectronRender } from "./ElectronRender";

export type TVideoSetting = {
  width: number;
  height: number;
};
export const VideoEditorApp: React.FC = () => {
  // State cho các thuộc tính của video
  const [backgroundType, setBackgroundType] = useState<
    "image" | "video" | "color"
  >("color");
  const [backgroundSrc, setBackgroundSrc] = useState<string>("");
  const [backgroundColor, setBackgroundColor] = useState<string>("#121212");
  const [audioSrc, setAudioSrc] = useState<string>("");
  const [karaokeLines, setKaraokeLines] =
    useState<KaraokeLine[]>(SAMPLE_KARAOKE_LINES);

  const [fps, setFps] = useState<number>(DEFAULT_FPS);
  const [durationInFrames, setDurationInFrames] = useState<number>(300);

  // State để theo dõi vị trí hiện tại
  const [currentFrame, setCurrentFrame] = useState<number>(0);

  // State để kiểm soát việc hiển thị các phần cấu hình cơ bản
  const [showBasicSettings, setShowBasicSettings] = useState<boolean>(true);
  // State để kiểm soát hiển thị timeline
  const [showTimeline, setShowTimeline] = useState<boolean>(true);

  // Thêm state để lưu file audio gốc
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const [videoSettings] = useState<TVideoSetting>({
    width: 1920,
    height: 1080,
  });

  // Refs cho input file và player
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const playerRef = useRef<PlayerRef>(null);

  // Tải các font Google Fonts
  useEffect(() => {
    // Tạo link element để tải Google Fonts
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = GOOGLE_FONTS_URL;
    document.head.appendChild(link);

    // Cleanup khi component unmount
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Toggle hiển thị cấu hình cơ bản
  const toggleBasicSettings = () => {
    setShowBasicSettings(!showBasicSettings);
  };

  // Toggle hiển thị timeline
  const toggleTimeline = () => {
    setShowTimeline(!showTimeline);
  };

  // Cập nhật durationInFrames dựa trên audio
  useEffect(() => {
    if (audioSrc) {
      const audio = new Audio(audioSrc);
      audio.onloadedmetadata = () => {
        // Cập nhật durationInFrames dựa trên thời lượng audio
        const newDurationInFrames = Math.ceil(audio.duration * fps);
        setDurationInFrames(newDurationInFrames);
      };
    }
  }, [audioSrc, fps]);

  // Xử lý khi Timeline thay đổi thời gian
  const handleTimelineTimeChange = (timeInSeconds: number) => {
    // Chuyển đổi thời gian thành frame
    const frame = Math.round(timeInSeconds * fps);
    setCurrentFrame(frame);

    // Cập nhật vị trí của player
    if (playerRef.current) {
      playerRef.current.seekTo(frame);
    }
  };

  // Add a useEffect to handle page unload or navigation
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Hiển thị hộp thoại xác nhận
      event.preventDefault();
      event.returnValue = ""; // Một số trình duyệt yêu cầu giá trị này để hiển thị hộp thoại xác nhận
    };

    // Lắng nghe sự kiện beforeunload
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup khi component unmount
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const saveSettings = () => {
    const data = {
      backgroundType,
      backgroundSrc,
      backgroundColor,
      audioSrc: "", // Không lưu blob URL vào settings
      karaokeLines,
      fps,
      durationInFrames,
      ...videoSettings,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    saveAs(blob, "video-settings.json");
  };

  return (
    <>
      <div className="fixed top-0 left-0 z-10 flex h-screen w-screen overflow-hidden bg-white">
        {/* Sidebar cho các tùy chọn - đảm bảo chiều rộng cố định */}
        <div className="w-[500px] min-w-[500px] p-4 overflow-y-auto shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Video Editor</h2>
            <button
              className={`px-3 py-1 rounded text-sm ${showBasicSettings ? "bg-gray-200" : "bg-blue-500 text-white"}`}
              onClick={toggleBasicSettings}
            >
              {showBasicSettings ? "Chỉ hiện Lyrics" : "Hiện đầy đủ"}
            </button>
          </div>
          {/* Phần cấu hình cơ bản - có thể thu gọn */}
          {showBasicSettings && (
            <>
              {/* Phần nền */}
              <BackgroundSettings
                backgroundType={backgroundType}
                setBackgroundType={setBackgroundType}
                backgroundColor={backgroundColor}
                setBackgroundColor={setBackgroundColor}
                backgroundSrc={backgroundSrc}
                setBackgroundSrc={setBackgroundSrc}
                imageInputRef={imageInputRef}
                videoInputRef={videoInputRef}
              />

              {/* Phần âm thanh */}
              <AudioSettings
                audioSrc={audioSrc}
                setAudioSrc={setAudioSrc}
                audioInputRef={audioInputRef}
                setAudioFile={setAudioFile}
              />

              {/* Phần FPS */}
              <VideoSettings
                fps={fps}
                setFps={setFps}
                durationInFrames={durationInFrames}
                setDurationInFrames={setDurationInFrames}
              />
            </>
          )}
          {/* Phần karaoke - luôn hiển thị */}
          <div className={showBasicSettings ? "" : "mt-4"}>
            <LyricsEditor
              karaokeLines={karaokeLines}
              setKaraokeLines={setKaraokeLines}
              fps={fps}
              fontOptions={VIETNAMESE_FONTS} // Thêm fontOptions vào đây
            />
          </div>

          <ElectronRender
            saveSettings={saveSettings}
            videoSettings={{
              backgroundType,
              backgroundSrc,
              backgroundColor,
              // Không truyền audioSrc vì nó là blob URL
              karaokeLines,
              fps,
              durationInFrames,
              ...videoSettings,
            }}
            audioFile={audioFile}
          />
        </div>

        {/* Phần xem trước video và timeline */}
        <div className="flex-1 p-4 flex flex-col overflow-hidden">
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
              flex: showTimeline && audioSrc ? "1 0 60%" : "1",
              minHeight: "300px",
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
              // controls
              initialFrame={currentFrame}
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

          {/* Timeline Component - có thể ẩn/hiện */}
          {audioSrc && showTimeline && (
            <div className="mt-4 overflow-hidden" style={{ maxHeight: "40%" }}>
              <Timeline
                karaokeLines={karaokeLines}
                setKaraokeLines={setKaraokeLines}
                fps={fps}
                durationInFrames={durationInFrames}
                setDurationInFrames={setDurationInFrames} // Thêm prop này
                audioSrc={audioSrc}
                onTimeChange={handleTimelineTimeChange}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};
