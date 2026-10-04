# Rollback and restore

What to do when a deploy is wrong, and how to get data back. Written after Audit E (4 October 2026) found that the 28 September outage ran for eighteen hours partly because the only rollback anyone knew was a revert pull request. Each section is a list of steps; do them in order.

Rehearse the Worker rollback once in a quiet hour before the Christmas window, so the first time is not the one that matters.

---

## 1. Roll back the Worker (minutes, no code)

Cloudflare keeps every version of the Worker. Switching back is instant and needs no build.

1. Cloudflare dashboard, account Jerry Can Spirits, Workers and Pages, `jerry-can-spirits-prod`.
2. Deployments tab. The top row is live. The row beneath it is what was live before.
3. On the previous row, open the menu and choose Rollback. Confirm.
4. In a private window, load the homepage, a product page and `/api/geo/`. Then run the smoke test from a terminal:

   ```
   SMOKE_TOKEN=<the WAF token> node scripts/smoke.mjs
   ```

5. Open the revert pull request so `main` matches what is live. Until it merges, the next merge to `main` will deploy the broken code again, so do this before anything else merges.

From a terminal instead of the dashboard:

```
npx wrangler versions list --name jerry-can-spirits-prod
npx wrangler rollback --name jerry-can-spirits-prod <version-id>
```

Rollback restores code and bindings. It does not touch secrets, KV, D1 or R2.

## 2. Restore the D1 database

Two sources, in this order of preference.

**Point in time, up to 30 days back.** Cloudflare keeps a continuous history. Find the moment before the damage and restore to it:

```
npx wrangler d1 time-travel info jerry-can-spirits-db --timestamp=2026-12-01T09:00:00Z
npx wrangler d1 time-travel restore jerry-can-spirits-db --timestamp=2026-12-01T09:00:00Z
```

The first command prints the bookmark it would use; the second applies it. Everything written after that moment is lost, so take a fresh export first (below) if any of it is wanted.

**From the weekly export, any age up to eight weeks.** GitHub, Actions, the Backups workflow, pick the run, download `d1-jerry-can-spirits-db-<run>`. The file is encrypted, because this repository is public and anyone with a GitHub account can download its artefacts. The passphrase is `BACKUP_PASSPHRASE` in 1Password. Then:

```
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -in d1-jerry-can-spirits-db.sql.gz.enc -out d1-jerry-can-spirits-db.sql.gz
gunzip d1-jerry-can-spirits-db.sql.gz
npx wrangler d1 execute jerry-can-spirits-db --remote --file=d1-jerry-can-spirits-db.sql
```

The first command asks for the passphrase.

The export is a full dump with `CREATE TABLE` statements, so it goes into an empty database, not over a live one. To recover single rows, open the file and copy the `INSERT` lines for the rows that matter into a smaller file, then run that.

To take an export by hand at any time:

```
npx wrangler d1 export jerry-can-spirits-db --remote --output=backup.sql
```

## 3. Restore the Sanity dataset

GitHub, Actions, the Backups workflow, pick the run, download `sanity-production-<run>`. It is an encrypted tarball of every document and asset, about 200 MB. Decrypt it with the same passphrase:

```
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -in sanity-production.tar.gz.enc -out sanity-production.tar.gz
```

To bring back a few documents, import into a scratch dataset and copy from there with a script; do not import over production. To replace the whole of production (the dataset was emptied or every cocktail was overwritten):

```
npx sanity dataset import sanity-production.tar.gz production --replace
```

Both need `SANITY_AUTH_TOKEN` set to a token with Editor rights. The Sanity webhook will revalidate the site as documents land; if pages still look stale after ten minutes, purge the Cloudflare cache from the dashboard.

## 4. Before any change in the Christmas window

For any merge between 20 November and 4 January.

1. Does it touch checkout, the cart, product or price data, delivery copy, the age gate, middleware, the Worker entry, `wrangler.jsonc`, `next.config.ts`, or anything under `/api/`? If yes, it needs an exception to the December freeze. If no, carry on.
2. Fresh branch off `origin/main`, pull request, `CI` green including the local smoke. No merges of anything else in the same hour.
3. Merge only Monday to Thursday between 09:00 and 15:00, with the person merging available for the following hour.
4. After merge, open Cloudflare, Workers and Pages, `jerry-can-spirits-prod`, Deployments, and wait for the new version to show as active. Then check the post-deploy smoke run is green in Actions.
5. In a private window at phone width: homepage loads styled, product page shows a price, add to cart, reach the Shopify checkout page. Then fetch the homepage once more and confirm `X-Edge-Cache: HIT` after a minute.
6. If any step fails, roll back from the Deployments page first (section 1) and investigate second.
7. Sanity content changes are not code and are not frozen; they go live on publish through the webhook. Shopify admin changes to prices and inventory are not frozen either, but checkout settings are.
