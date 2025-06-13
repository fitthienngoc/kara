/* eslint-disable @remotion/warn-native-media-tag */
import React from "react";
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
          const placedStartPos = timeToPosition(frameToTime(placedLine.line.startTime));
          const placedEndPos = timeToPosition(frameToTime(placedLine.line.endTime));
          
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
        width: lineWidth
      });
    });
    return rows;
  };

  const rows = distributeLinesToRows();

  return (
    <div className="mt-4 bg-gray-900 p-4 rounded-lg">
      <h3 className="text-white font-semibold mb-2">Timeline</h3>

      {/* Controls */}
      <div className="flex items-center mb-4">
        <button
          className={`px-3 py-1 rounded mr-2 flex items-center justify-center transition-colors ${
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
                className="h-4 w-4 mr-1"
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
                className="h-4 w-4 mr-1"
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

        <div className="text-white mr-4 font-mono">
          {Math.floor(currentTime / 60)}:
          {Math.floor(currentTime % 60)
            .toString()
            .padStart(2, "0")}{" "}
          /{Math.floor(audioDuration / 60)}:
          {Math.floor(audioDuration % 60)
            .toString()
            .padStart(2, "0")}
        </div>

        <div className="flex items-center mr-4">
          <span className="text-white mr-2">Zoom:</span>
          <input
            type="range"
            min="0.5"
            max="3.5"
            step="0.1"
            value={zoom}
            onChange={handleZoomChange}
            className="w-32"
          />
          <span className="text-white ml-1">{zoom.toFixed(1)}x</span>
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
        style={{ height: maxRows * 40 + 120 }} // Chiều cao cố định dựa trên số dòng tối đa
      >
        {/* Playhead - Cải thiện animation */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 cursor-ew-resize transition-all duration-100"
          style={{
            left: timeToPosition(currentTime),
            boxShadow: isPlaying ? "0 0 8px 1px rgba(255, 0, 0, 0.6)" : "none",
            transition: playheadDragging ? "none" : "left 0.1s ease-out",
          }}
          onMouseDown={handlePlayheadMouseDown}
        >
          <div
            className={`absolute w-4 h-4 bg-red-500 rounded-full -left-2 -top-2 transition-transform ${
              isPlaying ? "animate-pulse" : ""
            }`}
            style={{
              boxShadow: "0 0 5px 2px rgba(255, 0, 0, 0.4)",
              transform: playheadDragging ? "scale(1.2)" : "scale(1)",
            }}
          ></div>
        </div>

        {/* Time markers */}
        <div className="h-6 bg-gray-800 sticky top-0 z-10 flex">
          {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => (
            <div
              key={i}
              className="absolute flex flex-col items-center"
              style={{ left: timeToPosition(i) }}
            >
              <div className="h-2 w-1 bg-gray-400"></div>
              <div className="text-xs text-gray-400">{i}s</div>
            </div>
          ))}
        </div>

        {/* Waveform */}
        <div className="relative h-20 bg-gray-800 border-t border-gray-700">
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
                    className="absolute h-6 mt-2 bg-blue-800 rounded opacity-70 cursor-move flex items-center px-1 text-xs text-white overflow-hidden"
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
                  >
                    {line.words.map((word) => word.word).join(" ")}
                  </div>

                  {/* Line start handle */}
                  <div
                    className="absolute h-6 w-2 mt-2 bg-blue-500 cursor-ew-resize z-10 hover:bg-blue-400 transition-colors"
                    style={{
                      left: timeToPosition(frameToTime(line.startTime)),
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleMouseDown(e, "line", lineIndex, undefined, "start");
                    }}
                  ></div>

                  {/* Line end handle */}
                  <div
                    className="absolute h-6 w-2 mt-2 bg-blue-500 cursor-ew-resize z-10 hover:bg-blue-400 transition-colors"
                    style={{
                      left: timeToPosition(frameToTime(line.endTime)),
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleMouseDown(e, "line", lineIndex, undefined, "end");
                    }}
                  ></div>

                  {/* Words */}
                  {line.words.map((word, wordIndex) => (
                    <div
                      key={wordIndex}
                      className="absolute h-4 mt-3 bg-green-600 rounded opacity-80 cursor-move flex items-center justify-center text-xs text-white overflow-hidden hover:opacity-100 transition-opacity"
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
                    >
                      {word.word}

                      {/* Word start handle */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1 bg-green-400 cursor-ew-resize hover:bg-green-300 transition-colors"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleMouseDown(e, "word", lineIndex, wordIndex, "start");
                        }}
                      ></div>

                      {/* Word end handle */}
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 bg-green-400 cursor-ew-resize hover:bg-green-300 transition-colors"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleMouseDown(e, "word", lineIndex, wordIndex, "end");
                        }}
                      ></div>
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-400">
        Kéo các khối để di chuyển dòng/từ. Kéo cạnh để điều chỉnh thời gian bắt
        đầu/kết thúc.
      </div>
    </div>
  );
};