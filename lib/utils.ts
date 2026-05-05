import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const fixGoogleDriveUrl = (url?: string): string => {
  if (!url) return "";
  const match =
    url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  const fileId = match?.[1];
  if (!fileId) return url;
  return `https://drive.usercontent.google.com/download?id=${fileId}`;
};
