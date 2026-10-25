/**
 * Discord bot endpoints.
 *
 *   POST /discord/interactions       ← Discord (Interactions Endpoint URL). Signature-checked.
 *   GET  /admin/discord              → status for the admin panel
 *   POST /admin/discord/register     → register the /setup + /shop slash commands
 *   POST /admin/discord/setup        → run the same setup as /setup (from the admin panel)
 */
import type { Route } from '../lib/http';
import { HttpError, json } from '../lib/http';
import { requireAdmin } from '../lib/auth';
import { siteUrl } from '../lib/discord';
import { SetupIncomplete, botConfig, botConfigured, botInviteUrl, getBotState, handleInteraction, interactionIsAdmin, registerCommands, runSetup, verifyDiscordSignature, type Interaction } from '../lib/discordBot';

const EPHEMERAL = 64;

export const routes: Route[] = [
  {
    method: 'POST',
    path: '/discord/interactions',
    handler: async ({ req }) => {
      const raw = await req.text();
      const sig = req.headers.get('x-signature-ed25519');
      const ts = req.headers.get('x-signature-timestamp');
      if (!verifyDiscordSignature(raw, sig, ts)) return new Response('invalid request signature', { status: 401 });
      const i = JSON.parse(raw) as Interaction;
      if (i.type === 1) return json({ type: 1 }); // PING (Developer Portal verification)

      // /setup takes longer than Discord's 3 s window → defer and hand off to the background function
      if (i.type === 2 && i.data?.name === 'setup') {
        if (!interactionIsAdmin(i)) return json({ type: 4, data: { content: 'Only server admins can run /setup.', flags: EPHEMERAL } });
        if (i.guild_id !== botConfig().guildId) return json({ type: 4, data: { content: 'This bot is configured for a different server (DISCORD_GUILD_ID).', flags: EPHEMERAL } });
        let started = false;
        try {
          // the background function re-verifies the original Discord signature
          const bg = await fetch(`${siteUrl()}/.netlify/functions/discord-setup-background`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-signature-ed25519': sig!, 'x-signature-timestamp': ts! },
            body: raw,
          });
          started = bg.ok;
        } catch {
          started = false;
        }
        if (started) return json({ type: 5, data: { flags: EPHEMERAL } }); // "Bot is thinking…"
        // no background functions on this plan → do a short slice right here; progress is saved, so /setup again continues
        try {
          const state = await runSetup(() => undefined, { budgetMs: 1500 });
          return json({ type: 4, data: { content: `✅ Server is set up – ${Object.keys(state.channels).length} channels. Move your order-webhook into 🔒 STAFF → 🧾・orders.`, flags: EPHEMERAL } });
        } catch (err) {
          if (err instanceof SetupIncomplete) {
            return json({ type: 4, data: { content: `⏳ Setting up… (${Object.keys(err.state.channels).length} channels so far). **Run /setup again** to continue – repeat until you see ✅.`, flags: EPHEMERAL } });
          }
          return json({ type: 4, data: { content: `⚠️ Setup stopped: ${(err as Error).message}\nMake sure the bot has the **Administrator** permission and its role is at the top of the role list, then run /setup again.`, flags: EPHEMERAL } });
        }
      }

      try {
        return json(await handleInteraction(i));
      } catch (err) {
        console.error('[bot] interaction failed', err);
        return json({ type: 4, data: { content: '⚠️ Something went wrong – please try again or open a ticket.', flags: EPHEMERAL } });
      }
    },
  },
  {
    method: 'GET',
    path: '/admin/discord',
    handler: async ({ req }) => {
      requireAdmin(req);
      const c = botConfig();
      const state = await getBotState();
      return json({
        configured: botConfigured(),
        missing: [!c.token && 'DISCORD_BOT_TOKEN', !c.guildId && 'DISCORD_GUILD_ID', !c.appId && 'DISCORD_CLIENT_ID', !c.publicKey && 'DISCORD_PUBLIC_KEY'].filter(Boolean),
        interactionsUrl: `${siteUrl()}/api/discord/interactions`,
        inviteUrl: c.appId ? botInviteUrl() : null,
        setupAt: state?.updatedAt ?? null,
        channels: state ? Object.keys(state.channels).length : 0,
        roles: state ? Object.keys(state.roles).length : 0,
      });
    },
  },
  {
    method: 'POST',
    path: '/admin/discord/register',
    handler: async ({ req }) => {
      requireAdmin(req);
      if (!botConfigured()) throw new HttpError(503, 'Set DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, DISCORD_CLIENT_ID and DISCORD_PUBLIC_KEY first.', 'not_configured');
      try {
        return json(await registerCommands());
      } catch (err) {
        throw new HttpError(502, `Discord refused: ${(err as Error).message}`, 'discord_error');
      }
    },
  },
  {
    method: 'POST',
    path: '/admin/discord/setup',
    handler: async ({ req }) => {
      requireAdmin(req);
      if (!botConfigured()) throw new HttpError(503, 'Set DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, DISCORD_CLIENT_ID and DISCORD_PUBLIC_KEY first.', 'not_configured');
      const lines: string[] = [];
      try {
        // small slices that fit any function timeout; the admin UI calls again until done
        const state = await runSetup((l) => lines.push(l), { budgetMs: 6000 });
        return json({ ok: true, done: true, created: lines, channels: Object.keys(state.channels).length });
      } catch (err) {
        if (err instanceof SetupIncomplete) return json({ ok: true, done: false, created: lines, channels: Object.keys(err.state.channels).length });
        throw new HttpError(502, `Setup stopped: ${(err as Error).message}`, 'discord_error', { created: lines });
      }
    },
  },
];
