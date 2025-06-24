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

    // Kiểm tra nếu đang sử dụng hiệu ứng default_2
    const isDefault2Effect = containerClassName.includes(
      "karaoke-default-2-container",
    );

    // Trường hợp hiệu ứng mượt default_2
    if (isDefault2Effect && renderHighlight) {
      return (
        <span
          className={containerClassName}
          style={containerStyle}
          data-text={word.word}
        >
          {/* Chữ nền */}
          <span className="karaoke-default-2-text">{word.word}</span>

          {/* Phần highlight với hiệu ứng mượt hơn */}
          <span className={highlightClassName} style={highlightStyle}>
            {word.word}

            {/* Thêm hiệu ứng glow ở biên chuyển tiếp */}
            <span
              className="karaoke-default-2-progress"
              style={{ width: highlightStyle?.width }}
            />
          </span>
        </span>
      );
    }

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
