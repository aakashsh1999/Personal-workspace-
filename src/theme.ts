import type { ThemeSettings } from './types';
import { DEFAULT_THEME } from './types';

function clamp(n: number) {
  return Math.min(255, Math.max(0, Math.round(n)));
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.replace('#', '').trim();
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function toHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((v) => clamp(v).toString(16).padStart(2, '0'))
    .join('')}`;
}

export function mix(hex: string, withHex: string, amount: number) {
  const a = hexToRgb(hex);
  const b = hexToRgb(withHex);
  if (!a || !b) return hex;
  return toHex(
    a.r + (b.r - a.r) * amount,
    a.g + (b.g - a.g) * amount,
    a.b + (b.b - a.b) * amount,
  );
}

export function applyTheme(theme: ThemeSettings = DEFAULT_THEME) {
  const root = document.documentElement;
  const primary = theme.primary || DEFAULT_THEME.primary;
  const accent = theme.accent || DEFAULT_THEME.accent;
  const deep = mix(primary, '#000000', 0.22);
  const soft = mix(primary, '#ffffff', 0.88);
  const softMid = mix(primary, '#ffffff', 0.55);

  root.style.setProperty('--teal', primary);
  root.style.setProperty('--teal-deep', deep);
  root.style.setProperty('--teal-soft', soft);
  root.style.setProperty('--teal-mid', softMid);
  root.style.setProperty('--sky', accent);
  root.style.setProperty('--brand', primary);
  root.dataset.themePreset = theme.preset;
}
