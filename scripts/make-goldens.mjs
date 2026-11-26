// Remakes the exporter golden files in tests/golden/ from the ORIGINAL prototype.
// Only do this on purpose, e.g. after deliberately changing an exporter in the
// prototype. Usage: npm run goldens
import { spawnSync } from 'node:child_process';

const r = spawnSync('npx', ['vitest', 'run', 'tests/exporters.test.ts'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, UPDATE_GOLDENS: '1' },
});
process.exit(r.status ?? 1);
