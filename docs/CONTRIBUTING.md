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

**Crawler measurement has a permanent ceiling.** The zone is on the Pro Website
plan, so Bot Management is unavailable and `cf.verifiedBotCategory` is empty on
every request. Crawler traffic can only be attributed by user-agent plus
`cf.asn` / `cf.asOrganization`, and user-agents are trivially spoofed: a
7-day sample contained requests carrying `meta-externalagent` from Google Cloud
probing for `/.gitconfig`. Report such measurements as UA-and-ASN attribution,
never as verified. The data lives in Workers Logs, reachable at
`POST /accounts/{account}/workers/observability/telemetry/query` with the
standard API token; zone analytics needs a scope the token does not have.

**`dynamicParams = false` 404s every page it is meant to serve.** The site
configures no incremental cache (`open-next.config.ts` is
`defineCloudflareConfig({})`, and both deploy logs read *"Incremental cache does
not need populating"*), so nothing is served from one: every response carries
`x-nextjs-cache: MISS` and re-renders at the edge. Routes with
`dynamicParams = true` do not notice, because a miss falls through to an
on-demand render. With `dynamicParams = false`, Next serves only what it can
confirm was prerendered, that confirmation is unreachable, and the route 404s
for everyone. Forty-five facet pages shipped that way in #1088 and stayed dead
through #1090. Keep `dynamicParams` true on this platform and enforce the
unknown-value 404 inside the component with `notFound()`. Note what that moves:
guards the router used to make unreachable are now reachable, so a page number
arriving as `NaN` needs its own check.

**Build variables live on the trigger, not the Worker.** Reconnecting the Git
integration creates fresh triggers with no variables, and `NEXT_PUBLIC_*`
values are inlined at build time, so the build stays green and the deploy
breaks at runtime. `next.config.ts` asserts the required ones for that reason.
Runtime secrets read through `getCloudflareContext().env` live on the Worker
and survive reconnection; the two sets are not interchangeable.

## Check the check

**Every failure recorded here is a check that measured its input instead of its
output.** That is the whole section. What follows are worked examples, kept
because the shape is easy to recognise afterwards and almost invisible at the
time.

A green Workers Build with no environment variables. A cache-busted URL
returning fresh content while every real visitor got a stale price. A test that
passed because the exemption it asserted was never removed. A link audit that
read rendered text and missed the same link held in a structured field.

The only defence that has worked is verifying the verification: check what the
check actually measured, not merely that it passed.

**A local production server is not the deployed artefact.** The facet routes
were verified by building and serving them with `next start`, which reads
prerendered HTML off local disk. Production runs
`npx opennextjs-cloudflare build` and serves from a Worker, and there the same
45 pages returned 404 to every visitor. Nothing objected: `next build` listed
the pages, the deploy log said *Success*, and the routes 404'd for two days
across three merges. `npm run build` is `next build` only, so no local command
in this repo exercises what ships. After any deploy that introduces routes, run
`npm run verify:live`, which fetches production and asserts the status of one
URL per route family. `--base=https://jerry-can-spirits-prod.dan-a98.workers.dev`
measures the Worker directly, which is the instrument to use when Cloudflare is
challenging requests to the apex domain.

**Scripts run in this order: typecheck, dry run, execute.** `scripts/` is
typechecked by the build, so a script that runs correctly can still break CI.
Worse, running before typechecking means a script that would fail the build has
already written to production Sanity. Any script touching more than a handful
of documents needs a dry-run mode that prints every intended edit and writes
nothing without an explicit flag.

**Verify the query before reporting a surprising result.** A guide titled *The
Rise of English Whisky* was measured as containing zero occurrences of
"English". The extraction had silently returned one word, and the zero was an
artefact of the query rather than a fact about the guide. Its absurdity was the
only signal. Where a result would be surprising if true, confirm the
measurement works before reporting what it found.

**Prefer checks that fail when the thing they verify is absent.** Of the
failures listed here, only the middleware exclusion test could not have slipped
through, because removing the exemption makes the test fail. A check that
passes whether or not the feature exists is not evidence of anything.

**Rule files are the first place to change a formulation, not the last.** The
standing ingredient formulation was retired from eleven places, and three of
them were `CLAUDE.md`, `docs/VOICE.md` and this checklist's companion. Those
three are why it kept coming back: a rule file carrying the wrong version
teaches it to every later session, which then propagates it faithfully into new
copy. Change the rule files first, then the code, then the content.

**A rule that looks arbitrary usually encodes a decision.** `isIndexable`
exempted spirit rollups from the ten-cocktail floor, which read as an
inconsistency and was rewritten into a single uniform rule. It was not an
inconsistency: a rollup earns its page by answering a head term, not by
clearing a count. The test caught it. Before simplifying a rule into something
tidier, find out why it is shaped the way it is.

**Verify the rendered output, not the source.** Token tests passed while the
page title read "1 Recipes by Style" and the intro read "1 recipe ... are built
on whiskey". Reading the rendered strings instead of the templates also caught
a meta at 188 characters against a 155 ceiling, a description reading "built on
brandy: 11 cognac and 10 brandy", and thirteen pages headed "Mocktails
Cocktails". A component correct in isolation can still produce a wrong sentence.

**Use word-boundary matching by default on content screens.** A check for
alcoholic ingredients in the non-alcoholic recipes flagged Shirley Temple,
because the pattern matched "ale" inside "Ginger Ale". The ingredient
vocabulary is full of short words living inside longer ones: gin in ginger,
rum in rumtopf, port in porter.

**Word boundaries do not save you from a word with two meanings.** Mapping
equipment pages to guides by word frequency proposed linking the Blender page
to a distillery history, because Joy Spence is Appleton's master blender, and
the Bitters Bottle page to a paragraph about the size of the Angostura label.
Both matched cleanly on a word boundary and neither was about the object. Only
reading the surrounding sentence catches that.

**A guide that uses an item is not coverage of it.** The same mapping ranked
recipe guides above the glassware guide for every glass, because a recipe says
"strain into a rocks glass" and an explanation says it once. Frequency will
always rank usage above explanation. Rank by whether the subject of the
document is the thing.

**Measurements are labelled MEASURED or ASSUMED.** An inference reported in the
same register as a measurement is indistinguishable from one. If a number is
assumed, say what would confirm it.

The label applies to existence claims as much as to counts. "There are no facet
tests" was reported without looking in `tests/unit/lib/`, where twenty-five
were; "the meta renders at about 150 characters" was an estimate of a string
that was actually 188. Both would have been caught by asking which of the two
words applied.

**Two more instances have their own sections**, because they are standing
conditions rather than habits: *Cloudflare deployment gotchas* above, where a
build reports success and the deploy is broken, and *Known limitations* below,
where crawler attribution cannot be verified from inside the Worker and so any
crawler measurement carries a ceiling that must be stated with the result.

**The branch rule under Starting work is the same failure.** Pushing a
follow-up commit to a branch whose PR has already merged orphans it silently:
the push succeeds, the commit exists, and nothing is on `main`. That has now
happened four times, and the rule forbidding it was already written here each
time. Before pushing a follow-up, check whether the PR has merged rather than
assuming it has not.

**Dump the raw data before forming a theory about it.** A preview-crawler
audit reported fourteen missing user agents that were already present. Three
attempts went into explaining the fourteen before anyone looked at the raw
match output, which showed the cause immediately: a `307'd` inside a comment
had opened a phantom string and swallowed the rest of the pattern. Time spent
theorising about a surprising number is wasted until the number is known to be
real. Print what the check actually saw, then reason about it.

**Fixing a defect in one call site is not fixing the defect.** #1079 widened
the guide search clause in `/api/search` from four fields to twenty-four, and
left `/search` — the canonical, indexable surface — with its own duplicate
implementation still matching four. The defect was reported, understood and
half-fixed in the same session. Before closing a fix, search for every consumer
of the thing being fixed; a second call site is the normal case, not the
exception.

**A clause that has never matched anything looks exactly like a correct clause
over empty data.** Two lived in the search queries for as long as they have
existed. The cocktail query matched `category`, which cocktails do not have.
The guide query matched `introduction`, which is portable text, where `match`
never matches. Both returned nothing, forever, and nothing about them looked
wrong. Test a query clause against input known to match it, or it is not known
to work.

**A measurement that cannot see the thing it measures returns empty and looks
like an answer.** Site search was invisible to GA4 whatever the configuration,
because most searching happens in a modal that fetches results without
navigating, so no `?q=` pageview was ever produced. Reaching for the
parameter-based report would have shown almost no searches and been read as
"nobody searches" rather than "the instrument does not reach". Before trusting
a measurement, establish that a positive result could have reached it.

## Dependency overrides

The `overrides` block in `package.json` pins transitive dependencies past known
advisories. It took the repo from 27 advisories to 0 in #1013 and then decayed
to 21 without anything changing in this codebase: four of the pinned versions
had themselves become vulnerable, `brace-expansion` pinned to exactly `5.0.8`
inside an advisory covering `4.0.0 - 5.0.8`. A pin is a snapshot of what was
safe on the day it was written.

**Re-check monthly, and after any batch of Dependabot merges.** Run:

```bash
npm audit --package-lock-only
```

**Against the committed lockfile, never a local tree.** A local `node_modules`
drifts: this one had `sanity` 6.6.0 installed against a declared `^6.8.0` and
reported different numbers from CI. An audit of a tree nobody deploys is the
same false negative as every other failure in the section above.

Fix by raising the override floor to the patched version within the existing
major. `npm audit fix --force` is not the tool: asked to fix these, it proposed
downgrading `sanity` from the declared `^6.8.0` to `5.20.0` and moving `next`
from 15 to 16, neither of which is a security fix.

## Known limitations

**Ingredient families are two levels deep.** A sub-type has one `parent`, and a
parent has styles. Islay is a style of Scotch, which is a style of whisky, and
the schema cannot express that: Islay is filed directly under whisky. Adding
depth would mean a recursive query and a breadcrumb that can vary in length,
for one document. Left deliberately.

**Crawler attribution is user agent plus ASN, permanently.** `cf.verifiedBotCategory`
needs Bot Management, which is not on the Pro plan, so a request claiming to be
Googlebot cannot be verified as Googlebot from inside the Worker. Attribution
combines the declared user agent with `cf.asn` and `cf.asOrganization`, which is
strong enough to tell a real crawler from a spoofing scraper in aggregate and
not strong enough to trust per request. Any measurement of crawler behaviour
carries that ceiling; do not report it as though the identification were
verified.

## Copy and content

Customer-facing words follow `docs/VOICE.md`. Trademark, logo, and colour usage follow `docs/BRAND_GUIDELINES.md`. Security-relevant changes follow `docs/SECURITY.md`.
