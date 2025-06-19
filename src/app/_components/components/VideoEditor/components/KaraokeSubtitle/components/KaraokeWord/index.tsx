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
    return (
      <span
        className={wordStyle.containerClassName}
        style={wordStyle.containerStyle}
        data-text={word.word}
      >
        {word.word}
        {wordStyle.renderHighlight && (
          <span
            className={wordStyle.highlightClassName}
            style={wordStyle.highlightStyle}
          >
            {word.word}
          </span>
        )}
      </span>
    );
  },
);

KaraokeWord.displayName = "KaraokeWord";
