import { TSubtitleTab } from "..";
import { TabLyricsActions } from "../../../../../../../store/reducers/tabsLyrics";
import {
  useAppDispatch,
  useAppSelector,
} from "../../../../../../../store/store";

export default function useTabs() {
  const dispatch = useAppDispatch();
  const activeTabId = useAppSelector((state) => state.tabsLyrics.activeTab);
  const setActiveTabId = (tabId: string) => {
    dispatch(TabLyricsActions.setActiveTab(tabId));
  };
  const tabs = useAppSelector((state) => state.tabsLyrics.tabs.kra1);

  const setTabs = (
    tabsUpdater:
      | TSubtitleTab[]
      | ((prevTabs: TSubtitleTab[]) => TSubtitleTab[]),
  ) => {
    if (typeof tabsUpdater === "function") {
      // Nếu là hàm updater
      const newTabs = tabsUpdater(tabs);
      dispatch(TabLyricsActions.setTab({ code: "kra1", tabs: newTabs }));
    } else {
      // Nếu là mảng tabs mới
      dispatch(TabLyricsActions.setTab({ code: "kra1", tabs: tabsUpdater }));
    }
  };

  return {
    activeTabId,
    setActiveTabId,
    tabs,
    setTabs,
  };
}
