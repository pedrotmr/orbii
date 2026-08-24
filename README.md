# Orbii

Habit app that separates *habits you want in your life* from *what deserves attention today*.

Many habits live in your **Orbit**. Each day Orbii offers a small set; you pick what you can manage, commit, and complete — success is “Today’s Orbit complete,” not a giant checklist score.

## Source of truth

| What | Where |
|------|--------|
| V1 product & technical design | [Spec: Orbii V1 (approved)](https://github.com/pedrotmr/orbii/issues/15) |
| Work & wayfinding | [GitHub Issues](https://github.com/pedrotmr/orbii/issues) · [Wayfinder map](https://github.com/pedrotmr/orbii/issues/1) |

## Repo layout

| Path | Role |
|------|------|
| `apps/mobile` | Expo app |
| `packages/backend` | Ritual domain + Convex |
| `packages/tokens` | Shared design tokens |
| `design-ideas/` | Visual exploration / Vite prototype (not production) |

## Design prototype

```bash
cd design-ideas
npm install
npm run dev
```

## App (monorepo)

```bash
pnpm install
pnpm test
pnpm --filter @orbii/mobile dev
```
