"use client";

import React from "react";
import { AbsoluteFill, Img, staticFile, Video } from "remotion";

interface BackgroundProps {
  type: "image" | "video" | "color";
  src?: string;
  color?: string;
}

export const Background: React.FC<BackgroundProps> = ({
  type,
  src = "",
  color = "#000000",
}) => {
  // Hiển thị nền dựa vào loại
  if (type === "color") {
    return <AbsoluteFill className="z-0" style={{ backgroundColor: color }} />;
  }

  // Kiểm tra xem src có phải là URL đầy đủ, data URL hay không
  const source =
    src.startsWith("http") || src.startsWith("blob:") || src.startsWith("data:")
      ? src
      : src
        ? staticFile(src)
        : "";

  return (
    <AbsoluteFill className="z-0">
      {type === "image" && src ? (
        <Img src={source} className="w-full h-full object-cover" />
      ) : type === "video" && src ? (
        <Video
          src={source}
          className="w-full h-full object-cover"
          muted // Tắt âm thanh của video nền vì chúng ta sẽ sử dụng nhạc nền riêng
        />
      ) : (
        // Fallback: màu nền đen nếu không có ảnh hoặc video
        <div className="w-full h-full" style={{ backgroundColor: color }} />
      )}
    </AbsoluteFill>
  );
};
