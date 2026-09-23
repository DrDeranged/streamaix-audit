---
name: GitHub push via Git Data API
description: The only working way to push local commits to GitHub from this Replit environment — full Git Data API flow via the GitHub connector's proxyFetch.
---

# GitHub push via Git Data API

## The rule
Git CLI (`git push`) is broken — credential is stale and cannot be refreshed.
Octokit `updateRef` alone fails with "Object does not exist" (422) because local commit objects don't exist on the remote server; the REST ref API only moves a pointer.
The working method is the full **Git Data API** sequence via `conn.proxyFetch`.

**Why:** The workspace's Git credential has failed in prior pushes. The GitHub connector can authenticate through its proxy, but `updateRef` alone requires commit objects already uploaded to GitHub.

**How to apply:** Every time a commit needs to reach GitHub, use this 6-step flow inside a `"use impure"` block via `listConnections("github")`:

1. `GET /repos/{owner}/{repo}/git/commits/{remoteSha}` → get `tree.sha` (base tree)
2. For each changed file: `POST /repos/{owner}/{repo}/git/blobs` with `{ content, encoding: 'utf-8' }` → get blob SHA
3. `POST /repos/{owner}/{repo}/git/trees` with `{ base_tree, tree: [{path, mode:'100644', type:'blob', sha}...] }` → new tree SHA
4. `POST /repos/{owner}/{repo}/git/commits` with `{ message, tree: newTreeSha, parents: [remoteSha] }` → new commit SHA
5. `PATCH /repos/{owner}/{repo}/git/refs/heads/main` with `{ sha: newCommitSha }` → done
6. Verify the remote ref and uploaded file hashes. Query the remote ref fresh on every push; never rely on a saved SHA.

## Key data points
- Owner: `DrDeranged`, repo: `streamaix-audit`, branch: `main`
- `conn.hasClient` is true (Octokit SDK available) but `updateRef` still fails without pre-uploaded objects
- `conn.proxyFetch` requires path starting with `/` (e.g. `/repos/...`), NOT a full URL

## Blob upload pattern
`Promise.all` inside a single `"use impure"` block fails silently (all blob.sha come back undefined).
A for-loop inside a single `"use impure"` block causes "null does not match type Pattern" replay error.
**Working pattern:** one small `"use impure"` function per blob, launched in parallel from the DURABLE scope via `Promise.all(payloads.map(p => (async function(fp, content) { "use impure"; ... })(p.path, p.content)))`.
Then do tree + commit + ref update in ONE separate `"use impure"` call after blobs are confirmed.

## Common pitfall
Do NOT call `octokit.git.updateRef` without first uploading blobs and creating the tree+commit via the API. The ref pointer update requires the target SHA to already exist on GitHub.
