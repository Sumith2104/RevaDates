import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string) {
  if (!name) return '';
  const names = name.split(' ');
  const initials = names.map(n => n[0]).join('').toUpperCase();
  if (initials.length > 2 && names.length > 1) {
    return `${initials[0]}${initials[initials.length - 1]}`;
  }
  return initials.substring(0, 2);
}
