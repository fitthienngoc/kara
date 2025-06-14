/* eslint-disable @remotion/warn-native-media-tag */
import React, { useState, useEffect } from "react";
import { KaraokeLine } from "../../constants";
import useTimeLine from "./hooks";

export interface TimelineProps {
  karaokeLines: KaraokeLine[];
  setKaraokeLines: React.Dispatch<React.SetStateAction<KaraokeLine[]>>;
  fps: number;
  durationInFrames: number;
  audioSrc: string;
  onTimeChange?: (timeInSeconds: number) => void;
}

// Định nghĩa kiểu dữ liệu cho các dòng đã được phân bổ
interface LinePlacement {
  line: KaraokeLine;
  lineIndex: number;
  startPos: number;
  endPos: number;
  width: number;
}

export const Timeline: React.FC<TimelineProps> = ({
  karaokeLines,
  setKaraokeLines,
  fps,
  durationInFrames,
  audioSrc,
  onTimeChange,
}) => {
  const {
    currentTime,
    zoom,
    audioDuration,
    playheadDragging,
    isPlaying,
    timelineRef,
    audioRef,
    canvasRef,
    timelineWidth,
    timeToPosition,
    frameToTime,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleZoomChange,
    handleTimelineClick,
    handlePlayheadMouseDown,
    handleTimeUpdate,
    togglePlay,
    totalDuration,
  } = useTimeLine({
    karaokeLines,
    setKaraokeLines,
    fps,
    durationInFrames,
    audioSrc,
    onTimeChange,
  });

  const [recording, setRecording] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState<number | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  const handleWordTap = () => {
    if (!recording || currentLineIndex === null) return;
    setKaraokeLines((prevLines) => {
      const lines = [...prevLines];
      const line = { ...lines[currentLineIndex] };
      const words = [...line.words];
      if (currentWordIndex >= words.length) return prevLines;

      const start = Math.round(currentTime * fps);
      const duration = Math.round(0.3 * fps);

      if (currentWordIndex === 0) {
        words[currentWordIndex] = {
          ...words[currentWordIndex],
          startTime: start,
          endTime: start + duration,
        };
      } else {
        const prev = words[currentWordIndex - 1];
        words[currentWordIndex] = {
          ...words[currentWordIndex],
          startTime: prev.endTime,
          endTime: prev.endTime + duration,
        };
      }

      line.words = words;
      line.startTime = words[0].startTime;
      line.endTime = words[words.length - 1].endTime;
      lines[currentLineIndex] = line;
      return lines;
    });
    const nextWordIndex = currentWordIndex + 1;
    if (currentLineIndex !== null) {
      const line = karaokeLines[currentLineIndex];
      if (nextWordIndex >= line.words.length) {
        // Move to next line or stop recording
        if (currentLineIndex + 1 < karaokeLines.length) {
          setCurrentLineIndex(currentLineIndex + 1);
          setCurrentWordIndex(0);
        } else {
          setRecording(false);
          setCurrentLineIndex(null);
          setCurrentWordIndex(0);
        }
      } else {
        setCurrentWordIndex(nextWordIndex);
      }
    }
  };

  const startRecording = () => {
    if (currentLineIndex !== null) {
      setRecording(true);
      setCurrentWordIndex(0);
    }
  };

  const stopRecording = () => {
    setRecording(false);
    setCurrentLineIndex(null);
    setCurrentWordIndex(0);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && recording) {
        e.preventDefault();
        handleWordTap();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [recording, currentWordIndex, currentLineIndex, currentTime]);

  // Số dòng tối đa để hiển thị
  const maxRows = 2;

  // Tính toán phân bổ các dòng karaoke vào các hàng
  const distributeLinesToRows = (): LinePlacement[][] => {
    // Khởi tạo mảng với kiểu dữ liệu cụ thể
    const rows: LinePlacement[][] = Array(maxRows)
      .fill(null)
      .map(() => [] as LinePlacement[]);

    karaokeLines.forEach((line, index) => {
      // Tính toán thời gian bắt đầu và kết thúc để xác định vị trí phù hợp
      const startPos = timeToPosition(frameToTime(line.startTime));
      const endPos = timeToPosition(frameToTime(line.endTime));
      const lineWidth = endPos - startPos;

      // Tìm hàng phù hợp để đặt dòng karaoke
      let targetRow = index % maxRows; // Mặc định phân bổ đều

      // Kiểm tra xem có thể đặt vào hàng nào mà không bị chồng lấn
      for (let i = 0; i < maxRows; i++) {
        const rowLines = rows[i];
        let canPlace = true;

        for (const placedLine of rowLines) {
          const placedStartPos = timeToPosition(
            frameToTime(placedLine.line.startTime),
          );
          const placedEndPos = timeToPosition(
            frameToTime(placedLine.line.endTime),
          );

          // Kiểm tra xem có bị chồng lấn không
          if (!(endPos < placedStartPos || startPos > placedEndPos)) {
            canPlace = false;
            break;
          }
        }

        if (canPlace) {
          targetRow = i;
          break;
        }
      }

      // Thêm dòng vào hàng đã chọn với kiểu dữ liệu rõ ràng
      rows[targetRow].push({
        line,
        lineIndex: index,
        startPos,
        endPos,
        width: lineWidth,
      });
    });
    return rows;
  };

  const rows = distributeLinesToRows();

  return (
    <div className="mt-2 bg-gray-900 p-2 rounded-lg">
      {/* Controls */}
      <div className="flex items-center mb-2 text-xs gap-3">
        <button
          className={`px-1 py-0.5 rounded flex items-center justify-center transition-colors text-[10px] ${
            isPlaying
              ? "bg-red-500 hover:bg-red-600"
              : "bg-blue-500 hover:bg-blue-600"
          } text-white`}
          onClick={togglePlay}
        >
          {isPlaying ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 002 0V9a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v2a1 1 0 002 0V9a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Pause
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              Play
            </>
          )}
        </button>

        <button
          className={`px-1 py-0.5 rounded text-[10px] ${recording ? "bg-red-600" : "bg-green-600"} text-white`}
          onClick={recording ? stopRecording : startRecording}
          disabled={currentLineIndex === null}
        >
          {recording ? "⏹ Dừng ghi" : "🎙 Ghi từng từ"}
        </button>

        <div className="text-white font-mono text-[10px]">
          {Math.floor(currentTime / 60)}:
          {Math.floor(currentTime % 60)
            .toString()
            .padStart(2, "0")}{" "}
          /{Math.floor(audioDuration / 60)}:
          {Math.floor(audioDuration % 60)
            .toString()
            .padStart(2, "0")}
        </div>

        <div className="flex items-center">
          <input
            type="range"
            min="0.5"
            max="3.5"
            step="0.1"
            value={zoom}
            onChange={handleZoomChange}
            className="w-20"
          />
          <span className="text-white ml-1 text-[10px]">
            {zoom.toFixed(1)}x
          </span>
        </div>
      </div>

      {/* Audio element (hidden) */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        className="hidden"
      />

      {/* Timeline container */}
      <div
        className="relative overflow-x-auto"
        style={{ height: maxRows * 30 + 80 }} // Chiều cao cố định dựa trên số dòng tối đa, giảm từ 120 xuống 80
      >
        {/* Playhead - Cải thiện animation */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 cursor-ew-resize transition-all duration-100"
          style={{
            left: timeToPosition(currentTime),
            boxShadow: isPlaying ? "0 0 6px 1px rgba(255, 0, 0, 0.6)" : "none",
            transition: playheadDragging ? "none" : "left 0.1s ease-out",
            height: "calc(100% - 40px)",
          }}
          onMouseDown={handlePlayheadMouseDown}
        >
          <div
            className={`absolute w-3 h-3 bg-red-500 rounded-full -left-1.5 -top-1.5 transition-transform ${
              isPlaying ? "animate-pulse" : ""
            }`}
            style={{
              boxShadow: "0 0 4px 1.5px rgba(255, 0, 0, 0.4)",
              transform: playheadDragging ? "scale(1.2)" : "scale(1)",
            }}
          ></div>
        </div>

        {/* Time markers */}
        <div className="h-4 bg-gray-800 sticky top-0 z-10 flex">
          {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => (
            <div
              key={i}
              className="absolute flex flex-col items-center"
              style={{ left: timeToPosition(i) }}
            >
              <div className="h-2 w-0.5 bg-gray-400"></div>
              <div className="text-[10px] text-gray-400">{i}s</div>
            </div>
          ))}
        </div>

        {/* Waveform */}
        <div className="relative h-8 bg-gray-800 border-t border-gray-700">
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 h-full"
            style={{ width: timelineWidth }}
          />
        </div>

        {/* Timeline content */}
        <div
          ref={timelineRef}
          className="relative bg-gray-800 border-t border-gray-700"
          style={{ width: timelineWidth }}
          onClick={handleTimelineClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Karaoke lines - Hiển thị theo hàng */}
          {rows.map((rowLines, rowIndex) => (
            <div
              key={rowIndex}
              className="relative h-10 border-b border-gray-700"
            >
              {rowLines.map(({ line, lineIndex }) => (
                <React.Fragment key={lineIndex}>
                  {/* Line block */}
                  <div
                    className="absolute h-8 mt-1 bg-blue-800 rounded opacity-70 cursor-move flex items-end justify-center px-0.5 text-[10px] text-white overflow-hidden"
                    style={{
                      left: timeToPosition(frameToTime(line.startTime)),
                      width: timeToPosition(
                        frameToTime(line.endTime - line.startTime),
                      ),
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleMouseDown(e, "line", lineIndex);
                    }}
                    onClick={(e) => {
                      e.stopPropagation(); // Ngăn sự kiện click lan truyền
                      setCurrentLineIndex(lineIndex);
                    }}
                  >
                    {line.words.map((word) => word.word).join(" ")}
                  </div>

                  {/* Line start handle */}
                  <div
                    className="absolute h-8 w-1 mt-1 bg-blue-500 cursor-ew-resize z-10 hover:bg-blue-400 transition-colors"
                    style={{
                      left: timeToPosition(frameToTime(line.startTime)),
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleMouseDown(e, "line", lineIndex, undefined, "start");
                    }}
                    onClick={(e) => e.stopPropagation()} // Ngăn sự kiện click lan truyền
                  ></div>

                  {/* Line end handle */}
                  <div
                    className="absolute h-8 w-1 mt-1 bg-blue-500 cursor-ew-resize z-10 hover:bg-blue-400 transition-colors"
                    style={{
                      left: timeToPosition(frameToTime(line.endTime)),
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleMouseDown(e, "line", lineIndex, undefined, "end");
                    }}
                    onClick={(e) => e.stopPropagation()} // Ngăn sự kiện click lan truyền
                  ></div>

                  {/* Words */}
                  {line.words.map((word, wordIndex) => (
                    <div
                      key={wordIndex}
                      className="absolute h-5 mt-1 bg-green-600 rounded opacity-80 cursor-move flex items-center justify-center text-[10px] text-white overflow-hidden hover:opacity-100 transition-opacity"
                      style={{
                        left: timeToPosition(frameToTime(word.startTime)),
                        width: timeToPosition(
                          frameToTime(word.endTime - word.startTime),
                        ),
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleMouseDown(e, "word", lineIndex, wordIndex);
                      }}
                      onClick={(e) => e.stopPropagation()} // Ngăn sự kiện click lan truyền
                    >
                      {word.word}

                      {/* Word start handle */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-0.5 bg-green-400 cursor-ew-resize hover:bg-green-300 transition-colors"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleMouseDown(
                            e,
                            "word",
                            lineIndex,
                            wordIndex,
                            "start",
                          );
                        }}
                        onClick={(e) => e.stopPropagation()} // Ngăn sự kiện click lan truyền
                      ></div>

                      {/* Word end handle */}
                      <div
                        className="absolute right-0 top-0 bottom-0 w-0.5 bg-green-400 cursor-ew-resize hover:bg-green-300 transition-colors"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleMouseDown(
                            e,
                            "word",
                            lineIndex,
                            wordIndex,
                            "end",
                          );
                        }}
                        onClick={(e) => e.stopPropagation()} // Ngăn sự kiện click lan truyền
                      ></div>
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
