# Contributing

How work actually ships in this repo. The same workflow applies in the sibling `pour-iq` repo (its copy of this document differs only in commands).

## The model

Trunk-based. `main` is the only long-lived branch and auto-deploys to production via Cloudflare on merge. There is no `dev` branch, no release branches, no tags. Work moves in small, focused PRs that merge within minutes of passing review.

## Starting work

Every piece of work gets a fresh branch off up-to-date `origin/main`:

```bash
git fetch origin
git checkout -b feat/short-description origin/main
```

- Never branch off a stale local `main`.
- Never reuse a branch whose PR has merged — start a new one, even for a follow-up to the same feature.
- If `main` moves while you work, rebase onto `origin/main` before pushing.

Branch prefixes, matching the history: `feat/`, `fix/`, `docs/`, `chore/`.

## Before opening a PR

Run and pass, in this order:

```bash
npx tsc --noEmit     # typecheck — must be clean
npx vitest run       # tests — must pass
npm run build        # production build — must compile all pages
```

Lint the files you changed (`npx eslint <files>`); the repo-wide lint carries legacy noise, but changed files must be clean. For UI changes, check the affected pages at mobile and desktop widths.

## The PR

- Target `main`. One concern per PR; a batch of small related tweaks is fine, unrelated work is not.
- The description says what changed and why, and states what was verified (typecheck, tests, build) — claims of "works" without verification listed don't merge.
- CI runs build and type checks on every push; it must be green before merge.
- Squash merge. Delete the branch after.

## Commits

Conventional prefix, imperative subject, body explains why rather than what:

```
feat: homepage trust signals and desktop footer accordions

The second Trustpilot section duplicated the pull-quote strip's job...
```

## Hotfixes

Same flow, no shortcuts: branch off `origin/main`, PR, CI green, squash merge. The pipeline is fast enough that bypassing it never pays.

## Copy and content

Customer-facing words follow `docs/VOICE.md`. Trademark, logo, and colour usage follow `docs/BRAND_GUIDELINES.md`. Security-relevant changes follow `docs/SECURITY.md`.
