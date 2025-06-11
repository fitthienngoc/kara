// Kiểm tra ảnh có tải được không
export const checkImageLoadability = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      resolve(true);
    };
    
    img.onerror = () => {
      resolve(false);
    };
    
    img.src = url;
    
    // Timeout sau 3 giây nếu không có phản hồi
    setTimeout(() => {
      if (!img.complete) {
        resolve(false);
      }
    }, 3000);
  });
};

// Kiểm tra video có tải được không
export const checkVideoPlayability = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    
    video.oncanplaythrough = () => {
      resolve(true);
      video.oncanplaythrough = null;
    };
    
    video.onerror = () => {
      resolve(false);
      video.onerror = null;
    };
    
    video.src = url;
    video.load();
    
    // Timeout sau 3 giây nếu không có phản hồi
    setTimeout(() => {
      if (video.readyState < 3) {
        resolve(false);
      }
    }, 3000);
  });
};

// Kiểm tra file audio có phát được không
export const checkAudioPlayability = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const audio = document.createElement("audio");

    audio.oncanplaythrough = () => {
      resolve(true);
      audio.oncanplaythrough = null;
    };

    audio.onerror = () => {
      resolve(false);
      audio.onerror = null;
    };

    audio.src = url;
    audio.load();

    // Timeout sau 3 giây nếu không có phản hồi
    setTimeout(() => {
      if (audio.readyState < 3) {
        resolve(false);
      }
    }, 3000);
  });
};