# ESLint CLI Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace deprecated `next lint` with the ESLint CLI everywhere, fixing the heap OOM caused by non-global ignores, ready for Next.js 16.

**Architecture:** Three coordinated file edits: make the ignores in `eslint.config.mjs` a standalone first config object (flat-config global ignores) extended to cover all generated output; point the npm `lint` script at `eslint .`; switch CI's lint step to `npm run lint`. No rule changes, no new dependencies.

**Tech Stack:** ESLint 9 flat config, `eslint-config-next` via FlatCompat, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-06-12-eslint-cli-migration-design.md`

**Branch:** `chore/eslint-cli-migration` (already created from origin/main)

---

### Task 1: Global ignores in eslint.config.mjs

**Files:**
- Modify: `eslint.config.mjs`

- [ ] **Step 1: Restructure the config**

Replace the `eslintConfig` array in `eslint.config.mjs` so it reads exactly:

```js
const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".open-next/**",
      ".wrangler/**",
      "out/**",
      "build/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "@next/next/no-html-link-for-pages": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@next/next/no-img-element": "warn",
    },
  },
];
```

The imports and `compat` setup above the array stay unchanged. The critical change: `ignores` moves from the rules object (where it scopes nothing useful) into its own first object, which flat config treats as global ignores.

- [ ] **Step 2: Verify the OOM is gone**

Run: `npx eslint . 2>&1 | tail -5`
Expected: completes in well under a minute with no output about heap or memory.

`eslint .` covers files `next lint` never linted (`scripts/`, `tests/`, root config files), so new findings may appear even though main is lint-clean. If they do: fix warnings that are trivial (unused vars, imports) in this task; if anything non-trivial surfaces, stop and report it rather than changing rules to silence it.

- [ ] **Step 3: Commit**

```bash
git add eslint.config.mjs
git commit -m "fix(lint): make ignores global so the ESLint CLI skips generated output"
```

---

### Task 2: npm scripts and CI workflow

**Files:**
- Modify: `package.json` (scripts block)
- Modify: `.github/workflows/ci.yml` (Run ESLint step, ~line 30-31)

- [ ] **Step 1: Update the lint scripts**

In `package.json`, change:

```json
    "lint": "eslint",
```

to:

```json
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
```

- [ ] **Step 2: Update CI**

In `.github/workflows/ci.yml`, change:

```yaml
      - name: Run ESLint
        run: npx next lint
```

to:

```yaml
      - name: Run ESLint
        run: npm run lint
```

- [ ] **Step 3: Verify scripts work**

Run: `npm run lint`
Expected: completes, zero warnings/errors, no deprecation banner.

- [ ] **Step 4: Commit**

```bash
git add package.json .github/workflows/ci.yml
git commit -m "chore(lint): run the ESLint CLI in npm scripts and CI instead of next lint"
```

---

### Task 3: Coverage and regression verification

**Files:** none modified permanently (temporary edits reverted within the task)

- [ ] **Step 1: Prove coverage beyond src/**

Append a deliberately unused variable to a test file and a script file:

```bash
echo "const eslintCoverageProbe = 1" >> tests/unit/lib/shopify-admin.test.ts
echo "const eslintCoverageProbe = 1" >> scripts/submit-indexnow.ts
npm run lint
```

Expected: `npm run lint` reports the `@typescript-eslint/no-unused-vars` warning in BOTH files. This proves the CLI lints `tests/` and `scripts/`, which `next lint` never covered.

- [ ] **Step 2: Revert the probes**

```bash
git checkout -- tests/unit/lib/shopify-admin.test.ts scripts/submit-indexnow.ts
npm run lint
```

Expected: clean again, zero warnings.

- [ ] **Step 3: Confirm the build is unaffected**

Run: `npm run build`
Expected: completes successfully; the Next 15 build-time lint pass still runs and passes.

- [ ] **Step 4: Run unit tests**

Run: `npm run test:unit`
Expected: 1 test file, 1 test, passing.

- [ ] **Step 5: Commit (only if anything changed)**

Nothing should be left to commit; `git status` should be clean apart from untracked build output.
