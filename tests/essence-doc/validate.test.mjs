// essence-doc's mechanical guard: confirms code/URLs/paths survive an essence
// rewrite verbatim. The prose rewrite itself is a judgment call for whichever
// agent runs the skill — not something a script can validate — so these tests
// only exercise essence_doc.py's validate mode against hand-authored
// before/after fixtures.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..', '..');
const SCRIPT = path.join(REPO_ROOT, 'skills', 'essence-doc', 'scripts', 'essence_doc.py');
const ORIGINAL = path.join(__dirname, 'verbose.md');
const REWRITTEN = path.join(__dirname, 'verbose.essence.md');

function validate(originalPath, rewrittenPath) {
  try {
    const out = execFileSync('python3', [SCRIPT, 'validate', originalPath, rewrittenPath], { encoding: 'utf8' });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: e.stdout };
  }
}

test('a correct essence rewrite preserves every protected span', () => {
  const { code, out } = validate(ORIGINAL, REWRITTEN);
  assert.equal(code, 0, out);
  assert.match(out, /^OK: all \d+ protected span\(s\) preserved verbatim\.\s*$/);
});

test('dropping a URL from the rewrite fails validation', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'essence-doc-test-'));
  try {
    const mangled = path.join(dir, 'mangled.md');
    writeFileSync(mangled, 'Schema is documented elsewhere. Connection string: `./config/db.yaml`.\n');
    const { code, out } = validate(ORIGINAL, mangled);
    assert.equal(code, 1);
    assert.match(out, /FAIL:/);
    assert.match(out, /example\.com\/docs\/profiles/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('altering a code fence fails validation', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'essence-doc-test-'));
  try {
    const mangled = path.join(dir, 'mangled.md');
    writeFileSync(
      mangled,
      '```python\ndef get_profile(user_id):\n    return db.query("SELECT * FROM profiles")\n```\n' +
        'See https://example.com/docs/profiles and `./config/db.yaml`.\n'
    );
    const { code, out } = validate(ORIGINAL, mangled);
    assert.equal(code, 1);
    assert.match(out, /FAIL:/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
