"use client";

import {
  Bird,
  Cat,
  Fish,
  Flower2,
  Leaf,
  Moon,
  PawPrint,
  Sparkles,
  Star,
  Sun,
  Trees,
  Waves,
} from "lucide-react";
import { avatarStyle } from "@/lib/profile-avatar";
import { useThemeStore } from "@/lib/stores/theme-store";

const ICONS = [Cat, Bird, Fish, Flower2, Leaf, Moon, PawPrint, Sparkles, Star, Sun, Trees, Waves];

type ProfileAvatarProps = {
  seed: string;
  size?: number;
  className?: string;
};

export function ProfileAvatar({ seed, size = 48, className = "" }: ProfileAvatarProps) {
  const night = useThemeStore((state) => state.theme === "dark");
  const style = avatarStyle(seed, night);
  const Icon = ICONS[style.iconIndex] ?? Sparkles;
  const iconSize = Math.round(size * 0.48);

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full shadow-sm ring-2 ring-background ${className}`}
      style={{
        width: size,
        height: size,
        background: style.background,
        color: style.foreground,
      }}
      aria-hidden
    >
      <Icon style={{ width: iconSize, height: iconSize }} strokeWidth={1.75} />
    </span>
  );
}
