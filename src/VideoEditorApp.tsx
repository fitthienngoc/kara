import React, { useState, useEffect, useRef } from "react";
import { Player } from "@remotion/player";
import { VideoEditor } from "./VideoEditor/VideoEditor";
import {
  DEFAULT_ACTIVE_COLOR,
  DEFAULT_INACTIVE_COLOR,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  SAMPLE_KARAOKE_LINES,
  DEFAULT_FPS,
} from "./VideoEditor/constants";
import { KaraokeLine } from "./VideoEditor/constants";
import { BackgroundSettings } from "./VideoEditor/components/BackgroundSettings";
import { AudioSettings } from "./VideoEditor/components/AudioSettings";
import { VideoSettings } from "./VideoEditor/components/VideoSettings";
import { TextSettings } from "./VideoEditor/components/TextSettings";

// Danh sách font hỗ trợ tiếng Việt tốt
const VIETNAMESE_FONTS = [
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Roboto, sans-serif", label: "Roboto" },
  { value: "'Open Sans', sans-serif", label: "Open Sans" },
  { value: "'Noto Sans', sans-serif", label: "Noto Sans" },
  { value: "'Source Sans Pro', sans-serif", label: "Source Sans Pro" },
  { value: "'Montserrat', sans-serif", label: "Montserrat" },
  { value: "'Raleway', sans-serif", label: "Raleway" },
  { value: "'Lato', sans-serif", label: "Lato" },
  { value: "'Nunito', sans-serif", label: "Nunito" },
  { value: "'Quicksand', sans-serif", label: "Quicksand" },
  { value: "'Barlow', sans-serif", label: "Barlow" },
  { value: "'Be Vietnam Pro', sans-serif", label: "Be Vietnam Pro" },
  { value: "'Georgia', serif", label: "Georgia" },
  { value: "'Times New Roman', serif", label: "Times New Roman" },
];

export const VideoEditorApp: React.FC = () => {
  // State cho các thuộc tính của video
  const [backgroundType, setBackgroundType] = useState<
    "image" | "video" | "color"
  >("color");
  const [backgroundSrc, setBackgroundSrc] = useState<string>("");
  const [backgroundColor, setBackgroundColor] = useState<string>("#121212");
  const [audioSrc, setAudioSrc] = useState<string>("");
  const [karaokeLines] = useState<KaraokeLine[]>(SAMPLE_KARAOKE_LINES);
  const [activeWordColor, setActiveWordColor] =
    useState<string>(DEFAULT_ACTIVE_COLOR);
  const [inactiveWordColor, setInactiveWordColor] = useState<string>(
    DEFAULT_INACTIVE_COLOR,
  );
  const [fontFamily, setFontFamily] = useState<string>(DEFAULT_FONT_FAMILY);
  const [fontSize, setFontSize] = useState<number>(DEFAULT_FONT_SIZE);
  const [fps, setFps] = useState<number>(DEFAULT_FPS);
  const [durationInFrames, setDurationInFrames] = useState<number>(300);
  // Refs cho input file - cách 1
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Tải các font Google Fonts
  useEffect(() => {
    // Tạo link element để tải Google Fonts
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Open+Sans:wght@400;700&family=Noto+Sans:wght@400;700&family=Source+Sans+Pro:wght@400;700&family=Montserrat:wght@400;700&family=Raleway:wght@400;700&family=Lato:wght@400;700&family=Nunito:wght@400;700&family=Quicksand:wght@400;700&family=Barlow:wght@400;700&family=Be+Vietnam+Pro:wght@400;700&display=swap";
    document.head.appendChild(link);

    // Cleanup khi component unmount
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Không cần giải phóng blob URL nữa vì chúng ta đang sử dụng data URL
  // useEffect(() => {
  //   return () => {
  //     if (audioSrc && audioSrc.startsWith("blob:")) {
  //       URL.revokeObjectURL(audioSrc);
  //     }
  //     if (backgroundSrc && backgroundSrc.startsWith("blob:")) {
  //       URL.revokeObjectURL(backgroundSrc);
  //     }
  //   };
  // }, [audioSrc, backgroundSrc]);
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar cho các tùy chọn */}
      <div className="w-80 bg-white p-4 overflow-y-auto shadow-md">
        <h2 className="text-xl font-bold mb-4">Video Editor</h2>

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
        />
        {/* Phần FPS */}
        <VideoSettings
          fps={fps}
          setFps={setFps}
          durationInFrames={durationInFrames}
          setDurationInFrames={setDurationInFrames}
        />

        {/* Phần font và màu sắc */}
        <TextSettings
          activeWordColor={activeWordColor}
          setActiveWordColor={setActiveWordColor}
          inactiveWordColor={inactiveWordColor}
          setInactiveWordColor={setInactiveWordColor}
          fontFamily={fontFamily}
          setFontFamily={setFontFamily}
          fontSize={fontSize}
          setFontSize={setFontSize}
          fontOptions={VIETNAMESE_FONTS}
        />

        {/* Phần karaoke (đơn giản) */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Karaoke Lyrics</h3>
          <div className="text-sm text-gray-600">
            Using sample lyrics. Lyrics editor coming soon.
          </div>
        </div>
      </div>

      {/* Phần xem trước video */}
      <div className="flex-1 p-4 flex flex-col">
        <h2 className="text-xl font-bold mb-4">Preview</h2>
        <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden relative">
          <Player
            component={VideoEditor}
            durationInFrames={durationInFrames}
            fps={fps}
            compositionWidth={1920}
            compositionHeight={1080}
            style={{
              width: "100%",
              height: "100%",
            }}
            controls
            inputProps={{
              backgroundType,
              backgroundSrc,
              backgroundColor,
              audioSrc,
              karaokeLines,
              activeWordColor,
              inactiveWordColor,
              fontFamily,
              fontSize,
              fps,
            }}
          />
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 mb-2">
            This is a preview only. To render the final video, use the Remotion
            CLI.
          </p>
          <code className="bg-gray-100 p-2 rounded text-sm">
            yarn remotion render src/index.ts KaraokeVideoEditor{fps}FPS
            out/video.mp4
          </code>
        </div>
      </div>
    </div>
  );
};
