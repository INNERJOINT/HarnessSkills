#!/usr/bin/env node
'use strict';
/**
 * HarnessSkills Cross-platform hook runner (run.cjs)
 *
 * Uses process.execPath (the Node binary already running this script) to spawn
 * the target .mjs hook, bypassing PATH / shell discovery issues.
 */

const { spawnSync } = require('child_process');
const { existsSync, realpathSync } = require('fs');
const { join, dirname } = require('path');

const target = process.argv[2];
if (!target) {
  process.exit(0);
}

function resolveTarget(targetPath) {
  if (existsSync(targetPath)) return targetPath;

  try {
    const resolved = realpathSync(targetPath);
    if (existsSync(resolved)) return resolved;
  } catch {}

  return null;
}

const resolved = resolveTarget(target);
if (!resolved) {
  process.exit(0);
}

const result = spawnSync(
  process.execPath,
  [resolved, ...process.argv.slice(3)],
  {
    stdio: 'inherit',
    env: process.env,
    windowsHide: true,
  }
);

process.exit(result.status ?? 0);
