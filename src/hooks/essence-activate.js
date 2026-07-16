#!/usr/bin/env node
// essence — Claude Code SessionStart activation hook
//
// Runs on every session start:
//   1. Writes the active-mode flag at $CLAUDE_CONFIG_DIR/.essence-active
//   2. Emits the essence ruleset as SessionStart context (skipped if mode is 'off')
//
// Reads skills/essence/SKILL.md at runtime so edits to the source of truth
// propagate automatically — no hardcoded duplicate ruleset to go stale.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { getDefaultMode, safeWriteFlag } = require('./essence-config');

const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const flagPath = path.join(claudeDir, '.essence-active');

const mode = getDefaultMode();

if (mode === 'off') {
  try { fs.unlinkSync(flagPath); } catch (e) {}
  process.stdout.write('OK');
  process.exit(0);
}

safeWriteFlag(flagPath, mode);

// Candidate locations for the ruleset source, tried in order:
//   1. $CLAUDE_PLUGIN_ROOT/skills/essence/SKILL.md — set by Claude Code when
//      invoking a plugin hook; authoritative when present.
//   2. ../../skills/essence/SKILL.md — hook at <plugin_root>/src/hooks/.
//   3. ../skills/essence/SKILL.md — standalone install with hooks and skill
//      both under $CLAUDE_CONFIG_DIR directly.
const candidates = [];
if (process.env.CLAUDE_PLUGIN_ROOT) {
  candidates.push(path.join(process.env.CLAUDE_PLUGIN_ROOT, 'skills', 'essence', 'SKILL.md'));
}
candidates.push(
  path.join(__dirname, '..', '..', 'skills', 'essence', 'SKILL.md'),
  path.join(__dirname, '..', 'skills', 'essence', 'SKILL.md')
);

let skillContent = '';
for (const candidate of candidates) {
  try {
    skillContent = fs.readFileSync(candidate, 'utf8');
    break;
  } catch (e) { /* try next candidate */ }
}

// Fallback ruleset if SKILL.md couldn't be read (e.g. a broken install) — the
// essentials only, not a full duplicate.
if (!skillContent) {
  skillContent = [
    'ESSENCE MODE ACTIVE — default for everything you write: chat replies, code',
    'comments, commits, PR/issue text, docs, published copy.',
    '1. Make writing stand on its own: cut anything that only makes sense to',
    '   someone who saw this conversation (references to what was asked, hedging',
    '   about a prior draft, meta-commentary about the chat).',
    '2. Say only what you truly mean, not a word more: find the real point of',
    '   each paragraph and write only that.',
    'Keep: every load-bearing fact, code/commands/URLs/paths verbatim, normal',
    'grammar (not telegraphic). Off: "stop essence" / "normal mode".'
  ].join('\n');
}

process.stdout.write(skillContent);
