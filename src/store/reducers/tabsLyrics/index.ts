import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TProjectCode } from "../projects/types";
import {
  DEFAULT_TEXT_SETTING,
  TSubtitleTab,
} from "../../../app/_components/components/VideoEditor/components/LyricsEditor";
import { ID_TAB_DEFAULT } from "../../../app/_components/components/VideoEditor/constants";

interface ITabState {
  activeTab: string;
  tabs: {
    [K in TProjectCode]: TSubtitleTab[];
  };
}

const initialState: ITabState = {
  activeTab: ID_TAB_DEFAULT,
  tabs: {
    kra1: [
      {
        id: ID_TAB_DEFAULT,
        name: "Singer 1",
        lines: [],
        lyricsText: "",
        textSettings: DEFAULT_TEXT_SETTING,
        effectType: "default", // Hiệu ứng mặc định
      },
    ],
    kra2: [],
  },
};

const TabsLyricsSlice = createSlice({
  name: "Tab",
  initialState,
  reducers: {
    setTab(
      state,
      action: PayloadAction<{ code: TProjectCode; tabs: TSubtitleTab[] }>,
    ) {
      const { code, tabs } = action.payload;
      state.tabs[code] = tabs;
    },
    setActiveTab(state, action: PayloadAction<string>) {
      state.activeTab = action.payload;
    },
  },
});

export const TabLyricsActions = TabsLyricsSlice.actions;

export default TabsLyricsSlice.reducer;
