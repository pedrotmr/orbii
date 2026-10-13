# Orbii

Habit app that separates _habits you want in your life_ from _what deserves attention today_.

Many habits live in your **Orbit**. Each day Orbii offers a small set; you pick what you can manage, commit, and complete — success is “Today’s Orbit complete,” not a giant checklist score.

## Source of truth

| What                                | Where                                                                      |
| ----------------------------------- | -------------------------------------------------------------------------- |
| Current product & engineering rules | [Spec: Orbii V2 (approved)](https://github.com/pedrotmr/orbii/issues/50)   |
| Frozen V1 history                   | [Spec: Orbii V1 (historical)](https://github.com/pedrotmr/orbii/issues/15) |
| Current work                        | [GitHub Issues](https://github.com/pedrotmr/orbii/issues)                  |
| Completed V2 planning               | [Wayfinder: path to Orbii V2](https://github.com/pedrotmr/orbii/issues/51) |

## Repo layout

| Path               | Role                                                 |
| ------------------ | ---------------------------------------------------- |
| `apps/mobile`      | Expo app                                             |
| `packages/backend` | Convex rituals, points, and rewards                  |
| `packages/tokens`  | Shared design tokens                                 |
| `design-ideas/`    | Visual exploration / Vite prototype (not production) |

## Design prototype

```bash
cd design-ideas
npm install
npm run dev
```

## App (monorepo)

```bash
pnpm install
pnpm lint
pnpm test
pnpm --filter @orbii/mobile start
```

**Mobile development and TestFlight setup:** see [`apps/mobile/README.md`](apps/mobile/README.md).
