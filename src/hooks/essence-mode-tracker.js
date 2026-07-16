#!/usr/bin/env node
// essence — UserPromptSubmit hook: tracks on/off state and reinforces the
// ruleset every turn (SessionStart only runs once; models drift back to
// verbose mid-conversation without a per-turn nudge).

const fs = require('fs');
const path = require('path');
const os = require('os');
const { safeWriteFlag, readFlag } = require('./essence-config');

const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const flagPath = path.join(claudeDir, '.essence-active');

let input = '';
process.stdin.on('data', chunk => { input += chunk; });
// A broken pipe / abnormal stdin close emits 'error'; without a listener Node
// throws it as uncaught and the hook exits non-zero. Hooks must always exit 0.
process.stdin.on('error', () => process.exit(0));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const prompt = (data.prompt || '').trim();
    const lower = prompt.toLowerCase();

    // essence only ever has two states, so this doesn't need caveman's
    // ~10-pattern natural-language battery (that exists to disambiguate ~10
    // modes and to shield a much wider phrase set from false positives).
    // Explicit /essence [on|off] takes priority; otherwise a handful of plain
    // substring checks, with one guard so a question ("what is essence
    // mode?") doesn't flip the state.
    const cmdMatch = /^\/essence(?::essence)?(?:\s+(\w+))?\s*$/i.exec(prompt);
    const isQuestion = /^(what|how|why|does|is|are|can)\b/.test(lower);

    let explicitMode = null;
    if (cmdMatch) {
      const arg = (cmdMatch[1] || '').toLowerCase();
      if (arg === 'off') explicitMode = 'off';
      else if (arg === 'on' || !arg) explicitMode = 'on';
      // any other arg -> leave flag untouched, no silent overwrite
    } else if (/\b(stop|disable) essence\b|\bessence (mode )?off\b|\bnormal mode\b/.test(lower)) {
      explicitMode = 'off';
    } else if (!isQuestion && /\b(activate|enable|turn on) essence\b|\bessence mode\b/.test(lower)) {
      explicitMode = 'on';
    }

    if (explicitMode === 'off') {
      try { fs.unlinkSync(flagPath); } catch (e) {}
    } else if (explicitMode === 'on') {
      safeWriteFlag(flagPath, 'on');
    }

    // readFlag enforces symlink-safe read + size cap + whitelist — never
    // trust arbitrary bytes at a predictable dotfile path.
    const activeMode = readFlag(flagPath);
    if (activeMode === 'on') {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext:
            'ESSENCE MODE ACTIVE. Anything a reader besides the current user could see ' +
            '(chat replies, code comments, commits, PR/issue text, docs) must stand on its ' +
            'own: no reference to this conversation, no reflexive hedging or preamble, and ' +
            'only what you actually mean — not a word more. Normal grammar, not telegraphic.'
        }
      }));
    }
  } catch (e) {
    // Silent fail — hooks must never block the prompt over a tracking error
  }
});
