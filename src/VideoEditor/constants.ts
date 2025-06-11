import { z } from "zod";
import { zColor } from "@remotion/zod-types";

// Định nghĩa kiểu dữ liệu cho subtitle karaoke
export interface KaraokeWord {
  word: string;
  startTime: number; // Thời gian bắt đầu tính bằng frame
  endTime: number; // Thời gian kết thúc tính bằng frame
}

export interface KaraokeLine {
  words: KaraokeWord[];
  startTime: number;
  endTime: number;
}

// Schema cho VideoEditor
export const videoEditorSchema = z.object({
  // Thuộc tính cho nhạc nền (tùy chọn)
  audioSrc: z.string().optional(),
  
  // Thuộc tính cho nền
  backgroundType: z.enum(["image", "video", "color"]).default("color"),
  backgroundSrc: z.string().optional(),
  backgroundColor: zColor().default("#000000"),
  
  // Thuộc tính cho karaoke
  karaokeLines: z.array(
    z.object({
      words: z.array(
        z.object({
          word: z.string(),
          startTime: z.number(),
          endTime: z.number(),
        })
      ),
      startTime: z.number(),
      endTime: z.number(),
    })
  ),
  
  // Màu sắc cho karaoke
  activeWordColor: zColor(),
  inactiveWordColor: zColor(),
  
  // Font và kích thước cho karaoke
  fontFamily: z.string().default("Arial"),
  fontSize: z.number().default(40),
  
  // Thuộc tính cho FPS
  fps: z.number().default(30),
});

// Các hằng số mặc định
export const DEFAULT_FONT_FAMILY = "Arial, sans-serif";
export const DEFAULT_FONT_SIZE = 40;
export const DEFAULT_ACTIVE_COLOR = "#ff0000";
export const DEFAULT_INACTIVE_COLOR = "#ffffff";
export const DEFAULT_SHADOW_COLOR = "rgba(0, 0, 0, 0.5)";
export const DEFAULT_FPS = 30;
export const HIGH_FPS = 60;

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
  },
];

// Dữ liệu karaoke mẫu cho 60 FPS (thời gian nhân đôi để giữ nguyên thời lượng thực tế)
export const SAMPLE_KARAOKE_LINES_60FPS: KaraokeLine[] = [
  {
    words: [
      { word: "Chào", startTime: 60, endTime: 120 },
      { word: "mừng", startTime: 120, endTime: 150 },
      { word: "đến", startTime: 150, endTime: 180 },
      { word: "với", startTime: 180, endTime: 240 },
      { word: "Karaoke", startTime: 240, endTime: 300 },
      { word: "Editor", startTime: 300, endTime: 360 },
    ],
    startTime: 60,
    endTime: 360,
  },
  {
    words: [
      { word: "Tạo", startTime: 420, endTime: 460 },
      { word: "video", startTime: 460, endTime: 500 },
      { word: "tuyệt", startTime: 500, endTime: 540 },
      { word: "vời", startTime: 540, endTime: 580 },
    ],
    startTime: 420,
    endTime: 580,
  },
];

// Cập nhật mẫu karaoke cho 24 FPS (phong cách điện ảnh)
export const SAMPLE_KARAOKE_LINES_24FPS: KaraokeLine[] = [
  {
    words: [
      { word: "Phong", startTime: 24, endTime: 48 },
      { word: "cách", startTime: 48, endTime: 72 },
      { word: "điện", startTime: 72, endTime: 96 },
      { word: "ảnh", startTime: 96, endTime: 120 },
    ],
    startTime: 24,
    endTime: 120,
  },
  {
    words: [
      { word: "Video", startTime: 144, endTime: 168 },
      { word: "chất", startTime: 168, endTime: 192 },
      { word: "lượng", startTime: 192, endTime: 216 },
    ],
    startTime: 144,
    endTime: 216,
  },
];

// Hàm tiện ích để điều chỉnh thời gian karaoke theo FPS
export function adjustKaraokeTimingForFps(
  karaokeLines: KaraokeLine[],
  fromFps: number,
  toFps: number
): KaraokeLine[] {
  const ratio = toFps / fromFps;
  
  return karaokeLines.map(line => ({
    words: line.words.map(word => ({
      word: word.word,
      startTime: Math.round(word.startTime * ratio),
      endTime: Math.round(word.endTime * ratio),
    })),
    startTime: Math.round(line.startTime * ratio),
    endTime: Math.round(line.endTime * ratio),
  }));
}