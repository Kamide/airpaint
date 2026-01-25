import { useGPUDevice, useGPUTextureFormat } from "@/hooks/gpu";
import { cn } from "@/lib/utils";

export type AirpaintProps = {
  className?: string;
};

export function Airpaint(props: AirpaintProps) {
  const { className } = props;

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

    context.configure({
      alphaMode: "premultiplied",
      colorSpace: "srgb",
      device: device,
      format: format,
    });

    return () => {
      context.unconfigure();
    };
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <canvas ref={ref} className="h-full w-full" />
    </div>
  );
}
