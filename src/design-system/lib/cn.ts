import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/* Merge class lists so a caller's className always wins over a component's
   default, instead of both landing in the class list and specificity deciding. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
