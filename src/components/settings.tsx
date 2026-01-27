import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { useWorldStore } from "@/hooks/world";
import { useRadialMove } from "@mantine/hooks";
import { Brush, Menu, Trash2, Wind } from "lucide-react";
import { type JSX, type PropsWithChildren } from "react";

export function Settings({ className }: { className?: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="icon-lg" className={className}>
            <Menu className="h-5 w-5" aria-label="Settings" />
          </Button>
        }
      />
      <DropdownMenuContent className="w-72 space-y-6 px-4 py-4 select-none">
        <BrushSettings />
        <WindSettings />
        <Actions />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Actions() {
  return (
    <Button
      variant="destructive"
      size="icon-lg"
      className="w-full"
      onClick={undefined} // TODO
    >
      <Trash2 className="h-4 w-4" aria-label="Clear Canvas" />
    </Button>
  );
}

function BrushSettings() {
  const [brush, setBrush] = useWorldStore((world) => world.brush);

  return (
    <LabeledSection label="Brush" icon={<Brush className="mr-1 h-4 w-4" />}>
      <div className="flex items-center gap-6">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <BrushColorSettings />
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <LabeledSlider
            label="Radius"
            value={brush.radius}
            min={0}
            max={64}
            onChange={(radius) => setBrush((brush) => ({ ...brush, radius }))}
          />
          <LabeledSlider
            label="Hardness"
            value={brush.hardness}
            min={0}
            max={1}
            step={0.01}
            onChange={(hardness) =>
              setBrush((brush) => ({ ...brush, hardness }))
            }
          />
          <LabeledSlider
            label="Noise"
            value={brush.noise}
            min={0}
            max={1}
            step={0.01}
            onChange={(noise) => setBrush((brush) => ({ ...brush, noise }))}
          />
        </div>
      </div>
    </LabeledSection>
  );
}

function BrushColorSettings() {
  const [brush, setBrush] = useWorldStore((world) => world.brush);

  const channelToHex = (f32: number) =>
    (f32 * 255).toString(16).padStart(2, "0");

  const rgbaToHex = (color: { r: number; g: number; b: number; a: number }) => {
    const r = channelToHex(color.r);
    const g = channelToHex(color.g);
    const b = channelToHex(color.b);
    return `#${r}${g}${b}`;
  };

  const hexToRgba = (hex: string) => {
    const bigint = parseInt(hex.replace("#", ""), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r: r / 255, g: g / 255, b: b / 255, a: brush.color.a };
  };

  return (
    <label className="ring-ring/50 bg-background relative grid h-16 w-16 translate-y-1 cursor-pointer place-items-center rounded-full border shadow-sm transition hover:ring-4">
      <div
        className="absolute max-h-full max-w-full rounded-full border"
        style={{
          width: brush.radius,
          height: brush.radius,
          backgroundColor: `rgba(${brush.color.r * 255},${brush.color.g * 255},${brush.color.b * 255},${brush.color.a})`,
        }}
      />
      <input
        type="color"
        value={rgbaToHex(brush.color)}
        onChange={(e) =>
          setBrush((brush) => ({
            ...brush,
            color: hexToRgba(e.target.value),
          }))
        }
        className="sr-only"
      />
    </label>
  );
}

function WindSettings() {
  const [wind, setWind] = useWorldStore((world) => world.wind);

  return (
    <LabeledSection label="Wind" icon={<Wind className="mr-1 h-4 w-4" />}>
      <div className="flex items-center gap-6">
        <AngleSlider
          radians={wind.angle}
          setRadians={(angle) => setWind((wind) => ({ ...wind, angle }))}
        />

        <div className="flex flex-1 flex-col gap-4">
          <LabeledSlider
            label="Speed"
            value={wind.speed}
            min={0}
            max={16}
            step={0.1}
            onChange={(speed) => setWind((wind) => ({ ...wind, speed }))}
          />
          <LabeledSlider
            label="Diffusion"
            value={wind.diffusion}
            min={0}
            max={1}
            step={0.01}
            onChange={(diffusion) =>
              setWind((wind) => ({ ...wind, diffusion }))
            }
          />
        </div>
      </div>
    </LabeledSection>
  );
}

function AngleSlider({
  radians,
  setRadians,
}: {
  radians: number;
  setRadians: (value: number) => void;
}) {
  const { ref } = useRadialMove((degrees) => {
    setRadians(degrees * (Math.PI / 180) + Math.PI / 2);
  });

  const degrees = (radians - Math.PI / 2) * (180 / Math.PI);
  const degreesClamped = ((degrees % 360) + 360) % 360;

  return (
    <div
      ref={ref}
      className="ring-ring/50 bg-background relative grid h-16 w-16 translate-y-1 cursor-grab place-items-center rounded-full border shadow-sm transition hover:ring-4"
    >
      <div
        className="bg-primary absolute right-[50%] h-0.5 w-1/2 origin-right"
        style={{ rotate: `${radians}rad` }}
      />
      <div className="bg-background absolute h-8 w-8 rounded-full" />
      <div className="text-muted-foreground absolute flex items-center justify-center text-xs tabular-nums">
        {degreesClamped.toFixed(0)}
        <span className="absolute left-full">&deg;</span>
      </div>
    </div>
  );
}

function LabeledSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span>{label}</span>
        <span className="tabular-nums">{value.toFixed(2)}</span>
      </div>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        onValueChange={onChange}
      />
    </div>
  );
}

function LabeledSection({
  label,
  children,
  icon,
}: PropsWithChildren<{ label: string; icon?: JSX.Element }>) {
  return (
    <DropdownMenuGroup className="mb-6">
      <DropdownMenuLabel className="text-muted-foreground flex items-center gap-1 p-1.5 text-[11px] font-medium uppercase">
        {icon}
        {label}
      </DropdownMenuLabel>
      <div className="px-1">{children}</div>
    </DropdownMenuGroup>
  );
}
