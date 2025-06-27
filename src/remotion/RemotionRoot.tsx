"use client";

import { Composition } from "remotion";
import { useEffect } from "react";
import { loadAllFonts } from "../app/_components/components/VideoEditor/utils/fontLoader";
import {
  DEFAULT_FPS,
  ID_KARAOKE_VIDEO_EDITOR,
  SAMPLE_KARAOKE_LINES,
} from "../constants";
import { VideoEditor } from "../app/_components/components/VideoEditor/VideoEditor";

// Component chuyên dụng để tải font
const FontLoader = () => {
  useEffect(() => {
    loadAllFonts();
  }, []);
  return null;
};

// Mỗi <Composition> là một mục trong sidebar!

const RemotionRoot = ({
  durationInFrames,
  height,
  width,
  fps,
}: {
  durationInFrames: number;
  height: number;
  width: number;
  fps: number;
}) => {
  return (
    <>
      {/* Thêm FontLoader để tải font trước khi render */}
      <FontLoader />

      <Composition
        id={ID_KARAOKE_VIDEO_EDITOR}
        component={VideoEditor}
        durationInFrames={durationInFrames || DEFAULT_FPS * 10}
        fps={fps || DEFAULT_FPS}
        width={width}
        height={height}
        defaultProps={{
          backgroundType: "color",
          backgroundColor: "#121212",
          karaokeLines: SAMPLE_KARAOKE_LINES,
          fps: fps || DEFAULT_FPS,
        }}
      />
    </>
  );
};

export default RemotionRoot;
