# essence

This repo builds essence, a tool that strips writing down to what the reader needs. It dogfoods
itself: apply the ruleset in `skills/essence/SKILL.md` to everything you write here — commit
messages, PR text, code comments, docs.

Source of truth for the ruleset: `skills/essence/SKILL.md`. Don't duplicate its content elsewhere;
`src/hooks/essence-activate.js` reads it at runtime and `bin/install.js` reads it to build each
agent's rules file. Edit it in one place.

Layout:
- `skills/essence/` — the always-on ruleset
- `skills/essence-pr/`, `skills/essence-doc/`, `skills/essence-commit/` — deliverable-specific skills
- `commands/` — Claude Code (`.md`) and Codex (`.toml`) slash-command pairs
- `src/hooks/` — SessionStart / UserPromptSubmit hooks for Claude Code's always-on mode
- `bin/install.js` — multi-agent installer; `install.sh` / `install.ps1` are thin shims over it
- `tests/` — installer tests (`node --test`) and essence-doc fixtures
