"use client";

import { bundle } from "@remotion/bundler";
import {
  getCompositions,
  renderMedia,
  RenderMediaOptions,
} from "@remotion/renderer";
import path from "path";
import os from "os";
import fs from "fs";
import { KaraokeLine } from "../constants";
import { VideoQualityOption } from "../app/_components/VideoEditorApp/components/WebRenderer";

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

interface RenderParams {
  jobId: string;
  audioPath: string;
  outputPath: string;
  videoSettings: VideoSettings;
  qualitySettings: QualitySettings;
}

type JobStatus = "started" | "processing" | "completed" | "failed";

// Ghi file job status ra JSON trong thư mục /public/jobs
function updateJobStatus(
  jobId: string,
  status: JobStatus,
  progress: number,
  downloadUrl?: string,
  error?: string,
) {
  const JOBS_DIR = path.join(process.cwd(), "public", "jobs");
  fs.mkdirSync(JOBS_DIR, { recursive: true });

  const jobPath = path.join(JOBS_DIR, `${jobId}.json`);
  const newLog = `[${new Date().toLocaleTimeString()}] ${status}: ${progress}%`;

  let logs: string[] = [];
  if (fs.existsSync(jobPath)) {
    try {
      const prev = JSON.parse(fs.readFileSync(jobPath, "utf8"));
      if (Array.isArray(prev.logs)) logs = prev.logs;
    } catch (err) {
      console.warn("Không đọc được logs cũ:", err);
    }
  }

  const job = {
    jobId,
    status,
    progress,
    downloadUrl,
    error,
    updatedAt: new Date().toISOString(),
    logs: [...logs, newLog],
  };

  fs.writeFileSync(jobPath, JSON.stringify(job, null, 2));
}

export async function renderVideo({
  jobId,
  audioPath,
  outputPath,
  videoSettings,
  qualitySettings,
}: RenderParams) {
  try {
    updateJobStatus(jobId, "processing", 0);

    const serveUrl = await bundle({
      entryPoint: path.join(process.cwd(), "src", "remotion", "index.ts"),
      outDir: path.join(os.tmpdir(), "remotion-bundle", jobId),
    });

    const comps = await getCompositions(serveUrl, {
      inputProps: {
        audioSrc: `file://${audioPath}`,
        ...videoSettings,
      },
    });

    const comp = comps.find((c) => c.id === "KaraokeVideoEditor");
    if (!comp) {
      throw new Error("Không tìm thấy composition");
    }

    const options: RenderMediaOptions = {
      composition: comp,
      serveUrl,
      codec: "h264",
      outputLocation: outputPath,
      inputProps: {
        audioSrc: `file://${audioPath}`,
        ...videoSettings,
      },
      ...qualitySettings,
      onProgress: (p) =>
        updateJobStatus(jobId, "processing", Math.floor(p.progress * 100)),
    };

    await renderMedia(options);

    updateJobStatus(
      jobId,
      "completed",
      100,
      `/renders/${path.basename(outputPath)}`,
    );
  } catch (err: unknown) {
    let errorMessage = "Unknown error";
    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === "string") {
      errorMessage = err;
    }
    updateJobStatus(jobId, "failed", 0, undefined, errorMessage);
  } finally {
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
  }
}
