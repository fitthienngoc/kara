"use client";

import React, { useState, useEffect, useRef } from "react";
import { PlayerRef } from "@remotion/player";
import { DEFAULT_FPS, KaraokeLine } from "../components/VideoEditor/constants";
import { BackgroundSettings } from "../components/VideoEditor/components/BackgroundSettings";
import { AudioSettings } from "../components/VideoEditor/components/AudioSettings";
import { VideoSettings } from "../components/VideoEditor/components/VideoSettings";
import { LyricsEditor } from "../components/VideoEditor/components/LyricsEditor";
import {
  VIETNAMESE_FONTS,
  GOOGLE_FONTS_URL,
} from "../components/VideoEditor/constants/fonts";

import { saveAs } from "file-saver";
import { ElectronRender } from "../ElectronRender";
import { PreviewNTimeLine } from "./components";
import { useAppDispatch, useAppSelector } from "../../../store/store";
import {
  TKra1,
  TProject,
  TProjectWithKey,
} from "../../../store/reducers/projects/types";
import { projectsActions } from "../../../store/reducers/projects";

export type TVideoSetting = {
  width: number;
  height: number;
};

const VideoEditorApp: React.FC = () => {
  const projectData = useAppSelector((state) => state.projects.projects.kra1);
  const {
    audioSrc,
    code,
    durationInFrames = DEFAULT_FPS * 10,
    fps,
    height,
    karaokeLines,
    width,
  } = projectData;

  const dispatch = useAppDispatch();

  const setProject = (newProject: TProject<TProjectWithKey>) =>
    dispatch(
      projectsActions.setProjects({
        ...newProject,
      }),
    );

  const setProjectWithProp = <K extends keyof TProject<TKra1>>({
    property,
    newVl,
  }: {
    property: K;
    newVl: TProject<TKra1>[K];
  }) => {
    dispatch(
      projectsActions.setProjects({
        ...projectData,
        code,
        [property]: newVl,
      }),
    );
  };

  const setAudioSrc = (newVl: string) => {
    if (audioSrc) {
      const audio = new Audio(audioSrc);
      audio.onloadedmetadata = () => {
        // Cập nhật durationInFrames dựa trên thời lượng audio
        const newDurationInFrames = Math.ceil(audio.duration * fps);
        setProject({
          ...projectData,
          audioSrc: newVl,
          durationInFrames: newDurationInFrames,
        });
        return;
      };
    }
    setProjectWithProp({
      property: "audioSrc",
      newVl,
    });
  };

  const setKaraokeLines: (
    action: KaraokeLine[] | ((prev: KaraokeLine[]) => KaraokeLine[]),
  ) => void = (action) => {
    const prev = karaokeLines;
    const newValue =
      typeof action === "function"
        ? (action as (prev: KaraokeLine[]) => KaraokeLine[])(prev)
        : action;
    setProjectWithProp({
      property: "karaokeLines",
      newVl: newValue,
    });
  };

  const setFps = (action: number | ((prev: number) => number)) => {
    const prev = fps;
    const newValue =
      typeof action === "function"
        ? (action as (prev: number) => number)(prev)
        : action;

    // Tính toán tỷ lệ FPS mới so với FPS cũ
    const fpsRatio = newValue / prev;

    // Cập nhật lại timing cho karaokeLines
    const updatedKaraokeLines = karaokeLines.map((line) => {
      if (!line.startTime || !line.endTime) {
        // Nếu không có startTime hoặc endTime, giữ nguyên line
        return line;
      }
      // Sử dụng trực tiếp tỉ lệ để tính toán frame mới
      const newStartTime = Math.round(line.startTime * fpsRatio);
      const newEndTime = Math.round(line.endTime * fpsRatio);

      // Cập nhật từng từ nếu có
      let updatedWords = line.words;
      if (line.words && line.words.length > 0) {
        updatedWords = line.words.map((word) => {
          if (!word.startTime || !word.endTime) {
            // Nếu không có startTime hoặc endTime, giữ nguyên từ
            return word;
          }
          return {
            ...word,
            startTime: Math.round(word.startTime * fpsRatio),
            endTime: Math.round(word.endTime * fpsRatio),
          };
        });
      }

      return {
        ...line,
        startTime: newStartTime,
        endTime: newEndTime,
        words: updatedWords,
      };
    });

    // Tiếp tục với phần còn lại của hàm setFps
    if (audioSrc) {
      const audio = new Audio(audioSrc);
      audio.onloadedmetadata = () => {
        // Cập nhật durationInFrames dựa trên thời lượng audio
        const newDurationInFrames = Math.ceil(audio.duration * newValue);

        setProject({
          ...projectData,
          fps: newValue,
          durationInFrames: newDurationInFrames,
          karaokeLines: updatedKaraokeLines,
        });
        return;
      };
    }

    // Nếu không có audio
    setProject({
      ...projectData,
      fps: newValue,
      karaokeLines: updatedKaraokeLines,
    });
  };

  const setDurationInFrames: (
    action: number | ((prev: number) => number),
  ) => void = (action) => {
    const prev = durationInFrames;
    const newValue =
      typeof action === "function"
        ? (action as (prev: number) => number)(prev)
        : action;
    setProjectWithProp({
      property: "durationInFrames",
      newVl: newValue,
    });
  };

  const setVideoSettings: React.Dispatch<
    React.SetStateAction<TVideoSetting>
  > = (action) => {
    // Lấy prev từ store hoặc state
    const prev = { width, height };
    const newValue =
      typeof action === "function"
        ? (action as (prev: TVideoSetting) => TVideoSetting)(prev)
        : action;
    setProject({ ...projectData, ...newValue });
  };

  // State cho các thuộc tính của video
  const [backgroundType, setBackgroundType] = useState<
    "image" | "video" | "color"
  >("color");
  const [backgroundSrc, setBackgroundSrc] = useState<string>("");
  const [backgroundColor, setBackgroundColor] = useState<string>("#121212");

  // State để theo dõi vị trí hiện tại
  const [currentFrame, setCurrentFrame] = useState<number>(0);

  // State để kiểm soát việc hiển thị các phần cấu hình cơ bản
  const [showBasicSettings, setShowBasicSettings] = useState<boolean>(true);
  // State để kiểm soát hiển thị timeline
  const [showTimeline, setShowTimeline] = useState<boolean>(true);

  // Thêm state để lưu file audio gốc
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const videoSettings = {
    width,
    height,
  };

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

  // Thêm useEffect mới để đảm bảo currentFrame không vượt quá durationInFrames - 1
  useEffect(() => {
    if (currentFrame >= durationInFrames) {
      setCurrentFrame(Math.max(0, durationInFrames - 1));

      // Đồng bộ với player nếu cần
      if (playerRef.current) {
        playerRef.current.seekTo(Math.max(0, durationInFrames - 1));
      }
    }
  }, [durationInFrames, currentFrame]);

  // Xử lý khi Timeline thay đổi thời gian
  const handleTimelineTimeChange = (timeInSeconds: number) => {
    // Chuyển đổi thời gian thành frame
    const frame = Math.round(timeInSeconds * fps);
    // Đảm bảo frame không vượt quá durationInFrames - 1
    const safeFrame = Math.min(frame, durationInFrames - 1);
    setCurrentFrame(safeFrame);

    // Cập nhật vị trí của player
    if (playerRef.current) {
      playerRef.current.seekTo(safeFrame);
    }
  };

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
                // durationInFrames={durationInFrames}
                // setDurationInFrames={setDurationInFrames}
              />
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
                setVideoSettings={setVideoSettings}
                audioFile={audioFile}
                setFps={setFps}
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
        </div>

        {/* Phần xem trước video và timeline */}
        <PreviewNTimeLine
          playerRef={playerRef}
          currentFrame={currentFrame}
          durationInFrames={durationInFrames}
          setDurationInFrames={setDurationInFrames}
          fps={fps}
          videoSettings={videoSettings}
          backgroundType={backgroundType}
          backgroundSrc={backgroundSrc}
          backgroundColor={backgroundColor}
          audioSrc={audioSrc}
          karaokeLines={karaokeLines}
          setKaraokeLines={setKaraokeLines}
          showTimeline={showTimeline}
          toggleTimeline={toggleTimeline}
          handleTimelineTimeChange={handleTimelineTimeChange}
        />
      </div>
    </>
  );
};

export default VideoEditorApp;
