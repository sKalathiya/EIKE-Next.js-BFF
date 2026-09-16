const STORAGE_KEY = "eike_avatar_seed";

export function assignLoginAvatar() {
  const seed = crypto.randomUUID();
  window.localStorage.setItem(STORAGE_KEY, seed);
  return seed;
}

export function getAvatarSeed() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export function ensureAvatarSeed() {
  const existing = getAvatarSeed();
  if (existing) return existing;
  return assignLoginAvatar();
}

export function avatarStyle(seed: string, night = false) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  const hue = hash % 360;
  return {
    iconIndex: hash % 12,
    background: night ? `hsl(${hue} 36% 24%)` : `hsl(${hue} 62% 86%)`,
    foreground: night ? `hsl(${hue} 72% 86%)` : `hsl(${hue} 42% 28%)`,
  };
}
