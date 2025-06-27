// app/api/render/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

// Cấu hình thư mục lưu trạng thái job
const JOBS_DIR = path.join(process.cwd(), "public", "jobs");

export async function GET(req: NextRequest) {
  try {
    const jobId = req.nextUrl.searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "Thiếu tham số jobId" },
        { status: 400 },
      );
    }

    const jobPath = path.join(JOBS_DIR, `${jobId}.json`);

    if (!fs.existsSync(jobPath)) {
      return NextResponse.json(
        { status: "not_found", message: "Không tìm thấy job" },
        { status: 404 },
      );
    }

    const jobData = JSON.parse(fs.readFileSync(jobPath, "utf8"));

    return NextResponse.json({
      jobId: jobData.jobId,
      status: jobData.status,
      progress: jobData.progress,
      downloadUrl: jobData.downloadUrl,
      error: jobData.error,
      logs: jobData.logs || [],
      updatedAt: jobData.updatedAt,
    });
  } catch (err: unknown) {
    console.error("Lỗi khi đọc trạng thái job:", err);
    return NextResponse.json(
      { error: "Lỗi không xác định khi đọc trạng thái job" },
      { status: 500 },
    );
  }
}
