// Danh sách font hỗ trợ tiếng Việt tốt và có độ dày cao
export const VIETNAMESE_FONTS = [
  // Các font có hỗ trợ tiếng Việt tốt nhất
  { value: "'Be Vietnam Pro', sans-serif", label: "Be Vietnam Pro" },
  { value: "'Noto Sans Vietnamese', sans-serif", label: "Noto Sans Vietnamese" },
  { value: "'Montserrat', sans-serif", label: "Montserrat" },
  { value: "'Roboto', sans-serif", label: "Roboto" },
  { value: "'Open Sans', sans-serif", label: "Open Sans" },
  { value: "'Nunito', sans-serif", label: "Nunito" },
  
  // Các font có độ dày cao
  { value: "'Anton', sans-serif", label: "Anton" },
  { value: "'Bebas Neue', sans-serif", label: "Bebas Neue" },
  { value: "'Oswald', sans-serif", label: "Oswald" },
  { value: "'Russo One', sans-serif", label: "Russo One" },
  { value: "'Fjalla One', sans-serif", label: "Fjalla One" },
  { value: "'Teko', sans-serif", label: "Teko" },
];

// Font weights cho các font có nhiều weight
export const FONT_WEIGHTS = [
  { value: "400", label: "Normal" },
  { value: "700", label: "Bold" },
  { value: "900", label: "Black" },
];

// URL để tải Google Fonts với các phiên bản font weight cao
const FONT_LIST = [
  // Font tiếng Việt
  "Be+Vietnam+Pro:wght@400;700;900",
  "Noto+Sans+Vietnamese:wght@400;700;900",
  "Montserrat:wght@400;700;900",
  "Roboto:wght@400;700;900",
  "Open+Sans:wght@400;700;800",
  "Nunito:wght@400;700;800;900",
  
  // Font dày
  "Anton",
  "Bebas+Neue",
  "Oswald:wght@400;700",
  "Russo+One",
  "Fjalla+One",
  "Teko:wght@400;600;700",
].join("&family=");

// URL để tải Google Fonts
export const GOOGLE_FONTS_URL = `https://fonts.googleapis.com/css2?family=${FONT_LIST}&display=swap`;