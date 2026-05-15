# Terminal Emulator Selector

React + TypeScript + Vite app, prepared for publishing on **Cloudflare Workers** (static assets mode).

## Local development

```bash
bun install
bun run dev
```

## Build

```bash
bun run build
```

## Cloudflare Workers setup

This project includes `wrangler.jsonc` configured to serve the built SPA from `dist/`.

1. Build the app:

```bash
bun run build
```

2. Test with Workers runtime locally:

```bash
bun run cf:dev
```

3. Deploy when ready:

```bash
bun run cf:deploy
```

> `cf:deploy` is configured but **not run automatically**.

## Optional environment variables

- `VITE_SOURCE_URL` — used by the footer “View source” link.
