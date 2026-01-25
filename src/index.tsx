import "@/index.css";

import { Airpaint } from "@/components/airpaint";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={new QueryClient()}>
      <Airpaint className="h-svh w-svw" />
    </QueryClientProvider>
  </StrictMode>,
);
