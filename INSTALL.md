# Install essence

**Claude Code** doesn't need a clone; the plugin manifest lives in this repo, so the marketplace
mechanism reads it straight from GitHub:

```bash
claude plugin marketplace add jurassix/essence && claude plugin install essence@essence
```

Every other supported agent writes into a local rules file, so those need a clone:

```bash
git clone https://github.com/jurassix/essence.git
cd essence
node bin/install.js
```

What it does: detects which supported agents are present on your machine, and for each one either
installs the Claude Code plugin (hooks give it true always-on behavior) or writes the ruleset into
that agent's native rules file (`AGENTS.md`, `GEMINI.md`, `.cursor/rules/`, etc.). Safe to re-run:
each agent's block is replaced in place, not duplicated.

## Per-agent

| Agent | What happens | Always-on? |
|---|---|:-:|
| **Claude Code** | Runs `claude plugin marketplace add <repo>` and `claude plugin install essence@essence`. Hooks apply the ruleset every session automatically. | Yes |
| **Codex CLI** | Writes the ruleset into `AGENTS.md` in the current directory (creates it if absent, otherwise inserts/replaces a marked block). | Yes |
| **Gemini CLI** | Same, into `GEMINI.md`. | Yes |
| **Cursor** | Writes to `.cursor/rules/essence.md`. | No: say "essence mode" or invoke `/essence` once per session |
| **Windsurf** | Writes to `.windsurf/rules/essence.md`. | No: same as Cursor |
| **Cline** | Writes to `.clinerules/essence.md`. | No: same as Cursor |

Detection: Claude Code / Codex / Gemini check for `~/.claude`, `~/.codex`, `~/.gemini` or the CLI
binary on `PATH`. Cursor / Windsurf / Cline check for their config directory in the current repo
(`.cursor/`, `.windsurf/`, `.clinerules/`) since those are per-project conventions.

## Flags

| Flag | What |
|---|---|
| `--list` | Print the agent matrix and whether each was detected. Changes nothing. |
| `--dry-run` | Print what would be installed for each detected agent. Changes nothing. |
| `--only <id>` | Install for one agent only (`claude`, `codex`, `gemini`, `cursor`, `windsurf`, `cline`). Repeatable. |

```bash
node bin/install.js --list
node bin/install.js --dry-run
node bin/install.js --only cursor --only windsurf
```

`install.sh` (macOS/Linux/WSL) and `install.ps1` (Windows) are thin shims that check for Node >=18
and forward all flags to `bin/install.js`; use whichever matches your shell.

## Manual install (Claude Code)

If you'd rather not let the installer shell out to `claude`, or you're installing from a local
clone instead of GitHub:

```bash
claude plugin marketplace add jurassix/essence   # or: add /path/to/your/clone
claude plugin install essence@essence
```

## Manual install (rules-file agents)

Copy the body of `skills/essence/SKILL.md` (everything after the `---` frontmatter) into your
agent's rules file: `AGENTS.md`, `GEMINI.md`, `.cursor/rules/essence.md`,
`.windsurf/rules/essence.md`, or `.clinerules/essence.md`.

## Agents without a bespoke install path

Any agent that reads a plain instructions file (a `CLAUDE.md`/`AGENTS.md`-style convention) can use
essence today via the manual copy above, even if it isn't in the detection list yet. Broader
one-command coverage (an entry in a shared skills registry, the way caveman covers 30+ agents) is
future work.
