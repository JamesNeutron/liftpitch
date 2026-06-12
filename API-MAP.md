# API Dependency Map

Generated audit of every route under `src/app/api/`, with each caller found by searching the codebase for `fetch()` / `sendBeacon()` references to the endpoint path.

| Endpoint | Called by | Notes |
|---|---|---|
| `/api/delete-video` | `src/app/dashboard/videos/page.js:245` | Pro dashboard only. |
| `/api/generate-script` | `src/app/dashboard/script/page.js:371`, `:508`; `src/app/LiftPitchApp.jsx:691`, `:777` | Called from both pro dashboard and free-tier app. |
| `/api/get-upload-url` | `src/app/dashboard/record/page.js:374`; `src/app/LiftPitchApp.jsx:1457` | Pro dashboard + free-tier app. |
| `/api/parse-pdf` | — | **ORPHAN.** No references found anywhere in repo. |
| `/api/record-view` | `src/app/v/[id]/page.js:64`, `:88` (sendBeacon), `:90` | Public video share page (recruiter view analytics). |
| `/api/refine-resume` | `src/app/resume-refiner/page.js:93` | Public Resume Refiner page (no auth — lead-gen). |
| `/api/register-video` | `src/app/dashboard/record/page.js:390`; `src/app/LiftPitchApp.jsx:1475` | Pro dashboard + free-tier app. |
| `/api/rephrase-gaps` | `src/app/dashboard/script/page.js:272`; `src/app/LiftPitchApp.jsx:618` | Pro dashboard + free-tier app. |
| `/api/send-video-email` | `src/app/LiftPitchApp.jsx:1486` | Free-tier app only. |
| `/api/strengthen-resume` | `src/app/dashboard/script/page.js:475`; `src/app/LiftPitchApp.jsx:748` | Pro dashboard + free-tier app. |
| `/api/transcode-video` | — | **ORPHAN.** No references found anywhere in repo. |
| `/api/update-video-title` | `src/app/dashboard/videos/page.js:300` | Pro dashboard only. |
| `/api/upload-video` | — | **ORPHAN.** No references found anywhere in repo. |
| `/api/video/[id]` | `src/app/v/[id]/page.js:28` | Public video share page (fetches video by id). |

## Orphan routes (never called from anywhere)

These three route files exist but are not referenced by any `fetch()`, `sendBeacon()`, or other call in the codebase (searched all of `src/` and the repo root, excluding `node_modules`/`.git`):

- `src/app/api/parse-pdf/route.js`
- `src/app/api/transcode-video/route.js`
- `src/app/api/upload-video/route.js`

Note: uploads currently use `/api/get-upload-url` (signed URL flow) rather than `/api/upload-video`, which is consistent with these being dead/superseded routes. Not deleted — flagged here only, per session scope.
