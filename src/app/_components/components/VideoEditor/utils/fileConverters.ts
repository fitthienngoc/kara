import {
  checkAudioPlayability,
  checkImageLoadability,
  checkVideoPlayability,
} from "./mediaCheckers";

// Chuyển đổi file thành base64 data URL
export const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result as string);
    };

    reader.onerror = () => {
      reject(new Error("Không thể đọc file"));
    };

    reader.readAsDataURL(file);
  });
};

// Chuyển đổi file ảnh thành data URL và kiểm tra khả năng tải
export const processImageFile = async (
  file: File,
): Promise<{ success: boolean; dataURL?: string; error?: string }> => {
  try {
    const dataURL = await fileToDataURL(file);

    // Kiểm tra xem ảnh có tải được không
    const canLoad = await checkImageLoadability(dataURL);

    if (canLoad) {
      return { success: true, dataURL };
    } else {
      return {
        success: false,
        error: "File ảnh không thể tải. Vui lòng thử file khác.",
      };
    }
  } catch {
    return { success: false, error: "Lỗi khi xử lý file ảnh." };
  }
};

// Chuyển đổi file video thành data URL và kiểm tra khả năng phát
export const processVideoFile = async (
  file: File,
): Promise<{ success: boolean; dataURL?: string; error?: string }> => {
  try {
    const dataURL = await fileToDataURL(file);

    // Kiểm tra xem video có phát được không
    const canPlay = await checkVideoPlayability(dataURL);

    if (canPlay) {
      return { success: true, dataURL };
    } else {
      return {
        success: false,
        error: "File video không thể phát. Vui lòng thử file khác.",
      };
    }
  } catch {
    return { success: false, error: "Lỗi khi xử lý file video." };
  }
};

// Chuyển đổi file audio thành data URL và kiểm tra khả năng phát
export const processAudioFile = async (
  file: File,
): Promise<{ success: boolean; dataURL?: string; error?: string }> => {
  try {
    const dataURL = await fileToDataURL(file);

    // Kiểm tra xem audio có phát được không
    const canPlay = await checkAudioPlayability(dataURL);

    if (canPlay) {
      return { success: true, dataURL };
    } else {
      return {
        success: false,
        error: "File audio không thể phát. Vui lòng thử file khác.",
      };
    }
  } catch {
    return { success: false, error: "Lỗi khi xử lý file audio." };
  }
};
