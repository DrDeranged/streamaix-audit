---
name: GitHub push via Git Data API
description: The only working way to push local commits to GitHub from this Replit environment — full Git Data API flow via the GitHub connector's proxyFetch.
---

# GitHub push via Git Data API

## The rule
Git CLI (`git push`) is broken — credential is stale and cannot be refreshed.
Octokit `updateRef` alone fails with "Object does not exist" (422) because local commit objects don't exist on the remote server; the REST ref API only moves a pointer.
The working method is the full **Git Data API** sequence via `conn.proxyFetch`.

**Why:** The Replit git identity/credential for `github.com` has expired. The GitHub connector (connection `conn_github_01KVKX5934R739VW15CD24N0C9`) provides a valid OAuth token through the proxy, but `updateRef` alone requires the commit objects to already exist on GitHub — they don't until you upload them.

**How to apply:** Every time a commit needs to reach GitHub, use this 6-step flow inside a `"use impure"` block via `listConnections("github")`:

1. `GET /repos/{owner}/{repo}/git/commits/{remoteSha}` → get `tree.sha` (base tree)
2. For each changed file: `POST /repos/{owner}/{repo}/git/blobs` with `{ content, encoding: 'utf-8' }` → get blob SHA
3. `POST /repos/{owner}/{repo}/git/trees` with `{ base_tree, tree: [{path, mode:'100644', type:'blob', sha}...] }` → new tree SHA
4. `POST /repos/{owner}/{repo}/git/commits` with `{ message, tree: newTreeSha, parents: [remoteSha] }` → new commit SHA
5. `PATCH /repos/{owner}/{repo}/git/refs/heads/main` with `{ sha: newCommitSha }` → done
6. Update the local workspace note of the remote SHA so future pushes use the correct base

## Key data points
- Owner: `DrDeranged`, repo: `streamaix-audit`, branch: `main`
- GitHub connector ID: `conn_github_01KVKX5934R739VW15CD24N0C9`
- `conn.hasClient` is true (Octokit SDK available) but `updateRef` still fails without pre-uploaded objects
- `conn.proxyFetch` base is the GitHub API root; all paths are `/repos/...` style

## Common pitfall
Do NOT call `octokit.git.updateRef` without first uploading blobs and creating the tree+commit via the API. The ref pointer update requires the target SHA to already exist on GitHub.
