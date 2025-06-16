import { Composition } from "remotion";
import {
  DEFAULT_FPS,
  SAMPLE_KARAOKE_LINES,
} from "../../components/VideoEditor/constants";
import { VideoEditor } from "../../components/VideoEditor/VideoEditor";

// Each <Composition> is an entry in the sidebar!

const RemotionRoot = ({
  durationInFrames,
  height = 1080,
  width = 1920,
}: {
  durationInFrames: number;
  height?: number;
  width?: number;
}) => {
  return (
    <>
      <Composition
        id="KaraokeVideoEditor"
        component={VideoEditor}
        durationInFrames={durationInFrames || DEFAULT_FPS * 10}
        fps={DEFAULT_FPS}
        width={width}
        height={height}
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
export default RemotionRoot;
