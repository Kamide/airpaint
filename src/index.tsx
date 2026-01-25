import "./index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Airpaint } from "./components/airpaint";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={new QueryClient()}>
      <Airpaint className="h-svh w-svw" />
    </QueryClientProvider>
  </StrictMode>,
);
