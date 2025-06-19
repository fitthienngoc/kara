"use client";

import "../../styles/global.css";

import React from "react";
import { registerRoot, getInputProps } from "remotion";
import RemotionRoot from "./RemotionRoot";
import { loadAllFonts } from "../app/_components/components/VideoEditor/utils/fontLoader";

// Tải font trước khi render
(async () => {
  try {
    await loadAllFonts();
    console.log("Font đã được tải trước khi render");
  } catch (error) {
    console.error("Lỗi khi tải font:", error);
  }
})();

const inputProps = getInputProps();

registerRoot(() =>
  React.createElement(RemotionRoot, {
    durationInFrames: inputProps.durationInFrames as number,
    width: inputProps.width as number,
    height: inputProps.height as number,
  }),
);
