# Master documentation set — design

**Date:** 2026-07-13
**Scope:** both repos — `jerry-can-spirits` and `pour-iq`
**Goal:** level both repos up to one shared documentation standard, tailored per repo, so each carries a complete, internally consistent doc set and any future Jerry Can Spirits Ltd repo copies the closer one and edits the brand half.

## Decisions (from brainstorm, 2026-07-13)

1. **Both existing repos are the point.** The masters are not abstract templates; they are the live docs of these two repos, converged on one skeleton. A future repo benefiting is a bonus.
2. **Tailored copy in each repo.** One master structure, two tailored instances. No cross-repo dependency, no sync mechanism; shared standards read near-identically, brand/voice sections differ.
3. **Docs now, code gaps as follow-up.** Where the security baseline reveals a gap in either repo (e.g. Pour IQ has no `security.txt`), the gap is listed in that repo's SECURITY.md follow-ups section and shipped later as its own small PR. No code changes in this job.
4. **Pour IQ gets a derived voice doc.** Extracted from the shipped site and portal copy plus the transferable JCS writing discipline, positioned as its own SaaS voice, subject to Dan's explicit approval before merge. The "copy is final as provided" rule is unchanged.

## The four-doc skeleton (per repo)

### 1. `CLAUDE.md` — the working contract
Stack, key architecture decisions, coding standards, git workflow summary, and pointers to the three docs below. Keeps a short inline list of the hard writing rules (no em-dashes, no emojis, no exclamation marks, no hype) because they are load-bearing in every session; full voice detail moves to VOICE.md with a binding instruction to read it before writing any customer-facing copy.

- **JCS:** current file is the model. Brand-content detail (language lists, messaging hierarchy, product sheet, hook structure) moves to `docs/VOICE.md`. Technical sections (stack, Field Manual, SEO approach, cross-repo sessions) stay.
- **Pour IQ:** grows from 7 lines to the full skeleton. The existing copy rules (byte-exact copy, app-claim verification against the JCS-derived app code, legal copy/date coupling) stay verbatim at the top — they are the highest-priority rules in that repo.

### 2. `docs/VOICE.md` — voice, tone, and writing rules
- **JCS:** consolidated from CLAUDE.md's writing sections. `docs/BRAND_GUIDELINES.md` keeps its trademark/logo/colour/legal material; its contradictory voice section ("Bold", "Premium British Rum" — both violate the writing rules) is replaced with a pointer to VOICE.md.
- **Pour IQ:** new, derived from shipped copy. Same spine of discipline as JCS (no hype, no filler, one CTA, write to one person) where the copy confirms it transfers; its own register, terminology, and example lines. Includes the claims discipline: never claim what the app does not ship (notably no cross-venue price benchmarking).

### 3. `docs/SECURITY.md` — the security baseline
Near-identical shared standard in both repos: HTTP headers and CSP posture, secrets discipline, consent gating of third parties, dependency hygiene (dependabot + CI), vulnerability disclosure route, data handling/retention. Each repo's copy states its own current implementation against the baseline and ends with a follow-ups list of its gaps.

### 4. `docs/CONTRIBUTING.md` — the actual workflow
Rewritten to match reality in both repos: branch off fresh `origin/main` per piece of work, never reuse merged branches, PR to `main`, CI green before merge, squash merge, delete branch. The current JCS CONTRIBUTING.md describes a `dev`-branch Git Flow that has never matched practice and is replaced entirely. Per-repo verification commands included.

## Out of scope

- Code changes (including the security follow-ups themselves).
- Copy changes on either public site.
- The ~170 historical specs/plans in `docs/superpowers/` (history, untouched).
- The JCS content docs (guides, briefs, SEO checklists) beyond the four-doc set.

## Delivery

Two PRs, one per repo, each self-contained. The Pour IQ PR carries the derived voice doc for Dan's approval; nothing merges without his review. This spec lives in the JCS repo (the established specs home) and is referenced from both PRs.
