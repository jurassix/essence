#!/usr/bin/env node
// essence: shared configuration + flag-file helpers
//
// essence only has two states: on (default) and off. Resolution order for the
// default:
//   1. ESSENCE_DEFAULT_MODE env var
//   2. Repo-local config (checked-in, per-project default): <cwd>/.essence.json
//      or <cwd>/.essence/config.json, walking up to the nearest ancestor that
//      has one (stops at filesystem root): lets a team pin a project default.
//   3. User config: $XDG_CONFIG_HOME/essence/config.json, or
//      ~/.config/essence/config.json, or %APPDATA%\essence\config.json on Windows.
//   4. 'on'

const fs = require('fs');
const path = require('path');
const os = require('os');

const VALID_MODES = ['on', 'off'];
const MAX_FLAG_BYTES = 16; // longest legitimate value is "off" (3 bytes); slack without exfil risk

function getConfigDir() {
  if (process.env.XDG_CONFIG_HOME) return path.join(process.env.XDG_CONFIG_HOME, 'essence');
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'essence');
  }
  return path.join(os.homedir(), '.config', 'essence');
}

function getConfigPath() {
  return path.join(getConfigDir(), 'config.json');
}

function readModeFromConfigFile(configPath) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const mode = config && config.defaultMode ? String(config.defaultMode).toLowerCase() : null;
    return VALID_MODES.includes(mode) ? mode : null;
  } catch (e) {
    return null; // missing / unreadable / invalid JSON -> caller falls through
  }
}

// Walk up from `start` looking for a repo-local config. Bounded to 64 levels
// to defend against symlink cycles on pathological mounts.
function findRepoConfigPath(start) {
  try {
    let dir = path.resolve(start || process.cwd());
    const candidates = ['.essence/config.json', '.essence.json'];
    for (let i = 0; i < 64; i++) {
      for (const rel of candidates) {
        const p = path.join(dir, rel);
        try {
          const st = fs.lstatSync(p);
          if (st.isSymbolicLink() || !st.isFile()) continue;
          return p;
        } catch (e) { /* not present, try next candidate */ }
      }
      const parent = path.dirname(dir);
      if (parent === dir) return null;
      dir = parent;
    }
  } catch (e) { /* any cwd/fs failure -> no repo config */ }
  return null;
}

function getDefaultMode() {
  const envMode = process.env.ESSENCE_DEFAULT_MODE;
  if (envMode && VALID_MODES.includes(envMode.toLowerCase())) return envMode.toLowerCase();

  const repoConfigPath = findRepoConfigPath(process.cwd());
  if (repoConfigPath) {
    const repoMode = readModeFromConfigFile(repoConfigPath);
    if (repoMode) return repoMode;
  }

  const userMode = readModeFromConfigFile(getConfigPath());
  if (userMode) return userMode;

  return 'on';
}

// Symlink-safe, atomic flag write: refuses to write through a symlink at the
// flag path itself, writes to a temp file then renames (atomic on POSIX and
// NTFS), 0600 perms. Silent-fails on any filesystem error: the flag is
// best-effort, never worth crashing a hook over.
function safeWriteFlag(flagPath, content) {
  try {
    const dir = path.dirname(flagPath);
    fs.mkdirSync(dir, { recursive: true });

    try {
      if (fs.lstatSync(flagPath).isSymbolicLink()) return; // refuse to clobber through a symlink
    } catch (e) {
      if (e.code !== 'ENOENT') return;
    }

    const tempPath = path.join(dir, `.essence-active.${process.pid}.${Date.now()}`);
    const O_NOFOLLOW = typeof fs.constants.O_NOFOLLOW === 'number' ? fs.constants.O_NOFOLLOW : 0;
    const flags = fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | O_NOFOLLOW;
    const fd = fs.openSync(tempPath, flags, 0o600);
    try {
      fs.writeSync(fd, String(content));
    } finally {
      fs.closeSync(fd);
    }
    fs.renameSync(tempPath, flagPath);
  } catch (e) {
    // Silent fail
  }
}

// Symlink-safe, size-capped, whitelist-validated flag read. Returns null on
// any anomaly (missing, symlink, oversized, not a recognized mode) rather
// than trusting arbitrary file content.
function readFlag(flagPath) {
  try {
    const st = fs.lstatSync(flagPath);
    if (st.isSymbolicLink() || !st.isFile() || st.size > MAX_FLAG_BYTES) return null;

    const O_NOFOLLOW = typeof fs.constants.O_NOFOLLOW === 'number' ? fs.constants.O_NOFOLLOW : 0;
    const fd = fs.openSync(flagPath, fs.constants.O_RDONLY | O_NOFOLLOW);
    let raw;
    try {
      const buf = Buffer.alloc(MAX_FLAG_BYTES);
      const n = fs.readSync(fd, buf, 0, MAX_FLAG_BYTES, 0);
      raw = buf.slice(0, n).toString('utf8');
    } finally {
      fs.closeSync(fd);
    }

    const mode = raw.trim().toLowerCase();
    return VALID_MODES.includes(mode) ? mode : null;
  } catch (e) {
    return null;
  }
}

module.exports = { getDefaultMode, getConfigDir, getConfigPath, findRepoConfigPath, VALID_MODES, safeWriteFlag, readFlag };
