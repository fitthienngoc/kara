/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
const { exec } = require("child_process");
const fs = require("fs");
const { tmpdir } = require("os");

const kill = require("tree-kill");

// Biến lưu trữ cửa sổ chính
let mainWindow;

function createWindow() {
  // Tạo cửa sổ trình duyệt
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Tải URL của ứng dụng
  const startUrl = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "./build/index.html")}`;

  mainWindow.loadURL(startUrl);

  // Mở DevTools trong môi trường phát triển
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Biến lưu trữ tiến trình render hiện tại
let currentRenderProcess = null;

// Xử lý sự kiện render video
ipcMain.on("render-video", async (event, options) => {
  const { outputPath, videoSettings, audioFile, audioFileName } = options;

  try {
    // In ra thông tin debug
    console.log("Current directory:", __dirname);
    console.log("Audio file name:", audioFileName);
    console.log("Audio file size:", audioFile.length);

    // Tạo thư mục public nếu chưa tồn tại
    const publicDir = path.join(__dirname, "public");
    if (!fs.existsSync(publicDir)) {
      console.log("Creating public directory:", publicDir);
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Xác định đường dẫn đến thư mục public/audio
    const audioDir = path.join(publicDir, "audio");
    if (!fs.existsSync(audioDir)) {
      console.log("Creating audio directory:", audioDir);
      fs.mkdirSync(audioDir, { recursive: true });
    }

    // Tạo tên file duy nhất để tránh xung đột
    const uniqueAudioFileName = `audio-${Date.now()}-${audioFileName}`;
    const audioPath = path.join(audioDir, uniqueAudioFileName);

    console.log("Writing audio file to:", audioPath);

    // Lưu file audio vào thư mục public/audio
    fs.writeFileSync(audioPath, Buffer.from(audioFile));

    // Kiểm tra xem file đã được tạo thành công chưa
    if (fs.existsSync(audioPath)) {
      const stats = fs.statSync(audioPath);
      console.log("Audio file created successfully. Size:", stats.size);
    } else {
      console.error("Failed to create audio file!");
    }

    event.sender.send("render-log", `Saved audio to: ${audioPath}`);

    // Cập nhật cấu hình với đường dẫn audio tương đối cho Remotion
    const settingsWithAudio = {
      ...videoSettings,
      audioSrc: `/audio/${uniqueAudioFileName}`, // Đường dẫn tương đối cho staticFile
    };

    // Lưu cấu hình vào file tạm
    const tempDir = path.join(tmpdir(), `remotion-render-${Date.now()}`);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const settingsPath = path.join(tempDir, "video-settings.json");
    fs.writeFileSync(settingsPath, JSON.stringify(settingsWithAudio, null, 2));

    // In ra nội dung file cấu hình
    console.log(
      "Settings file content:",
      JSON.stringify(settingsWithAudio, null, 2),
    );

    // Tạo lệnh render
    const command = `npx remotion render src/render.ts KaraokeVideoEditor --codec=h264 --props="${settingsPath}" --output="${outputPath}"`;

    // event.sender.send("render-log", `Executing: ${command}`);
    // console.log("Executing command:", command);

    // Thực thi lệnh render
    currentRenderProcess = exec(command);

    // Gửi log về renderer process
    currentRenderProcess.stdout.on("data", (data) => {
      const existLog = ["Render"];

      if (existLog.some((word) => data.toString().includes(word))) {
        event.sender.send("render-log", data.toString());
      }
    });

    currentRenderProcess.stderr.on("data", (data) => {
      const existLog = ["Error", "Warning", "Failed", "Render"];

      if (existLog.some((word) => data.toString().includes(word))) {
        event.sender.send("render-error", data.toString());
      }
    });

    // Khi render hoàn tất
    currentRenderProcess.on("close", (code) => {
      console.log("Render process completed with code:", code);
      currentRenderProcess = null; // Reset tiến trình render

      // Xóa file tạm và file audio
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log("Temp directory removed:", tempDir);

        fs.unlinkSync(audioPath); // Xóa file audio sau khi render xong
        console.log("Audio file removed:", audioPath);
      } catch (err) {
        console.error("Error cleaning up temporary files:", err);
      }
      event.sender.send("render-complete", code === 0);

      if (code === 0) {
        event.sender.send(
          "render-log",
          `Video rendered successfully to ${outputPath}`,
        );
      } else {
        event.sender.send("render-error", `Render failed with code ${code}`);
      }
    });
  } catch (error) {
    console.error("Error in render-video handler:", error);
    event.sender.send(
      "render-error",
      `Error preparing render: ${error.message}`,
    );
    event.sender.send("render-complete", false);
  }
});

// Xử lý sự kiện dừng render
ipcMain.on("stop-render", (event) => {
  if (currentRenderProcess) {
    try {
      // Sử dụng tree-kill để dừng toàn bộ cây tiến trình
      kill(currentRenderProcess.pid, "SIGKILL", (err) => {
        if (err) {
          console.error("Error stopping render process:", err);
          event.sender.send("render-error", "Failed to stop render process.");
        } else {
          console.log("Render process stopped successfully.");
          event.sender.send("render-log", "Render process stopped by user.");
          event.sender.send("render-complete", false); // Thông báo render đã bị dừng
        }
      });

      currentRenderProcess = null; // Reset tiến trình render
    } catch (error) {
      console.error("Error stopping render process:", error);
      event.sender.send("render-error", "Failed to stop render process.");
    }
  } else {
    event.sender.send("render-log", "No render process to stop.");
  }
});

// Thêm vào file main.js
ipcMain.handle("show-save-dialog", async (event, options) => {
  const { defaultPath, filters } = options;
  const result = await dialog.showSaveDialog({
    title: "Chọn nơi lưu video",
    defaultPath: defaultPath || "rendered-video.mp4",
    filters: filters || [
      { name: "MP4 Video", extensions: ["mp4"] },
      { name: "All Files", extensions: ["*"] },
    ],
    properties: ["createDirectory"],
  });

  return result.filePath;
});
