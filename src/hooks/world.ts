import { type World } from "@/lib/airpaint";
import { createContext, use } from "react";

export const WorldContext = createContext<World>(null!);

export function useWorldContext(): World {
  return use(WorldContext);
}
