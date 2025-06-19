import React, { useState, useEffect, useRef } from "react";
import { useCurrentFrame } from "remotion";
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useDraggable } from "@dnd-kit/core";

import clsx from "clsx";
import { KaraokeEffectType, useKaraokeEffect } from "./hooks/useKaraokeEffect";
import {
  KaraokeLine,
  DEFAULT_INACTIVE_COLOR,
  DEFAULT_ACTIVE_COLOR,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_FONT_WEIGHT,
} from "../../constants";
import { KaraokeLineWithStyle, TextStyle } from "../../types";
import { KaraokeWord } from "./components";

// Mở rộng interface KaraokeLine để thêm thuộc tính position
interface KaraokeLineWithPosition extends KaraokeLine {
  position?: {
    x: number;
    y: number;
  };
}

interface KaraokeSubtitleProps {
  lines: KaraokeLineWithPosition[];
  setKaraokeLines?: React.Dispatch<React.SetStateAction<KaraokeLine[]>>;
  editable?: boolean;
  effectType?: KaraokeEffectType;
}

// Component cho dòng karaoke có thể kéo thả
interface DraggableLineProps {
  id: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className: string;
}

const DraggableLine: React.FC<DraggableLineProps> = ({
  id,
  children,
  style = {},
  className,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
    });

  // Tạo style cho phần tử khi kéo thả
  const draggableStyle = {
    ...style,
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 1000 : 10,
    opacity: isDragging ? 0.8 : style.opacity,
    boxShadow: isDragging ? "0 0 10px rgba(255, 255, 255, 0.5)" : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={draggableStyle}
      className={clsx(className, isDragging && "dragging")}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
};

export const KaraokeSubtitle: React.FC<KaraokeSubtitleProps> = ({
  lines,
  setKaraokeLines,
  editable = false,
  effectType = "default",
}) => {
  const frame = useCurrentFrame();
  // Thời gian hiển thị trước (tính bằng frames) - mặc định là 3 giây (90 frames ở 30fps)
  const previewFrames = 90;
  const containerRef = useRef<HTMLDivElement>(null);

  // State để lưu vị trí tạm thời của từng dòng
  const [linePositions, setLinePositions] = useState<
    Record<number, { x: number; y: number }>
  >({});

  // Cấu hình sensors cho DndContext
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Chỉ kích hoạt kéo thả khi di chuyển ít nhất 5px
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  // Khởi tạo vị trí ban đầu sau khi component đã render
  useEffect(() => {
    if (containerRef.current && setKaraokeLines) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const positions: Record<number, { x: number; y: number }> = {};

      // Cập nhật vị trí cho tất cả các dòng
      const updatedLines = [...lines];

      lines.forEach((line, index) => {
        // Nếu dòng đã có vị trí, sử dụng vị trí đó
        if (line.position) {
          positions[index] = line.position;
        } else {
          // Nếu không, tạo vị trí mặc định dựa trên vị trí hiện tại
          const isEvenLine = index % 2 === 0;

          positions[index] = {
            x: 100, // Dòng lẻ cách bên phải 100px (giả định chiều rộng text ~400px)
            y: isEvenLine
              ? containerRect.height - 180 // Dòng chẵn ở dưới, tăng khoảng cách
              : containerRect.height - 80, // Dòng lẻ ở trên
          };

          // Cập nhật vị trí vào dòng
          updatedLines[index] = {
            ...line,
            position: positions[index],
          };
        }
      });

      // Cập nhật state
      setLinePositions(positions);

      // Cập nhật dữ liệu gốc nếu có thay đổi
      if (JSON.stringify(lines) !== JSON.stringify(updatedLines)) {
        setKaraokeLines(updatedLines);
      }
    }
  }, [containerRef.current, setKaraokeLines]);

  // Tìm các dòng hiện tại đang được hiển thị, bao gồm cả thời gian chuẩn bị
  const currentLines = lines.filter(
    (line) => line.startTime !== undefined && line.endTime !== undefined,
  );

  // Sử dụng hook hiệu ứng karaoke
  const { cssStyles, getWordStyle } = useKaraokeEffect({
    effectType,
    frame,
    lines: currentLines as KaraokeLineWithStyle[],
    fps: 30,
  });

  // Xử lý sự kiện khi kết thúc kéo
  const handleDragEnd = (event: DragEndEvent) => {
    if (!setKaraokeLines) return;

    const { active, delta } = event;
    const lineId = active.id as string;
    const lineIndex = parseInt(lineId.replace("line-", ""), 10);

    // Lấy vị trí hiện tại
    const currentLine = lines[lineIndex];
    const currentPosition = currentLine?.position ||
      linePositions[lineIndex] || { x: 0, y: 0 };

    // Tính toán vị trí mới
    const newPosition = {
      x: currentPosition.x + delta.x,
      y: currentPosition.y + delta.y,
    };

    // Cập nhật vị trí tạm thời
    setLinePositions((prev) => ({
      ...prev,
      [lineIndex]: newPosition,
    }));

    // Cập nhật vị trí vào dữ liệu karaoke
    setKaraokeLines((prevLines) => {
      const newLines = [...prevLines];
      if (newLines[lineIndex]) {
        newLines[lineIndex] = {
          ...newLines[lineIndex],
          position: newPosition,
        };
      }
      return newLines;
    });
  };

  // Tạo style cho các chấm đếm ngược và các phần tử khác
  const createBaseStyles = () => {
    return `
      .countdown-dot {
        display: inline-block;
        width: 0.5em;
        height: 0.5em;
        margin-right: 0.4em;
        border-radius: 50%;
        background-color: ${DEFAULT_INACTIVE_COLOR};
        opacity: 0.5;
      }
      
      .countdown-dot.active {
        background-color: ${DEFAULT_ACTIVE_COLOR};
        opacity: 1;
        animation: pulse 1s infinite;
      }
      
      .countdown-container {
        display: inline-flex;
        align-items: center;
        margin-right: 1em;
      }
      
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
      }

      .karaoke-line-container {
        cursor: ${editable ? "move" : "default"};
        user-select: none;
        border-radius: 4px;
        padding: 2px;
        touch-action: none;
      }
      
      .karaoke-line-container.dragging {
        box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        z-index: 1000;
        opacity: 0.9;
      }
      
      .karaoke-line-container:hover {
        ${editable ? "box-shadow: 0 0 5px rgba(255, 255, 255, 0.3);" : ""}
      }
    `;
  };

  // Xác định trạng thái của các chấm đếm ngược
  const getCountdownDotStatus = (line: KaraokeLine) => {
    if (line.startTime === undefined) return [false, false, false];

    const timeToStart = line.startTime - frame;

    // Nếu đã bắt đầu, tất cả các chấm đều không active
    if (timeToStart <= 0) {
      return [false, false, false];
    }

    // Tính số giây còn lại (giả sử 30fps)
    const secondsToStart = Math.ceil(timeToStart / 30);

    if (secondsToStart > 3) {
      return [false, false, false];
    } else if (secondsToStart === 3) {
      return [true, false, false];
    } else if (secondsToStart === 2) {
      return [false, true, false];
    } else {
      // secondsToStart === 1
      return [false, false, true];
    }
  };

  return (
    <>
      <style>{createBaseStyles()}</style>
      <style>{cssStyles}</style>
      <DndContext
        sensors={sensors}
        onDragEnd={handleDragEnd}
        autoScroll={false}
      >
        <div
          ref={containerRef}
          className="absolute h-full w-full flex flex-col items-center justify-center px-5"
          style={{
            fontFamily: DEFAULT_FONT_FAMILY,
            fontSize: DEFAULT_FONT_SIZE,
            fontWeight: DEFAULT_FONT_WEIGHT,
            textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
          }}
        >
          <div className="w-full h-full relative">
            {currentLines.map((line, lineIndex) => {
              const lineWithStyle = line as KaraokeLineWithStyle;
              const lineStyle =
                lineWithStyle.style || ({} as Partial<TextStyle>);

              // Sử dụng style của dòng nếu có, nếu không sử dụng giá trị mặc định
              const lineFontFamily =
                lineStyle.fontFamily || DEFAULT_FONT_FAMILY;
              const lineFontSize = lineStyle.fontSize || DEFAULT_FONT_SIZE;
              const lineFontWeight =
                lineStyle.fontWeight || DEFAULT_FONT_WEIGHT;

              const isPreview = frame < (line.startTime ?? 0);
              const opacity = isPreview ? 0.5 : 1;
              const dotStatus = getCountdownDotStatus(line);
              const countdown = line.countDown;
              const isActive =
                line.startTime !== undefined &&
                line.endTime !== undefined &&
                frame >= line.startTime - previewFrames &&
                frame <= line.endTime;

              // Lấy vị trí từ dữ liệu hoặc từ state
              const position = line.position || linePositions[lineIndex];

              const lineId = `line-${lineIndex}`;

              // Nếu đang ở chế độ chỉnh sửa và có vị trí, sử dụng DraggableLine
              if (editable && position) {
                return (
                  <DraggableLine
                    key={lineIndex}
                    id={lineId}
                    className={clsx(
                      !isActive && "opacity-0",
                      "absolute karaoke-line-container w-full",
                    )}
                    style={{
                      fontFamily: lineFontFamily,
                      fontSize: lineFontSize,
                      fontWeight: lineFontWeight,
                      left: position.x,
                      top: position.y,
                      opacity: opacity,
                      maxWidth: "90%",
                    }}
                  >
                    <div
                      className={clsx(
                        lineIndex % 2 === 0 ? "" : "justify-end",
                        "px-4 w-full flex flex-wrap items-center",
                      )}
                    >
                      {countdown && (
                        <div className="countdown-container">
                          {[0, 1, 2].map((dotIndex) => {
                            const activeColor =
                              lineStyle.activeColor || DEFAULT_ACTIVE_COLOR;
                            const inactiveColor =
                              lineStyle.inactiveColor || DEFAULT_INACTIVE_COLOR;

                            return (
                              <div
                                key={dotIndex}
                                className={`countdown-dot ${
                                  dotStatus[dotIndex] ? "active" : ""
                                }`}
                                style={{
                                  backgroundColor: dotStatus[dotIndex]
                                    ? activeColor
                                    : inactiveColor,
                                }}
                              />
                            );
                          })}
                        </div>
                      )}

                      {line.words.map((word, wordIndex) => {
                        const wordStyle = getWordStyle(
                          lineWithStyle,
                          word as KaraokeLineWithStyle["words"][0],
                          lineIndex,
                          wordIndex,
                        );

                        return (
                          <KaraokeWord
                            key={wordIndex}
                            word={word as KaraokeLineWithStyle["words"][0]}
                            wordStyle={wordStyle}
                          />
                        );
                      })}
                    </div>
                  </DraggableLine>
                );
              } else {
                // Nếu không ở chế độ chỉnh sửa hoặc không có vị trí, sử dụng cấu trúc gốc
                return (
                  <div
                    key={lineIndex}
                    className={clsx(
                      !isActive && "opacity-0",
                      "absolute w-full flex flex-col mb-2.5 bottom-0 left-0",
                    )}
                    style={{
                      fontFamily: lineFontFamily,
                      fontSize: lineFontSize,
                      fontWeight: lineFontWeight,
                    }}
                  >
                    <div
                      className={clsx(
                        lineIndex % 2 === 0 ? "mb-40" : "mb-10 justify-end",
                        "px-14 w-full flex flex-wrap items-center",
                      )}
                      style={{ opacity }}
                    >
                      {countdown && (
                        <div className="countdown-container">
                          {[0, 1, 2].map((dotIndex) => {
                            const activeColor =
                              lineStyle.activeColor || DEFAULT_ACTIVE_COLOR;
                            const inactiveColor =
                              lineStyle.inactiveColor || DEFAULT_INACTIVE_COLOR;

                            return (
                              <div
                                key={dotIndex}
                                className={`countdown-dot ${
                                  dotStatus[dotIndex] ? "active" : ""
                                }`}
                                style={{
                                  backgroundColor: dotStatus[dotIndex]
                                    ? activeColor
                                    : inactiveColor,
                                }}
                              />
                            );
                          })}
                        </div>
                      )}

                      {line.words.map((word, wordIndex) => {
                        const wordStyle = getWordStyle(
                          lineWithStyle,
                          word as KaraokeLineWithStyle["words"][0],
                          lineIndex,
                          wordIndex,
                        );

                        return (
                          <KaraokeWord
                            key={wordIndex}
                            word={word as KaraokeLineWithStyle["words"][0]}
                            wordStyle={wordStyle}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </div>
      </DndContext>
    </>
  );
};
