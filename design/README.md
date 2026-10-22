# Design reference

These are the approved screens from the Claude Design canvas, saved as source so Claude Code can read them.
Treat them as the spec for layout, copy and spacing. Build with the real tokens and classes in
`src/app/globals.css`, not by copying the inline styles.

| File | Screen | Status |
|---|---|---|
| `Landing.dc.html` | Landing page | Built (`src/app/page.tsx`) |
| `SignIn.dc.html` | Sign in | Built (`src/app/sign-in`) |
| `Feed.dc.html` | Browse open roles | Built (`src/app/(app)/browse`) |
| `Project.dc.html` | Project page, offers, credits | Built (`src/app/(app)/projects/[id]`) |
| `Post.dc.html` | Post a project | Built (`src/app/(app)/post`; screenshot upload not yet) |
| `Messages.dc.html` | Messages | Built (`src/app/(app)/messages`; no unread counts) |
| `Profile.dc.html` | Profile | Built (`src/app/(app)/profile` edit, `src/app/(app)/people/[id]` public) |

How to read a file: the markup inside `<x-dc>` is the screen; `{{name}}` holes and `<sc-for>` loops are filled
from `renderVals()` in the `<script>` at the bottom, which also holds the example data and the interactions
(filters, accept/decline, add role). Example names and projects are illustrations, not real users.
