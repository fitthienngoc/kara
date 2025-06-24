import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TProject, TProjectCode, TProjectWithKey } from "./types";
import { v4 as uuidv4 } from "uuid";

interface IProjectsState {
  projects: Record<string, TProject<TProjectWithKey>>;
}

const initialState: IProjectsState = {
  projects: {
    kra1: {
      code: "kra1",
      width: 1280,
      height: 720,
      backgroundType: "video",
      backgroundSrc: "",
      backgroundColor: "#000000",
      audioSrc: "",
      karaokeLines: [],
      fps: 30,
      durationInFrames: 300,
    },
    kra2: {
      code: "kra2",
      width: 1280,
      height: 720,
      element: [],
      audioSrc: "",
      karaokeLines: [],
      fps: 30,
      durationInFrames: 300,
    },
  },
};

const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    setProjects(state, action: PayloadAction<TProject<TProjectWithKey>>) {
      if (state.projects[action.payload.code]) {
        state.projects[action.payload.code] = action.payload;
        return;
      }
      state.projects = {
        ...state.projects,
        [action.payload.code]: action.payload,
      };
    },
    createNewProject(state, action: PayloadAction<TProjectCode>) {
      switch (action.payload) {
        case "kra1":
          const kra1Project = initialState.projects.kra1;
          const kra1ProjectKey = uuidv4();
          state.projects = {
            ...state.projects,
            [kra1ProjectKey]: kra1Project,
          };
          break;
        case "kra2":
          const kra2Project = initialState.projects.kra2;
          const kra2ProjectKey = uuidv4();
          state.projects = {
            ...state.projects,
            [kra2ProjectKey]: kra2Project,
          };
          break;
        default:
          break;
      }
    },
  },
});

export const projectsActions = projectsSlice.actions;

export default projectsSlice.reducer;
