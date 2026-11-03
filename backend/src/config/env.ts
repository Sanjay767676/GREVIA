import 'dotenv/config';

function bool(value: string | undefined, fallback = false): boolean {
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  storageBucket: process.env.SUPABASE_STORAGE_BUCKET ?? 'complaints',
  sessionSecret: process.env.SESSION_SECRET ?? 'dev-insecure-secret-change-me',
  cookieSameSite: (process.env.COOKIE_SAMESITE ?? 'lax') as 'lax' | 'strict' | 'none',
  cookieSecure: bool(process.env.COOKIE_SECURE, process.env.NODE_ENV === 'production'),
  demoMode: bool(process.env.DEMO_MODE),
  cronSecret: process.env.CRON_SECRET ?? '',
  sweepIntervalMs: Number(process.env.SLA_SWEEP_INTERVAL_MS ?? 60_000),
};

export const isProd = env.nodeEnv === 'production';
