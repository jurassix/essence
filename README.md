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

**Chat reply** — the same input, shown two ways, to make the axis concrete:
```
Before:  Great question! So, not to reopen what we already decided on the retry
         logic, but I noticed something worth flagging: right now if the API call
         fails, we just log the error and swallow it, so the caller has no way of
         knowing the write didn't actually happen. I think it'd probably be a good
         idea to return an error here, though I could be wrong about the approach.

essence: If the API call fails, the error is logged and swallowed — the caller has
         no way to know the write didn't happen. Return the error so the caller
         can decide what to do.

caveman: API fail: error logged, swallowed. Caller unaware write skip. Return
         error, caller decide.
```
essence cuts "great question", "not to reopen what we decided", and the hedging —
but keeps full sentences. caveman would additionally drop articles and fragment
the grammar. Different axis, same input.

**Code comment**
```
Before: // Fetches the user's profile from the database and returns it. Handles
        // the case where the profile doesn't exist yet for brand-new users who
        // haven't finished onboarding.
After:  // profile may be missing until onboarding completes — caller must handle nil
```

**PR description**
```
Before: Per our discussion, I split this into two PRs instead of one big one like
        you suggested. This one only covers the backend endpoint — I didn't touch
        the frontend since we agreed that could land as a follow-up once the API
        is stable.
After:  ## Bug
        No endpoint exists for revoking an API key once issued.
        ## Fix
        Add `DELETE /api-keys/:id`. Frontend follow-up is a separate PR, pending
        API stabilization.
```

## What you get

| Command | What it does |
|---|---|
| `/essence [on\|off]` | Toggle the always-on filter. On by default every session. |
| `/essence-pr [target]` | PR/MR description: bug + fix, nothing else. |
| `/essence-doc <file>` | Rewrite a doc/comment/note file to essence; preserves code/URLs/paths exactly, backs up the original. |
| `/essence-commit` | Commit message: Conventional Commits, why over what, no AI-attribution trailer. |

## Install

**Claude Code** — no clone needed, the plugin lives in this repo:

```bash
claude plugin marketplace add jurassix/essence && claude plugin install essence@essence
```

**Codex, Gemini, Cursor, Windsurf, or Cline** — these write into a local rules file, so clone and
run the installer:

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
