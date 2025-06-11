// Kiểm tra định dạng file audio được hỗ trợ
export const isAudioFormatSupported = (file: File): boolean => {
  const supportedFormats = [
    "audio/mp3",
    "audio/mpeg",
    "audio/wav",
    "audio/wave",
    "audio/x-wav",
    "audio/ogg",
    "audio/aac",
    "audio/x-m4a",
    "audio/webm",
  ];

  return supportedFormats.includes(file.type);
};

// Kiểm tra định dạng file video được hỗ trợ
export const isVideoFormatSupported = (file: File): boolean => {
  const supportedFormats = ["video/mp4", "video/webm", "video/ogg"];

  return supportedFormats.includes(file.type);
};

// Kiểm tra định dạng file ảnh được hỗ trợ
export const isImageFormatSupported = (file: File): boolean => {
  const supportedFormats = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  return supportedFormats.includes(file.type);
};