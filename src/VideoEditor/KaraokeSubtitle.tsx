import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { KaraokeLine } from "./constants";

interface KaraokeSubtitleProps {
  lines: KaraokeLine[];
  activeWordColor: string;
  inactiveWordColor: string;
  fontFamily: string;
  fontSize: number;
}

export const KaraokeSubtitle: React.FC<KaraokeSubtitleProps> = ({
  lines,
  activeWordColor,
  inactiveWordColor,
  fontFamily,
  fontSize,
}) => {
  const frame = useCurrentFrame();

  // Tìm các dòng hiện tại đang được hiển thị
  const currentLines = lines.filter(
    (line) => frame >= line.startTime && frame <= line.endTime
  );

  return (
    <div 
      className="absolute bottom-[120px] w-full flex flex-col items-center justify-center px-5" 
      style={{ 
        fontFamily, 
        fontSize, 
        textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)" 
      }}
    >
      {currentLines.map((line, lineIndex) => (
        <div key={lineIndex} className="mb-2.5 w-full flex flex-wrap justify-center">
          {line.words.map((word, wordIndex) => {
            // Sử dụng interpolate để làm mượt chuyển động
            const progress = interpolate(
              frame,
              [word.startTime, word.endTime],
              [0, 100],
              {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp'
              }
            );

            return (
              <span 
                key={wordIndex} 
                className="mr-2 inline-block relative"
              >
                {/* Lớp chữ không active ở dưới */}
                <span 
                  style={{ 
                    color: inactiveWordColor,
                    position: 'relative',
                  }}
                >
                  {word.word}
                </span>
                
                {/* Lớp chữ active ở trên, được clip theo tiến độ */}
                <span 
                  style={{
                    color: activeWordColor,
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    clipPath: `inset(0 ${100 - progress}% 0 0)`,
                    WebkitClipPath: `inset(0 ${100 - progress}% 0 0)`,
                    // Loại bỏ transition để Remotion kiểm soát hoàn toàn việc chuyển frame
                  }}
                >
                  {word.word}
                </span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};