import { useQuery } from "@tanstack/react-query";

const gpu: GPU | undefined = navigator.gpu;

export function useGPUAdapter(): GPUAdapter | undefined {
  return useQuery({
    queryFn: async () => (await gpu?.requestAdapter()) ?? undefined,
    queryKey: ["GPUAdapter"],
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  }).data;
}

export function useGPUDevice(): GPUDevice | undefined {
  const adapter = useGPUAdapter();
  return useQuery({
    enabled: adapter != null,
    queryFn: async () => await adapter?.requestDevice(),
    queryKey: ["GPUDevice"],
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  }).data;
}

export function useGPUTextureFormat(): GPUTextureFormat | undefined {
  return gpu?.getPreferredCanvasFormat();
}
