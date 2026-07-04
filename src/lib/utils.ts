import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// A fixed, warm-leaning palette (matching the Mastercard-inspired cream/ink/
// signal-orange theme) so avatars carry a distinct, per-person identity
// color instead of all looking the same.
const AVATAR_COLORS = [
  "bg-orange-700",
  "bg-emerald-700",
  "bg-amber-600",
  "bg-rose-700",
  "bg-stone-700",
  "bg-teal-700",
  "bg-red-700",
  "bg-yellow-700",
]

export function getAvatarColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
