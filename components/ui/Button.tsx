"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "outline" | "danger" | "subtle";
type Size = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  "inline-flex items-center justify-center gap-1 font-medium rounded-md transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

const sizes: Record<Size, string> = {
  sm: "text-xs px-2.5 py-1.5",
  md: "text-sm px-3 py-2",
};

const variants: Record<Variant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "bg-gray-900 text-white hover:bg-gray-800",
  outline: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
  subtle: "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  )
);

Button.displayName = "Button";

export default Button;

