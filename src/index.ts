import "./index.css";
import { registerRoot } from "remotion";

import React from "react";
import AppRouter from "./AppRouters";

// Kiểm tra xem có đang chạy trong Electron không
const isElectron = window && window.process && window.process.type;

// Nếu đang chạy trong Electron, cấu hình @electron/remote
if (isElectron) {
  const { remote } = window.require("@electron/remote");
  window.electronRemote = remote;
}

registerRoot(() => React.createElement(AppRouter));
