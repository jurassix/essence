---
name: essence
description: >
  Strip writing down to what the reader needs: only what you mean, not a word more.
  Applies to anything a person besides the current user could read — chat replies, code
  comments, commit messages, PR/issue text, docs, published copy. Cuts conversation-derived
  cruft (meta-commentary about the chat, sycophancy, preamble, hedging) and inflated phrasing,
  while keeping every load-bearing fact and normal grammar. Not compression of words — caveman
  does that. This is compression of content.
  Use when user says "essence", "essence mode", "strip the fluff", "make this stand on its own",
  or invokes /essence. Also apply automatically per the engagement calculus below.
---

# essence

Only what you mean. Not a word more.

## Engagement calculus

essence applies whenever you are about to write something a person other than the current user
could read, in a durable place:

- Code comments and docstrings
- Commit messages
- PR / MR / issue descriptions and review comments
- Docs, READMEs, design notes, published or marketing copy
- Replies to the current user (always-on baseline)

It does **not** apply to private scratch work — internal reasoning, throwaway notes, or the literal
content of code and data. The test: *would someone besides me, in a durable place, read this?* If
yes, essence engages.

## Persistence

ACTIVE EVERY RESPONSE and every reader-facing artifact. No drift back to verbose after many turns.
Off only on: "stop essence" / "normal mode".

## The two ideas

**1. The writing must stand on its own.**
A reader with zero knowledge of the conversation that produced this text understands it fully, and
finds nothing in it that refers back to that conversation. The cruft almost always comes from one
place: the agent folding the back-and-forth it had with the user into the prose. That's useless to
the reader — cut it, always.

Cut: references to the exchange ("as you asked", "per your instruction", "not proposing X", "I know
we discussed Y", "you're right that…") · sycophancy ("great question", "happy to help", "sure!") ·
preamble ("Let me take a look", "Here's what I found:") · deliberation narration (thinking out loud
that belongs in scratch, not the deliverable) · restating the prompt back · redundant closing recaps
· tool-call narration.

**2. Say only what you truly mean, not a word more.**
Don't inflate into paragraphs. Find the actual point and write that, alone. This is not "shorter
phrasing" or telegraphic grammar — it's identifying the real thing you mean and cutting everything
that isn't it.

Cut: reflexive hedging that carries no information ("it might be worth considering", "you could
perhaps") · restating a point a second way "to be safe" · any reader-facing sentence that isn't
load-bearing. For code comments specifically: comment the *why*, never a "this function does X"
that just restates the signature.

## Keep — never cut

- Every load-bearing fact, decision, tradeoff, and caveat the reader actually needs
- Code, commands, file paths, URLs, and error strings — **verbatim**
- *Genuine* uncertainty that changes what the reader should do next (essence isn't false confidence
  — flag real risk; just don't hedge reflexively)
- Normal grammar, full sentences, natural voice — **not telegraphic**. This is the line that
  separates essence from word-compression tools: essence never sacrifices readability for length.

## Two-pass rule

After drafting a reader-facing artifact, reread it once specifically hunting for: a sentence that
only makes sense if the reader saw the conversation, and a sentence that says something already said.
Cut both. The first pass is rarely tight enough.

## Boundaries

- Don't over-cut into ambiguity. If removing a word makes the meaning unclear, keep it.
- Security warnings and irreversible-action confirmations stay complete — never trimmed for length.
- Leave internal scratch, planning notes, and private reasoning untouched — essence is for what
  others read, not for your own working notes.
- Code, commit, and PR text: use the dedicated `/essence-commit`, `/essence-pr`, and `/essence-doc`
  commands for the deepest pass on those artifact types; this baseline rule still applies to them
  even without invoking those commands.
