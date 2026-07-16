// essence installer tests — exercises bin/install.js as a subprocess (matches
// how it's actually invoked) rather than importing internals, since the script
// isn't structured as an importable module.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..', '..');
const INSTALL_JS = path.join(REPO_ROOT, 'bin', 'install.js');

function run(args, cwd) {
  return execFileSync(process.execPath, [INSTALL_JS, ...args], { cwd, encoding: 'utf8' });
}

test('--list prints the agent matrix without writing anything', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'essence-test-'));
  try {
    const out = run(['--list'], dir);
    assert.match(out, /claude\s+Claude Code/);
    assert.match(out, /cursor\s+Cursor/);
    assert.equal(existsSync(path.join(dir, 'AGENTS.md')), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('--dry-run --only codex previews without writing', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'essence-test-'));
  try {
    const out = run(['--dry-run', '--only', 'codex'], dir);
    assert.match(out, /\[dry-run\] would write essence block to/);
    assert.equal(existsSync(path.join(dir, 'AGENTS.md')), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('--only codex writes an AGENTS.md block and is idempotent on re-run', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'essence-test-'));
  try {
    run(['--only', 'codex'], dir);
    const agentsPath = path.join(dir, 'AGENTS.md');
    assert.equal(existsSync(agentsPath), true);
    const first = readFileSync(agentsPath, 'utf8');
    assert.equal((first.match(/essence:start/g) || []).length, 1);

    run(['--only', 'codex'], dir);
    const second = readFileSync(agentsPath, 'utf8');
    assert.equal((second.match(/essence:start/g) || []).length, 1, 're-running must replace the block, not duplicate it');
    assert.equal(second, first, 'content should be byte-identical across a no-op re-run');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('installing preserves pre-existing content in the target rules file', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'essence-test-'));
  try {
    const agentsPath = path.join(dir, 'AGENTS.md');
    const preexisting = '# My Project\n\nSome existing agent instructions here.\n';
    writeFileSync(agentsPath, preexisting);

    run(['--only', 'codex'], dir);
    const after = readFileSync(agentsPath, 'utf8');
    assert.match(after, /My Project/);
    assert.match(after, /Some existing agent instructions here\./);
    assert.match(after, /essence:start/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('--only with an unsupported id installs nothing', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'essence-test-'));
  try {
    const out = run(['--only', 'not-a-real-agent'], dir);
    assert.match(out, /no supported agent detected/);
    assert.equal(existsSync(path.join(dir, 'AGENTS.md')), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
