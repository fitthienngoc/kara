import React from "react";
import { useCurrentFrame } from "remotion";
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
            // Xác định xem từ hiện tại có đang được hát hay không
            const isActive = frame >= word.startTime && frame <= word.endTime;
            
            return (
              <span 
                key={wordIndex} 
                className="mr-2 inline-block"
                style={{ color: isActive ? activeWordColor : inactiveWordColor }}
              >
                {word.word}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};