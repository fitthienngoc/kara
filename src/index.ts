// npx remotion render <entry-file> HelloWorld out/video.mp4
import "./index.css";
import { registerRoot } from "remotion";

import React from "react";
import AppRouter from "./AppRouters";

registerRoot(() => React.createElement(AppRouter));
