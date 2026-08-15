---
name: tsc baseline diff line-shift trap
description: Position-only tsc baseline diffs flag pre-existing errors as new when edits shift lines
---
- When diffing tsc errors vs a baseline by file(line,col), edits that delete/insert lines in a file shift its pre-existing errors and they show up as "new".
- **How to apply:** match "new" entries against removed baseline entries by (file, column); only unmatched ones are genuinely new. Regenerate the baseline from a git worktree of the parent commit (symlink node_modules) when /tmp/base-pos.log is gone.
