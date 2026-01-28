import {
  defineConfig,
  minimal2023Preset as preset,
} from "@vite-pwa/assets-generator/config";

export default defineConfig({
  headLinkOptions: {
    preset: "2023",
  },
  preset: {
    ...preset,
    png: {
      compressionLevel: 9,
      effort: 10,
      palette: false,
    },
    maskable: {
      ...preset.maskable,
      resizeOptions: {
        ...preset.maskable.resizeOptions,
        background: "#ffffff",
      },
    },
    apple: {
      ...preset.apple,
      resizeOptions: {
        ...preset.apple.resizeOptions,
        background: "#ffffff",
      },
    },
  },
  images: ["./public/logo.svg"],
});
