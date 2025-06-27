// app/api/render/start/route.ts
import { NextResponse } from "next/server";
import path from "path";
import os from "os";
import fs from "fs";
import { writeFile } from "fs/promises";
import { v4 as uuidv4 } from "uuid";

import { KaraokeLine } from "../../../../constants";
import { VideoQualityOption } from "../../../_components/VideoEditorApp/components/WebRenderer";
import { renderVideo } from "../../../../scripts/render";

// ========== Định nghĩa types ==========
interface VideoSettings {
  backgroundType: "video" | "image" | "color";
  backgroundSrc: string;
  backgroundColor: string;
  karaokeLines: KaraokeLine[];
  fps: number;
  width: number;
  height: number;
}

interface QualitySettings {
  crf: VideoQualityOption["crf"];
  x264Preset: VideoQualityOption["x264Preset"];
}

// ========== Helpers ==========
async function parseFormData(request: Request) {
  const formData = await request.formData();
  return {
    audioFile: formData.get("audioFile") as File | null,
    fileName: (formData.get("fileName") as string) || "",
    videoSettings: JSON.parse(
      (formData.get("videoSettings") as string) || "{}",
    ) as VideoSettings,
    qualitySettings: JSON.parse(
      (formData.get("qualitySettings") as string) || "{}",
    ) as QualitySettings,
  };
}

async function saveTempFile(file: File): Promise<string> {
  const filePath = path.join(os.tmpdir(), `${uuidv4()}-${file.name}`);
  await writeFile(filePath, new Uint8Array(await file.arrayBuffer()));
  return filePath;
}

// ========== Hàm chính ==========
export async function POST(request: Request) {
  try {
    const { audioFile, fileName, videoSettings, qualitySettings } =
      await parseFormData(request);
    if (!audioFile) {
      return NextResponse.json({ error: "Thiếu file audio." }, { status: 400 });
    }

    const jobId = `job-${Date.now()}-${uuidv4().slice(0, 8)}`;
    const outputFileName = `${fileName || "rendered"}-${jobId}.mp4`;
    const outputPath = path.join(
      process.cwd(),
      "public",
      "renders",
      outputFileName,
    );
    const audioPath = await saveTempFile(audioFile);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    // Trả jobId về trước
    const response = NextResponse.json({
      jobId,
      status: "started",
      message: "Đã bắt đầu render",
    });

    // Thực hiện render không blocking response
    void renderVideo({
      jobId,
      audioPath,
      outputPath,
      videoSettings,
      qualitySettings,
    });

    return response;
  } catch (err: unknown) {
    console.error("Render failed:", err);
    const errorMessage =
      err instanceof Error
        ? err.message
        : typeof err === "string"
          ? err
          : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
