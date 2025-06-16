"use client";

import React, { useState, useEffect } from "react";
import { Audio, staticFile, useVideoConfig } from "remotion";
import { interpolate } from "remotion";

interface AudioTrackProps {
  src?: string;
  volumeLevel?: number; // Mức âm lượng từ 0-1
  fadeIn?: number; // Số frame để fade in
  fadeOut?: number; // Số frame để fade out
  startFrom?: number; // Frame bắt đầu phát nhạc
}

export const AudioTrack: React.FC<AudioTrackProps> = ({
  src,
  volumeLevel = 1,
  fadeIn = 0,
  fadeOut = 0,
  startFrom = 0,
}) => {
  const { durationInFrames } = useVideoConfig();
  const [hasError, setHasError] = useState(false);
  const [audioReady, setAudioReady] = useState(false);

  // Xác định source
  const source =
    src && (src.startsWith("http") || src.startsWith("blob:"))
      ? src
      : src
        ? staticFile(src)
        : "";

  // Kiểm tra audio có thể phát được không trước khi render
  useEffect(() => {
    if (!src) {
      return; // Thoát sớm nếu không có src
    }

    // Reset state khi src thay đổi
    setHasError(false);
    setAudioReady(false);

    // Tạo audio element để kiểm tra
    // Sử dụng HTMLAudioElement thay vì Audio constructor của Remotion
    const audio = document.createElement("audio");
    // Xử lý khi audio có thể phát
    audio.oncanplaythrough = () => {
      setAudioReady(true);
      audio.oncanplaythrough = null;
    };

    // Xử lý khi có lỗi
    audio.onerror = (e) => {
      console.error("Audio không thể phát:", e);
      setHasError(true);
      audio.onerror = null;
    };

    // Gán src và bắt đầu tải
    audio.src = source;
    audio.load();

    // Cleanup khi component unmount hoặc src thay đổi
    return () => {
      audio.oncanplaythrough = null;
      audio.onerror = null;
      audio.src = "";
    };
  }, [src, source]);

  // Nếu không có src, không hiển thị gì cả
  if (!src) {
    return null;
  }

  // Nếu đã có lỗi, hiển thị thông báo
  if (hasError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-red-500/80 text-white p-4 rounded-lg max-w-md text-center">
          <p className="font-bold text-lg mb-2">Lỗi phát audio</p>
          <p>Định dạng file không được hỗ trợ hoặc file bị hỏng.</p>
          <p className="mt-2 text-sm">Hãy thử định dạng MP3, WAV hoặc OGG.</p>
        </div>
      </div>
    );
  }

  // Chỉ render Audio component khi đã kiểm tra thành công
  if (!audioReady) {
    return null;
  }

  return (
    <Audio
      src={source}
      volume={(f) => {
        // Frame hiện tại tương đối với điểm bắt đầu
        const relativeFrame = f - startFrom;

        // Nếu chưa đến lúc phát nhạc, volume = 0
        if (relativeFrame < 0) {
          return 0;
        }

        // Xử lý fade in
        if (fadeIn > 0 && relativeFrame < fadeIn) {
          return interpolate(relativeFrame, [0, fadeIn], [0, volumeLevel]);
        }

        // Xử lý fade out
        if (fadeOut > 0) {
          const fadeOutStart = durationInFrames - fadeOut;

          if (f > fadeOutStart) {
            return interpolate(
              f,
              [fadeOutStart, durationInFrames],
              [volumeLevel, 0],
            );
          }
        }

        // Trường hợp mặc định: trả về mức âm lượng cố định
        return volumeLevel;
      }}
      startFrom={startFrom}
      onError={(err) => {
        console.error("Lỗi phát audio:", err);
        setHasError(true);
      }}
    />
  );
};
