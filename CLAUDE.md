# CLAUDE.md

Project conventions live in AGENTS.md (shared with every coding agent) and are imported here:

@AGENTS.md

## Claude Code specifics

### Skills (`.claude/skills/`)

| Skill                  | Use it when…                                                         |
| ---------------------- | -------------------------------------------------------------------- |
| `new-page-object`      | You need a Page Object for a page or component that doesn't have one |
| `test-from-user-story` | You're given a user story / acceptance criteria to automate          |
| `fix-flaky-test`       | A test passes sometimes and fails sometimes, or only in CI           |

Prefer invoking the matching skill over improvising; they encode the repo's workflow.

### Working style

- Before writing locators, **look at the real page**: run
  `node .claude/skills/new-page-object/scripts/dump-locators.mjs <path> [--login standard_user]`
  instead of guessing `data-test` ids.
- Iterate with the narrowest command (`--project=chromium <file> -g "<title>"`), then widen.
- When a test fails, read `test-results/**/error-context.md` first: it has the error,
  the page's accessibility snapshot and the failing source line.
- Run `npm run check` before declaring a task done.
- Never weaken an assertion, add `test.skip`, or update a snapshot just to make a run green.
  Explain the failure instead.
