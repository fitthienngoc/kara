// npx remotion render <entry-file> HelloWorld out/video.mp4

import { getInputProps, registerRoot } from "remotion";
import { RemotionRoot } from "./Root";
import React from "react";
import { VideoEditorApp } from "./VideoEditorApp";

// Kiểm tra xem có tham số URL "editor=true" không
const urlParams = new URLSearchParams(window.location.search);
const isEditorMode = urlParams.get("editor") === "true";

// Thêm thuộc tính vào body để CSS có thể nhận biết
if (isEditorMode) {
  document.body.setAttribute("data-remotion-editor", "true");
}

// Đăng ký Root component tùy thuộc vào chế độ
if (!isEditorMode) {
  const inputProps = getInputProps();

  registerRoot(() =>
    React.createElement(RemotionRoot, {
      durationInFrames: inputProps.durationInFrames as number,
    }),
  );
} else {
  registerRoot(() => React.createElement(VideoEditorApp));
}
