import "./index.css";
import { Composition } from "remotion";

import { VideoEditor } from "./VideoEditor/VideoEditor";
import { SAMPLE_KARAOKE_LINES, DEFAULT_FPS } from "./VideoEditor/constants";

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="KaraokeVideoEditor"
        component={VideoEditor}
        durationInFrames={300}
        fps={DEFAULT_FPS}
        width={1920}
        height={1080}
        defaultProps={{
          backgroundType: "color",
          backgroundColor: "#121212",
          karaokeLines: SAMPLE_KARAOKE_LINES,
          fps: DEFAULT_FPS,
        }}
      />
    </>
  );
};
