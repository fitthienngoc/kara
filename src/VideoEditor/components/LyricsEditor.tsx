import React, { useState, useEffect } from "react";
import { KaraokeLine } from "../constants";
import clsx from "clsx";

interface LyricsEditorProps {
  karaokeLines: KaraokeLine[];
  setKaraokeLines: React.Dispatch<React.SetStateAction<KaraokeLine[]>>;
  fps: number;
}

interface SubtitleTab {
  id: string;
  name: string;
  lines: SubtitleLine[];
}

interface SubtitleLine {
  id: number;
  countdown: boolean; // Checkbox S
  actor: string;
  content: string;
}

export const LyricsEditor: React.FC<LyricsEditorProps> = ({
  karaokeLines,
  setKaraokeLines,
  fps,
}) => {
  // ===========================
  // Tab management logic
  // ===========================
  const [tabs, setTabs] = useState<SubtitleTab[]>([
    {
      id: "tab1",
      name: "Singer 1",
      lines: [],
    },
  ]);
  const [activeTabId, setActiveTabId] = useState("tab1");
  // State để theo dõi tab nào đang được chỉnh sửa tên
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
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

  // ===========================
  // Subtitle line management logic
  // ===========================
  const [fullLyrics, setFullLyrics] = useState("");
  const [showDetailedEditor, setShowDetailedEditor] = useState(false);
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
  // Xử lý khi người dùng lưu lời từ khung nhập tổng thể
  const handleFullLyricsSave = () => {
    if (!fullLyrics.trim()) {
      return;
    }

    const lines = fullLyrics.split("\n").filter((line) => line.trim());

    const currentTabIndex = tabs.findIndex((tab) => tab.id === activeTabId);
    if (currentTabIndex !== -1) {
      // Tạo mảng dòng mới
      const newLines = lines.map((line, index) => ({
        id: index + 1,
        countdown: false,
        actor: "",
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
    const result: KaraokeLine[] = [];
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
          });

          // Cập nhật thời gian bắt đầu cho dòng tiếp theo
          // Thêm khoảng trống giữa các dòng (1 giây)
          currentStartTime = lineEndTime + Math.round(1 * fps);
        }
      });
    });

    return result;
  };


  // Xử lý khi người dùng lưu lời
  const handleSaveLyrics = () => {
    try {
      // Trước khi lưu, đảm bảo rằng các dòng trong tab được cập nhật từ fullLyrics
      handleFullLyricsSave();

      const newKaraokeLines = convertTabsToKaraokeLines();
      setKaraokeLines(newKaraokeLines);
    } catch (error) {
      console.error("Lỗi khi chuyển đổi lời:", error);
      alert("Có lỗi xảy ra khi chuyển đổi lời. Vui lòng kiểm tra lại.");
    }
  };

  // Tìm tab hiện tại
  const activeTab = tabs.find((tab) => tab.id === activeTabId) || tabs[0];

  // ===========================
  // Effects to sync state
  // ===========================
  // Đồng bộ từ karaokeLines sang tabs và fullLyrics khi component mount
  useEffect(() => {
    if (karaokeLines.length > 0) {
      // Giả định tất cả các dòng thuộc về tab đầu tiên
      const lines: SubtitleLine[] = karaokeLines.map((line, index) => ({
        id: index + 1,
        countdown: false,
        actor: "",
        content: line.words.map((word) => word.word).join(" "),
      }));

      setTabs([
        {
          id: "tab1",
          name: "Singer 1",
          lines,
        },
      ]);

      // Cập nhật fullLyrics từ karaokeLines
      const lyrics = lines.map((line) => line.content).join("\n");
      setFullLyrics(lyrics);
    }
  }, []);

  // Đồng bộ từ tab lines sang fullLyrics
  useEffect(() => {
    const currentTabIndex = tabs.findIndex((tab) => tab.id === activeTabId);
    if (currentTabIndex !== -1) {
      const sortedLines = [...tabs[currentTabIndex].lines].sort(
        (a, b) => a.id - b.id,
      );
      const lyrics = sortedLines.map((line) => line.content).join("\n");
      setFullLyrics(lyrics);
    }
  }, [tabs, activeTabId]);

  return (
    <div className="mb-6">
      <h3 className="font-semibold mb-2">Karaoke Lyrics</h3>

      {/* Phần nhập lời tổng thể - luôn hiển thị */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium">Nhập lời bài hát</h4>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          Mỗi dòng sẽ được tự động chuyển thành một câu riêng biệt.
        </p>
        <textarea
          value={fullLyrics}
          onChange={(e) => setFullLyrics(e.target.value)}
          className={clsx(
            "w-full h-60 border rounded p-2 text-sm",
            showDetailedEditor && "hidden",
          )}
          placeholder="Nhập lời bài hát ở đây, mỗi dòng là một câu"
        />
        <div className="mt-2 flex justify-between items-center">
          <button
            className={`text-sm px-3 py-1 rounded ${showDetailedEditor ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            onClick={() => setShowDetailedEditor(!showDetailedEditor)}
          >
            {showDetailedEditor
              ? "Ẩn chỉnh sửa chi tiết"
              : "Hiện chỉnh sửa chi tiết"}
          </button>
          <div
            className={clsx("flex space-x-2", showDetailedEditor && "hidden")}
          >
            <button
              className="bg-green-500 text-white px-3 py-1 rounded"
              onClick={() => {
                handleFullLyricsSave();
                handleSaveLyrics();
              }}
            >
              Áp dụng
            </button>
            <button
              className="bg-blue-500 text-white px-3 py-1 rounded"
              onClick={handleFullLyricsSave}
            >
              Tách thành các dòng
            </button>
          </div>
        </div>
      </div>

      {/* Phần chỉnh sửa chi tiết - có thể ẩn/hiện */}
      {showDetailedEditor && (
        <div className="mb-4 border rounded bg-gray-800 text-white">
          {/* Tab headers */}
          <div className="flex border-b border-gray-600">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`flex items-center px-4 py-2 cursor-pointer ${activeTabId === tab.id ? "bg-gray-700 border-b-2 border-blue-400" : "hover:bg-gray-700"}`}
                onClick={() => setActiveTabId(tab.id)}
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
                  <span onDoubleClick={() => setEditingTabId(tab.id)}>{tab.name}</span>
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
        </div>
      )}
    </div>
  );
};
