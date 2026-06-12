# ESLint CLI Migration — Design

**Date:** 2026-06-12
**Status:** Approved (approach A)

## Background

Next.js 16 removes `next lint`. CI currently runs `npx next lint` (deprecation warning in every build), and the `lint` npm script invokes bare `eslint`, which crashes with a JavaScript heap out-of-memory error.

**Root cause of the OOM:** in ESLint flat config, an `ignores` array is only treated as a global ignore when it is the sole key in its config object. In `eslint.config.mjs` the `ignores` array sits alongside `rules`, so nothing is globally ignored and bare `eslint` attempts to lint generated output, including the ~36 MB `.open-next/worker.js`.

## Scope

Three files, one behaviour: linting runs through the ESLint CLI everywhere, covers the same source files `next lint` covered, completes without OOM, and is Next 16 ready.

### `eslint.config.mjs`

Move the ignores into a standalone first config object so they apply globally, and extend the list to cover all generated output:

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
    rules: { /* unchanged */ },
  },
];
```

No rule changes. `eslint-config-next` and `FlatCompat` stay as-is; both work under Next 16.

### `package.json`

- `lint`: `eslint` becomes `eslint .`
- Add `lint:fix`: `eslint . --fix`

### `.github/workflows/ci.yml`

The Lint and Type Check job's `npx next lint` step becomes `npm run lint`. This removes the deprecation warning from every CI run.

## Out of scope

- The `next-lint-to-eslint-cli` codemod (designed for `.eslintrc` projects; ours is already flat config).
- Any rule changes or new plugins.
- `next build`'s built-in lint pass — unchanged on Next 15; disappears naturally with Next 16.

## Verification

1. `npm run lint` completes without OOM and reports zero warnings or errors (parity with the now-clean `next lint`).
2. Coverage check: a deliberate, temporary lint violation in `tests/` and in `scripts/` is reported by `npm run lint`, then reverted — proving the CLI lints beyond `src/`.
3. `npm run build` still succeeds.
4. CI green on the PR.

## Risks

The ESLint CLI lints a wider file set than `next lint` did (`next lint` defaulted to app/pages/components/lib/src). New findings may surface in `scripts/`, `tests/`, or config files. These are fixed (if trivial) or reviewed individually; the wider coverage is intended, not accidental.
