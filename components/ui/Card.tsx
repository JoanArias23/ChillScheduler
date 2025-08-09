import { HTMLAttributes } from "react";

export default function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-[var(--surface)] border border-[color:var(--border)] rounded-lg shadow-sm hover:shadow-md transition-shadow ${className}`}
      {...props}
    />
  );
}
