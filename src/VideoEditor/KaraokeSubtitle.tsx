import React from "react";
import { useCurrentFrame } from "remotion";
import {
  DEFAULT_ACTIVE_COLOR,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_FONT_WEIGHT,
  DEFAULT_INACTIVE_COLOR,
  DEFAULT_TEXT_STROKE,
  DEFAULT_TEXT_STROKE_COLOR,
  KaraokeLine,
} from "./constants";
import { KaraokeLineWithStyle, TextStyle } from "./types";
import clsx from "clsx";

interface KaraokeSubtitleProps {
  lines: KaraokeLine[];
}

export const KaraokeSubtitle: React.FC<KaraokeSubtitleProps> = ({ lines }) => {
  const frame = useCurrentFrame();
  // Thời gian hiển thị trước (tính bằng frames) - mặc định là 3 giây (90 frames ở 30fps)
  const previewFrames = 90;

  // Tìm các dòng hiện tại đang được hiển thị, bao gồm cả thời gian chuẩn bị
  const currentLines = lines.filter(
    (line) => line.startTime !== undefined && line.endTime !== undefined,
  );

  // Tạo style cho hiệu ứng karaoke
  const createKaraokeStyles = () => {
    let styles = "";

    // Tạo animation cho mỗi từ
    currentLines.forEach((line, lineIndex) => {
      const lineWithStyle = line as KaraokeLineWithStyle;
      const lineStyle = lineWithStyle.style || ({} as Partial<TextStyle>);

      line.words.forEach((word, wordIndex) => {
        const wordWithStyle = word as KaraokeLineWithStyle["words"][0];
        const wordStyle =
          wordWithStyle.style || lineStyle || ({} as Partial<TextStyle>);

        // Sử dụng style của từ/dòng nếu có, nếu không sử dụng giá trị mặc định
        const activeColor =
          wordStyle.activeColor ||
          lineStyle.activeColor ||
          DEFAULT_ACTIVE_COLOR;
        const inactiveColor =
          wordStyle.inactiveColor ||
          lineStyle.inactiveColor ||
          DEFAULT_INACTIVE_COLOR;
        const wordTextStroke =
          wordStyle.textStroke || lineStyle.textStroke || DEFAULT_TEXT_STROKE;
        const wordTextStrokeColor =
          wordStyle.textStrokeColor ||
          lineStyle.textStrokeColor ||
          DEFAULT_TEXT_STROKE_COLOR;

        const wordKey = `line${lineIndex}-word${wordIndex}`;

        const duration =
          word.startTime !== undefined && word.endTime !== undefined
            ? word.endTime - word.startTime
            : 0;

        if (
          duration > 0 &&
          word.startTime !== undefined &&
          word.endTime !== undefined &&
          frame >= word.startTime &&
          frame < word.endTime
        ) {
          const remainingDuration = (word.endTime - frame) / 60; // Chuyển đổi frame sang giây (giả sử 60fps)

          styles += `
            @keyframes highlight-${wordKey} {
              from { width: ${((frame - word.startTime) / duration) * 100}%; }
              to { width: 100%; }
            }
            
            .word-${wordKey}::after {
              animation: highlight-${wordKey} ${remainingDuration}s linear forwards;
            }
          `;
        }

        // Style riêng cho từng từ
        styles += `
          .word-${wordKey} {
            color: ${inactiveColor};
            -webkit-text-stroke: ${wordTextStroke} ${wordTextStrokeColor};
          }
          
          .word-${wordKey}::after {
            color: ${activeColor};
            -webkit-text-stroke: ${wordTextStroke} ${wordTextStrokeColor};
          }
        `;
      });
    });

    // Style chung cho tất cả các từ
    styles += `
      .karaoke-word {
        position: relative;
        white-space: nowrap;
      }
      
      .karaoke-word::after {
        content: attr(data-text);
        position: absolute;
        left: 0;
        top: 0;
        overflow: hidden;
        width: 0;
      }
      
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
    `;

    return styles;
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
      <style>{createKaraokeStyles()}</style>
      <div
        className="absolute h-full w-full flex flex-col items-center justify-center px-5"
        style={{
          fontFamily: DEFAULT_FONT_FAMILY,
          fontSize: DEFAULT_FONT_SIZE,
          fontWeight: DEFAULT_FONT_WEIGHT,
          textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div className="w-full h-full relative">
          {currentLines.map((line, lineIndex) => {
            const lineWithStyle = line as KaraokeLineWithStyle;
            const lineStyle = lineWithStyle.style || ({} as Partial<TextStyle>);

            // Sử dụng style của dòng nếu có, nếu không sử dụng giá trị mặc định
            const lineFontFamily = lineStyle.fontFamily || DEFAULT_FONT_FAMILY;
            const lineFontSize = lineStyle.fontSize || DEFAULT_FONT_SIZE;
            const lineFontWeight = lineStyle.fontWeight || DEFAULT_FONT_WEIGHT;

            const isPreview = frame < (line.startTime ?? 0);
            const opacity = isPreview ? 0.5 : 1;
            const dotStatus = getCountdownDotStatus(line);
            const countdown = line.countDown;
            const isActive =
              line.startTime !== undefined &&
              line.endTime !== undefined &&
              frame >= line.startTime - previewFrames &&
              frame <= line.endTime;

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
                                ? activeColor // Nếu active, dùng màu active
                                : inactiveColor, // Nếu không active, dùng màu inactive
                            }}
                          />
                        );
                      })}
                    </div>
                  )}

                  {line.words.map((word, wordIndex) => {
                    const wordWithStyle =
                      word as KaraokeLineWithStyle["words"][0];
                    const wordStyle =
                      wordWithStyle.style ||
                      lineStyle ||
                      ({} as Partial<TextStyle>);

                    // Sử dụng style của từ/dòng nếu có, nếu không sử dụng giá trị mặc định
                    const activeColor =
                      wordStyle.activeColor ||
                      lineStyle.activeColor ||
                      DEFAULT_ACTIVE_COLOR;

                    const wordKey = `line${lineIndex}-word${wordIndex}`;

                    // Xác định trạng thái của từ
                    let width = "0%";
                    if (
                      word.startTime !== undefined &&
                      word.endTime !== undefined
                    ) {
                      if (frame > word.endTime) {
                        width = "100%";
                      } else if (frame >= word.startTime) {
                        const duration = word.endTime - word.startTime;
                        width =
                          duration > 0
                            ? `${((frame - word.startTime) / duration) * 100}%`
                            : "100%";
                      }
                    }

                    return (
                      <span
                        key={wordIndex}
                        className={`karaoke-word word-${wordKey} mr-2 inline-block`}
                        data-text={word.word}
                      >
                        {word.word}
                        <span
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            color: activeColor,
                            overflow: "hidden",
                            width: width,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {word.word}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};
