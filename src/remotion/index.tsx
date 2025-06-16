"use client";

import "../../styles/global.css";

import React from "react";

import { registerRoot, getInputProps } from "remotion";
import RemotionRoot from "./RemotionRoot";

const inputProps = getInputProps();

registerRoot(() =>
  React.createElement(RemotionRoot, {
    durationInFrames: inputProps.durationInFrames as number,
  }),
);
