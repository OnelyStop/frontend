import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// twMerge so a caller's className wins over the default instead of specificity.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
