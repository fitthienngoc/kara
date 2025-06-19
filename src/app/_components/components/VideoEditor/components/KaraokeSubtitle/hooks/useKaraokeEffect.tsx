import { useMemo } from "react";
import {
  DEFAULT_ACTIVE_COLOR,
  DEFAULT_INACTIVE_COLOR,
  DEFAULT_TEXT_STROKE,
  DEFAULT_TEXT_STROKE_COLOR,
} from "../../../constants";
import { KaraokeLineWithStyle, TextStyle } from "../../../types";

export type KaraokeEffectType =
  | "default" // Hiệu ứng mặc định - đổ màu từ trái sang phải
  | "gradient" // Hiệu ứng gradient
  | "glow" // Hiệu ứng phát sáng
  | "wave" // Hiệu ứng sóng
  | "bounce" // Hiệu ứng nảy
  | "3d"; // Hiệu ứng 3D

interface UseKaraokeEffectProps {
  effectType?: KaraokeEffectType;
  frame: number;
  lines: KaraokeLineWithStyle[];
  fps?: number;
}

interface KaraokeWordStyle {
  containerClassName: string;
  containerStyle?: React.CSSProperties;
  highlightClassName?: string;
  highlightStyle?: React.CSSProperties;
  cssStyles: string;
  // Thêm thuộc tính để xác định có render phần highlight hay không
  renderHighlight: boolean;
}

export const useKaraokeEffect = ({
  effectType = "default",
  frame,
  lines,
  fps = 30,
}: UseKaraokeEffectProps) => {
  // Tạo CSS styles dựa trên loại hiệu ứng
  const cssStyles = useMemo(() => {
    let styles = "";

    // Style chung cho tất cả các từ
    styles += `
      .karaoke-word {
        position: relative;
        white-space: nowrap;
      }
    `;

    // Thêm style dựa trên loại hiệu ứng
    switch (effectType) {
      case "default":
        styles += `
          .karaoke-default-highlight {
            position: absolute;
            left: 0;
            top: 0;
            overflow: hidden;
            white-space: nowrap;
            width: 0;
          }
          
          @keyframes fill-text {
            from { width: var(--start-width, 0%); }
            to { width: var(--end-width, 100%); }
          }
          
          .karaoke-filling {
            animation: fill-text var(--duration, 1s) linear forwards;
          }
          
          .karaoke-filled {
            width: 100%;
          }
        `;
        break;

      case "gradient":
        styles += `
          @keyframes gradient-move {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          .karaoke-gradient {
            background: linear-gradient(90deg, #ffffff, #ffcc00, #ff9900, #ffffff);
            background-size: 300% 100%;
            animation: gradient-move 3s ease infinite;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
        `;
        break;
      case "glow":
        styles += `
          @keyframes glow {
            0% { text-shadow: 0 0 2px rgba(255, 255, 255, 0.5); }
            50% { text-shadow: 0 0 8px rgba(255, 255, 255, 0.8), 0 0 15px #ffcc00; }
            100% { text-shadow: 0 0 2px rgba(255, 255, 255, 0.5); }
          }
          
          .karaoke-glow {
            animation: glow 1.5s infinite;
          }
        `;
        break;

      case "wave":
        styles += `
          @keyframes wave {
            0%, 100% { transform: translateY(0); }
            25% { transform: translateY(-5px); }
            75% { transform: translateY(5px); }
          }
        `;
        break;
      case "bounce":
        styles += `
          @keyframes bounce-in {
            0% { transform: scale(0.8); opacity: 0; }
            40% { transform: scale(1.2); opacity: 1; }
            60% { transform: scale(0.9); opacity: 1; }
            80% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          
          .karaoke-bounce {
            animation: bounce-in 0.5s forwards;
          }
        `;
        break;

      case "3d":
        styles += `
          .karaoke-3d {
            transform: perspective(500px) rotateX(5deg);
          }
          .karaoke-3d-inactive {
            text-shadow: 0 1px 0 #ccc, 0 2px 0 #c9c9c9, 0 3px 0 #bbb, 0 4px 0 #b9b9b9, 0 5px 0 #aaa, 
                        0 6px 1px rgba(0,0,0,.1), 0 0 5px rgba(0,0,0,.1), 0 1px 3px rgba(0,0,0,.3), 
                        0 3px 5px rgba(0,0,0,.2), 0 5px 10px rgba(0,0,0,.25), 0 10px 10px rgba(0,0,0,.2), 
                        0 20px 20px rgba(0,0,0,.15);
          }
          
          .karaoke-3d-active {
            text-shadow: 0 1px 0 #fff, 0 2px 0 #fff, 0 3px 0 #fff, 0 4px 0 #fff, 0 5px 0 #fff,
                        0 6px 1px rgba(255,255,255,.1), 0 0 5px rgba(255,255,255,.1), 0 1px 3px rgba(255,255,255,.3),
                        0 3px 5px rgba(255,255,255,.2), 0 5px 10px rgba(255,255,255,.25), 0 10px 10px rgba(255,255,255,.2),
                        0 20px 20px rgba(255,255,255,.15);
          }
        `;
        break;
    }

    // Tạo animation cho từng từ (chỉ cho hiệu ứng default)
    if (effectType === "default") {
      lines.forEach((line, lineIndex) => {
        line.words.forEach((word, wordIndex) => {
          const wordKey = `line${lineIndex}-word${wordIndex}`;

          if (
            word.startTime !== undefined &&
            word.endTime !== undefined &&
            frame >= word.startTime &&
            frame < word.endTime
          ) {
            const duration = word.endTime - word.startTime;
            const remainingDuration = (word.endTime - frame) / fps; // Chuyển đổi frame sang giây
            const progress = (frame - word.startTime) / duration;

            styles += `
              .word-${wordKey}-highlight {
                --start-width: ${progress * 100}%;
                --end-width: 100%;
                --duration: ${remainingDuration}s;
    }
            `;
          }
        });
      });
    }

    // Tạo style riêng cho từng từ
    lines.forEach((line, lineIndex) => {
      const lineStyle = line.style || ({} as Partial<TextStyle>);

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

        // Style riêng cho từng từ
        styles += `
          .word-${wordKey} {
            color: ${inactiveColor};
            -webkit-text-stroke: ${wordTextStroke} ${wordTextStrokeColor};
          }
          
          .word-${wordKey}-active {
            color: ${activeColor};
            -webkit-text-stroke: ${wordTextStroke} ${wordTextStrokeColor};
          }
        `;
      });
    });

    return styles;
  }, [effectType, frame, lines, fps]);

  // Tạo style cho từng từ dựa trên loại hiệu ứng
  const getWordStyle = (
    line: KaraokeLineWithStyle,
    word: KaraokeLineWithStyle["words"][0],
    lineIndex: number,
    wordIndex: number,
  ): KaraokeWordStyle => {
    const lineStyle = line.style || ({} as Partial<TextStyle>);
    const wordWithStyle = word as KaraokeLineWithStyle["words"][0];
    const wordStyle =
      wordWithStyle.style || lineStyle || ({} as Partial<TextStyle>);

    // Sử dụng style của từ/dòng nếu có, nếu không sử dụng giá trị mặc định
    const activeColor =
      wordStyle.activeColor || lineStyle.activeColor || DEFAULT_ACTIVE_COLOR;

    const wordKey = `line${lineIndex}-word${wordIndex}`;

    // Xác định trạng thái của từ
    const isCurrentWord =
      word.startTime !== undefined &&
      word.endTime !== undefined &&
      frame >= word.startTime &&
      frame <= word.endTime;

    const isCompleted =
      word.startTime !== undefined &&
      word.endTime !== undefined &&
      frame > word.endTime;

    const isJustStarted =
      word.startTime !== undefined && Math.abs(frame - word.startTime) < 5; // 5 frames ~ 0.16s ở 30fps

    // Xác định xem có cần render phần highlight không
    let renderHighlight = false;

    // Style cơ bản cho container
    const baseContainerClassName = `karaoke-word word-${wordKey} mr-2 inline-block`;

    // Tùy chỉnh style dựa trên loại hiệu ứng
    switch (effectType) {
      case "default":
        renderHighlight = true;
        let highlightClassName = `word-${wordKey}-active karaoke-default-highlight word-${wordKey}-highlight`;

        if (isCurrentWord) {
          highlightClassName += " karaoke-filling";
        } else if (isCompleted) {
          highlightClassName += " karaoke-filled";
        }
        return {
          containerClassName: baseContainerClassName,
          highlightClassName: highlightClassName,
          highlightStyle: {},
          cssStyles,
          renderHighlight,
        };

      case "gradient":
        // Với gradient, chỉ áp dụng cho từ hiện tại hoặc đã hoàn thành
        return {
          containerClassName: `${baseContainerClassName} ${
            isCurrentWord || isCompleted
              ? `karaoke-gradient word-${wordKey}-active`
              : ""
          }`,
          cssStyles,
          renderHighlight: false,
        };

      case "glow":
        // Với glow, chỉ áp dụng hiệu ứng cho từ hiện tại
        return {
          containerClassName: `${baseContainerClassName} ${
            isCurrentWord
              ? `karaoke-glow word-${wordKey}-active`
              : isCompleted
                ? `word-${wordKey}-active`
                : ""
          }`,
          cssStyles,
          renderHighlight: false,
        };

      case "wave":
        // Với wave, áp dụng animation cho từ hiện tại
        return {
          containerClassName: `${baseContainerClassName} ${
            isCompleted ? `word-${wordKey}-active` : ""
          }`,
          containerStyle: {
            animation: isCurrentWord
              ? `wave 2s infinite ${wordIndex * 0.1}s`
              : "none",
            color: isCurrentWord ? activeColor : undefined,
          },
          cssStyles,
          renderHighlight: false,
        };

      case "bounce":
        // Với bounce, áp dụng animation khi từ bắt đầu
        return {
          containerClassName: `${baseContainerClassName} ${
            isJustStarted ? "karaoke-bounce" : ""
          } ${isCurrentWord || isCompleted ? `word-${wordKey}-active` : ""}`,
          cssStyles,
          renderHighlight: false,
        };

      case "3d":
        // Với 3D, áp dụng hiệu ứng cho tất cả các từ
        return {
          containerClassName: `${baseContainerClassName} karaoke-3d ${
            isCurrentWord || isCompleted
              ? `karaoke-3d-active word-${wordKey}-active`
              : "karaoke-3d-inactive"
          }`,
          cssStyles,
          renderHighlight: false,
        };

      default:
        renderHighlight = true;
        return {
          containerClassName: baseContainerClassName,
          highlightClassName: `word-${wordKey}-active karaoke-default-highlight`,
          highlightStyle: {},
          cssStyles,
          renderHighlight,
        };
    }
  };

  return {
    cssStyles,
    getWordStyle,
  };
};
