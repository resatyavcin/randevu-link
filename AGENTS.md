<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


# Architecture rules

- Keep the structure small: `app`, `components`, `lib`, `data`, and `types`.
- `app` contains Next.js route entries. Page content lives in `components/booking`, `components/booking-link`, `components/budget`, and `components/showcase`.
- Keep shared UI in `components/ui`, profile UI in `components/profile`, and app wrappers in `components/layout` and `components/providers`.
- Keep helpers and shared configuration in `lib`, and external data access in `data`. Appearance preferences stay in local browser storage.
- Booking buttons open empty drawers; do not restore demo booking flows or data.
- Preserve `components/booking/service-picker.tsx`, `google-reviews.tsx`, and `kvkk-link.tsx` as reusable UI; preview them on `/ui`. Keep their data/content supplied by props.
- Show business cover, avatar, and profile header only on `/booking` and `/booking-link`. Other pages use the plain menu header in `components/layout/panel-shell.tsx`.
- Shared TypeScript contracts live in `types`; they must not import UI or data access code.
- Do not reintroduce domain/application/infrastructure/composition wrappers for simple forwarding.
- Run `pnpm check` after changes. Use `pnpm build` for routing or bundling changes.
- See `docs/architecture.md` for the structure and `docs/migration-map.json` for previous source locations.
