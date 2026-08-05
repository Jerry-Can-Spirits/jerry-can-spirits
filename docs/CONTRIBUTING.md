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

## Cloudflare deployment gotchas

These are invisible until something fails, which is how both of them were
found. Read this before debugging a deploy.

**Production deploys come only from `main`.** Never deploy a preview version to
production to unblock something. The `*` trigger runs `wrangler versions
upload`, the `main` trigger runs `wrangler deploy`; only the second one should
ever be what users get.

**Secret edits are blocked while an undeployed version is newer than the
deployed one.** Because preview builds upload versions without deploying them,
`wrangler secret put` and `wrangler secret delete` fail with error 10215:
*"the latest version of your Worker isn't currently deployed"*. This is
Cloudflare preventing an accidental deploy, not a fault. Either make the change
in the dashboard, or retry immediately after a `main` deploy and before the
next preview build. Do not "fix" it by deploying the latest version — that
version is a preview branch.

**Build variables live on the trigger, not the Worker.** Reconnecting the Git
integration creates fresh triggers with no variables, and `NEXT_PUBLIC_*`
values are inlined at build time, so the build stays green and the deploy
breaks at runtime. `next.config.ts` asserts the required ones for that reason.
Runtime secrets read through `getCloudflareContext().env` live on the Worker
and survive reconnection; the two sets are not interchangeable.

## Check the check

Four distinct failure modes on this project have shared one shape: something
reported success while being wrong. A green Workers Build with no environment
variables. A cache-busted URL returning fresh content while every real visitor
got a stale price. A test that passed because the exemption it asserted was
never removed. A link audit that read rendered text and missed the same link
held in a structured field.

The only defence that has worked is verifying the verification: check what the
check actually measured, not merely that it passed.

**Scripts run in this order: typecheck, dry run, execute.** `scripts/` is
typechecked by the build, so a script that runs correctly can still break CI.
Worse, running before typechecking means a script that would fail the build has
already written to production Sanity. Any script touching more than a handful
of documents needs a dry-run mode that prints every intended edit and writes
nothing without an explicit flag.

**The branch rule under Starting work is the same failure.** Pushing a
follow-up commit to a branch whose PR has already merged orphans it silently:
the push succeeds, the commit exists, and nothing is on `main`. That has now
happened four times, and the rule forbidding it was already written here each
time. Before pushing a follow-up, check whether the PR has merged rather than
assuming it has not.

## Copy and content

Customer-facing words follow `docs/VOICE.md`. Trademark, logo, and colour usage follow `docs/BRAND_GUIDELINES.md`. Security-relevant changes follow `docs/SECURITY.md`.
