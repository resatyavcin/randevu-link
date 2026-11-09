<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


# Architecture rules

- Preserve the `domain`, `application`, `infrastructure`, `composition`, `presentation`, and Next.js `app` boundaries.
- Keep domain rules and application use cases independent of packages, browser globals, and storage.
- Define repository contracts in `application/ports`; implement adapters in `infrastructure` and wire them in `composition`.
- Import application entry points from `composition` in presentation code. Do not import infrastructure directly from screens or routes.
- Keep query/cache state in presentation hooks and route-specific view content in `presentation/views`.
- Run `pnpm check` after changes. Use `pnpm build` for routing or bundling changes.
- See `docs/architecture.md` for dependency directions and `docs/migration-map.json` for previous source locations.
