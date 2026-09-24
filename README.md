# Snip

Snip is a tiny URL shortener with one backend and two clients: an Angular web app and a Node command-line interface. Each layer has its own orphan branch and is mounted into this `main` branch as a Git submodule.

## Layout

| Path | Branch | Purpose |
| --- | --- | --- |
| `backend/` | `backend` | Bun API server with in-memory link storage |
| `frontend/` | `frontend` | Angular 19 standalone web client |
| `cli/` | `cli` | Zero-dependency Node CLI client |
| `bundle/` | `bundle` | Generated release with the server, UI, and CLI |

The submodule pointers make each `main` checkout a reproducible combination of the three layer commits.

## API contract

The backend listens on port `3000` by default.

| Method | Path | Response |
| --- | --- | --- |
| `POST` | `/api/links` with `{ "url": "https://..." }` | `201` with `{ code, url, shortUrl, hits, createdAt }`; `400` for invalid input |
| `GET` | `/api/links` | `200` with an array of links |
| `GET` | `/:code` | `302` to the original URL and increments `hits`; `404` if unknown |

Links are stored in memory and reset when the backend restarts.

## Clone and run

Use recursive cloning because a plain clone creates empty submodule folders:

```bash
git clone --recurse-submodules https://github.com/ngys9919/nus-iss-snip-demo.git
cd nus-iss-snip-demo
```

Run each layer from separate terminals:

```bash
cd backend && bun start
cd frontend && npm install && npx ng serve
cd cli && node cli.js ls
```

The API runs at `http://localhost:3000`, the Angular app at `http://localhost:4200`, and the CLI uses `SNIP_API` when set.

## Generated bundle

Regenerate the release submodule from the three source branches with Node:

```bash
node scripts/build-bundle.mjs
node scripts/build-bundle.mjs --push
```

The script builds the Angular UI, assembles the Bun server and CLI into `bundle/`, and is idempotent. It creates local commits only when generated content or the bundle pointer changes; `--push` publishes the bundle branch and the `main` pointer. The generated bundle serves the UI and API together on port `3000` and is ready for Docker or Railway.

## Update workflow

Changes happen inside the relevant submodule first:

```bash
cd backend
git add -A && git commit -m "Update backend" && git push
cd ..
git submodule update --remote backend
git add backend
git commit -m "Bump backend submodule"
git push
```

Use the same sequence for `frontend` or `cli`. The submodule commit and the superproject pointer commit are separate records; the pointer bump is what updates `main` to the new layer version.
