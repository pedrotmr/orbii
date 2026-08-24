# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`
- **List issues**: `gh issue list --state open --json number,title,body,labels`
- **Comment**: `gh issue comment <number> --body "..."`
- **Labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

Infer the repo from `git remote -v` — `gh` does this automatically when run inside a clone.

## Pull requests as a triage surface

**PRs as a request surface: no.**

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: issue labelled `wayfinder:map`
- **Child ticket**: GitHub sub-issue of the map when available; otherwise `Part of #<map>` in the child body + task list on the map. Labels: `wayfinder:research` | `wayfinder:grilling` | `wayfinder:prototype` | `wayfinder:task`
- **Blocking**: GitHub native issue dependencies when available; else `Blocked by: #n` in the body
- **Claim**: `gh issue edit <n> --add-assignee @me`
- **Resolve**: resolution comment → close → append gist + link to the map’s Decisions so far
