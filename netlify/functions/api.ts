import type { Config, Context } from '@netlify/functions';
import { dispatch } from '../lib/http';
import { routes } from '../api/routes';

export default async (req: Request, context: Context): Promise<Response> => dispatch(routes, req, context);

export const config: Config = {
  path: ['/api', '/api/*'],
};
