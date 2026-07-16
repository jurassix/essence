---
name: essence-pr
description: >
  Write a PR/MR description that stands on its own: the bug and the proposed fix, nothing else.
  No conversation residue, no test-plan padding unless it's needed. Use when user says
  "write a PR description", "PR description", or invokes /essence-pr.
---

# essence-pr

A reviewer opens this PR with no memory of the conversation that produced it. The description's
only job: let them understand the bug and the fix without asking a single follow-up question.

## Structure

Two sections, nothing more unless the change genuinely needs it:

```
## Bug
<what was broken, in terms a reviewer who never saw the issue can verify against the diff>

## Fix
<what changed and why this is the correct fix, not a narration of the diff>
```

Add a third section only when the reviewer actually needs it:
- **Test plan**: only if verification isn't obvious from CI, or a manual repro step is required
- **Breaking change / migration note**: only if one actually exists

## What never goes in

- "As discussed", "per your feedback", "you asked me to split this up": the reviewer wasn't there
- Restating the diff line-by-line: the diff already shows *what*; the description explains *why*
  it's the right fix
- Hedging about scope ("not proposing to also fix X"): if it's out of scope, just don't mention it
- Filler acknowledgments, sign-offs, or AI attribution

## Boundaries

Generates the description text only; does not run `gh pr create` or push. If asked to update an
existing PR, produce the replacement text; let the user apply it.
