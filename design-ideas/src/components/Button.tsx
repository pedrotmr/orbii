import { motion } from "framer-motion";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./ui.css";

type Variant = "primary" | "secondary" | "ghost" | "accent";

type Props = {
  variant?: Variant;
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  type?: "button" | "submit" | "reset";
  "aria-label"?: string;
};

export function Button({
  variant = "primary",
  fullWidth,
  children,
  className = "",
  disabled,
  type = "button",
  ...rest
}: Props) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className={`btn btn--${variant} ${fullWidth ? "btn--full" : ""} ${className}`}
      disabled={disabled}
      type={type}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
