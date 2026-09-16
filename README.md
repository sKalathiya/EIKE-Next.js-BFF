# EIKE web

Browser app for the Enterprise Intelligent Knowledge Engine. Sign in, manage teams and files, and ask questions about documents your team can see.

The API and workers live in a separate repository: [Enterprise-Intelligent-Knowledge-Engine-EIKE-](https://github.com/sKalathiya/Enterprise-Intelligent-Knowledge-Engine-EIKE-). Run that stack first, then this app.

## Features

- Register and log in (session cookie; you stay signed in until you log out or the session expires)
- A **Private** library that only you can see, created when you register
- Shared teams: create, rename, invite by email, remove members, leave, transfer ownership
- Upload PDF or plain text (up to 10MB) to Private or any team you belong to
- Share or unshare files you uploaded; retry a failed file; delete your uploads
- Chat: pick a team and ask in everyday language; answers come from that team’s ready files
- Profile: update first name, last name, and email, or delete your account

## How it works (for users)

1. Create an account. You start with Private.
2. Optionally create a team and add people by email.
3. Upload a PDF or `.txt` file. Status moves from uploading → processing → ready (or failed).
4. If you own a file, share it with other teams you belong to. Unsharing from the last team sends it back to Private.
5. Open Chat, choose a team, and ask a question. Only **completed** files on that team are used.
6. Transfer ownership if you want someone else to run the team; you stay a member and your files stay on the team. Leaving or being removed sends *your* last-share files to Private.
7. You can delete your account only after you no longer own extra teams (Private is fine).

Destructive team actions (delete team, leave, remove a member, transfer owner) ask **Are you sure?** before they run.

## Stack

Next.js 16 (App Router), React 19, Tailwind CSS 4.

The Next server exposes `/api/v1` for the browser and forwards those calls to the gateway. File bytes go to object storage with a short-lived URL from the API. This app does not talk to the database or AI workers.

## Prerequisites

- Node.js 20+
- Backend running from the EIKE repo (Docker Compose), with the reverse proxy on port 80
- Object storage CORS allowing this app’s origin (`http://localhost:3000` in development)

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

| Variable | Example | Meaning |
| --- | --- | --- |
| `GATEWAY_SERVICE_URL` | `http://localhost` | Gateway via the reverse proxy (port 80). Not `http://localhost:3000` (that is this Next app). |

Restart `next dev` after changing `.env.local`. Do not commit that file.

| Script | |
| --- | --- |
| `npm run dev` | Development server (port 3000) |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |

## Pages

| Path | |
| --- | --- |
| `/` | Landing |
| `/login`, `/register` | Auth |
| `/documents` | All files you can see; upload and share |
| `/teams` | Teams, members, uploads for one team |
| `/chat` | Ask questions |
| `/profile` | Account |

Signed-out users are redirected to `/login`. Signed-in users are redirected away from login and register.

## Project layout

```
app/            Pages and API routes the browser calls
components/     UI (auth, documents, teams, chat, profile)
lib/            Client API helpers and small stores
middleware.ts   Session redirects
```

## Troubleshooting

- **Nothing loads / cannot sign in** — start the backend Compose stack first. `GATEWAY_SERVICE_URL` must be the proxy (`http://localhost`), not port 3000.
- **Upload fails with a network-style error** — allow `http://localhost:3000` on the storage bucket CORS (PUT). Changing the gateway URL does not change this origin.
- **Chat has nothing to answer** — wait until the file status is ready, and search in a team that actually has that file.
- **Cannot delete account** — transfer or delete teams you own besides Private.

## Related

Backend (API, workers, Compose): [EIKE](https://github.com/sKalathiya/Enterprise-Intelligent-Knowledge-Engine-EIKE-).
