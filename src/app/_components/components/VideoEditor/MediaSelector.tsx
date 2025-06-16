"use client";

import React, { useState, useCallback, useRef } from "react";

interface MediaSelectorProps {
  onSelectBackground: (
    type: "image" | "video" | "color",
    src?: string,
    color?: string,
  ) => void;
  onSelectAudio: (src: string) => void;
}

export const MediaSelector: React.FC<MediaSelectorProps> = ({
  onSelectBackground,
  onSelectAudio,
}) => {
  // State để lưu trữ các file đã tải lên
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [backgroundVideo, setBackgroundVideo] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState("#121212");

  // Refs cho input file
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Xử lý tải lên ảnh nền
  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        setBackgroundImage(url);
        onSelectBackground("image", url);
      }
    },
    [onSelectBackground],
  );

  // Xử lý tải lên video nền
  const handleVideoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        setBackgroundVideo(url);
        onSelectBackground("video", url);
      }
    },
    [onSelectBackground],
  );

  // Xử lý tải lên file âm thanh
  const handleAudioUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        setAudioFile(url);
        onSelectAudio(url);
      }
    },
    [onSelectAudio],
  );

  // Xử lý thay đổi màu nền
  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const color = e.target.value;
      setBackgroundColor(color);
      onSelectBackground("color", undefined, color);
    },
    [onSelectBackground],
  );

  // Xử lý chọn loại nền
  const handleBackgroundTypeChange = useCallback(
    (type: "image" | "video" | "color") => {
      if (type === "image" && backgroundImage) {
        onSelectBackground("image", backgroundImage);
      } else if (type === "video" && backgroundVideo) {
        onSelectBackground("video", backgroundVideo);
      } else if (type === "color") {
        onSelectBackground("color", undefined, backgroundColor);
      }
    },
    [backgroundImage, backgroundVideo, backgroundColor, onSelectBackground],
  );

  return (
    <div className="absolute top-2.5 left-2.5 bg-black/70 text-white p-4 rounded-lg z-10 w-72 font-sans">
      <h3 className="mt-0 mb-3 text-lg font-bold">Media Selector</h3>

      {/* Phần chọn nền */}
      <div className="mb-4">
        <label className="block mb-1.5 font-semibold">Background:</label>
        <div className="flex flex-wrap">
          <button
            className={`mr-2 mb-2 px-3 py-2 rounded text-white border-none cursor-pointer ${backgroundColor === "#121212" ? "bg-blue-700" : "bg-blue-500"}`}
            onClick={() => handleBackgroundTypeChange("color")}
          >
            Color
          </button>
          <button
            className={`mr-2 mb-2 px-3 py-2 rounded text-white border-none cursor-pointer ${backgroundImage ? "bg-blue-700" : "bg-blue-500"}`}
            onClick={() =>
              backgroundImage
                ? handleBackgroundTypeChange("image")
                : imageInputRef.current?.click()
            }
          >
            Image
          </button>
          <button
            className={`mr-2 mb-2 px-3 py-2 rounded text-white border-none cursor-pointer ${backgroundVideo ? "bg-blue-700" : "bg-blue-500"}`}
            onClick={() =>
              backgroundVideo
                ? handleBackgroundTypeChange("video")
                : videoInputRef.current?.click()
            }
          >
            Video
          </button>
        </div>

        {/* Input màu nền */}
        <div className="mt-2.5">
          <label className="block mb-1.5 font-semibold">
            Background Color:
          </label>
          <input
            type="color"
            value={backgroundColor}
            onChange={handleColorChange}
            className="w-full h-8 cursor-pointer"
          />
        </div>

        {/* Input ẩn cho tải lên file */}
        <input
          type="file"
          ref={imageInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />
        <input
          type="file"
          ref={videoInputRef}
          onChange={handleVideoUpload}
          accept="video/*"
          className="hidden"
        />
      </div>

      {/* Phần chọn âm thanh */}
      <div className="mb-4">
        <label className="block mb-1.5 font-semibold">Audio:</label>
        <button
          className="bg-blue-500 text-white border-none px-3 py-2 rounded cursor-pointer"
          onClick={() => audioInputRef.current?.click()}
        >
          {audioFile ? "Change Audio" : "Upload Audio"}
        </button>
        {audioFile && <span className="ml-2.5 text-xs">✓ Audio loaded</span>}
        <input
          type="file"
          ref={audioInputRef}
          onChange={handleAudioUpload}
          accept="audio/*"
          className="hidden"
        />
      </div>

      {/* Thông tin hướng dẫn */}
      <div className="text-xs opacity-80">
        Tip: You can upload your own media files to use as background or audio.
      </div>
    </div>
  );
};
