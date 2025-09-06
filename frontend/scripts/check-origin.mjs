#!/usr/bin/env node
import { execSync } from 'node:child_process';

const REQUIRED = 'https://github.com/Dmitrii-rgszh/NutriAI.git';

function fail(msg) {
  console.error(`\n[check:origin] ERROR: ${msg}\nТребуемый origin: ${REQUIRED}\n`);
  process.exit(1);
}

try {
  const remotesRaw = execSync('git remote -v', { encoding: 'utf8' });
  const has = remotesRaw
    .split(/\r?\n/) 
    .filter(Boolean)
    .some(line => line.includes('origin') && line.includes(REQUIRED));
  if (!has) fail('origin не указывает на требуемый репозиторий');
  console.log('[check:origin] OK');
} catch (e) {
  fail('не удалось прочитать git remotes');
}
