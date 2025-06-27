// app/api/render/stop/route.ts
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const JOBS_DIR = path.join(process.cwd(), "public", "jobs");

export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json();

    if (!jobId) {
      return NextResponse.json({ error: "Thiếu jobId" }, { status: 400 });
    }

    const jobPath = path.join(JOBS_DIR, `${jobId}.json`);

    if (!fs.existsSync(jobPath)) {
      return NextResponse.json(
        { error: "Không tìm thấy job" },
        { status: 404 },
      );
    }

    const job = JSON.parse(fs.readFileSync(jobPath, "utf-8"));

    if (job.status === "completed" || job.status === "failed") {
      return NextResponse.json({
        message: "Job đã hoàn thành hoặc thất bại, không thể dừng",
      });
    }

    const now = new Date().toISOString();
    const newLog = `[${new Date().toLocaleTimeString()}] stopped: dừng bởi người dùng`;

    const updated = {
      ...job,
      status: "failed",
      error: "Render bị dừng bởi người dùng",
      updatedAt: now,
      logs: [...(job.logs || []), newLog],
    };

    fs.writeFileSync(jobPath, JSON.stringify(updated, null, 2));

    return NextResponse.json({ message: "Đã dừng job thành công" });
  } catch (err: unknown) {
    console.error("Lỗi khi dừng job:", err);
    return NextResponse.json({ error: "Lỗi khi dừng job" }, { status: 500 });
  }
}
