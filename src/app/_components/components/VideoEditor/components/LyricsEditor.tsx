import React, { useState, useEffect } from "react";
import {
  DEFAULT_ACTIVE_COLOR,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_FONT_WEIGHT,
  DEFAULT_INACTIVE_COLOR,
  DEFAULT_POSITION,
  DEFAULT_POSITION_EVEN,
  DEFAULT_TEXT_STROKE,
  DEFAULT_TEXT_STROKE_COLOR,
  ID_TAB_DEFAULT,
  KaraokeLine,
} from "../constants";
import { FONT_WEIGHTS } from "../constants/fonts";
import { KaraokeEffectType } from "../components/KaraokeSubtitle/hooks/useKaraokeEffect";
import { v4 as uuidv4 } from "uuid";
import { useAppDispatch, useAppSelector } from "../../../../../store/store";
import { TabLyricsActions } from "../../../../../store/reducers/tabsLyrics";
import DebugJsonPopup from "./DebugJsonPopup";

// Định nghĩa TextStyle với tên thuộc tính khớp với style trong KaraokeLineWithStyle
interface TextStyle {
  activeColor: string; // Tên thuộc tính trong style
  inactiveColor: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  textStroke: string;
  textStrokeColor: string;
}

// Mở rộng KaraokeLine để thêm style
interface KaraokeLineWithStyle extends KaraokeLine {
  style?: TextStyle;
  words: {
    word: string;
    startTime?: number;
    endTime?: number;
    style?: TextStyle;
  }[];
}

interface LyricsEditorProps {
  karaokeLines: KaraokeLine[];
  setKaraokeLines: React.Dispatch<React.SetStateAction<KaraokeLine[]>>;
  fps: number;
  fontOptions: { value: string; label: string }[];
  defaultTextSettings?: TextSettings; // Thêm prop này
}

interface TextSettings {
  activeWordColor: string; // Tên thuộc tính trong settings
  inactiveWordColor: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  textStroke: string;
  textStrokeColor: string;
}
export const DEFAULT_TEXT_SETTING: TextSettings = {
  activeWordColor: DEFAULT_ACTIVE_COLOR,
  inactiveWordColor: DEFAULT_INACTIVE_COLOR,
  fontFamily: DEFAULT_FONT_FAMILY,
  fontSize: DEFAULT_FONT_SIZE,
  fontWeight: DEFAULT_FONT_WEIGHT,
  textStroke: DEFAULT_TEXT_STROKE,
  textStrokeColor: DEFAULT_TEXT_STROKE_COLOR,
};

export interface TSubtitleTab {
  id: string;
  name: string;
  lines: SubtitleLine[];
  lyricsText: string;
  textSettings: TextSettings; // Cài đặt văn bản cho mỗi tab
  effectType: KaraokeEffectType; // Thêm hiệu ứng cho mỗi tab
}

interface SubtitleLine {
  id: number;
  countdown: boolean; // Checkbox S
  actor: string;
  content: string;
}

// Danh sách các hiệu ứng karaoke có sẵn
const KARAOKE_EFFECTS: { value: KaraokeEffectType; label: string }[] = [
  { value: "default", label: "Mặc định - Đổ màu từ trái sang phải" },
  { value: "default_2", label: "Mặc định 2 - Mượt hơn" },
  { value: "gradient", label: "Gradient - Hiệu ứng màu chuyển" },
  { value: "glow", label: "Glow - Hiệu ứng phát sáng" },
  { value: "wave", label: "Wave - Hiệu ứng sóng" },
  { value: "bounce", label: "Bounce - Hiệu ứng nảy" },
  { value: "3d", label: "3D - Hiệu ứng không gian" },
];

// Hàm chuyển đổi từ TextSettings sang TextStyle
const textSettingsToStyle = (settings: TextSettings): TextStyle => {
  return {
    activeColor: settings.activeWordColor,
    inactiveColor: settings.inactiveWordColor,
    fontFamily: settings.fontFamily,
    fontSize: settings.fontSize,
    fontWeight: settings.fontWeight,
    textStroke: settings.textStroke,
    textStrokeColor: settings.textStrokeColor,
  };
};

// Hàm chuyển đổi từ TextStyle sang TextSettings
const textStyleToSettings = (
  style: TextStyle,
  defaultSettings: TextSettings,
): TextSettings => {
  return {
    activeWordColor: style.activeColor || defaultSettings.activeWordColor,
    inactiveWordColor: style.inactiveColor || defaultSettings.inactiveWordColor,
    fontFamily: style.fontFamily || defaultSettings.fontFamily,
    fontSize: style.fontSize || defaultSettings.fontSize,
    fontWeight: style.fontWeight || defaultSettings.fontWeight,
    textStroke: style.textStroke || defaultSettings.textStroke,
    textStrokeColor: style.textStrokeColor || defaultSettings.textStrokeColor,
  };
};

export const LyricsEditor: React.FC<LyricsEditorProps> = ({
  karaokeLines,
  setKaraokeLines,
  fontOptions,
  defaultTextSettings,
}) => {
  // Cài đặt mặc định cho text
  const initialTextSettings: TextSettings = {
    ...DEFAULT_TEXT_SETTING,
    ...defaultTextSettings,
  };

  // ===========================
  // Tab management logic
  // ===========================
  // const [tabs, setTabs] = useState<TSubtitleTab[]>([
  //   {
  //     id: ID_TAB_DEFAULT,
  //     name: "Singer 1",
  //     lines: [],
  //     lyricsText: "",
  //     textSettings: { ...initialTextSettings }, // Sử dụng cài đặt mặc định
  //     effectType: "default", // Hiệu ứng mặc định
  //   },
  // ]);
  const tabs = useAppSelector((state) => state.tabsLyrics.tabs.kra1);

  const activeTabId = useAppSelector((state) => state.tabsLyrics.activeTab);

  // State để theo dõi tab nào đang được chỉnh sửa tên
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  // State để hiển thị/ẩn phần cài đặt văn bản
  const [showTextSettings, setShowTextSettings] = useState(false);
  const dispatch = useAppDispatch();

  // Thêm state để kiểm soát việc hiển thị popup Debug JSON
  const [showJsonDebug, setShowJsonDebug] = useState(false);

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

  const setActiveTabId = (tabId: string) => {
    dispatch(TabLyricsActions.setActiveTab(tabId));
  };

  // Hàm cập nhật tên tab
  const updateTabName = (tabId: string, newName: string) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === tabId ? { ...tab, name: newName } : tab,
      ),
    );
  };
  const [newTabName, setNewTabName] = useState("");
  const [showNewTabInput, setShowNewTabInput] = useState(false);

  // Tìm tab hiện tại
  const activeTab = tabs.find((tab) => tab.id === activeTabId) || tabs[0];

  // Thêm tab mới
  const addNewTab = () => {
    if (newTabName.trim()) {
      const newTabId = uuidv4();
      setTabs([
        ...tabs,
        {
          id: newTabId,
          name: newTabName.trim(),
          lines: [],
          lyricsText: "",
          textSettings: { ...initialTextSettings }, // Sử dụng cài đặt mặc định cho tab mới
          effectType: "default", // Hiệu ứng mặc định cho tab mới
        },
      ]);
      setActiveTabId(newTabId);
      setNewTabName("");
      setShowNewTabInput(false);
    }
  };

  // Xóa tab
  const deleteTab = (tabId: string) => {
    if (tabs.length > 1) {
      const newTabs = tabs.filter((tab) => tab.id !== tabId);
      setTabs(newTabs);
      if (activeTabId === tabId) {
        setActiveTabId(newTabs[0].id);
      }
    } else {
      alert("Không thể xóa tab cuối cùng");
    }
  };

  // Xử lý thay đổi tab
  const handleTabChange = (newTabId: string) => {
    // Lưu nội dung textarea hiện tại vào tab hiện tại trước khi chuyển tab
    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === activeTabId
          ? { ...tab, lyricsText: activeTab.lyricsText }
          : tab,
      ),
    );

    // Chuyển sang tab mới
    setActiveTabId(newTabId);
  };

  // ===========================
  // Text Settings management
  // ===========================
  // Cập nhật cài đặt văn bản cho tab hiện tại
  const updateTextSettings = (
    field: keyof TextSettings,
    value: string | number,
  ) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === activeTabId
          ? {
              ...tab,
              textSettings: {
                ...tab.textSettings,
                [field]: value,
              },
            }
          : tab,
      ),
    );
  };

  // Cập nhật hiệu ứng cho tab hiện tại
  const updateEffectType = (effectType: KaraokeEffectType) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === activeTabId ? { ...tab, effectType } : tab,
      ),
    );
  };

  // Xử lý thay đổi hiệu ứng
  const handleEffectTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateEffectType(e.target.value as KaraokeEffectType);
  };

  // Xử lý thay đổi màu chữ
  const handleActiveColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateTextSettings("activeWordColor", e.target.value);
  };

  const handleInactiveColorChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    updateTextSettings("inactiveWordColor", e.target.value);
  };

  // Xử lý thay đổi màu stroke
  const handleStrokeColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateTextSettings("textStrokeColor", e.target.value);
  };

  // Xử lý thay đổi font
  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateTextSettings("fontFamily", e.target.value);
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateTextSettings("fontSize", parseInt(e.target.value));
  };

  // Xử lý thay đổi độ đậm của font
  const handleFontWeightChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateTextSettings("fontWeight", e.target.value);
  };

  // Xử lý thay đổi độ dày của stroke
  const handleTextStrokeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    updateTextSettings("textStroke", `${value}px`);
  };

  // Lấy giá trị số từ textStroke (bỏ 'px')
  const getStrokeValue = () => {
    return parseInt(activeTab.textSettings.textStroke) || 0;
  };

  // ===========================
  // Subtitle line management logic
  // ===========================
  const [showDetailedEditor] = useState(true);

  // Thêm dòng mới vào tab hiện tại
  const addNewLine = () => {
    const currentTabIndex = tabs.findIndex((tab) => tab.id === activeTabId);
    if (currentTabIndex !== -1) {
      setTabs((prevTabs) =>
        prevTabs.map((tab, index) => {
          if (index !== currentTabIndex) return tab;

          const newId =
            tab.lines.length > 0
              ? Math.max(...tab.lines.map((line) => line.id)) + 1
              : 1;

          const newLine = {
            id: newId,
            countdown: false,
            actor: "",
            content: "",
          };

          return {
            ...tab,
            lines: [...tab.lines, newLine],
          };
        }),
      );
    }
  };

  // Cập nhật nội dung textarea của tab hiện tại
  const updateTabLyrics = (text: string) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === activeTabId ? { ...tab, lyricsText: text } : tab,
      ),
    );
  };

  const handleFullLyricsSave = () => {
    if (!activeTab.lyricsText.trim()) {
      return;
    }

    const lines = activeTab.lyricsText
      .split("\n")
      .filter((line) => line.trim());

    const currentTabIndex = tabs.findIndex((tab) => tab.id === activeTabId);
    if (currentTabIndex !== -1) {
      // Tạo mảng dòng mới
      const newLines = lines.map((line, index) => ({
        id: index + 1,
        countdown: activeTab?.lines?.[index]?.countdown || false,
        actor: activeTab?.lines?.[index]?.actor || "",
        content: line.trim(),
      }));

      // Cách 1: Sử dụng hàm updater để tạo mảng tabs mới hoàn toàn
      setTabs((prevTabs) =>
        prevTabs.map((tab, index) =>
          index === currentTabIndex ? { ...tab, lines: newLines } : tab,
        ),
      );

      // Hoặc Cách 2: Tạo đối tượng mới hoàn toàn và cập nhật nó
      // const updatedTabs = tabs.map((tab, index) => {
      //   if (index === currentTabIndex) {
      //     return { ...tab, lines: newLines };
      //   }
      //   return tab;
      // });
      // setTabs(updatedTabs);
    }
  };
  // Cập nhật nội dung dòng
  const updateLineContent = (
    lineId: number,
    field: keyof SubtitleLine,
    value: string | boolean,
  ) => {
    const currentTabIndex = tabs.findIndex((tab) => tab.id === activeTabId);
    if (currentTabIndex !== -1) {
      setTabs((prevTabs) =>
        prevTabs.map((tab, index) => {
          if (index !== currentTabIndex) return tab;

          return {
            ...tab,
            lines: tab.lines.map((line) =>
              line.id === lineId ? { ...line, [field]: value } : line,
            ),
          };
        }),
      );
    }
  };

  // Xóa dòng
  const deleteLine = (lineId: number) => {
    const currentTabIndex = tabs.findIndex((tab) => tab.id === activeTabId);
    if (currentTabIndex !== -1) {
      setTabs((prevTabs) =>
        prevTabs.map((tab, index) => {
          if (index !== currentTabIndex) return tab;

          return {
            ...tab,
            lines: tab.lines.filter((line) => line.id !== lineId),
          };
        }),
      );
    }
  };
  // Chuyển đổi từ tabs sang karaokeLines khi lưu
  const findTimingForLine = (
    karaokeLines: KaraokeLine[],
    content: string,
  ): { startTime?: number; endTime?: number } => {
    for (const line of karaokeLines) {
      const lineContent = line.words.map((word) => word.word).join(" ");
      if (lineContent === content) {
        return { startTime: line.startTime, endTime: line.endTime };
      }
    }
    return {};
  };

  const findTimingForWords = (
    karaokeLines: KaraokeLine[],
    content: string,
  ): { word: string; startTime?: number; endTime?: number }[] => {
    for (const line of karaokeLines) {
      const lineContent = line.words.map((word) => word.word).join(" ");
      if (lineContent === content) {
        // Trả về danh sách từ với thứ tự chính xác
        return line.words.map(({ word, startTime, endTime }) => ({
          word,
          startTime,
          endTime,
        }));
      }
    }
    return [];
  };

  const convertTabsToKaraokeLines = (): KaraokeLine[] => {
    const result: KaraokeLineWithStyle[] = [];

    // Xử lý từng tab
    tabs.forEach((tab) => {
      const sortedLines = [...tab.lines].sort((a, b) => a.id - b.id);

      sortedLines.forEach((line) => {
        if (line.content.trim()) {
          // Tìm timing cho dòng từ karaokeLines gốc
          const { startTime, endTime } = findTimingForLine(
            karaokeLines,
            line.content,
          );

          // Tìm timing cho từng từ từ karaokeLines gốc
          const wordsWithTiming = findTimingForWords(
            karaokeLines,
            line.content,
          );

          // Nếu không tìm thấy timing từ karaokeLines, tạo mặc định
          const words =
            wordsWithTiming.length > 0
              ? wordsWithTiming.map((word) => ({
                  word: word.word,
                  startTime: word.startTime,
                  endTime: word.endTime,
                  style: textSettingsToStyle(tab.textSettings),
                }))
              : line.content.split(/\s+/).map((wordText) => ({
                  word: wordText,
                  startTime: undefined,
                  endTime: undefined,
                  style: textSettingsToStyle(tab.textSettings),
                }));

          const clonePosition = result?.[result.length - 2]?.position;

          // Thêm dòng vào kết quả với hiệu ứng từ tab
          result.push({
            startTime,
            endTime,
            words,
            style: textSettingsToStyle(tab.textSettings),
            countDown: line.countdown,
            position:
              clonePosition ||
              (result.length % 2 === 0
                ? DEFAULT_POSITION
                : DEFAULT_POSITION_EVEN),
            effectType: tab.effectType, // Sử dụng hiệu ứng từ tab
            idTab: tab.id, // Sửa từ activeTabId thành tab.id để giữ thông tin tab đúng
          });
        }
      });
    });

    return result as KaraokeLine[];
  };

  // Xử lý khi người dùng lưu lời
  const handleSaveLyrics = () => {
    try {
      // Lưu nội dung textarea hiện tại vào tab hiện tại
      handleFullLyricsSave();

      const newKaraokeLines = convertTabsToKaraokeLines();

      setKaraokeLines(newKaraokeLines);
    } catch (error) {
      console.error("Lỗi khi chuyển đổi lời:", error);
      alert("Có lỗi xảy ra khi chuyển đổi lời. Vui lòng kiểm tra lại.");
    }
  };

  // Hàm xử lý lưu dữ liệu từ JSON Debug popup
  const handleSaveJsonData = (
    newTabs: TSubtitleTab[],
    newActiveTabId: string,
    newKaraokeLines: KaraokeLine[],
  ) => {
    // Cập nhật tabs
    setTabs(newTabs);

    // Cập nhật activeTabId nếu khác với giá trị hiện tại
    if (newActiveTabId !== activeTabId) {
      setActiveTabId(newActiveTabId);
    }

    // Cập nhật karaokeLines
    setKaraokeLines(newKaraokeLines);
    // Đóng popup
    setShowJsonDebug(false);
  };

  // ===========================
  // Effects to sync state
  // ===========================
  // Đồng bộ từ karaokeLines sang tabs và lyricsText khi component mount
  useEffect(() => {
    if (karaokeLines.length > 0) {
      // Nhóm các dòng theo idTab
      const tabGroups = karaokeLines.reduce(
        (groups, line) => {
          const tabId = line.idTab || ID_TAB_DEFAULT; // Mặc định là ID_TAB_DEFAULT nếu không có idTab
          if (!groups[tabId]) {
            groups[tabId] = [];
          }
          groups[tabId].push(line);
          return groups;
        },
        {} as Record<string, KaraokeLine[]>,
      );

      // Tạo các tab dựa trên các nhóm
      const newTabs: TSubtitleTab[] = [];

      Object.entries(tabGroups).forEach(([tabId, lines], index) => {
        const subtitleLines: SubtitleLine[] = lines.map((line, lineIndex) => ({
          id: lineIndex + 1,
          countdown: line.countDown || false,
          actor: "",
          content: line.words.map((word) => word.word).join(" "),
        }));

        // Cập nhật lyricsText từ karaokeLines
        const lyrics = subtitleLines.map((line) => line.content).join("\n");

        // Lấy style từ dòng đầu tiên
        const firstLine = lines[0] as KaraokeLineWithStyle;

        // Chuyển đổi từ TextStyle sang TextSettings hoặc sử dụng mặc định
        let tabTextSettings = initialTextSettings;
        if (firstLine?.style) {
          tabTextSettings = textStyleToSettings(
            firstLine.style,
            initialTextSettings,
          );
        }

        // Lấy hiệu ứng từ dòng đầu tiên hoặc sử dụng mặc định
        const effectType = firstLine?.effectType || "default";

        newTabs.push({
          id: tabId,
          name: `Ca sĩ ${index + 1}`, // Tên mặc định có thể được cải thiện nếu cần
          lines: subtitleLines,
          lyricsText: lyrics,
          textSettings: tabTextSettings,
          effectType: effectType,
        });
      });

      // Nếu không có tab nào được tạo (không có idTab hợp lệ), tạo tab mặc định
      if (newTabs.length === 0) {
        newTabs.push({
          id: "ID_TAB_DEFAULT",
          name: "Ca sĩ 1",
          lines: [],
          lyricsText: "",
          textSettings: initialTextSettings,
          effectType: "default",
        });
      }

      setTabs(newTabs);
    }
  }, []);

  return (
    <div className="mb-6">
      <h3 className="font-semibold mb-2 flex justify-between items-center">
        Karaoke Lyrics
        <button
          className="bg-gray-700 hover:bg-gray-600 text-xs text-white px-2 py-1 rounded flex items-center"
          onClick={() => setShowJsonDebug(true)}
        >
          <span className="mr-1">🛠️</span> Debug JSON
        </button>
      </h3>
      {showJsonDebug && (
        <DebugJsonPopup
          tabs={tabs}
          activeTabId={activeTabId}
          onClose={() => setShowJsonDebug(false)}
          onSave={handleSaveJsonData}
          karaokeLines={karaokeLines}
        />
      )}
      {/* Phần chỉnh sửa chi tiết - có thể ẩn/hiện */}
      {showDetailedEditor && (
        <div className="mb-4 border rounded bg-gray-800 text-white">
          {/* Tab headers */}
          <div className="flex border-b border-gray-600">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`flex items-center px-4 py-2 cursor-pointer ${activeTabId === tab.id ? "bg-gray-700 border-b-2 border-blue-400" : "hover:bg-gray-700"}`}
                onClick={() => handleTabChange(tab.id)}
              >
                {editingTabId === tab.id ? (
                  <input
                    type="text"
                    value={tab.name}
                    onChange={(e) => updateTabName(tab.id, e.target.value)}
                    onBlur={() => setEditingTabId(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setEditingTabId(null);
                    }}
                    autoFocus
                    className="px-1 py-0.5 text-white rounded"
                  />
                ) : (
                  <span
                    className="text-sm"
                    onDoubleClick={() => setEditingTabId(tab.id)}
                  >
                    {tab.name}
                  </span>
                )}
                {tabs.length > 1 && (
                  <button
                    className="ml-2 text-gray-400 hover:text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTab(tab.id);
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            {/* Add new tab button */}
            {showNewTabInput ? (
              <div className="flex items-center px-2 py-1">
                <input
                  type="text"
                  value={newTabName}
                  onChange={(e) => setNewTabName(e.target.value)}
                  className="px-2 py-1 text-white text-sm rounded"
                  placeholder="Tab name"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addNewTab();
                    if (e.key === "Escape") setShowNewTabInput(false);
                  }}
                />
                <button
                  className="ml-1 px-2 bg-green-500 rounded"
                  onClick={addNewTab}
                >
                  +
                </button>
                <button
                  className="ml-1 px-2 bg-gray-500 rounded"
                  onClick={() => setShowNewTabInput(false)}
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                className="px-3 py-2 text-gray-300 hover:bg-gray-700"
                onClick={() => setShowNewTabInput(true)}
              >
                +
              </button>
            )}
          </div>
          {activeTab && (
            <>
              {/* Textarea cho tab hiện tại khi ở chế độ chi tiết */}
              <div className="p-2 bg-gray-900">
                <textarea
                  value={activeTab.lyricsText}
                  onChange={(e) => updateTabLyrics(e.target.value)}
                  className="w-full h-32 bg-gray-800 text-white border border-gray-600 rounded p-2 text-sm mb-2"
                  placeholder={`Nhập lời cho ${activeTab.name} ở đây, mỗi dòng là một câu`}
                />
                <div className="flex justify-between items-center">
                  <button
                    className={`text-sm px-3 py-1 rounded ${showTextSettings ? "bg-blue-500 text-white" : "bg-gray-600 text-gray-200"}`}
                    onClick={() => setShowTextSettings(!showTextSettings)}
                  >
                    {showTextSettings
                      ? "Ẩn cài đặt văn bản"
                      : "Hiện cài đặt văn bản"}
                  </button>
                  <button
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                    onClick={handleFullLyricsSave}
                  >
                    Tách thành các dòng
                  </button>
                </div>
              </div>

              {/* Text Settings cho tab hiện tại */}
              {showTextSettings && (
                <div className="p-3 bg-gray-900 border-t border-gray-700">
                  <h4 className="font-medium mb-2 text-sm">
                    Cài đặt văn bản cho {activeTab.name}
                  </h4>

                  {/* Thêm lựa chọn hiệu ứng */}
                  <div className="mb-4">
                    <label className="block text-xs mb-1">Kiểu hiệu ứng:</label>
                    <select
                      value={activeTab.effectType}
                      onChange={handleEffectTypeChange}
                      className="w-full p-2 border rounded mb-2 text-xs bg-gray-800 text-white"
                    >
                      {KARAOKE_EFFECTS.map((effect) => (
                        <option key={effect.value} value={effect.value}>
                          {effect.label}
                        </option>
                      ))}
                    </select>
                    <div className="text-xs text-gray-400 italic">
                      Hiệu ứng này sẽ được áp dụng cho tất cả các dòng trong tab
                      này.
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs mb-1">
                        Màu chữ đang phát:
                      </label>
                      <input
                        type="color"
                        value={activeTab.textSettings.activeWordColor}
                        onChange={handleActiveColorChange}
                        className="w-full h-8 cursor-pointer mb-2"
                      />
                    </div>

                    <div>
                      <label className="block text-xs mb-1">
                        Màu chữ chưa phát:
                      </label>
                      <input
                        type="color"
                        value={activeTab.textSettings.inactiveWordColor}
                        onChange={handleInactiveColorChange}
                        className="w-full h-8 cursor-pointer mb-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <label className="block text-xs mb-1">Font chữ:</label>
                      <select
                        value={activeTab.textSettings.fontFamily}
                        onChange={handleFontFamilyChange}
                        className="w-full p-1 border rounded mb-2 text-xs bg-gray-800 text-white"
                      >
                        {fontOptions.map((font) => (
                          <option key={font.value} value={font.value}>
                            {font.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs mb-1">Độ đậm:</label>
                      <select
                        value={activeTab.textSettings.fontWeight}
                        onChange={handleFontWeightChange}
                        className="w-full p-1 border rounded mb-2 text-xs bg-gray-800 text-white"
                      >
                        {FONT_WEIGHTS.map((weight) => (
                          <option key={weight.value} value={weight.value}>
                            {weight.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-2">
                    <label className="block text-xs mb-1">
                      Kích thước chữ: {activeTab.textSettings.fontSize}px
                    </label>
                    <input
                      type="range"
                      min="20"
                      max="200"
                      value={activeTab.textSettings.fontSize}
                      onChange={handleFontSizeChange}
                      className="w-full mb-3"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <label className="block text-xs mb-1">
                        Viền chữ: {getStrokeValue()}px
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        value={getStrokeValue()}
                        onChange={handleTextStrokeChange}
                        className="w-full mb-2"
                      />
                    </div>

                    <div>
                      <label className="block text-xs mb-1">
                        Màu viền chữ:
                      </label>
                      <input
                        type="color"
                        value={activeTab.textSettings.textStrokeColor}
                        onChange={handleStrokeColorChange}
                        className="w-full h-8 cursor-pointer mb-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Table header */}
              <div className="grid grid-cols-12 bg-gray-700 text-gray-300 text-xs">
                <div className="col-span-1 p-2 border-r border-gray-600 text-center">
                  #
                </div>
                <div className="col-span-1 p-2 border-r border-gray-600 text-center">
                  S
                </div>
                <div className="col-span-2 p-2 border-r border-gray-600">
                  Actor
                </div>
                <div className="col-span-8 p-2">Content</div>
              </div>

              {/* Table body */}
              <div className="max-h-60 overflow-y-auto">
                {activeTab.lines.map((line) => (
                  <div
                    key={line.id}
                    className="grid grid-cols-12 border-t border-gray-600 hover:bg-gray-700"
                  >
                    <div className="col-span-1 p-2 border-r border-gray-600 text-center text-gray-400 text-xs">
                      {line.id}
                    </div>
                    <div className="col-span-1 p-2 border-r border-gray-600 text-center text-xs">
                      <input
                        type="checkbox"
                        checked={line.countdown}
                        onChange={(e) =>
                          updateLineContent(
                            line.id,
                            "countdown",
                            e.target.checked,
                          )
                        }
                        className="form-checkbox h-4 w-4"
                      />
                    </div>
                    <div className="col-span-2 p-2 border-r border-gray-600">
                      <input
                        type="text"
                        value={line.actor}
                        onChange={(e) =>
                          updateLineContent(line.id, "actor", e.target.value)
                        }
                        className="bg-transparent w-full text-gray-300 focus:outline-none text-xs"
                        placeholder="Actor"
                      />
                    </div>
                    <div className="col-span-8 p-2 flex items-center">
                      <input
                        type="text"
                        value={line.content}
                        onChange={(e) =>
                          updateLineContent(line.id, "content", e.target.value)
                        }
                        className="bg-transparent w-full text-gray-300 focus:outline-none text-xs"
                        placeholder="Enter lyrics here"
                      />
                      <button
                        className="ml-2 text-gray-500 hover:text-red-400"
                        onClick={() => deleteLine(line.id)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add new line button */}
                <div className="border-t border-gray-600 p-2 flex justify-end">
                  <button
                    className="text-gray-400 hover:text-white py-1 px-2"
                    onClick={addNewLine}
                  >
                    + Thêm dòng
                  </button>
                </div>
              </div>
            </>
          )}
          {/* Nút lưu ở cuối khi ở chế độ chi tiết */}
          <div className="border-t border-gray-600 p-2 flex justify-end">
            <button
              className="bg-green-500 text-white px-3 py-1 rounded"
              onClick={handleSaveLyrics}
            >
              Lưu lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
