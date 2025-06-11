import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { Background } from "./Background";
import { AudioTrack } from "./AudioTrack";
import { KaraokeSubtitle } from "./KaraokeSubtitle";
import { videoEditorSchema } from "./constants";
import { z } from "zod";

// Component chính cho trình edit video
export const VideoEditor: React.FC<z.infer<typeof videoEditorSchema>> = ({
  audioSrc,
  backgroundType,
  backgroundSrc,
  backgroundColor,
  karaokeLines,
  activeWordColor,
  inactiveWordColor,
  fontFamily,
  fontSize,
  fps = 30, // Mặc định là 30 FPS
}) => {
  const { fps: remotionFps } = useVideoConfig();
  
  // Kiểm tra xem fps trong props có khớp với fps của Remotion không
  if (fps !== remotionFps) {
    console.warn(
      `FPS mismatch: Props FPS (${fps}) doesn't match Remotion composition FPS (${remotionFps}). ` +
      `Timing may be incorrect. Consider using adjustKaraokeTimingForFps function.`
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
        activeWordColor={activeWordColor}
        inactiveWordColor={inactiveWordColor}
        fontFamily={fontFamily}
        fontSize={fontSize}
      />
      
      {/* Hiển thị thông tin FPS */}
      <div className="absolute top-2.5 right-2.5 bg-black/50 text-white px-2.5 py-1.5 rounded text-sm font-mono">
        {remotionFps} FPS
      </div>
    </AbsoluteFill>
  );
};