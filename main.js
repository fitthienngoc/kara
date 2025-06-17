import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { join } from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  statSync,
  rmSync,
  unlinkSync,
} from "fs";
import { tmpdir } from "os";
import path from "path";
import kill from "tree-kill";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// nếu không, window sẽ tự động đóng khi đối tượng JavaScript bị thu gom rác
let mainWindow;

function createWindow() {
  // Tạo cửa sổ trình duyệt
  mainWindow = new BrowserWindow({
    width: 1280 * 2,
    height: 800 * 2,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, "preload.js"),
    },
  });

  const isDev = process.env.NODE_ENV !== "production";
  // URL để load
  const startUrl = isDev
    ? "http://localhost:3000" // URL dev server
    : `file://${join(__dirname, "./out/index.html")}`; // URL file đã build

  // Load URL trong cửa sổ
  mainWindow.loadURL(startUrl);

  // Mở DevTools khi đang trong môi trường development
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  // Xử lý khi cửa sổ bị đóng
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Phương thức này sẽ được gọi khi Electron đã hoàn thành
// quá trình khởi tạo và sẵn sàng để tạo các cửa sổ trình duyệt
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    // Trên macOS thường tái tạo cửa sổ trong ứng dụng khi biểu tượng dock
    // được nhấp vào và không có cửa sổ nào khác đang mở.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

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
    const publicDir = join(__dirname, "public");
    if (!existsSync(publicDir)) {
      console.log("Creating public directory:", publicDir);
      mkdirSync(publicDir, { recursive: true });
    }

    // Xác định đường dẫn đến thư mục public/audio
    const audioDir = join(publicDir, "audio");
    if (!existsSync(audioDir)) {
      console.log("Creating audio directory:", audioDir);
      mkdirSync(audioDir, { recursive: true });
    }

    // Tạo tên file duy nhất để tránh xung đột
    const uniqueAudioFileName = `audio-${Date.now()}-${audioFileName}`;
    const audioPath = join(audioDir, uniqueAudioFileName);

    console.log("Writing audio file to:", audioPath);

    // Lưu file audio vào thư mục public/audio
    writeFileSync(audioPath, Buffer.from(audioFile));

    // Kiểm tra xem file đã được tạo thành công chưa
    if (existsSync(audioPath)) {
      const stats = statSync(audioPath);
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
    const tempDir = join(tmpdir(), `remotion-render-${Date.now()}`);
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    const settingsPath = join(tempDir, "video-settings.json");
    writeFileSync(settingsPath, JSON.stringify(settingsWithAudio, null, 2));

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
        rmSync(tempDir, { recursive: true, force: true });
        console.log("Temp directory removed:", tempDir);

        unlinkSync(audioPath); // Xóa file audio sau khi render xong
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
