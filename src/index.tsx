import "@/index.css";

import { Airpaint } from "@/components/airpaint";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Store } from "@tanstack/react-store";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={new QueryClient()}>
      <ThemeProvider>
        <Airpaint
          className="h-svh w-svw"
          world={{
            pointer: new Store({
              x: 0,
              y: 0,
              pressure: 1,
              down: false as boolean,
            }),
            brush: new Store({
              radius: Math.max(Math.random() * 64, 4),
              hardness: 0.5,
              noise: 0,
              color: {
                r: Math.random(),
                g: Math.random(),
                b: Math.random(),
                a: 1,
              },
            }),
            wind: new Store({
              angle: Math.random() * 2 * Math.PI,
              speed: Math.random() * 5,
              diffusion: Math.random() / 4,
            }),
            size: new Store({
              width: 1,
              height: 1,
            }),
            event: {
              clear: new Store(0),
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
