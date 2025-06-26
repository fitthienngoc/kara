import { TabLyricsActions } from "../../../../../../../store/reducers/tabsLyrics";
import {
  useAppDispatch,
  useAppSelector,
} from "../../../../../../../store/store";

export const useCurrentTiming = () => {
  const dispatch = useAppDispatch();

  const currentUnixIdActiveLine = useAppSelector(
    (state) => state.tabsLyrics.currentUnixIdActiveLine,
  );

  const currentLineIndex = useAppSelector((state) => {
    const index = state.projects.projects.kra1?.karaokeLines.findIndex(
      ({ unixId = undefined }) => currentUnixIdActiveLine === unixId,
    );
    if (index > -1) {
      return index;
    }
    return null;
  });

  const currentWordIndex = useAppSelector(
    (state) => state.tabsLyrics.currentWordIndex,
  );

  const setCurrentWordIndex = (newI: number) => {
    dispatch(TabLyricsActions.setCurrentWordIndex(newI));
  };
  const setCurrentUnixIdActiveLine = (id?: string) => {
    dispatch(TabLyricsActions.setCurrentUnixIdActiveLine(id));
  };

  return {
    currentLineIndex,
    currentWordIndex,
    setCurrentWordIndex,
    setCurrentUnixIdActiveLine,
  };
};
