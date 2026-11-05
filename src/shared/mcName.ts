/**
 * Minecraft player names, shared by the storefront and the API.
 *
 * DonutSMP runs Java and Bedrock (Geyser/Floodgate). Bedrock players show up in-game
 * with a "." in front of their gamertag, and spaces become "_" (e.g. ".Steve_123").
 *  - Java:    3–16 letters, digits or "_"           → checked against Mojang
 *  - Bedrock: "." + 1–16 letters, digits or "_"     → no Mojang account to check
 */
export const JAVA_NAME_RE = /^[A-Za-z0-9_]{3,16}$/;
export const BEDROCK_NAME_RE = /^\.[A-Za-z0-9_]{1,16}$/;
export const MC_USERNAME_RE = /^(?:[A-Za-z0-9_]{3,16}|\.[A-Za-z0-9_]{1,16})$/;

/** Longest name we accept (Bedrock dot + 16). */
export const MC_NAME_MAX = 17;

export function isBedrockName(name: string): boolean {
  return name.trim().startsWith('.');
}

export function isValidMcName(name: string): boolean {
  return MC_USERNAME_RE.test(name.trim());
}

/** A Bedrock gamertag as DonutSMP shows it: leading dot, spaces → "_", other symbols dropped. */
export function toBedrockName(gamertag: string): string {
  const tag = gamertag
    .trim()
    .replace(/^\.+/, '')
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_]/g, '')
    .slice(0, 16);
  return tag ? `.${tag}` : '';
}

/** Human readable problem with a name, or null when it is fine. */
export function mcNameProblem(name: string): string | null {
  const n = name.trim();
  if (!n) return 'Enter your Minecraft username.';
  if (isBedrockName(n)) {
    if (n.length < 2) return 'Enter your Bedrock gamertag after the dot.';
    if (n.length > MC_NAME_MAX) return 'Bedrock names have at most 16 characters after the dot.';
    if (!BEDROCK_NAME_RE.test(n)) return 'Bedrock names: a dot, then letters, numbers or underscores (spaces become _).';
    return null;
  }
  if (n.length < 3) return 'Usernames have at least 3 characters.';
  if (n.length > 16) return 'Usernames have at most 16 characters.';
  if (!JAVA_NAME_RE.test(n)) return 'Only letters, numbers and underscores are allowed. Bedrock player? Start with a dot, e.g. .Steve_123';
  return null;
}

export const MC_NAME_RULES = 'Java names are 3–16 letters, numbers or underscores; Bedrock names start with a dot (e.g. .Steve_123).';
