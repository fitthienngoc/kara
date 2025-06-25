import { useState, useEffect } from "react";
import { TSubtitleTab } from "../LyricsEditor";
import { KaraokeLine } from "../../constants";

const DebugJsonPopup = ({
  tabs,
  activeTabId,
  onClose,
  onSave,
  karaokeLines,
}: {
  tabs: TSubtitleTab[];
  activeTabId: string;
  karaokeLines: KaraokeLine[];
  onClose: () => void;
  onSave: (
    newTabs: TSubtitleTab[],
    newActiveTabId: string,
    newKaraokeLines: KaraokeLine[],
  ) => void;
}) => {
  const [jsonData, setJsonData] = useState("");
  const [error, setError] = useState("");

  // Khởi tạo giá trị JSON từ props
  useEffect(() => {
    setJsonData(JSON.stringify({ tabs, activeTabId, karaokeLines }, null, 2));
  }, [tabs, activeTabId]);

  // Xử lý khi người dùng lưu JSON
  const handleSave = () => {
    try {
      const parsedData = JSON.parse(jsonData);
      if (!parsedData.tabs || !Array.isArray(parsedData.tabs)) {
        throw new Error(
          "Thuộc tính 'tabs' không hợp lệ hoặc không phải là mảng",
        );
      }
      if (
        !parsedData.activeTabId ||
        typeof parsedData.activeTabId !== "string"
      ) {
        throw new Error("Thuộc tính 'activeTabId' không hợp lệ");
      }

      setError("");
      onSave(parsedData.tabs, parsedData.activeTabId, parsedData.karaokeLines);
    } catch (e) {
      setError((e as Error).message || "JSON không hợp lệ");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-4/5 max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="bg-gray-700 px-4 py-2 flex justify-between items-center">
          <h3 className="font-medium text-white">Debug JSON Data</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-white">
            &times;
          </button>
        </div>

        {error && (
          <div className="bg-red-600 text-white px-4 py-2 text-sm">
            Lỗi: {error}
          </div>
        )}

        <div className="flex-1 p-4 overflow-auto">
          <textarea
            className="w-full h-full min-h-[80vh] bg-gray-900 text-green-400 font-mono p-4 rounded border border-gray-600"
            value={jsonData}
            onChange={(e) => setJsonData(e.target.value)}
          />
        </div>

        <div className="bg-gray-700 px-4 py-3 flex justify-end">
          <button
            onClick={handleSave}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-2"
          >
            Cập nhật
          </button>
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugJsonPopup;
