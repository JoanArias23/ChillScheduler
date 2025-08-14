import { HTMLAttributes } from "react";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-gray-100 text-gray-700 border-gray-200",
  success: "bg-emerald-100 text-emerald-700 border-emerald-200",
  warning: "bg-amber-100 text-amber-700 border-amber-200",
  danger: "bg-red-100 text-red-700 border-red-200",
  info: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function Badge({
  tone = "neutral",
  className = "",
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${tones[tone]} ${className}`}
      {...rest}
    />
  );
}

