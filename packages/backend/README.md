## Convex backend (@orbii/backend)

Pure ritual helpers live in `convex/lib/` and are unit-tested without a Convex deployment.

Convex functions (`users`, `habits`, `day`) persist the same ritual. To wire a deployment:

```bash
cd packages/backend
pnpm exec convex dev
```

That generates `convex/_generated` and prints a deployment URL for the mobile app.
