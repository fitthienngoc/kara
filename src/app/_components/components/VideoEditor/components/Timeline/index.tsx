import React, { useState, useEffect } from "react";
import { KaraokeLine } from "../../constants";
import useTimeLine from "./hooks/useTimeLine";
import clsx from "clsx";
import { ControlsTimeline } from "./components";
import { useCurrentTiming } from "./hooks/useCurrentTiming";
import {
  getConsistentColorFromString,
  getLighterColorVariant,
  getDarkerColorVariant,
} from "./utils";
import { useTabs } from "../LyricsEditor/hooks";

export interface TimelineProps {
  karaokeLines: KaraokeLine[];
  setKaraokeLines: React.Dispatch<React.SetStateAction<KaraokeLine[]>>;
  fps: number;
  durationInFrames: number;
  setDurationInFrames: (frames: number) => void; // Thêm prop để cập nhật durationInFrames
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
  color: string; // Màu cho line block
  wordColor: string; // Màu cho các từ
  handleColor: string; // Màu cho handle
  handleHoverColor: string; // Màu khi hover handle
}

export const Timeline: React.FC<TimelineProps> = ({
  karaokeLines,
  setKaraokeLines,
  fps,
  durationInFrames,
  setDurationInFrames, // Thêm prop để cập nhật durationInFrames
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
    setDurationInFrames,
  });

  const [isTimelineFocused, setIsTimelineFocused] = useState(false);
  const [recording, setRecording] = useState(false);
  // const [currentLineIndex, setCurrentLineIndex] = useState<number | null>(null);

  const {
    currentLineIndex,
    currentWordIndex,
    setCurrentWordIndex,
    setCurrentUnixIdActiveLine,
  } = useCurrentTiming();

  // Thêm state để chỉnh sửa thời lượng video
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [customDuration, setCustomDuration] = useState(durationInFrames / fps);

  const { activeTabId: activeTab, setActiveTabId } = useTabs();

  // Hàm xử lý khi thay đổi thời lượng video
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDurationInSeconds = parseFloat(e.target.value);
    setCustomDuration(newDurationInSeconds);
  };

  // Hàm áp dụng thời lượng mới
  const applyCustomDuration = () => {
    const newDurationInFrames = Math.round(customDuration * fps);
    setDurationInFrames(newDurationInFrames);
    setIsEditingDuration(false);
  };

  const handleWordTap = () => {
    if (!recording || currentLineIndex === null) return;

    setKaraokeLines((prevLines) => {
      const lines = [...prevLines];
      const line = { ...lines[currentLineIndex] };
      const words = [...line.words];

      if (currentWordIndex >= words.length || activeTab !== line.idTab) {
        return prevLines;
      }

      const start = Math.round(currentTime * fps); // Thời gian hiện tại của playhead

      // Tính toán thời gian kết thúc của từ hiện tại
      let end: number | undefined;
      if (currentWordIndex < words.length - 1) {
        // Nếu không phải từ cuối cùng, thời gian kết thúc là thời gian bắt đầu của từ tiếp theo
        end =
          words[currentWordIndex + 1].startTime ??
          start + Math.round(0.3 * fps);
      } else {
        // Nếu là từ cuối cùng, kéo dài đến cuối dòng hoặc một khoảng mặc định
        end = start + Math.round(0.5 * fps);
      }

      // Cập nhật thời gian cho từ hiện tại
      words[currentWordIndex] = {
        ...words[currentWordIndex],
        startTime: start,
        endTime: end,
      };

      // Cập nhật thời gian của dòng
      line.words = words;
      line.startTime = words[0]?.startTime ?? undefined;
      line.endTime = Math.max(
        ...words.map((word) => word.endTime || 0), // Lấy giá trị endTime lớn nhất trong các từ
      );
      lines[currentLineIndex] = line;
      return lines;
    });

    const nextWordIndex = currentWordIndex + 1;
    if (currentLineIndex !== null) {
      const line = karaokeLines[currentLineIndex];
      if (nextWordIndex >= line.words.length) {
        // Chuyển sang dòng tiếp theo hoặc dừng ghi
        if (currentLineIndex + 1 < karaokeLines.length) {
          setCurrentUnixIdActiveLine(karaokeLines[currentLineIndex + 1].unixId);
          setCurrentWordIndex(0);
        } else {
          setRecording(false);
          setCurrentUnixIdActiveLine(undefined);
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
    setCurrentUnixIdActiveLine(undefined);
    setCurrentWordIndex(0);
  };

  // Add the optimizeTiming function
  const optimizeTiming = () => {
    const padding = 0; // Thời gian đệm thêm (0.2 giây)

    setKaraokeLines((prevLines) => {
      return prevLines.map((line) => {
        if (!line.words || line.words.length === 0) return line;

        const updatedWords = line.words.map((wordC, index) => {
          const nextWord = line.words[index + 1]; // Lấy từ tiếp theo
          const word = { ...wordC }; // Sao chép từ hiện tại
          if (!word.startTime) {
            // Nếu từ không có startTime, sử dụng thời gian hiện tại
            word.startTime = Math.round(currentTime * fps);
          }

          // Nếu là từ cuối của câu
          if (!nextWord) {
            return {
              ...word,
              endTime: word.endTime, // Giữ nguyên endTime của từ cuối
            };
          }

          // Nếu không phải từ cuối, tính toán endTime
          const calculatedEndTime =
            nextWord.startTime ??
            word.endTime ??
            word.startTime + Math.round(0.5 * fps); // Thời gian kết thúc mặc định

          return {
            ...word,
            endTime: calculatedEndTime + padding, // Thêm thời gian đệm vào endTime
          };
        });

        return {
          ...line,
          words: updatedWords,
          startTime: updatedWords[0]?.startTime,
          endTime: updatedWords[updatedWords.length - 1]?.endTime,
        };
      });
    });
  };

  const handleTimelineFocus = () => {
    setIsTimelineFocused(true);
  };

  const handleTimelineBlur = () => {
    setIsTimelineFocused(false);
  };

  useEffect(() => {
    setCustomDuration(durationInFrames / fps);
  }, [fps]);

  // Add to the existing useEffect for keyboard events
  useEffect(() => {
    if (!isTimelineFocused) return;
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        if (recording) {
          e.preventDefault();
          handleWordTap();
        }
      }

      // Handle delete key to reset the current line
      if (e.code === "Delete" || e.code === "Backspace") {
        if (currentLineIndex === null) return;
        e.preventDefault();
        setKaraokeLines((prevLines) => {
          const lines = [...prevLines];
          const line = { ...lines[currentLineIndex] };

          // Reset startTime and endTime to undefined
          line.startTime = undefined;
          line.endTime = undefined;

          // Reset words' timing as well
          line.words = line.words.map((word) => ({
            ...word,
            startTime: undefined,
            endTime: undefined,
          }));

          lines[currentLineIndex] = line;
          return lines;
        });
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    recording,
    currentWordIndex,
    currentLineIndex,
    currentTime,
    setKaraokeLines,
    isTimelineFocused,
    activeTab,
  ]);

  // Số dòng tối đa để hiển thị
  const maxRows = 2;

  // Tính toán phân bổ các dòng karaoke vào các hàng
  // Tính toán phân bổ các dòng karaoke vào các hàng
  const distributeLinesToRows = (): LinePlacement[][] => {
    // Khởi tạo mảng với kiểu dữ liệu cụ thể
    const rows: LinePlacement[][] = Array(maxRows)
      .fill(null)
      .map(() => [] as LinePlacement[]);

    karaokeLines.forEach((line, index) => {
      if (!line.startTime || !line.endTime) return;

      // Tính toán thời gian bắt đầu và kết thúc để xác định vị trí phù hợp
      const startPos = timeToPosition(frameToTime(line.startTime));
      const endPos = timeToPosition(frameToTime(line.endTime));
      const lineWidth = endPos - startPos;

      // Tạo màu sắc nhất quán dựa trên idTab
      const baseColor = getConsistentColorFromString(line.idTab);
      const wordColor = getLighterColorVariant(baseColor);
      const handleColor = getDarkerColorVariant(wordColor);
      const handleHoverColor = getLighterColorVariant(handleColor);

      // Tìm hàng phù hợp để đặt dòng karaoke
      let targetRow = index % maxRows; // Mặc định phân bổ đều

      // Kiểm tra xem có thể đặt vào hàng nào mà không bị chồng lấn
      for (let i = 0; i < maxRows; i++) {
        const rowLines = rows[i];
        let canPlace = true;

        for (const placedLine of rowLines) {
          if (!placedLine.line.startTime || !placedLine.line.endTime) continue;

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

      // Thêm dòng vào hàng đã chọn với kiểu dữ liệu rõ ràng và màu sắc
      rows[targetRow].push({
        line,
        lineIndex: index,
        startPos,
        endPos,
        width: lineWidth,
        color: baseColor,
        wordColor: wordColor,
        handleColor: handleColor,
        handleHoverColor: handleHoverColor,
      });
    });

    return rows;
  };
  const rows = distributeLinesToRows();

  return (
    <div
      className="mt-2 bg-gray-900 p-2 rounded-lg flex flex-col flex-1"
      onMouseEnter={handleTimelineFocus}
      onMouseLeave={handleTimelineBlur}
    >
      {/* Controls */}
      <ControlsTimeline
        isPlaying={isPlaying}
        togglePlay={togglePlay}
        currentLineIndex={currentLineIndex}
        onReady={() => {
          setCurrentWordIndex(0);
          setCurrentUnixIdActiveLine(
            karaokeLines.find((line) => line.idTab === activeTab)?.unixId,
          );
        }}
        recording={recording}
        stopRecording={stopRecording}
        startRecording={startRecording}
        currentTime={currentTime}
        audioDuration={audioDuration}
        zoom={zoom}
        handleZoomChange={handleZoomChange}
        optimizeTiming={optimizeTiming}
        isEditingDuration={isEditingDuration}
        setIsEditingDuration={setIsEditingDuration}
        customDuration={customDuration}
        handleDurationChange={handleDurationChange}
        applyCustomDuration={applyCustomDuration}
        durationInFrames={durationInFrames}
        fps={fps}
      />

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

        {/* Video Duration Marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-purple-500 z-10"
          style={{
            left: timeToPosition(durationInFrames / fps),
            height: "calc(100% - 40px)",
          }}
        >
          <div className="absolute -top-4 -left-8 bg-purple-700 text-white text-[10px] px-1 py-0.5 rounded whitespace-nowrap">
            End: {(durationInFrames / fps).toFixed(1)}s
          </div>
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
              className={"relative h-10 border-b border-gray-700"}
            >
              {rowLines.map((placement) => (
                <React.Fragment key={placement.lineIndex}>
                  {/* Line block */}
                  {placement.line.startTime && placement.line.endTime && (
                    <div
                      className={clsx(
                        placement.lineIndex !== currentLineIndex &&
                          "opacity-30",
                      )}
                    >
                      <div
                        className={`absolute h-8 mt-1 bg-${placement.color} rounded opacity-70 cursor-move flex items-end justify-center px-0.5 text-[10px] text-white overflow-hidden`}
                        style={{
                          left: placement.startPos,
                          width: placement.width,
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleMouseDown(e, "line", placement.lineIndex);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentUnixIdActiveLine(placement.line.unixId);
                          setActiveTabId(placement.line.idTab);
                          setCurrentWordIndex(0);
                        }}
                      >
                        {placement.line.words
                          .map((word) => word.word)
                          .join(" ")}
                      </div>

                      {/* Line start handle */}
                      <div
                        className={`absolute h-8 w-1 mt-1 bg-${placement.handleColor} cursor-ew-resize z-10 hover:bg-${placement.handleHoverColor} transition-colors`}
                        style={{
                          left: placement.startPos,
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleMouseDown(
                            e,
                            "line",
                            placement.lineIndex,
                            undefined,
                            "start",
                          );
                        }}
                        onClick={(e) => e.stopPropagation()}
                      ></div>

                      {/* Line end handle */}
                      <div
                        className={`absolute h-8 w-1 mt-1 bg-${placement.handleColor} cursor-ew-resize z-10 hover:bg-${placement.handleHoverColor} transition-colors`}
                        style={{
                          left: placement.endPos,
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleMouseDown(
                            e,
                            "line",
                            placement.lineIndex,
                            undefined,
                            "end",
                          );
                        }}
                        onClick={(e) => e.stopPropagation()}
                      ></div>
                    </div>
                  )}

                  {/* Words */}
                  {placement.line.words.map(
                    (word, wordIndex) =>
                      word.startTime &&
                      word.endTime && (
                        <div
                          key={wordIndex}
                          className={clsx(
                            placement.lineIndex !== currentLineIndex
                              ? "opacity-30"
                              : "opacity-80",
                            `absolute h-5 mt-1 bg-${placement.wordColor} rounded cursor-move flex items-center justify-center text-[10px] text-white overflow-hidden hover:opacity-100 transition-opacity`,
                          )}
                          style={{
                            left: timeToPosition(frameToTime(word.startTime)),
                            width: timeToPosition(
                              frameToTime(word.endTime - word.startTime),
                            ),
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleMouseDown(
                              e,
                              "word",
                              placement.lineIndex,
                              wordIndex,
                            );
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {word.word}

                          {/* Word start handle */}
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-0.5 bg-${placement.handleColor} cursor-ew-resize hover:bg-${placement.handleHoverColor} transition-colors`}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleMouseDown(
                                e,
                                "word",
                                placement.lineIndex,
                                wordIndex,
                                "start",
                              );
                            }}
                            onClick={(e) => e.stopPropagation()}
                          ></div>

                          {/* Word end handle */}
                          <div
                            className={`absolute right-0 top-0 bottom-0 w-0.5 bg-${placement.handleColor} cursor-ew-resize hover:bg-${placement.handleHoverColor} transition-colors`}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleMouseDown(
                                e,
                                "word",
                                placement.lineIndex,
                                wordIndex,
                                "end",
                              );
                            }}
                            onClick={(e) => e.stopPropagation()}
                          ></div>
                        </div>
                      ),
                  )}
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
