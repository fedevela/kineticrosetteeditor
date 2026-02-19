import { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

type ControlCardProps = {
  className?: string;
  children: ReactNode;
};

export function ControlCard({ className, children }: ControlCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-white/10 bg-slate-900/65 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_8px_28px_rgba(2,6,23,0.35)] backdrop-blur-md",
        className,
      )}
    >
      {children}
    </div>
  );
}

type SliderFieldProps = {
  id: string;
  label: string;
  valueLabel: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
};

export function SliderField({
  id,
  label,
  valueLabel,
  value,
  min,
  max,
  step = 1,
  onChange,
  className,
}: SliderFieldProps) {
  return (
    <div className={className}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-xs text-slate-300/80">
          {label}
        </Label>
        <span className="text-xs tabular-nums text-slate-100">{valueLabel}</span>
      </div>
      <Slider
        id={id}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(next) => onChange(next[0] ?? value)}
        className="w-full"
      />
    </div>
  );
}
