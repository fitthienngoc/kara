import { combineReducers } from "@reduxjs/toolkit";
import { projectsSlice, tabsLyricsSlice } from "./reducers";

const rootReducer = combineReducers({
  projects: projectsSlice,
  tabsLyrics: tabsLyricsSlice,
});

export default rootReducer;
