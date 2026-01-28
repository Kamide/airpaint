import { Settings } from "@/components/settings";
import { useGPUDevice, useGPUTextureFormat } from "@/hooks/gpu";
import { WorldContext } from "@/hooks/world";
import { airpaint, type World } from "@/lib/airpaint";
import { cn } from "@/lib/utils";

export type AirpaintProps = {
  className?: string;
  world: World;
};

export function Airpaint(props: AirpaintProps) {
  const { className, world } = props;

  const device = useGPUDevice();
  const format = useGPUTextureFormat();

  const ref = (canvas: HTMLCanvasElement | null) => {
    if (canvas == null || device == null || format == null) {
      return;
    }

    const context = canvas.getContext("webgpu");

    if (context == null) {
      return;
    }

    if (import.meta.hot && location.hash == "#nop") {
      return;
    }

    return airpaint({ canvas, context, device, format, world });
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <canvas ref={ref} className="h-full w-full touch-none" />
      <WorldContext value={world}>
        <Settings className="absolute top-4 left-4" />
      </WorldContext>
    </div>
  );
}
