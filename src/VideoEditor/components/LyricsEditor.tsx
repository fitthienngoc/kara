import React, { useState, useEffect } from "react";
import {
  DEFAULT_ACTIVE_COLOR,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_FONT_WEIGHT,
  DEFAULT_INACTIVE_COLOR,
  DEFAULT_TEXT_STROKE,
  DEFAULT_TEXT_STROKE_COLOR,
  KaraokeLine,
} from "../constants";
import { FONT_WEIGHTS } from "../constants/fonts";

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
    startTime: number;
    endTime: number;
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

interface SubtitleTab {
  id: string;
  name: string;
  lines: SubtitleLine[];
  lyricsText: string;
  textSettings: TextSettings; // Thêm cài đặt văn bản cho mỗi tab
}

interface SubtitleLine {
  id: number;
  countdown: boolean; // Checkbox S
  actor: string;
  content: string;
}

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
  fps,
  fontOptions,
  defaultTextSettings,
}) => {
  // Cài đặt mặc định cho text
  const initialTextSettings: TextSettings = {
    activeWordColor:
      defaultTextSettings?.activeWordColor || DEFAULT_ACTIVE_COLOR,
    inactiveWordColor:
      defaultTextSettings?.inactiveWordColor || DEFAULT_INACTIVE_COLOR,
    fontFamily:
      defaultTextSettings?.fontFamily ||
      fontOptions[0]?.value ||
      DEFAULT_FONT_FAMILY,
    fontSize: defaultTextSettings?.fontSize || DEFAULT_FONT_SIZE,
    fontWeight: defaultTextSettings?.fontWeight || DEFAULT_FONT_WEIGHT,
    textStroke: defaultTextSettings?.textStroke || DEFAULT_TEXT_STROKE,
    textStrokeColor:
      defaultTextSettings?.textStrokeColor || DEFAULT_TEXT_STROKE_COLOR,
  };

  // ===========================
  // Tab management logic
  // ===========================
  const [tabs, setTabs] = useState<SubtitleTab[]>([
    {
      id: "tab1",
      name: "Singer 1",
      lines: [],
      lyricsText: "",
      textSettings: { ...initialTextSettings }, // Sử dụng cài đặt mặc định
    },
  ]);
  const [activeTabId, setActiveTabId] = useState("tab1");
  // State để theo dõi tab nào đang được chỉnh sửa tên
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  // State để hiển thị/ẩn phần cài đặt văn bản
  const [showTextSettings, setShowTextSettings] = useState(false);

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
      const newTabId = `tab${tabs.length + 1}`;
      setTabs([
        ...tabs,
        {
          id: newTabId,
          name: newTabName.trim(),
          lines: [],
          lyricsText: "",
          textSettings: { ...initialTextSettings }, // Sử dụng cài đặt mặc định cho tab mới
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
      const updatedTabs = [...tabs];
      const currentLines = [...updatedTabs[currentTabIndex].lines];
      const newId =
        currentLines.length > 0
          ? Math.max(...currentLines.map((line) => line.id)) + 1
          : 1;

      currentLines.push({
        id: newId,
        countdown: false,
        actor: "",
        content: "",
      });

      updatedTabs[currentTabIndex].lines = currentLines;
      setTabs(updatedTabs);
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

  // Xử lý khi người dùng lưu lời từ khung nhập tổng thể
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
        countdown: activeTab?.lines?.[index]?.countdown || false, // Giữ nguyên trạng thái đếm ngược nếu có
        actor: activeTab?.lines?.[index]?.actor || "", // Giữ nguyên actor nếu có
        content: line.trim(),
      }));

      // Cập nhật tab hiện tại với các dòng mới
      const updatedTabs = [...tabs];
      updatedTabs[currentTabIndex].lines = newLines;
      setTabs(updatedTabs);
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
      const updatedTabs = [...tabs];
      const lineIndex = updatedTabs[currentTabIndex].lines.findIndex(
        (line) => line.id === lineId,
      );

      if (lineIndex !== -1) {
        updatedTabs[currentTabIndex].lines[lineIndex] = {
          ...updatedTabs[currentTabIndex].lines[lineIndex],
          [field]: value,
        };
        setTabs(updatedTabs);
      }
    }
  };

  // Xóa dòng
  const deleteLine = (lineId: number) => {
    const currentTabIndex = tabs.findIndex((tab) => tab.id === activeTabId);
    if (currentTabIndex !== -1) {
      const updatedTabs = [...tabs];
      updatedTabs[currentTabIndex].lines = updatedTabs[
        currentTabIndex
      ].lines.filter((line) => line.id !== lineId);
      setTabs(updatedTabs);
    }
  };

  // Chuyển đổi từ tabs sang karaokeLines khi lưu
  const convertTabsToKaraokeLines = (): KaraokeLine[] => {
    const result: KaraokeLineWithStyle[] = [];
    let currentStartTime = 30; // Bắt đầu từ frame 30

    // Xử lý từng tab
    tabs.forEach((tab) => {
      // Sắp xếp các dòng theo ID
      const sortedLines = [...tab.lines].sort((a, b) => a.id - b.id);

      sortedLines.forEach((line) => {
        if (line.content.trim()) {
          // Tách các từ trong dòng
          const wordTexts = line.content.trim().split(/\s+/);

          // Tính toán thời gian cho từng từ
          const words = wordTexts.map((wordText, index) => {
            const wordDuration = Math.round(0.3 * fps); // 0.3 giây cho mỗi từ
            const wordStartTime = currentStartTime + index * wordDuration;

            return {
              word: wordText,
              startTime: wordStartTime,
              endTime: wordStartTime + wordDuration,
              // Thêm thông tin style từ tab - chuyển đổi từ TextSettings sang TextStyle
              style: textSettingsToStyle(tab.textSettings),
            };
          });

          // Tính thời gian kết thúc của dòng
          const lineEndTime =
            currentStartTime +
            words.length * Math.round(0.3 * fps) +
            Math.round(0.5 * fps);

          // Thêm dòng vào kết quả
          result.push({
            startTime: currentStartTime,
            endTime: lineEndTime,
            words,
            // Thêm thông tin style từ tab - chuyển đổi từ TextSettings sang TextStyle
            style: textSettingsToStyle(tab.textSettings),
            countDown: line.countdown,
          });

          // Cập nhật thời gian bắt đầu cho dòng tiếp theo
          // Thêm khoảng trống giữa các dòng (1 giây)
          currentStartTime = lineEndTime + Math.round(1 * fps);
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

  // ===========================
  // Effects to sync state
  // ===========================
  // Đồng bộ từ karaokeLines sang tabs và lyricsText khi component mount
  useEffect(() => {
    if (karaokeLines.length > 0) {
      // Giả định tất cả các dòng thuộc về tab đầu tiên
      const lines: SubtitleLine[] = karaokeLines.map((line, index) => ({
        id: index + 1,
        countdown: false,
        actor: "",
        content: line.words.map((word) => word.word).join(" "),
      }));

      // Cập nhật lyricsText từ karaokeLines
      const lyrics = lines.map((line) => line.content).join("\n");

      // Lấy style từ karaokeLine đầu tiên nếu có
      const firstLine = karaokeLines[0] as KaraokeLineWithStyle;

      // Chuyển đổi từ TextStyle sang TextSettings hoặc sử dụng mặc định
      let tabTextSettings = initialTextSettings;
      if (firstLine?.style) {
        tabTextSettings = textStyleToSettings(
          firstLine.style,
          initialTextSettings,
        );
      }

      setTabs([
        {
          id: "tab1",
          name: "Singer 1",
          lines,
          lyricsText: lyrics,
          textSettings: tabTextSettings,
        },
      ]);
    }
  }, []);

  return (
    <div className="mb-6">
      <h3 className="font-semibold mb-2">Karaoke Lyrics</h3>

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
                    className="px-1 py-0.5 text-sm text-white rounded"
                  />
                ) : (
                  <span onDoubleClick={() => setEditingTabId(tab.id)}>
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
                  max="100"
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
                    max="5"
                    value={getStrokeValue()}
                    onChange={handleTextStrokeChange}
                    className="w-full mb-2"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1">Màu viền chữ:</label>
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
            <div className="col-span-2 p-2 border-r border-gray-600">Actor</div>
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
                      updateLineContent(line.id, "countdown", e.target.checked)
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
