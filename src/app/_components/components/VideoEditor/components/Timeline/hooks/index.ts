import { useState, useRef, useEffect } from "react";
import { TimelineProps } from "..";

// Thêm hàm này để tìm lũy thừa của 2 gần nhất

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
      if (!audioSrc || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = (canvas.width = timelineWidth);
      const height = (canvas.height = 80);

      // Xóa canvas
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#121212";
      ctx.fillRect(0, 0, width, height);

      try {
        console.log("Bắt đầu tạo waveform cho:", audioSrc);

        // Tạo AudioContext mới
        const audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();

        // Fetch audio file
        const response = await fetch(audioSrc);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        console.log("Đã tải audio buffer, kích thước:", arrayBuffer.byteLength);

        // Decode audio data
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log(
          "Đã decode audio, duration:",
          audioBuffer.duration,
          "số kênh:",
          audioBuffer.numberOfChannels,
        );

        // Lấy dữ liệu âm thanh (lấy kênh đầu tiên nếu stereo)
        const channelData = audioBuffer.getChannelData(0);
        console.log("Đã lấy channel data, số mẫu:", channelData.length);

        // Xác định số lượng mẫu dựa trên độ rộng của canvas
        const step = Math.ceil(channelData.length / width);
        const samples = [];

        // Xử lý dữ liệu âm thanh để giảm số lượng điểm vẽ
        for (let i = 0; i < width; i++) {
          const startIndex = Math.floor(i * step);
          const endIndex = Math.min(startIndex + step, channelData.length);

          // Tính peak (giá trị tuyệt đối lớn nhất) cho mỗi đoạn
          let max = 0;
          for (let j = startIndex; j < endIndex; j++) {
            const amplitude = Math.abs(channelData[j]);
            if (amplitude > max) max = amplitude;
          }
          samples.push(max);
        }

        console.log("Đã xử lý dữ liệu, số mẫu:", samples.length);
        console.log("Giá trị mẫu (10 đầu tiên):", samples.slice(0, 10));

        // Tìm giá trị peak để chuẩn hóa
        const peak = Math.max(...samples) || 1;
        console.log("Peak value:", peak);

        // Vẽ waveform
        const centerY = height / 2;

        // Tạo gradient cho phần trên
        const gradientTop = ctx.createLinearGradient(0, 0, 0, centerY);
        gradientTop.addColorStop(0, "rgba(33, 150, 243, 0.8)");
        gradientTop.addColorStop(1, "rgba(76, 175, 80, 0.4)");

        // Tạo gradient cho phần dưới
        const gradientBottom = ctx.createLinearGradient(0, centerY, 0, height);
        gradientBottom.addColorStop(0, "rgba(76, 175, 80, 0.4)");
        gradientBottom.addColorStop(1, "rgba(33, 150, 243, 0.8)");

        // Vẽ waveform
        // Phần trên của waveform
        ctx.beginPath();
        ctx.moveTo(0, centerY);

        for (let i = 0; i < samples.length; i++) {
          const x = i;
          // Tăng hệ số khuếch đại để waveform rõ ràng hơn
          const amplifier = 1.5;
          const normalizedValue = (samples[i] / peak) * amplifier;
          // Đảm bảo waveform không vượt quá kích thước canvas
          const y = Math.max(0, centerY - normalizedValue * centerY * 0.9);

          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, centerY);
        ctx.closePath();
        ctx.fillStyle = gradientTop;
        ctx.fill();

        // Phần dưới của waveform
        ctx.beginPath();
        ctx.moveTo(0, centerY);

        for (let i = 0; i < samples.length; i++) {
          const x = i;
          const amplifier = 1.5;
          const normalizedValue = (samples[i] / peak) * amplifier;
          // Đảm bảo waveform không vượt quá kích thước canvas
          const y = Math.min(height, centerY + normalizedValue * centerY * 0.9);

          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, centerY);
        ctx.closePath();
        ctx.fillStyle = gradientBottom;
        ctx.fill();

        // Vẽ đường trung tâm
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 1;
        ctx.stroke();

        console.log("Vẽ waveform hoàn tất");
      } catch (error) {
        console.error("Lỗi khi vẽ waveform:", error);

        // Fallback: vẽ waveform giả khi có lỗi
        const centerY = height / 2;

        // Vẽ thông báo lỗi lên canvas
        ctx.font = "14px Arial";
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.textAlign = "center";
        ctx.fillText("Không thể hiển thị waveform", width / 2, centerY - 20);

        // Vẽ một đường sóng giả đơn giản
        ctx.beginPath();
        ctx.moveTo(0, centerY);

        for (let i = 0; i < width; i += 3) {
          const randomHeight = Math.random() * (height / 4);
          ctx.lineTo(i, centerY - randomHeight);
        }

        ctx.lineTo(width, centerY);
        ctx.closePath();
        ctx.fillStyle = "rgba(33, 150, 243, 0.4)";
        ctx.fill();

        // Phần dưới của waveform giả
        ctx.beginPath();
        ctx.moveTo(0, centerY);

        for (let i = 0; i < width; i += 3) {
          const randomHeight = Math.random() * (height / 4);
          ctx.lineTo(i, centerY + randomHeight);
        }

        ctx.lineTo(width, centerY);
        ctx.closePath();
        ctx.fillStyle = "rgba(76, 175, 80, 0.4)";
        ctx.fill();
      }
    };

    // Chỉ vẽ waveform khi có audioSrc và canvas đã được khởi tạo
    if (audioSrc && canvasRef.current) {
      console.log("Gọi drawWaveform với audioSrc:", audioSrc);
      drawWaveform();
    } else {
      console.log("Không thể vẽ waveform: audioSrc hoặc canvas không tồn tại", {
        audioSrc: Boolean(audioSrc),
        canvas: Boolean(canvasRef.current),
      });
    }
  }, [audioSrc, timelineWidth, canvasRef]);

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
