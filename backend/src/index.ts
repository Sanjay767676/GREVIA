import { createApp } from './app.js';
import { env } from './config/env.js';
import { db } from './lib/db.js';
import { runSlaSweep } from './services/sla-sweep.js';

const app = createApp();

app.listen(env.port, () => {
  console.log(`[grievia-api] listening on http://localhost:${env.port}`);
  if (env.demoMode) console.log('[grievia-api] DEMO_MODE enabled (short SLA windows)');
});

// Built-in SLA sweeper. The /api/cron/sla-check endpoint stays available for
// external schedulers, but the server escalates on its own too.
async function sweep() {
  try {
    const result = await runSlaSweep(db(), null);
    if (result.escalated > 0) {
      console.log(`[grievia-api] SLA sweep escalated ${result.escalated} of ${result.checked}`);
    }
  } catch (err) {
    console.error('[grievia-api] SLA sweep failed:', err);
  }
}

if (env.sweepIntervalMs > 0) {
  setInterval(sweep, env.sweepIntervalMs);
  console.log(`[grievia-api] SLA sweep every ${Math.round(env.sweepIntervalMs / 1000)}s`);
}
