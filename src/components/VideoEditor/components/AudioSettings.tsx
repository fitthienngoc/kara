import React from "react";
import { isAudioFormatSupported } from "../utils/formatCheckers";
import { checkAudioPlayability } from "../utils/mediaCheckers";

interface AudioSettingsProps {
  audioSrc: string;
  setAudioSrc: (src: string) => void;
  audioInputRef: React.RefObject<HTMLInputElement | null>;
}

export const AudioSettings: React.FC<AudioSettingsProps> = ({
  audioSrc,
  setAudioSrc,
  audioInputRef,
}) => {
  const [audioError, setAudioError] = React.useState<string | null>(null);
  const [audioFileName, setAudioFileName] = React.useState<string>("");

  // Xử lý tải lên file âm thanh
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Reset lỗi
      setAudioError(null);

      // Kiểm tra định dạng file
      if (!isAudioFormatSupported(file)) {
        setAudioError(`Định dạng file "${file.type}" không được hỗ trợ`);
        if (audioInputRef.current) {
          audioInputRef.current.value = "";
        }
        return;
      }

      // Giải phóng URL cũ nếu có
      if (audioSrc && audioSrc.startsWith("blob:")) {
        URL.revokeObjectURL(audioSrc);
      }

      // Tạo URL mới
      const url = URL.createObjectURL(file);

      // Kiểm tra xem file có phát được không
      const canPlay = await checkAudioPlayability(url);

      if (canPlay) {
        setAudioSrc(url);
        setAudioFileName(file.name);
        console.log(
          `Đã tải file audio: ${file.name} (${file.type}, ${Math.round(file.size / 1024)} KB)`
        );
      } else {
        setAudioError("File audio không thể phát. Vui lòng thử file khác.");
        URL.revokeObjectURL(url);
        if (audioInputRef.current) {
          audioInputRef.current.value = "";
        }
      }
    }
  };

  return (
    <div className="mb-6">
      <h3 className="font-semibold mb-2">Audio</h3>
      <button
        className="bg-blue-500 text-white px-3 py-1 rounded mb-2"
        onClick={() => audioInputRef.current?.click()}
      >
        {audioSrc ? "Change Audio" : "Upload Audio"}
      </button>

      {audioSrc && (
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
          <span className="truncate max-w-[180px]" title={audioFileName}>
            {audioFileName || "Audio loaded"}
          </span>
        </div>
      )}

      {audioError && (
        <div className="text-sm text-red-600 mt-1">Lỗi: {audioError}</div>
      )}

      <div className="text-xs text-gray-500 mt-1">
        Định dạng hỗ trợ: MP3, WAV, OGG
      </div>

      <input
        type="file"
        ref={audioInputRef}
        onChange={handleAudioUpload}
        accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg"
        className="hidden"
      />
    </div>
  );
};