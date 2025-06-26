// Thêm hàm tạo màu ngẫu nhiên nhưng nhất quán dựa trên idTab
const getConsistentColorFromString = (str?: string): string => {
  if (!str) return "blue-800"; // Màu mặc định

  // Tạo một số ngẫu nhiên nhưng nhất quán từ chuỗi
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Đảm bảo hash dương
  hash = Math.abs(hash);

  // Danh sách các màu Tailwind có sẵn với độ tương phản tốt
  const colors = [
    "blue",
    "red",
    "amber",
    "green",
    "teal",
    "sky",
    "indigo",
    "purple",
    "pink",
    "rose",
    "orange",
    "yellow",
    "lime",
    "emerald",
    "cyan",
    "violet",
  ];

  // Chọn màu dựa trên hash
  const colorIndex = hash % colors.length;
  return `${colors[colorIndex]}-800`;
};

// Các hàm phụ tạo màu cho các thành phần khác
const getLighterColorVariant = (baseColor: string): string => {
  const [color, shade] = baseColor.split("-");
  const newShade = parseInt(shade) - 200; // Nhạt hơn 200
  return `${color}-${newShade}`;
};

const getDarkerColorVariant = (baseColor: string): string => {
  const [color, shade] = baseColor.split("-");
  const newShade = Math.min(parseInt(shade) + 100, 900); // Đậm hơn 100 nhưng max là 900
  return `${color}-${newShade}`;
};

export {
  getConsistentColorFromString,
  getLighterColorVariant,
  getDarkerColorVariant,
};
