import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Airpaint } from "./components/airpaint";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Airpaint />
  </StrictMode>,
);
