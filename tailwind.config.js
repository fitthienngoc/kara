/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    // Safelist cho tất cả các màu và shade được sử dụng
    {
      pattern: /(bg|text|border)-(blue|red|amber|green|teal|sky|indigo|purple|pink|rose|orange|yellow|lime|emerald|cyan|violet)-(50|100|200|300|400|500|600|700|800|900)/,
    }
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}