import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { Background } from "./Background";
import { AudioTrack } from "./AudioTrack";
import { KaraokeSubtitle } from "./components";
import { KaraokeLine, videoEditorSchema } from "./constants";
import { z } from "zod";

// Component chính cho trình edit video
export const VideoEditor: React.FC<
  z.infer<typeof videoEditorSchema> & {
    setKaraokeLines?: React.Dispatch<React.SetStateAction<KaraokeLine[]>>;
  }
> = ({
  audioSrc,
  backgroundType,
  backgroundSrc,
  backgroundColor,
  karaokeLines,
  fps = 30,
  setKaraokeLines,
}) => {
  const { fps: remotionFps } = useVideoConfig();

  // Kiểm tra xem fps trong props có khớp với fps của Remotion không
  if (fps !== remotionFps) {
    console.warn(
      `FPS mismatch: Props FPS (${fps}) doesn't match Remotion composition FPS (${remotionFps}). ` +
        `Timing may be incorrect. Consider using adjustKaraokeTimingForFps function.`,
    );
  }

  return (
    <AbsoluteFill>
      {/* Hiển thị nền (ảnh, video hoặc màu) */}
      <Background
        type={backgroundType}
        src={backgroundSrc}
        color={backgroundColor}
      />

      {/* Thêm nhạc nền nếu có */}
      {audioSrc && (
        <AudioTrack
          src={audioSrc}
          volumeLevel={1}
          fadeIn={Math.round(fps)} // Điều chỉnh thời gian fade theo fps
          fadeOut={Math.round(fps)}
        />
      )}

      {/* Hiển thị subtitle dạng karaoke */}
      <KaraokeSubtitle
        lines={karaokeLines}
        editable
        setKaraokeLines={setKaraokeLines}
      />
    </AbsoluteFill>
  );
};
