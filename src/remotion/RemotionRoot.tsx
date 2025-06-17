"use client";

import { Composition } from "remotion";

import {
  DEFAULT_FPS,
  SAMPLE_KARAOKE_LINES,
} from "../app/_components/components/VideoEditor/constants";
import { VideoEditor } from "../app/_components/components/VideoEditor/VideoEditor";

// Each <Composition> is an entry in the sidebar!
export const ID_KARAOKE_VIDEO_EDITOR = "KaraokeVideoEditor";

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
        id={ID_KARAOKE_VIDEO_EDITOR}
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
