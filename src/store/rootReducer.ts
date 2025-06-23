import { combineReducers } from '@reduxjs/toolkit';
import { projectsSlice } from './reducers';


const rootReducer = combineReducers({
    projects: projectsSlice,
});

export default rootReducer;