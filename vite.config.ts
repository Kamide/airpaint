import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import htmlMinifier from "vite-plugin-html-minifier";

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    tailwindcss(),
    htmlMinifier({
      minify: true,
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        hashCharacters: "base36",
        advancedChunks: {
          maxSize: 500000,
          groups: [
            {
              name: "react-vendor",
              test: /node_modules[\\/]react/,
            },
            {
              name: "vendor",
              test: /node_modules/,
            },
          ],
        },
      },
    },
  },
});
