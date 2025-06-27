/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    // Thay vì sử dụng null-loader, loại bỏ hoàn toàn các file .d.ts
    config.module.rules.push({
      test: /\.d\.ts$/,
      exclude: /node_modules/,
      use: {
        loader: "ignore-loader",
      },
    });

    return config;
  },
  // Các cấu hình khác giữ nguyên
};

export default nextConfig;
