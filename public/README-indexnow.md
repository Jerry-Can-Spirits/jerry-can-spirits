# IndexNow keys

Two key files sit at the site root, and both are meant to be there.

IndexNow verifies a submission by fetching a key file from the domain it claims
to speak for. The protocol allows a domain to host several, which is how two
independent systems can each submit without sharing a credential or being able
to break the other.

| Key | Belongs to | Submits when |
|---|---|---|
| `a7e2b5f9c3d1e6a8b4d2f0e5c9a3b7d1` | us | `scripts/submit-indexnow.ts` is run, normally after a deploy |
| `u2ytr8rxgfc4h1jh6hxxhrgzn93xtb8d` | Ahrefs Site Audit | Ahrefs crawls the site and notices a change |

**They are not redundant, and one is not a replacement for the other.** Ours
fires the moment we publish; Ahrefs' fires when Ahrefs next crawls, which is a
weekly cadence rather than an immediate one. On a site that adds pages in
batches — thirteen cocktail pages in one evening in August 2026 — the
difference between "now" and "within a week" is the whole value of the
protocol. Keeping both means a publish is announced immediately and anything
the script misses is picked up on the next crawl.

Keeping them separate also means Ahrefs regenerating their key, or the account
lapsing, cannot stop us submitting.

## The files

Both contain the key as their entire contents, UTF-8, **no trailing newline**,
exactly 32 bytes. The newline matters: the file is compared against the key it
is named for, and an implementation doing an exact match will reject a 33-byte
file. Check with `wc -c` after editing, because most editors add one silently.

Next serves everything in `public/` from the site root, so
`public/<key>.txt` is reachable at `https://jerrycanspirits.co.uk/<key>.txt`.

## If a key stops verifying

Fetch it as a bot would, not as a browser:

```
curl -A "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)" \
  https://jerrycanspirits.co.uk/<key>.txt
```

A 200 with the bare key is correct. A challenge page means Cloudflare bot
protection is intercepting the fetch, which is worth checking before assuming
the file is wrong.
