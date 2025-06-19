"use client";

import { Composition } from "remotion";
import { useEffect } from "react";
import { loadAllFonts } from "../app/_components/components/VideoEditor/utils/fontLoader";
import {
  DEFAULT_FPS,
  SAMPLE_KARAOKE_LINES,
} from "../app/_components/components/VideoEditor/constants";
import { VideoEditor } from "../app/_components/components/VideoEditor/VideoEditor";

// Component chuyên dụng để tải font
const FontLoader = () => {
  useEffect(() => {
    loadAllFonts();
  }, []);
  return null;
};

// Mỗi <Composition> là một mục trong sidebar!
export const ID_KARAOKE_VIDEO_EDITOR = "KaraokeVideoEditor";

const RemotionRoot = ({
  durationInFrames,
  height,
  width,
}: {
  durationInFrames: number;
  height: number;
  width: number;
}) => {
  return (
    <>
      {/* Thêm FontLoader để tải font trước khi render */}
      <FontLoader />

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
