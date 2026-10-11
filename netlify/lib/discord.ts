/** Discord webhook notifications (optional – needs DISCORD_WEBHOOK_URL). */

export interface DiscordEmbed {
  title: string;
  description?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  url?: string;
  footer?: { text: string };
  timestamp?: string;
}

export const COLORS = {
  blue: 0x3b82f6,
  green: 0x22c55e,
  gold: 0xf5b301,
  pink: 0xff4f9a,
  red: 0xef4444,
  gray: 0x64748b,
};

export async function notifyDiscord(embed: DiscordEmbed, content?: string): Promise<void> {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        content: content ?? undefined,
        embeds: [{ timestamp: new Date().toISOString(), ...embed }],
        allowed_mentions: { parse: [] },
      }),
    });
    if (!res.ok) console.warn('[discord] webhook failed', res.status, await res.text().catch(() => ''));
  } catch (err) {
    console.warn('[discord] webhook error', err);
  }
}

export function siteUrl(): string {
  return (process.env.SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || 'http://localhost:8888').replace(/\/$/, '');
}
