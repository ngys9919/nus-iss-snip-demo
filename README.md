# Snip backend

Tiny zero-dependency Bun URL shortener. Links are stored in memory and reset when the server restarts.

```bash
bun start
```

The API listens on port `3000` by default. Set `PORT`, `BASE_URL`, and optionally `PUBLIC_DIR` through the environment.