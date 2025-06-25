import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { TextStyle } from "./types";
import { KaraokeEffectType } from "./components/KaraokeSubtitle/hooks/useKaraokeEffect";

// Định nghĩa kiểu dữ liệu cho subtitle karaoke
export interface KaraokeWord {
  word: string;
  startTime?: number; // Thời gian bắt đầu tính bằng frame
  endTime?: number; // Thời gian kết thúc tính bằng frame
}

export interface KaraokeLine {
  // Các thuộc tính hiện có
  startTime?: number;
  endTime?: number;
  words: Array<{
    word: string;
    startTime?: number;
    endTime?: number;
    style?: Partial<TextStyle>;
  }>;
  countDown?: boolean;
  style?: Partial<TextStyle>;
  // Thêm thuộc tính position
  position: {
    x: number;
    y: number;
  };
  effectType: KaraokeEffectType;
  idTab: string;
}

// Assuming TextStyle is already defined elsewhere
// If not, you'll need to define it as a Zod schema first
const TextStyleZ = z
  .object({
    // Define your TextStyle properties here
    // For example:
    // fontFamily: z.string().optional(),
    // fontSize: z.number().optional(),
    // color: z.string().optional(),
    // etc.
  })
  .partial();

// Define the position schema
const Position = z.object({
  x: z.number(),
  y: z.number(),
});

// Define the word schema
const Word = z.object({
  word: z.string(),
  startTime: z.number().optional(),
  endTime: z.number().optional(),
  style: TextStyleZ.optional(),
});

export const ID_TAB_DEFAULT = "S_1"; // Default tab ID
// Main schema
const KaraokeLineSchema = z.object({
  startTime: z.number().optional(),
  endTime: z.number().optional(),
  words: z.array(Word),
  countDown: z.boolean().optional(),
  style: TextStyleZ.optional(),
  position: Position,
  effectType: z
    .enum([
      "default", // Hiệu ứng mặc định - đổ màu từ trái sang phải
      "default_2", // Hiệu ứng mặc định phiên bản 2 - mượt hơn
      "gradient", // Hiệu ứng gradient
      "glow", // Hiệu ứng phát sáng
      "wave", // Hiệu ứng sóng
      "bounce", // Hiệu ứng nảy
      "3d", // Hiệu ứng 3D
    ])
    .default("default"),
  idTab: z.string().default(ID_TAB_DEFAULT),
});

// Schema cho VideoEditor
export const videoEditorSchema = z.object({
  // Thuộc tính cho nhạc nền (tùy chọn)
  audioSrc: z.string().optional(),

  // Thuộc tính cho nền
  backgroundType: z.enum(["image", "video", "color"]).default("color"),
  backgroundSrc: z.string().optional(),
  backgroundColor: zColor().default("#000000"),

  // Thuộc tính cho karaoke
  karaokeLines: z.array(KaraokeLineSchema),

  // Thuộc tính cho FPS
  fps: z.number().default(30),
});

// Các hằng số mặc định
export const DEFAULT_FONT_FAMILY = "'Be Vietnam Pro', sans-serif";
export const DEFAULT_FONT_SIZE = 60;
export const DEFAULT_FONT_WEIGHT = "700";
export const DEFAULT_ACTIVE_COLOR = "#ff0000";
export const DEFAULT_INACTIVE_COLOR = "#ffffff";
export const DEFAULT_SHADOW_COLOR = "rgba(0, 0, 0, 0.5)";
export const DEFAULT_TEXT_STROKE = "1px";
export const DEFAULT_TEXT_STROKE_COLOR = "#000000";
export const DEFAULT_FPS = 30;
export const HIGH_FPS = 60;
export const DEFAULT_POSITION = { x: 100, y: 300 };
export const DEFAULT_POSITION_EVEN = { x: 100, y: 500 };

// Dữ liệu karaoke mẫu cho 30 FPS
export const SAMPLE_KARAOKE_LINES: KaraokeLine[] = [
  {
    words: [
      { word: "Chào", startTime: 30, endTime: 60 },
      { word: "mừng", startTime: 60, endTime: 75 },
      { word: "đến", startTime: 75, endTime: 90 },
      { word: "với", startTime: 90, endTime: 120 },
      { word: "Karaoke", startTime: 120, endTime: 150 },
      { word: "Editor", startTime: 150, endTime: 180 },
    ],
    startTime: 30,
    endTime: 180,
    countDown: false,
    position: DEFAULT_POSITION,
    effectType: "default",
    idTab: "",
  },
  {
    words: [
      { word: "Tạo", startTime: 210, endTime: 230 },
      { word: "video", startTime: 230, endTime: 250 },
      { word: "tuyệt", startTime: 250, endTime: 270 },
      { word: "vời", startTime: 270, endTime: 290 },
    ],
    startTime: 210,
    endTime: 290,
    countDown: false,
    position: DEFAULT_POSITION_EVEN,
    effectType: "default",
    idTab: "",
  },
];

export function adjustKaraokeTimingForFps(
  karaokeLines: KaraokeLine[],
  fromFps: number,
  toFps: number,
): KaraokeLine[] {
  const ratio = toFps / fromFps;

  return karaokeLines.map((line) => ({
    words: line.words.map((word) => ({
      word: word.word,
      startTime: word?.startTime
        ? Math.round(word?.startTime * ratio)
        : undefined,
      endTime: word?.endTime ? Math.round(word?.endTime * ratio) : undefined,
    })),
    startTime: line?.startTime
      ? Math.round(line?.startTime * ratio)
      : undefined,
    endTime: line?.endTime ? Math.round(line?.endTime * ratio) : undefined,
    countDown: line.countDown,
    position: { ...line.position },
    effectType: line.effectType,
    idTab: line.idTab,
  }));
}
