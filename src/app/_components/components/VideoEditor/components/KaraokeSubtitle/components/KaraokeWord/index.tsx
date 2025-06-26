import { memo } from "react";
import { KaraokeLineWithStyle } from "../../../../types";
import { KaraokeWordStyle } from "../../hooks/useKaraokeEffect";

// Tạo một component con để hiển thị từng từ và tối ưu hóa re-render
export const KaraokeWord = memo(
  ({
    word,
    wordStyle,
  }: {
    word: KaraokeLineWithStyle["words"][0];
    wordStyle: KaraokeWordStyle;
  }) => {
    const {
      containerClassName,
      containerStyle,
      highlightClassName,
      highlightStyle,
      renderHighlight,
    } = wordStyle;

    // Trường hợp sử dụng hiệu ứng mặc định và các hiệu ứng khác
    return (
      <span
        className={containerClassName}
        style={containerStyle}
        data-text={word.word}
      >
        {word.word}
        {renderHighlight && (
          <span className={highlightClassName} style={highlightStyle}>
            {word.word}
          </span>
        )}
      </span>
    );
  },
);

KaraokeWord.displayName = "KaraokeWord";
