import { KaraokeLine } from "../../../../constants";

// Định nghĩa cấu trúc style cho text
export interface TextStyle {
  activeColor: string;
  inactiveColor: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  textStroke: string;
  textStrokeColor: string;
}

// Định nghĩa cấu trúc settings cho text trong UI
export interface TextSettings {
  activeWordColor: string;
  inactiveWordColor: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  textStroke: string;
  textStrokeColor: string;
}

// Mở rộng từ KaraokeLine để thêm style
export interface KaraokeLineWithStyle extends KaraokeLine {
  style?: TextStyle;
  words: {
    word: string;
    startTime: number;
    endTime: number;
    style?: TextStyle;
  }[];
}

// Hàm chuyển đổi từ TextSettings sang TextStyle
export function textSettingsToStyle(settings: TextSettings): TextStyle {
  return {
    activeColor: settings.activeWordColor,
    inactiveColor: settings.inactiveWordColor,
    fontFamily: settings.fontFamily,
    fontSize: settings.fontSize,
    fontWeight: settings.fontWeight,
    textStroke: settings.textStroke,
    textStrokeColor: settings.textStrokeColor,
  };
}
// Hàm chuyển đổi từ TextStyle sang TextSettings
export function textStyleToSettings(
  style: TextStyle,
  defaultSettings: TextSettings,
): TextSettings {
  return {
    activeWordColor: style.activeColor || defaultSettings.activeWordColor,
    inactiveWordColor: style.inactiveColor || defaultSettings.inactiveWordColor,
    fontFamily: style.fontFamily || defaultSettings.fontFamily,
    fontSize: style.fontSize || defaultSettings.fontSize,
    fontWeight: style.fontWeight || defaultSettings.fontWeight,
    textStroke: style.textStroke || defaultSettings.textStroke,
    textStrokeColor: style.textStrokeColor || defaultSettings.textStrokeColor,
  };
}
