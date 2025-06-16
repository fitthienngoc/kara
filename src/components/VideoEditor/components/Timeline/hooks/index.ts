import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import { useState, useRef, useEffect } from "react";
import { delayRender, continueRender, random } from "remotion";
import { TimelineProps } from "..";

export default function useTimeLine({
  karaokeLines,
  setKaraokeLines,
  fps,
  durationInFrames,
  audioSrc,
  onTimeChange,
}: TimelineProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{
    type: "line" | "word";
    lineIndex: number;
    wordIndex?: number;
    edge?: "start" | "end";
  } | null>(null);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [playheadDragging, setPlayheadDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const timelineRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Tính toán tổng thời gian dựa trên fps và số frame
  const totalDuration = durationInFrames / fps;

  // Tính toán độ rộng của timeline dựa trên zoom
  const timelineWidth = totalDuration * 100 * zoom; // 100px cho mỗi giây

  // Tính toán vị trí pixel từ thời gian
  const timeToPosition = (time: number) => time * 100 * zoom;

  // Tính toán thời gian từ vị trí pixel
  const positionToTime = (position: number) => position / (100 * zoom);

  // Tính toán frame từ thời gian
  const timeToFrame = (time: number) => Math.round(time * fps);

  // Tính toán thời gian từ frame
  const frameToTime = (frame: number) => frame / fps;

  // Sử dụng Remotion để lấy dữ liệu audio - luôn gọi hook, nhưng chỉ sử dụng kết quả khi có audioSrc
  const audioData = useAudioData(audioSrc || "");

  const hasValidAudioData = audioSrc && audioData;

  // Xử lý khi audio được tải
  useEffect(() => {
    if (audioSrc && audioRef.current) {
      audioRef.current.src = audioSrc;
      audioRef.current.onloadedmetadata = () => {
        if (audioRef.current) {
          setAudioLoaded(true);
          setAudioDuration(audioRef.current.duration);
        }
      };
    }
  }, [audioSrc]);

  // Xử lý sự kiện play/pause cho audio
  useEffect(() => {
    const audioElement = audioRef.current;

    if (audioElement) {
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => setIsPlaying(false);

      audioElement.addEventListener("play", handlePlay);
      audioElement.addEventListener("pause", handlePause);
      audioElement.addEventListener("ended", handleEnded);

      return () => {
        audioElement.removeEventListener("play", handlePlay);
        audioElement.removeEventListener("pause", handlePause);
        audioElement.removeEventListener("ended", handleEnded);
      };
    }
  }, []);

  // Vẽ waveform khi có dữ liệu audio
  useEffect(() => {
    const drawWaveform = async () => {
      if (!hasValidAudioData || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = (canvas.width = timelineWidth);
      const height = (canvas.height = 80);

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#121212";
      ctx.fillRect(0, 0, width, height);

      // Sử dụng visualizeAudio từ Remotion để tạo waveform
      try {
        // Số lượng mẫu dựa trên độ rộng của canvas
        const numberOfSamples = Math.min(width, 1000);

        // Tạo handle để delay render nếu cần
        const handle = delayRender("Visualizing audio");

        // Tạo dữ liệu waveform từ audioData
        const visualization = await visualizeAudio({
          audioData,
          numberOfSamples,
          fps,
          frame: 0, // Lấy toàn bộ audio
        });

        // Tiếp tục render sau khi đã hoàn thành
        continueRender(handle);

        // Vẽ waveform với kiểu đối xứng
        const barWidth = width / numberOfSamples;

        // Tạo gradient cho phần trên
        const gradientTop = ctx.createLinearGradient(0, 0, 0, height / 2);
        gradientTop.addColorStop(0, "rgba(33, 150, 243, 0.7)"); // Xanh dương đậm ở trên cùng
        gradientTop.addColorStop(1, "rgba(76, 175, 80, 0.3)"); // Xanh lá nhạt ở giữa

        // Tạo gradient cho phần dưới
        const gradientBottom = ctx.createLinearGradient(
          0,
          height / 2,
          0,
          height,
        );
        gradientBottom.addColorStop(0, "rgba(76, 175, 80, 0.3)"); // Xanh lá nhạt ở giữa
        gradientBottom.addColorStop(1, "rgba(33, 150, 243, 0.7)"); // Xanh dương đậm ở dưới cùng

        // Vẽ nền
        ctx.fillStyle = "rgba(20, 20, 20, 0.5)";
        ctx.fillRect(0, 0, width, height);

        // Vẽ lưới
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;

        // Vẽ lưới ngang
        for (let i = 0; i < height; i += 10) {
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(width, i);
          ctx.stroke();
        }

        // Vẽ lưới dọc
        for (let i = 0; i < width; i += 50) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, height);
          ctx.stroke();
        }

        // Vẽ đường trung tâm
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.stroke();

        // Vẽ sóng âm phần trên (phần dương)
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        visualization.forEach((sample, index) => {
          const x = index * barWidth;
          // Chỉ lấy giá trị dương của sample (0 đến 1)
          const y = height / 2 - Math.abs(sample) * height * 0.4;

          if (index === 0) {
            ctx.lineTo(x, y);
          } else {
            // Sử dụng bezierCurveTo để tạo đường cong mượt mà
            const prevX = (index - 1) * barWidth;
            const prevY =
              height / 2 - Math.abs(visualization[index - 1]) * height * 0.4;
            const cpX1 = prevX + (x - prevX) / 3;
            const cpX2 = prevX + ((x - prevX) * 2) / 3;

            ctx.bezierCurveTo(cpX1, prevY, cpX2, y, x, y);
          }
        });
        ctx.lineTo(width, height / 2);
        ctx.closePath();
        ctx.fillStyle = gradientTop;
        ctx.fill();

        // Vẽ đường viền phần trên
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        visualization.forEach((sample, index) => {
          const x = index * barWidth;
          const y = height / 2 - Math.abs(sample) * height * 0.4;

          if (index === 0) {
            ctx.lineTo(x, y);
          } else {
            // Sử dụng bezierCurveTo để tạo đường cong mượt mà
            const prevX = (index - 1) * barWidth;
            const prevY =
              height / 2 - Math.abs(visualization[index - 1]) * height * 0.4;
            const cpX1 = prevX + (x - prevX) / 3;
            const cpX2 = prevX + ((x - prevX) * 2) / 3;

            ctx.bezierCurveTo(cpX1, prevY, cpX2, y, x, y);
          }
        });
        ctx.strokeStyle = "rgba(76, 175, 80, 0.8)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Vẽ sóng âm phần dưới (phản chiếu)
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        visualization.forEach((sample, index) => {
          const x = index * barWidth;
          // Phản chiếu xuống dưới
          const y = height / 2 + Math.abs(sample) * height * 0.4;

          if (index === 0) {
            ctx.lineTo(x, y);
          } else {
            // Sử dụng bezierCurveTo để tạo đường cong mượt mà
            const prevX = (index - 1) * barWidth;
            const prevY =
              height / 2 + Math.abs(visualization[index - 1]) * height * 0.4;
            const cpX1 = prevX + (x - prevX) / 3;
            const cpX2 = prevX + ((x - prevX) * 2) / 3;

            ctx.bezierCurveTo(cpX1, prevY, cpX2, y, x, y);
          }
        });
        ctx.lineTo(width, height / 2);
        ctx.closePath();
        ctx.fillStyle = gradientBottom;
        ctx.fill();

        // Vẽ đường viền phần dưới
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        visualization.forEach((sample, index) => {
          const x = index * barWidth;
          const y = height / 2 + Math.abs(sample) * height * 0.4;

          if (index === 0) {
            ctx.lineTo(x, y);
          } else {
            // Sử dụng bezierCurveTo để tạo đường cong mượt mà
            const prevX = (index - 1) * barWidth;
            const prevY =
              height / 2 + Math.abs(visualization[index - 1]) * height * 0.4;
            const cpX1 = prevX + (x - prevX) / 3;
            const cpX2 = prevX + ((x - prevX) * 2) / 3;

            ctx.bezierCurveTo(cpX1, prevY, cpX2, y, x, y);
          }
        });
        ctx.strokeStyle = "rgba(33, 150, 243, 0.8)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Thêm hiệu ứng glow
        ctx.shadowColor = "rgba(76, 175, 80, 0.5)";
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        visualization.forEach((sample, index) => {
          const x = index * barWidth;
          const y = height / 2 - Math.abs(sample) * height * 0.4;

          if (index === 0) {
            ctx.lineTo(x, y);
          } else {
            const prevX = (index - 1) * barWidth;
            const prevY =
              height / 2 - Math.abs(visualization[index - 1]) * height * 0.4;
            const cpX1 = prevX + (x - prevX) / 3;
            const cpX2 = prevX + ((x - prevX) * 2) / 3;

            ctx.bezierCurveTo(cpX1, prevY, cpX2, y, x, y);
          }
        });
        ctx.strokeStyle = "rgba(76, 175, 80, 0.8)";
        ctx.stroke();

        // Reset shadow
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      } catch (error) {
        console.error("Không thể tạo waveform:", error);

        // Fallback: tạo waveform giả lập nếu không thể sử dụng Remotion
        const sampleCount = Math.floor(audioDuration * 10);
        const samples = Array.from({ length: sampleCount }, (_, i) => {
          // Sử dụng random từ Remotion với seed là index để có kết quả xác định
          return random(`waveform-${i}`) * 0.8 + 0.2;
        });

        // Vẽ waveform kiểu đối xứng với dữ liệu giả lập
        const barWidth = width / sampleCount;

        // Tạo gradient cho phần trên
        const gradientTop = ctx.createLinearGradient(0, 0, 0, height / 2);
        gradientTop.addColorStop(0, "rgba(33, 150, 243, 0.7)");
        gradientTop.addColorStop(1, "rgba(76, 175, 80, 0.3)");

        // Tạo gradient cho phần dưới
        const gradientBottom = ctx.createLinearGradient(
          0,
          height / 2,
          0,
          height,
        );
        gradientBottom.addColorStop(0, "rgba(76, 175, 80, 0.3)");
        gradientBottom.addColorStop(1, "rgba(33, 150, 243, 0.7)");

        // Vẽ nền
        ctx.fillStyle = "rgba(20, 20, 20, 0.5)";
        ctx.fillRect(0, 0, width, height);

        // Vẽ lưới
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;

        // Vẽ lưới ngang
        for (let i = 0; i < height; i += 10) {
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(width, i);
          ctx.stroke();
        }

        // Vẽ lưới dọc
        for (let i = 0; i < width; i += 50) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, height);
          ctx.stroke();
        }

        // Vẽ đường trung tâm
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.stroke();

        // Vẽ sóng âm phần trên
        ctx.beginPath();
        ctx.moveTo(0, height / 2);

        // Tạo các điểm điều khiển cho đường cong Bezier
        for (let i = 0; i < samples.length; i++) {
          const x = i * barWidth;
          const amplitude = (samples[i] - 0.5) * 2; // Chuyển về dải -1 đến 1
          const y = height / 2 - Math.abs(amplitude) * height * 0.4;

          if (i === 0) {
            ctx.lineTo(x, y);
          } else {
            // Tạo đường cong mượt mà
            const prevX = (i - 1) * barWidth;
            const prevAmplitude = (samples[i - 1] - 0.5) * 2;
            const prevY = height / 2 - Math.abs(prevAmplitude) * height * 0.4;
            const cpX1 = prevX + (x - prevX) / 3;
            const cpX2 = prevX + ((x - prevX) * 2) / 3;

            ctx.bezierCurveTo(cpX1, prevY, cpX2, y, x, y);
          }
        }
        ctx.lineTo(width, height / 2);
        ctx.closePath();
        ctx.fillStyle = gradientTop;
        ctx.fill();

        // Vẽ đường viền phần trên
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        for (let i = 0; i < samples.length; i++) {
          const x = i * barWidth;
          const amplitude = (samples[i] - 0.5) * 2;
          const y = height / 2 - Math.abs(amplitude) * height * 0.4;

          if (i === 0) {
            ctx.lineTo(x, y);
          } else {
            const prevX = (i - 1) * barWidth;
            const prevAmplitude = (samples[i - 1] - 0.5) * 2;
            const prevY = height / 2 - Math.abs(prevAmplitude) * height * 0.4;
            const cpX1 = prevX + (x - prevX) / 3;
            const cpX2 = prevX + ((x - prevX) * 2) / 3;

            ctx.bezierCurveTo(cpX1, prevY, cpX2, y, x, y);
          }
        }
        ctx.strokeStyle = "rgba(76, 175, 80, 0.8)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Vẽ sóng âm phần dưới (phản chiếu)
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        for (let i = 0; i < samples.length; i++) {
          const x = i * barWidth;
          const amplitude = (samples[i] - 0.5) * 2;
          const y = height / 2 + Math.abs(amplitude) * height * 0.4;

          if (i === 0) {
            ctx.lineTo(x, y);
          } else {
            const prevX = (i - 1) * barWidth;
            const prevAmplitude = (samples[i - 1] - 0.5) * 2;
            const prevY = height / 2 + Math.abs(prevAmplitude) * height * 0.4;
            const cpX1 = prevX + (x - prevX) / 3;
            const cpX2 = prevX + ((x - prevX) * 2) / 3;

            ctx.bezierCurveTo(cpX1, prevY, cpX2, y, x, y);
          }
        }
        ctx.lineTo(width, height / 2);
        ctx.closePath();
        ctx.fillStyle = gradientBottom;
        ctx.fill();

        // Vẽ đường viền phần dưới
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        for (let i = 0; i < samples.length; i++) {
          const x = i * barWidth;
          const amplitude = (samples[i] - 0.5) * 2;
          const y = height / 2 + Math.abs(amplitude) * height * 0.4;

          if (i === 0) {
            ctx.lineTo(x, y);
          } else {
            const prevX = (i - 1) * barWidth;
            const prevAmplitude = (samples[i - 1] - 0.5) * 2;
            const prevY = height / 2 + Math.abs(prevAmplitude) * height * 0.4;
            const cpX1 = prevX + (x - prevX) / 3;
            const cpX2 = prevX + ((x - prevX) * 2) / 3;

            ctx.bezierCurveTo(cpX1, prevY, cpX2, y, x, y);
          }
        }
        ctx.strokeStyle = "rgba(33, 150, 243, 0.8)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Thêm hiệu ứng glow
        ctx.shadowColor = "rgba(76, 175, 80, 0.5)";
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        for (let i = 0; i < samples.length; i++) {
          const x = i * barWidth;
          const amplitude = (samples[i] - 0.5) * 2;
          const y = height / 2 - Math.abs(amplitude) * height * 0.4;

          if (i === 0) {
            ctx.lineTo(x, y);
          } else {
            const prevX = (i - 1) * barWidth;
            const prevAmplitude = (samples[i - 1] - 0.5) * 2;
            const prevY = height / 2 - Math.abs(prevAmplitude) * height * 0.4;
            const cpX1 = prevX + (x - prevX) / 3;
            const cpX2 = prevX + ((x - prevX) * 2) / 3;

            ctx.bezierCurveTo(cpX1, prevY, cpX2, y, x, y);
          }
        }
        ctx.strokeStyle = "rgba(76, 175, 80, 0.8)";
        ctx.stroke();

        // Reset shadow
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }
    };

    if (hasValidAudioData && audioLoaded && audioDuration > 0) {
      drawWaveform();
    }
  }, [
    audioData,
    audioLoaded,
    audioDuration,
    timelineWidth,
    fps,
    hasValidAudioData,
  ]);

  // Xử lý khi kéo thả các phần tử
  const handleMouseDown = (
    e: React.MouseEvent,
    type: "line" | "word",
    lineIndex: number,
    wordIndex?: number,
    edge?: "start" | "end",
  ) => {
    setIsDragging(true);
    setDraggedItem({ type, lineIndex, wordIndex, edge });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !draggedItem || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const newTime = positionToTime(offsetX);
    const newFrame = timeToFrame(newTime);

    // Clone karaokeLines để cập nhật
    const updatedLines = [...karaokeLines];
    const { type, lineIndex, wordIndex, edge } = draggedItem;

    const line = updatedLines[lineIndex];
    if (type === "line") {
      if (!line || line.startTime === undefined || line.endTime === undefined)
        return;

      if (edge === "start") {
        // Đảm bảo startTime không vượt quá endTime
        const newStartTime = Math.min(newFrame, line.endTime - 1);
        line.startTime = newStartTime;

        // Cập nhật startTime của từ đầu tiên
        if (line.words.length > 0) {
          line.words[0].startTime = newStartTime;
        }
      } else if (edge === "end") {
        // Đảm bảo endTime không nhỏ hơn startTime
        const newEndTime = Math.max(newFrame, line.startTime + 1);
        line.endTime = newEndTime;

        // Cập nhật endTime của từ cuối cùng
        if (line.words.length > 0) {
          line.words[line.words.length - 1].endTime = newEndTime;
        }
      } else {
        // Di chuyển cả dòng
        const duration = line.endTime - line.startTime;
        line.startTime = newFrame;
        line.endTime = newFrame + duration;

        // Cập nhật thời gian cho tất cả các từ
        const wordDuration = duration / line.words.length;
        line.words.forEach((word, idx) => {
          if (line.startTime === undefined) return;

          word.startTime = line.startTime + idx * wordDuration;
          word.endTime = word.startTime + wordDuration;
        });
      }
    } else if (type === "word" && typeof wordIndex === "number") {
      if (!line || !line.words[wordIndex]) return;

      if (edge === "start") {
        if (line.words[wordIndex].endTime === undefined) return;

        // Đảm bảo startTime không vượt quá endTime
        line.words[wordIndex].startTime = Math.min(
          newFrame,
          line.words[wordIndex].endTime - 1,
        );

        // Nếu là từ đầu tiên, cập nhật startTime của dòng
        if (wordIndex === 0) {
          line.startTime = line.words[wordIndex].startTime;
        }
      } else if (edge === "end") {
        if (line.words[wordIndex].startTime === undefined) return;
        // Đảm bảo endTime không nhỏ hơn startTime
        line.words[wordIndex].endTime = Math.max(
          newFrame,
          line.words[wordIndex].startTime + 1,
        );

        // Nếu là từ cuối cùng, cập nhật endTime của dòng
        if (wordIndex === line.words.length - 1) {
          line.endTime = line.words[wordIndex].endTime;
        }
      } else {
        if (
          line.words[wordIndex].startTime === undefined ||
          line.words[wordIndex].endTime === undefined
        )
          return;
        // Di chuyển cả từ
        const duration =
          line.words[wordIndex].endTime - line.words[wordIndex].startTime;
        line.words[wordIndex].startTime = newFrame;
        line.words[wordIndex].endTime = newFrame + duration;

        // Cập nhật startTime và endTime của dòng nếu cần
        if (wordIndex === 0) {
          line.startTime = line.words[wordIndex].startTime;
        }
        if (wordIndex === line.words.length - 1) {
          line.endTime = line.words[wordIndex].endTime;
        }
      }
    }

    setKaraokeLines(updatedLines);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedItem(null);
  };

  // Xử lý khi thay đổi zoom
  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoom(parseFloat(e.target.value));
  };

  // Xử lý khi click vào timeline để di chuyển playhead
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const newTime = positionToTime(offsetX);

    setCurrentTime(newTime);

    // Đồng bộ với audio player
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }

    // Thông báo thay đổi thời gian cho component cha
    if (onTimeChange) {
      onTimeChange(newTime);
    }
  };

  // Xử lý khi bắt đầu kéo playhead
  const handlePlayheadMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPlayheadDragging(true);

    // Thêm event listeners để theo dõi kéo chuột
    document.addEventListener("mousemove", handlePlayheadMouseMove);
    document.addEventListener("mouseup", handlePlayheadMouseUp);
  };

  // Xử lý khi kéo playhead
  const handlePlayheadMouseMove = (e: MouseEvent) => {
    if (!playheadDragging || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(e.clientX - rect.left, timelineWidth));
    const newTime = positionToTime(offsetX);

    setCurrentTime(newTime);

    // Đồng bộ với audio player
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  // Xử lý khi thả playhead
  const handlePlayheadMouseUp = () => {
    setPlayheadDragging(false);

    // Gỡ bỏ event listeners
    document.removeEventListener("mousemove", handlePlayheadMouseMove);
    document.removeEventListener("mouseup", handlePlayheadMouseUp);

    // Thông báo thay đổi thời gian cho component cha
    if (onTimeChange) {
      onTimeChange(currentTime);
    }
  };

  // Xử lý khi audio đang phát
  const handleTimeUpdate = () => {
    if (audioRef.current && !playheadDragging) {
      const newTime = audioRef.current.currentTime;
      setCurrentTime(newTime);

      // Thông báo thay đổi thời gian cho component cha
      if (onTimeChange) {
        onTimeChange(newTime);
      }
    }
  };

  // Xử lý khi nhấn nút play/pause
  const togglePlay = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  };
  return {
    currentTime,
    zoom,
    isDragging,
    draggedItem,
    audioLoaded,
    audioDuration,
    playheadDragging,
    isPlaying,
    setIsPlaying,
    timelineRef,
    audioRef,
    canvasRef,
    timelineWidth,
    timeToPosition,
    positionToTime,
    timeToFrame,
    frameToTime,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleZoomChange,
    handleTimelineClick,
    handlePlayheadMouseDown,
    handlePlayheadMouseMove,
    handlePlayheadMouseUp,
    handleTimeUpdate,
    togglePlay,
    totalDuration,
  };
}
