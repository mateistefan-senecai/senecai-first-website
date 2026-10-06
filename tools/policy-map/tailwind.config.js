// Same brand gold scale as the old site, so the ported map keeps its look; type is Archivo.
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Archivo', 'system-ui', 'sans-serif'] },
      colors: {
        primary: {
          50: '#fefaf0', 100: '#fdf4dc', 200: '#fbe9b9', 300: '#f8dd96', 400: '#f6d173',
          500: '#D4AF37', 600: '#c9a02d', 700: '#a68524', 800: '#836a1c', 900: '#604f15', 950: '#3d3209',
        },
      },
    },
  },
  plugins: [],
};
