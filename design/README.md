# Design reference

These are the approved screens from the Claude Design canvas, saved as source so Claude Code can read them.
Treat them as the spec for layout, copy and spacing. Build with the real tokens and classes in
`src/app/globals.css`, not by copying the inline styles.

| File | Screen | Status |
|---|---|---|
| `Landing.dc.html` | Landing page | Built (`src/app/page.tsx`) |
| `SignIn.dc.html` | Sign in | Built (`src/app/sign-in`) |
| `Feed.dc.html` | Browse open roles | Built (`src/app/(app)/browse`) |
| `Project.dc.html` | Project page, offers, credits | Phase 2 |
| `Post.dc.html` | Post a project | Phase 2 |
| `Messages.dc.html` | Messages | Phase 2 |
| `Profile.dc.html` | Profile | Phase 2 (sign-out and basic info built) |

How to read a file: the markup inside `<x-dc>` is the screen; `{{name}}` holes and `<sc-for>` loops are filled
from `renderVals()` in the `<script>` at the bottom, which also holds the example data and the interactions
(filters, accept/decline, add role). Example names and projects are illustrations, not real users.
