#!/usr/bin/env node
// essence: multi-agent installer.
//
// Detects which AI coding agents are present and installs essence for each:
// Claude Code gets the native plugin (skill + always-on hooks). Agents without
// a hook system get the ruleset dropped into their native rules file
// (AGENTS.md, GEMINI.md, .cursor/rules/, etc.) inside a delimited block, so
// re-running the installer updates the block in place instead of duplicating it.
//
// Usage:
//   node bin/install.js                 # detect + install for everything found
//   node bin/install.js --list          # print the agent matrix and detection result
//   node bin/install.js --dry-run       # print what would happen, change nothing
//   node bin/install.js --only claude --only cursor   # install for specific agents only

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const REPO_ROOT = path.join(__dirname, '..');
const SKILL_PATH = path.join(REPO_ROOT, 'skills', 'essence', 'SKILL.md');

function parseArgs(argv) {
  const opts = { dryRun: false, list: false, only: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--list') opts.list = true;
    else if (arg === '--only') opts.only.push(argv[++i]);
    else if (arg === '--all') { /* default behavior; accepted for symmetry with docs */ }
    else console.error(`essence: unknown flag ${arg}, ignoring`);
  }
  return opts;
}

function hasBin(name) {
  try {
    execFileSync(process.platform === 'win32' ? 'where' : 'command', process.platform === 'win32' ? [name] : ['-v', name], { stdio: 'ignore', shell: process.platform !== 'win32' });
    return true;
  } catch (e) {
    return false;
  }
}

function hasPath(p) {
  try {
    fs.statSync(p);
    return true;
  } catch (e) {
    return false;
  }
}

// Extract the SKILL.md body (drop the YAML frontmatter) so rules files get
// clean prose, not a duplicated `name:`/`description:` header per agent.
function ruleContent() {
  const raw = fs.readFileSync(SKILL_PATH, 'utf8');
  const match = /^---\n[\s\S]*?\n---\n([\s\S]*)$/.exec(raw);
  return (match ? match[1] : raw).trim() + '\n';
}

const BLOCK_START = '<!-- essence:start (managed by essence installer, safe to re-run) -->';
const BLOCK_END = '<!-- essence:end -->';

// BLOCK_START/BLOCK_END contain regex metacharacters (parens): escape them
// before building a RegExp, or the parens are read as a capture group instead
// of literal text and the match silently fails (blockRe.test would never be
// true, so every re-run would append a duplicate block instead of replacing it).
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Idempotent block write: if targetPath exists and already has an essence
// block, replace just that block; otherwise append one; if the file doesn't
// exist, create it (and parent dirs) with just the block.
function writeRulesFile(targetPath, dryRun) {
  const block = `${BLOCK_START}\n${ruleContent()}${BLOCK_END}\n`;

  let existing = '';
  if (hasPath(targetPath)) existing = fs.readFileSync(targetPath, 'utf8');

  const blockRe = new RegExp(`${escapeRegExp(BLOCK_START)}[\\s\\S]*?${escapeRegExp(BLOCK_END)}\\n?`);
  let next;
  if (blockRe.test(existing)) {
    next = existing.replace(blockRe, block);
  } else if (existing) {
    next = existing.replace(/\n*$/, '\n\n') + block;
  } else {
    next = block;
  }

  if (dryRun) {
    console.log(`  [dry-run] would write essence block to ${targetPath}`);
    return;
  }
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, next);
  console.log(`  wrote essence block to ${targetPath}`);
}

function installClaudeCode(dryRun) {
  if (dryRun) {
    console.log(`  [dry-run] would run: claude plugin marketplace add ${REPO_ROOT}`);
    console.log(`  [dry-run] would run: claude plugin install essence@essence`);
    return;
  }
  try {
    execFileSync('claude', ['plugin', 'marketplace', 'add', REPO_ROOT], { stdio: 'inherit' });
    execFileSync('claude', ['plugin', 'install', 'essence@essence'], { stdio: 'inherit' });
    console.log('  installed essence plugin for Claude Code.');
  } catch (e) {
    console.log('  could not run `claude` automatically. Install manually:');
    console.log(`    claude plugin marketplace add ${REPO_ROOT}`);
    console.log('    claude plugin install essence@essence');
  }
}

const home = os.homedir();
const cwd = process.cwd();

// Each provider: detect() returns whether the agent looks installed; install()
// performs (or previews) the install; autoActivates notes whether the agent
// applies the ruleset every turn on its own, or needs an explicit invocation.
const PROVIDERS = [
  {
    id: 'claude',
    label: 'Claude Code',
    detect: () => hasPath(path.join(home, '.claude')) || hasBin('claude'),
    install: installClaudeCode,
    autoActivates: true,
  },
  {
    id: 'codex',
    label: 'Codex CLI',
    detect: () => hasPath(path.join(home, '.codex')) || hasBin('codex'),
    install: (dryRun) => writeRulesFile(path.join(cwd, 'AGENTS.md'), dryRun),
    autoActivates: true,
  },
  {
    id: 'gemini',
    label: 'Gemini CLI',
    detect: () => hasPath(path.join(home, '.gemini')) || hasBin('gemini'),
    install: (dryRun) => writeRulesFile(path.join(cwd, 'GEMINI.md'), dryRun),
    autoActivates: true,
  },
  {
    id: 'cursor',
    label: 'Cursor',
    detect: () => hasPath(path.join(cwd, '.cursor')),
    install: (dryRun) => writeRulesFile(path.join(cwd, '.cursor', 'rules', 'essence.md'), dryRun),
    autoActivates: false,
  },
  {
    id: 'windsurf',
    label: 'Windsurf',
    detect: () => hasPath(path.join(cwd, '.windsurf')),
    install: (dryRun) => writeRulesFile(path.join(cwd, '.windsurf', 'rules', 'essence.md'), dryRun),
    autoActivates: false,
  },
  {
    id: 'cline',
    label: 'Cline',
    detect: () => hasPath(path.join(cwd, '.clinerules')),
    install: (dryRun) => writeRulesFile(path.join(cwd, '.clinerules', 'essence.md'), dryRun),
    autoActivates: false,
  },
];

function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.list) {
    for (const p of PROVIDERS) {
      const detected = p.detect();
      console.log(`${p.id.padEnd(10)} ${p.label.padEnd(14)} detected=${detected ? 'yes' : 'no'} auto-activates=${p.autoActivates ? 'yes' : 'no'}`);
    }
    return;
  }

  const targets = PROVIDERS.filter((p) => (opts.only.length ? opts.only.includes(p.id) : p.detect()));

  if (!targets.length) {
    console.log('essence: no supported agent detected. Pass --only <id> to force a target, or --list to see the matrix.');
    return;
  }

  for (const p of targets) {
    console.log(`\n${p.label}:`);
    p.install(opts.dryRun);
    if (!p.autoActivates) {
      console.log(`  not always-on for this agent: invoke /essence once per session to apply it.`);
    }
  }
  console.log('\nDone.');
}

main();
