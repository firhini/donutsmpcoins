import type { Context } from '@netlify/functions';
import { dispatch } from '../lib/http';
import { routes } from '../api/routes';

/**
 * Single catch-all API function. Reached through the forced rewrite in netlify.toml
 * (`/api/*` → `/.netlify/functions/api/:splat`).
 *
 * Deliberately NO `config.path` here: as soon as a function declares a custom path,
 * Netlify disables its default `/.netlify/functions/<name>` URL – the rewrite above
 * then points into the void and every API call gets the 404 page (seen in production).
 * The router strips both prefixes (lib/http.ts stripApiPrefix), so local `netlify dev`
 * and the Vite dev plugin keep working unchanged.
 */
export default async (req: Request, context: Context): Promise<Response> => dispatch(routes, req, context);
