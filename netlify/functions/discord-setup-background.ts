/**
 * Background function (Netlify runs *-background functions for up to 15 minutes and answers
 * the caller with 202 immediately). Started by POST /api/discord/interactions for /setup.
 * Re-verifies Discord's signature, builds the server, then edits the deferred reply.
 */
import { botConfig, editOriginal, interactionIsAdmin, runSetup, verifyDiscordSignature, type Interaction } from '../lib/discordBot';

export default async (req: Request): Promise<Response> => {
  const raw = await req.text();
  if (!verifyDiscordSignature(raw, req.headers.get('x-signature-ed25519'), req.headers.get('x-signature-timestamp'))) return new Response('unauthorized', { status: 401 });
  const i = JSON.parse(raw) as Interaction;
  if (i.type !== 2 || i.data?.name !== 'setup' || !interactionIsAdmin(i) || i.guild_id !== botConfig().guildId) return new Response('ignored', { status: 400 });
  const created: string[] = [];
  try {
    const state = await runSetup((l) => created.push(l));
    await editOriginal(i.application_id, i.token, `✅ Setup finished – ${Object.keys(state.channels).length} channels, ${Object.keys(state.roles).length} roles${created.length ? `, newly created: ${created.filter((c) => c !== 'done').join(', ')}` : ', everything refreshed'}.\nMove your order-webhook into **🔒 STAFF → 🧾・orders** (Server Settings → Integrations → Webhooks).`);
  } catch (err) {
    console.error('[bot] setup failed', err);
    await editOriginal(i.application_id, i.token, `⚠️ Setup stopped: ${(err as Error).message}\nRun /setup again – it continues where it stopped. Make sure the bot has the **Administrator** permission and its role is at the top of the role list, then run /setup again.`);
  }
  return new Response('ok');
};
