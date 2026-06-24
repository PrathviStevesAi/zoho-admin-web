import React from "react";
import { Input } from "@/components/ui/input";

export const CustomInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <Input ref={ref} className={`${className || ""}`} {...props} />
));
CustomInput.displayName = "CustomInput";
