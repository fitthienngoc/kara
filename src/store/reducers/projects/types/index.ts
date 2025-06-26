import { KaraokeLine } from "../../../../constants";

export type TProjectCode = "kra1" | "kra2";

export type TKra1 = {
  width: number;
  height: number;
  backgroundType: "video" | "image" | "color";
  backgroundSrc: string;
  backgroundColor: string;
  audioSrc: string;
  karaokeLines: KaraokeLine[];
  fps: number;
  durationInFrames: number;
};
export type TKra2 = {
  width: number;
  height: number;
  element: [];
  audioSrc: string;
  karaokeLines: KaraokeLine[];
  fps: number;
  durationInFrames: number;
};

export type TProjectWithKey = TKra1 | TKra2;

export type TProject<TProjectWithKey> = TProjectWithKey & {
  code: TProjectCode;
};
