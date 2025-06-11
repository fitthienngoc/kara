import "./index.css";
import { Composition } from "remotion";

import { VideoEditor } from "./VideoEditor/VideoEditor";
import {
  videoEditorSchema,
  DEFAULT_ACTIVE_COLOR,
  DEFAULT_INACTIVE_COLOR,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  SAMPLE_KARAOKE_LINES,
  SAMPLE_KARAOKE_LINES_60FPS,
  DEFAULT_FPS,
  HIGH_FPS
} from "./VideoEditor/constants";

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Composition cho VideoEditor với nền màu đơn giản (30 FPS) */}
      <Composition
        id="KaraokeVideoEditor30FPS"
        component={VideoEditor}
        durationInFrames={300}
        fps={DEFAULT_FPS}
        width={1920}
        height={1080}
        schema={videoEditorSchema}
        defaultProps={{
          backgroundType: "color" as const,
          backgroundColor: "#121212",
          karaokeLines: SAMPLE_KARAOKE_LINES,
          activeWordColor: DEFAULT_ACTIVE_COLOR,
          inactiveWordColor: DEFAULT_INACTIVE_COLOR,
          fontFamily: DEFAULT_FONT_FAMILY,
          fontSize: DEFAULT_FONT_SIZE,
          fps: DEFAULT_FPS,
        }}
      />

      {/* Composition cho VideoEditor với nền gradient (60 FPS) */}
      <Composition
        id="KaraokeVideoEditor60FPS"
        component={VideoEditor}
        durationInFrames={600} // Tăng gấp đôi để giữ nguyên thời lượng thực tế của video
        fps={HIGH_FPS}
        width={1920}
        height={1080}
        schema={videoEditorSchema}
        defaultProps={{
          backgroundType: "color" as const,
          backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          karaokeLines: SAMPLE_KARAOKE_LINES_60FPS,
          activeWordColor: "#ffff00",
          inactiveWordColor: "#ffffff",
          fontFamily: "Georgia, serif",
          fontSize: 48,
          fps: HIGH_FPS,
        }}
      />

      {/* Composition cho VideoEditor với FPS tùy chỉnh (24 FPS - phong cách điện ảnh) */}
      <Composition
        id="KaraokeVideoEditor24FPS"
        component={VideoEditor}
        durationInFrames={240} // Điều chỉnh để giữ nguyên thời lượng thực tế (8 giây)
        fps={24}
        width={1920}
        height={1080}
        schema={videoEditorSchema}
        defaultProps={{
          backgroundType: "color" as const,
          backgroundColor: "#000000",
          karaokeLines: [
            {
              words: [
                { word: "Cinematic", startTime: 24, endTime: 48 },
                { word: "24 FPS", startTime: 48, endTime: 72 },
                { word: "Karaoke", startTime: 72, endTime: 96 },
                { word: "Experience", startTime: 96, endTime: 120 },
              ],
              startTime: 24,
              endTime: 120,
            },
            {
              words: [
                { word: "Film", startTime: 144, endTime: 168 },
                { word: "Style", startTime: 168, endTime: 192 },
                { word: "Video", startTime: 192, endTime: 216 },
              ],
              startTime: 144,
              endTime: 216,
            },
          ],
          activeWordColor: "#e5a00d", // Màu vàng phong cách phim
          inactiveWordColor: "#cccccc",
          fontFamily: "'Times New Roman', serif", // Font kiểu cổ điển
          fontSize: 56,
          fps: 24,
        }}
      />

      {/* Nút chuyển đến giao diện editor */}
      <div className="fixed bottom-4 right-4 z-50">
        <a 
          href="/?editor=true" 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        >
          Open Full Editor
        </a>
      </div>
    </>
  );
};