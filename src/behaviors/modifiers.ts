export enum Mods {
  LeftControl = 0x01,
  LeftShift = 0x02,
  LeftAlt = 0x04,
  LeftGUI = 0x08,
  RightControl = 0x10,
  RightShift = 0x20,
  RightAlt = 0x40,
  RightGUI = 0x80,
}

export const mod_labels: Record<Mods, string> = {
  [Mods.LeftControl]: "L Ctrl",
  [Mods.LeftShift]: "L Shift",
  [Mods.LeftAlt]: "L Alt",
  [Mods.LeftGUI]: "L GUI",
  [Mods.RightControl]: "R Ctrl",
  [Mods.RightShift]: "R Shift",
  [Mods.RightAlt]: "R Alt",
  [Mods.RightGUI]: "R GUI",
};

export const all_mods = [
  Mods.LeftControl,
  Mods.LeftShift,
  Mods.LeftAlt,
  Mods.LeftGUI,
  Mods.RightControl,
  Mods.RightShift,
  Mods.RightAlt,
  Mods.RightGUI,
];

export function mods_to_flags(mods: Mods[]): number {
  return mods.reduce((a, v) => a + v, 0);
}

export function mask_mods(value: number) {
  return value & ~(mods_to_flags(all_mods) << 24);
}

export function resolveModifiers(flags: number): string[] {
  return all_mods.filter((m) => m & flags).map((m) => mod_labels[m]);
}

export function resolveModifierLabel(flags: number): string {
  return resolveModifiers(flags).join("+");
}

const mod_symbols: Record<Mods, string> = {
  [Mods.LeftControl]: "^",
  [Mods.LeftShift]: "⇧",
  [Mods.LeftAlt]: "⌥",
  [Mods.LeftGUI]: "⌘",
  [Mods.RightControl]: "^",
  [Mods.RightShift]: "⇧",
  [Mods.RightAlt]: "⌥",
  [Mods.RightGUI]: "⌘",
};

export function resolveModifierPrefix(flags: number): string {
  return all_mods
    .filter((m) => m & flags)
    .map((m) => mod_symbols[m])
    .join("");
}
