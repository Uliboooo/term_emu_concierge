# Terminal Emulator Selector

React + TypeScript + Vite app, prepared for publishing on **Cloudflare Pages**.

## Local development

```bash
bun install
bun run dev
```

## Build

```bash
bun run build
```

## Cloudflare Pages setup

This project includes `wrangler.jsonc` configured for Pages with `dist` as the build output directory.

1. Build the app:

```bash
bun run build
```

2. Test with Pages runtime locally:

```bash
bun run cf:dev
```

3. Deploy to Cloudflare Pages when ready:

```bash
bun run cf:deploy
```

> `cf:deploy` is configured but **not run automatically**.

## Optional environment variables

- `VITE_SOURCE_URL` — used by the footer “View source” link.
