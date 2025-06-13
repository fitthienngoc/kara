import "./index.css";
import { Composition } from "remotion";

import { VideoEditor } from "./VideoEditor/VideoEditor";
import {
  videoEditorSchema,
  SAMPLE_KARAOKE_LINES,
  DEFAULT_FPS,
} from "./VideoEditor/constants";

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Composition cho VideoEditor với nền màu đơn giản (30 FPS) */}
      <Composition
        id="KaraokeVideoEditor"
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
          fps: DEFAULT_FPS,
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
