import { TabLyricsActions } from "../../../../../../../store/reducers/tabsLyrics";
import {
  useAppDispatch,
  useAppSelector,
} from "../../../../../../../store/store";

export const useCurrentTiming = () => {
  const dispatch = useAppDispatch();
  const currentLineIndex = useAppSelector(
    (state) => state.tabsLyrics.currentLineIndex,
  );
  const currentWordIndex = useAppSelector(
    (state) => state.tabsLyrics.currentWordIndex,
  );

  const setCurrentLineIndex = (newI: number | null) => {
    dispatch(TabLyricsActions.setCurrentLineIndex(newI));
  };

  const setCurrentWordIndex = (newI: number) => {
    dispatch(TabLyricsActions.setCurrentWordIndex(newI));
  };
  const setCurrentUnixIdActiveLine = (id?: string) => {
    dispatch(TabLyricsActions.setCurrentUnixIdActiveLine(id));
  };

  return {
    currentLineIndex,
    setCurrentLineIndex,
    currentWordIndex,
    setCurrentWordIndex,
    setCurrentUnixIdActiveLine,
  };
};
