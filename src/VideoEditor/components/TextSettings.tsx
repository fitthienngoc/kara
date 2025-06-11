import React from "react";

interface TextSettingsProps {
  activeWordColor: string;
  setActiveWordColor: (color: string) => void;
  inactiveWordColor: string;
  setInactiveWordColor: (color: string) => void;
  fontFamily: string;
  setFontFamily: (font: string) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  fontOptions: { value: string; label: string }[];
}

export const TextSettings: React.FC<TextSettingsProps> = ({
  activeWordColor,
  setActiveWordColor,
  inactiveWordColor,
  setInactiveWordColor,
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  fontOptions,
}) => {
  // Xử lý thay đổi màu chữ
  const handleActiveColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActiveWordColor(e.target.value);
  };

  const handleInactiveColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInactiveWordColor(e.target.value);
  };

  // Xử lý thay đổi font
  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFontFamily(e.target.value);
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFontSize(parseInt(e.target.value));
  };

  // Hiển thị mẫu font với văn bản tiếng Việt
  const fontPreviewStyle = {
    fontFamily: fontFamily,
    fontSize: "16px",
    marginTop: "8px",
    padding: "4px",
    backgroundColor: "#f0f0f0",
    borderRadius: "4px",
  };

  return (
    <div className="mb-6">
      <h3 className="font-semibold mb-2">Text Settings</h3>

      <label className="block text-sm mb-1">Active Word Color:</label>
      <input
        type="color"
        value={activeWordColor}
        onChange={handleActiveColorChange}
        className="w-full h-8 cursor-pointer mb-2"
      />

      <label className="block text-sm mb-1">Inactive Word Color:</label>
      <input
        type="color"
        value={inactiveWordColor}
        onChange={handleInactiveColorChange}
        className="w-full h-8 cursor-pointer mb-2"
      />

      <label className="block text-sm mb-1">Font Family:</label>
      <select
        value={fontFamily}
        onChange={handleFontFamilyChange}
        className="w-full p-2 border rounded mb-2"
      >
        {fontOptions.map((font) => (
          <option key={font.value} value={font.value}>
            {font.label}
          </option>
        ))}
      </select>

      {/* Xem trước font với văn bản tiếng Việt */}
      <div style={fontPreviewStyle}>
        Xin chào! Tiếng Việt có dấu: ă, â, đ, ê, ô, ơ, ư
      </div>

      <label className="block text-sm mb-1 mt-4">Font Size: {fontSize}px</label>
      <input
        type="range"
        min="20"
        max="80"
        value={fontSize}
        onChange={handleFontSizeChange}
        className="w-full"
      />
    </div>
  );
};