import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";
import htmlMinifier from "vite-plugin-html-minifier";
import { VitePWA } from "vite-plugin-pwa";

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
    glsl({
      minify: true,
    }),
    htmlMinifier({
      minify: true,
    }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.svg"],
      manifest: {
        id: "airpaint",
        name: "Airpaint",
        short_name: "Airpaint",
        description:
          "Airpaint is a lightweight spray paint app where physics takes the lead. Paint on your canvas as real-time wind simulation pushes, pulls, and swirls your strokes. Perfect for quick sketches, abstract art, and playful experimentation.",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        icons: [
          {
            src: "pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
          },
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "screenshots/narrow.png",
            sizes: "750x1334",
            form_factor: "narrow",
          },
          {
            src: "screenshots/wide.png",
            sizes: "2048x1535",
            form_factor: "wide",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,wasm,css,html,png,svg,ico,woff2}"],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        hashCharacters: "base36",
        advancedChunks: {
          groups: [
            {
              name: "react-vendor",
              test: /node_modules[\\/]react/,
            },
            {
              name: "base-ui-vendor",
              test: /node_modules[\\/]@base-ui/,
            },
            {
              name: "tanstack-vendor",
              test: /node_modules[\\/]@tanstack/,
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
