import { useMemo } from "react";
import {
  DEFAULT_ACTIVE_COLOR,
  DEFAULT_INACTIVE_COLOR,
  DEFAULT_TEXT_STROKE,
  DEFAULT_TEXT_STROKE_COLOR,
} from "../../../../../../../constants";
import { KaraokeLineWithStyle, TextStyle } from "../../../types";

export type KaraokeEffectType =
  | "default" // Hiệu ứng mặc định - đổ màu từ trái sang phải
  | "gradient" // Hiệu ứng gradient
  | "glow" // Hiệu ứng phát sáng
  | "wave" // Hiệu ứng sóng
  | "bounce" // Hiệu ứng nảy
  | "3d"; // Hiệu ứng 3D

interface UseKaraokeEffectProps {
  frame: number;
  lines: KaraokeLineWithStyle[];
  setLines?: (lines: KaraokeLineWithStyle[]) => void;
  fps?: number;
}

export interface KaraokeWordStyle {
  containerClassName: string;
  containerStyle?: React.CSSProperties;
  highlightClassName?: string;
  highlightStyle?: React.CSSProperties;
  cssStyles: string;
  renderHighlight: boolean;
}

export const useKaraokeEffect = ({
  frame,
  lines,
  setLines,
}: UseKaraokeEffectProps) => {
  // Tạo CSS styles dựa trên loại hiệu ứng cho từng dòng
  const cssStyles = useMemo(() => {
    let styles = "";

    // Style chung cho tất cả các từ
    styles += `
      .karaoke-word {
        position: relative;
        white-space: nowrap;
        will-change: transform;
        backface-visibility: hidden;
        -webkit-font-smoothing: subpixel-antialiased;
      }
    `;

    // Hiệu ứng default: highlight bằng ::after
    styles += `
      .karaoke-default-effect {
        position: relative;
        color: ${DEFAULT_INACTIVE_COLOR};
        text-shadow: 0 0 3px rgba(0,0,0,1);
      }
      .karaoke-default-effect::after {
        content: attr(data-text);
        position: absolute;
        left: 0;
        top: 0;
        color: ${DEFAULT_ACTIVE_COLOR};
        overflow: hidden;
        width: var(--karaoke-progress, 0%);
        text-shadow: 0 0 3px rgba(255,255,255,1);
        pointer-events: none;
        white-space: nowrap;
        transition: width 0.15s linear; // Thêm dòng này để mượt hơn
      }
`;
    // gradient
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
        will-change: background-position;
      }
    `;

    // glow
    styles += `
      @keyframes glow {
        0% { text-shadow: 0 0 2px rgba(255, 255, 255, 0.5); }
        50% { text-shadow: 0 0 8px rgba(255, 255, 255, 0.8), 0 0 15px var(--glow-color, #ffcc00); }
        100% { text-shadow: 0 0 2px rgba(255, 255, 255, 0.5); }
      }
      
      .karaoke-glow {
        animation: glow 1.5s infinite;
        will-change: text-shadow;
      }
    `;

    // wave
    styles += `
      @keyframes wave {
        0%, 100% { transform: translateY(0); }
        25% { transform: translateY(-5px); }
        75% { transform: translateY(5px); }
      }
      
      .karaoke-wave-animation {
        animation: wave 2s infinite;
        will-change: transform;
      }
    `;

    // bounce
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
        will-change: transform, opacity;
      }
    `;

    // 3d
    styles += `
      .karaoke-3d {
        transform: perspective(500px) rotateX(5deg);
        transform-style: preserve-3d;
      }
      
      .karaoke-3d-inactive {
        text-shadow: 0 1px 0 #ccc, 0 2px 0 #c9c9c9, 0 3px 0 #bbb, 0 4px 0 #b9b9b9, 0 5px 0 #aaa, 
                    0 6px 1px rgba(0,0,0,.1), 0 0 5px rgba(0,0,0,.1), 0 1px 3px rgba(0,0,0,.3), 
                    0 3px 5px rgba(0,0,0,.2), 0 5px 10px rgba(0,0,0,.25), 0 10px 10px rgba(0,0,0,.2), 
                    0 20px 20px rgba(0,0,0,.15);
      }
      
      .karaoke-3d-active {
        text-shadow: 0 1px 0 var(--active-color-shadow, #fff), 
                    0 2px 0 var(--active-color-shadow, #fff), 
                    0 3px 0 var(--active-color-shadow, #fff), 
                    0 4px 0 var(--active-color-shadow, #fff), 
                    0 5px 0 var(--active-color-shadow, #fff),
                    0 6px 1px rgba(255,255,255,.1), 
                    0 0 5px rgba(255,255,255,.1), 
                    0 1px 3px rgba(255,255,255,.3),
                    0 3px 5px rgba(255,255,255,.2), 
                    0 5px 10px rgba(255,255,255,.25), 
                    0 10px 10px rgba(255,255,255,.2),
                    0 20px 20px rgba(255,255,255,.15);
      }
    `;

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

        // Tính toán màu glow dựa trên active color
        const activeColorRgb = hexToRgb(activeColor);
        const glowColor = activeColorRgb
          ? `rgba(${activeColorRgb.r}, ${activeColorRgb.g}, ${activeColorRgb.b}, 0.8)`
          : "#ffcc00";

        // Tính toán màu shadow cho hiệu ứng 3D
        const shadowColor = activeColor === "#ffffff" ? "#fff" : activeColor;

        // Style riêng cho từng từ
        styles += `
          .word-${wordKey} {
            color: ${inactiveColor};
            -webkit-text-stroke: ${wordTextStroke} ${wordTextStrokeColor};
            text-shadow: 0 0 1px rgba(0,0,0,0.3);
          }
          
          .word-${wordKey}-active {
            color: ${activeColor};
            -webkit-text-stroke: ${wordTextStroke} ${wordTextStrokeColor};
            text-shadow: 0 0 1px rgba(0,0,0,0.3);
          }
          
          .word-${wordKey}-glow {
            --glow-color: ${glowColor};
          }
          
          .word-${wordKey}-3d {
            --active-color-shadow: ${shadowColor};
          }

          @keyframes glow-${wordKey} {
            0% { text-shadow: 0 0 2px rgba(255, 255, 255, 0.5); }
            50% { text-shadow: 0 0 8px rgba(255, 255, 255, 0.8), 0 0 15px ${glowColor}; }
            100% { text-shadow: 0 0 2px rgba(255, 255, 255, 0.5); }
          }
          
          .word-${wordKey}-glow-animation {
            animation: glow-${wordKey} 1.5s infinite;
          }
        `;
      });
    });

    return styles;
  }, [lines]);

  // Tạo style cho từng từ dựa trên loại hiệu ứng của dòng
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

    // Lấy effectType từ line
    const effectType = line.effectType || "default";

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

    // Tính toán tiến độ hoàn thành của từ hiện tại
    let progress = 0;
    if (word.startTime !== undefined && word.endTime !== undefined) {
      if (frame > word.endTime) {
        progress = 1; // 100%
      } else if (frame >= word.startTime) {
        const duration = word.endTime - word.startTime;
        progress = duration > 0 ? (frame - word.startTime) / duration : 1;
      }
    }

    // Xác định xem có cần render phần highlight không
    let renderHighlight = false;

    // Style cơ bản cho container
    const baseContainerClassName = `karaoke-word word-${wordKey} mr-2 inline-block`;

    // Tùy chỉnh style dựa trên loại hiệu ứng
    switch (effectType) {
      case "default":
        return {
          containerClassName: `${baseContainerClassName} karaoke-default-effect`,
          containerStyle: {
            ["--karaoke-progress" as string]: isCompleted
              ? "100%"
              : `${progress * 100}%`,
          },
          cssStyles,
          renderHighlight: false, // Không cần render highlight span nữa
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
        // Với glow, chỉ áp dụng hiệu ứng cho từ hiện tại và sử dụng active color
        return {
          containerClassName: `${baseContainerClassName} ${
            isCurrentWord
              ? `word-${wordKey}-active word-${wordKey}-glow word-${wordKey}-glow-animation`
              : isCompleted
                ? `word-${wordKey}-active`
                : ""
          }`,
          containerStyle: isCurrentWord ? { color: activeColor } : undefined,
          cssStyles,
          renderHighlight: false,
        };

      case "wave":
        // Với wave, áp dụng animation và active color cho từ hiện tại
        return {
          containerClassName: `${baseContainerClassName} ${
            isCompleted ? `word-${wordKey}-active` : ""
          } ${isCurrentWord ? "karaoke-wave-animation" : ""}`,
          containerStyle: {
            color: isCurrentWord ? activeColor : undefined,
            animationDelay: `${wordIndex * 0.1}s`,
          },
          cssStyles,
          renderHighlight: false,
        };

      case "bounce":
        // Với bounce, áp dụng animation khi từ bắt đầu và active color
        return {
          containerClassName: `${baseContainerClassName} ${
            isJustStarted ? "karaoke-bounce" : ""
          } ${isCurrentWord || isCompleted ? `word-${wordKey}-active` : ""}`,
          // Thêm active color ngay khi từ bắt đầu
          containerStyle:
            isJustStarted || isCurrentWord ? { color: activeColor } : undefined,
          cssStyles,
          renderHighlight: false,
        };

      case "3d":
        // Với 3D, áp dụng hiệu ứng và active color cho tất cả các từ
        return {
          containerClassName: `${baseContainerClassName} karaoke-3d ${
            isCurrentWord || isCompleted
              ? `karaoke-3d-active word-${wordKey}-active word-${wordKey}-3d`
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
          highlightStyle: {
            width: isCompleted ? "100%" : `${progress * 100}%`,
          },
          cssStyles,
          renderHighlight,
        };
    }
  };

  // Thêm hàm để cập nhật hiệu ứng cho tất cả các dòng
  const updateLinesEffects = () => {
    if (!setLines) return;

    // Tạo bản sao của lines để cập nhật
    const updatedLines = [...lines].map((line) => {
      // Thực hiện xử lý cho từng dòng dựa trên line.effectType
      // Có thể thêm logic tùy chỉnh ở đây nếu cần

      return {
        ...line,
        // Có thể thêm các thuộc tính mới hoặc cập nhật thuộc tính hiện có
      };
    });

    // Cập nhật lines với bản sao đã được xử lý
    setLines(updatedLines);
  };

  return {
    cssStyles,
    getWordStyle,
    updateLinesEffects,
  };
};

// Hàm hỗ trợ chuyển đổi màu hex sang RGB
function hexToRgb(hex: string) {
  // Kiểm tra hex có hợp lệ không
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}
