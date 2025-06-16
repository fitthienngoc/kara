// npx remotion render <entry-file> HelloWorld out/video.mp4
import React from "react";
import "./index.css";
import { registerRoot, getInputProps } from "remotion";
import { RemotionRoot } from "./pages";

const inputProps = getInputProps();

registerRoot(() =>
  React.createElement(RemotionRoot, {
    durationInFrames: inputProps.durationInFrames as number,
  }),
);
