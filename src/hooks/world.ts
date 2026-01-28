import { type World } from "@/lib/airpaint";
import { type Store, useStore } from "@tanstack/react-store";
import { createContext, use } from "react";

export const WorldContext = createContext<World>(null!);

export function useWorld(): World {
  return use(WorldContext);
}

export function useWorldStore<State>(getStore: (world: World) => Store<State>) {
  const world = useWorld();
  const store = getStore(world);
  const state = useStore(store);
  const setState = store.setState.bind(store);
  return [state, setState] as const;
}

export function useWorldDispatch(
  getStore: (event: World["event"]) => Store<number>,
) {
  const world = useWorld();
  const store = getStore(world.event);
  return () => store.setState((state) => state + 1);
}
