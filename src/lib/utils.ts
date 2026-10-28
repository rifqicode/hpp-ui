import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const APP_NAME = import.meta.env.VITE_APP_NAME || "Ekatra POS"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
