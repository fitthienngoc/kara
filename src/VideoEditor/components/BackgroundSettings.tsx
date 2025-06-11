import React from "react";
import { isImageFormatSupported, isVideoFormatSupported } from "../utils/formatCheckers";
import { processImageFile, processVideoFile } from "../utils/fileConverters";
interface BackgroundSettingsProps {
  backgroundType: "image" | "video" | "color";
  setBackgroundType: (type: "image" | "video" | "color") => void;
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
  backgroundSrc: string;
  setBackgroundSrc: (src: string) => void;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  videoInputRef: React.RefObject<HTMLInputElement | null>;
}

export const BackgroundSettings: React.FC<BackgroundSettingsProps> = ({
  backgroundType,
  setBackgroundType,
  backgroundColor,
  setBackgroundColor,
  backgroundSrc,
  setBackgroundSrc,
  imageInputRef,
  videoInputRef,
}) => {
  // Thêm state để theo dõi lỗi và tên file
  const [backgroundImageError, setBackgroundImageError] = React.useState<string | null>(null);
  const [backgroundVideoError, setBackgroundVideoError] = React.useState<string | null>(null);
  const [backgroundImageName, setBackgroundImageName] = React.useState<string>("");
  const [backgroundVideoName, setBackgroundVideoName] = React.useState<string>("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  // Xử lý thay đổi màu nền
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setBackgroundColor(color);
    setBackgroundType("color");
  };

  // Xử lý tải lên ảnh nền
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Reset lỗi và set trạng thái đang xử lý
      setBackgroundImageError(null);
    setIsProcessing(true);

      // Kiểm tra định dạng file
      if (!isImageFormatSupported(file)) {
      setBackgroundImageError(`Định dạng file "${file.type}" không được hỗ trợ`);
      setIsProcessing(false);
      if (imageInputRef.current) {
          imageInputRef.current.value = "";
        }
        return;
      }

    // Xử lý file ảnh
    const result = await processImageFile(file);
    
    if (result.success && result.dataURL) {
      setBackgroundSrc(result.dataURL);
        setBackgroundType("image");
        setBackgroundImageName(file.name);
      console.log(`Đã tải file ảnh: ${file.name} (${file.type}, ${Math.round(file.size/1024)} KB)`);
      } else {
      setBackgroundImageError(result.error || "Lỗi không xác định khi xử lý ảnh");
      if (imageInputRef.current) {
          imageInputRef.current.value = "";
        }
      }
    
    setIsProcessing(false);
  };

  // Xử lý tải lên video nền
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Reset lỗi và set trạng thái đang xử lý
      setBackgroundVideoError(null);
    setIsProcessing(true);

      // Kiểm tra định dạng file
      if (!isVideoFormatSupported(file)) {
      setBackgroundVideoError(`Định dạng file "${file.type}" không được hỗ trợ`);
      setIsProcessing(false);
        if (videoInputRef.current) {
          videoInputRef.current.value = "";
        }
        return;
      }

    // Xử lý file video
    const result = await processVideoFile(file);
    
    if (result.success && result.dataURL) {
      setBackgroundSrc(result.dataURL);
        setBackgroundType("video");
        setBackgroundVideoName(file.name);
      console.log(`Đã tải file video: ${file.name} (${file.type}, ${Math.round(file.size/1024)} KB)`);
      } else {
      setBackgroundVideoError(result.error || "Lỗi không xác định khi xử lý video");
        if (videoInputRef.current) {
          videoInputRef.current.value = "";
        }
      }
    
    setIsProcessing(false);
  };

  return (
    <div className="mb-6">
      <h3 className="font-semibold mb-2">Background</h3>
      <div className="flex space-x-2 mb-2">
        <button
          className={`px-3 py-1 rounded ${backgroundType === "color" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setBackgroundType("color")}
        >
          Color
        </button>
        <button
          className={`px-3 py-1 rounded ${backgroundType === "image" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => imageInputRef.current?.click()}
          disabled={isProcessing}
        >
          Image
        </button>
        <button
          className={`px-3 py-1 rounded ${backgroundType === "video" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => videoInputRef.current?.click()}
          disabled={isProcessing}
        >
          Video
        </button>
      </div>

      {/* Input màu nền */}
      {backgroundType === "color" && (
        <div className="mb-2">
          <label className="block text-sm mb-1">Background Color:</label>
          <input
            type="color"
            value={backgroundColor}
            onChange={handleColorChange}
            className="w-full h-8 cursor-pointer"
          />
        </div>
      )}

      {/* Hiển thị trạng thái đang xử lý */}
      {isProcessing && (
        <div className="text-sm text-blue-600 flex items-center">
          <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Đang xử lý...
        </div>
      )}

      {/* Hiển thị thông tin ảnh đã tải */}
      {backgroundType === "image" && backgroundSrc && !isProcessing && (
        <div className="text-sm text-green-600 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="truncate max-w-[180px]" title={backgroundImageName}>
            {backgroundImageName || "Image loaded"}
          </span>
        </div>
      )}

      {/* Hiển thị lỗi ảnh nếu có */}
      {backgroundImageError && (
        <div className="text-sm text-red-600 mt-1">
          Lỗi: {backgroundImageError}
        </div>
      )}

      {/* Hiển thị thông tin video đã tải */}
      {backgroundType === "video" && backgroundSrc && !isProcessing && (
        <div className="text-sm text-green-600 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
      />
          </svg>
          <span className="truncate max-w-[180px]" title={backgroundVideoName}>
            {backgroundVideoName || "Video loaded"}
          </span>
    </div>
      )}

      {/* Hiển thị lỗi video nếu có */}
      {backgroundVideoError && (
        <div className="text-sm text-red-600 mt-1">
          Lỗi: {backgroundVideoError}
        </div>
      )}

      <div className="text-xs text-gray-500 mt-1">
        {backgroundType === "image" 
          ? "Định dạng ảnh hỗ trợ: JPEG, PNG, GIF, WebP" 
          : backgroundType === "video" 
          ? "Định dạng video hỗ trợ: MP4, WebM, OGG"
          : ""}
      </div>

      {/* Input ẩn cho tải lên file */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageUpload}
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={videoInputRef}
        onChange={handleVideoUpload}
        accept="video/mp4,video/webm,video/ogg"
        className="hidden"
      />
    </div>
  );
};
