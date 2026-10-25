import type { Route } from '../lib/http';
import { routes as catalogRoutes } from './catalog';
import { routes as mcRoutes } from './mc';
import { routes as orderRoutes } from './orders';
import { routes as paymentRoutes } from './payments';
import { routes as promoRoutes } from './promo';
import { routes as socialRoutes } from './social';
import { routes as adminRoutes } from './admin';
import { routes as authRoutes } from './auth';
import { routes as discordBotRoutes } from './discordBot';

/** Order matters: first match wins. Admin routes are prefixed with /admin. */
export const routes: Route[] = [
  ...catalogRoutes,
  ...authRoutes,
  ...discordBotRoutes,
  ...mcRoutes,
  ...orderRoutes,
  ...paymentRoutes,
  ...promoRoutes,
  ...socialRoutes,
  ...adminRoutes,
];
