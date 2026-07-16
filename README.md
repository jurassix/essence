# essence

**Only what you mean. Not a word more.**

essence strips writing down to what the reader needs. It applies wherever a person besides you
could read the result: chat replies, code comments, commit messages, PR/issue text, docs,
published copy.

The idea: writing usually picks up cruft from the conversation that produced it — hedges,
meta-commentary about what was asked, preamble, restated context. None of that belongs in the
deliverable. A reader who never saw that conversation should understand it fully, and find nothing
in it that refers back to something they weren't part of.

## essence vs [caveman](https://github.com/JuliusBrussee/caveman)

Caveman compresses *words* — telegraphic grammar, dropped articles, same content in fewer tokens.
essence filters *content* — full grammar, full sentences, but only the sentences that are actually
load-bearing. Different axis: caveman changes *how* something is said, essence changes *what* gets
said at all. They compose fine; essence doesn't touch phrasing style.

## Before / after

**Code comment**
```
Before: // This function fetches the user's profile from the database and
        // returns it, handling the case where the profile might not exist yet
After:  // profile may not exist yet (new users) — caller must handle nil
```

**Chat reply** (contrast with caveman: still full sentences, not fragments)
```
Before: Sure! I'd be happy to help with that. So looking at your code, I think the
        issue you're experiencing is likely caused by the fact that you're creating
        a new object reference on each render, since when you pass an inline object
        as a prop, React's shallow comparison sees it as a different object every time.
After:  The inline object prop creates a new reference on every render, so React's
        shallow comparison always sees it as different and re-renders. Wrap it in useMemo.
```

**PR description**
```
Before: As discussed, I'm not proposing we fold this into the existing check — just
        adding a new one. Per the trace you shared, it crashes at line 42 because
        the token can be null there.
After:  ## Bug
        Auth middleware crashes when `token` is null; the check at line 42
        dereferences it directly.
        ## Fix
        Add a null guard before the dereference.
```

## What you get

| Command | What it does |
|---|---|
| `/essence [on\|off]` | Toggle the always-on filter. On by default every session. |
| `/essence-pr [target]` | PR/MR description: bug + fix, nothing else. |
| `/essence-doc <file>` | Rewrite a doc/comment/note file to essence; preserves code/URLs/paths exactly, backs up the original. |
| `/essence-commit` | Commit message: Conventional Commits, why over what, no AI-attribution trailer. |

## Install

Not published to a registry yet — clone and run the installer:

```bash
git clone https://github.com/jurassix/essence.git
cd essence
node bin/install.js            # detect installed agents, install for each
node bin/install.js --list     # see the agent matrix + what was detected
node bin/install.js --dry-run  # preview without writing anything
```

See [INSTALL.md](./INSTALL.md) for the per-agent matrix and manual steps.

## Repo layout

- `skills/essence/SKILL.md` — the ruleset; single source of truth, read at runtime by the
  activation hook and by the installer
- `skills/essence-pr/`, `skills/essence-doc/`, `skills/essence-commit/` — deliverable-specific skills
- `commands/` — Claude Code (`.md`) and Codex (`.toml`) slash-command pairs
- `src/hooks/` — SessionStart / UserPromptSubmit hooks powering Claude Code's always-on mode
- `bin/install.js` — multi-agent installer; `install.sh` / `install.ps1` are thin shims over it

## Out of scope for v1

Token-savings stats + statusline, an MCP tool-description compressor, a benchmark/eval harness.
essence is language-preserving by nature (it never translates), so there's no separate mode for that.
