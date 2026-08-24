# Orbii — design ideas

Throwaway visual exploration for Orbii. **Not** the production app.

The real product will be an Expo + Convex monorepo at the repository root. This folder exists so we can try look, type, motion, and the daily Orbit loop without polluting that structure.

## What’s here

| Path             | Purpose                            |
| ---------------- | ---------------------------------- |
| `PRODUCT.md`     | Product principles / audience      |
| `DESIGN.md`      | Visual direction & tokens notes    |
| `src/`           | Interactive Vite + React prototype |
| `design-probes/` | Early direction images             |
| `screenshots/`   | Capture dumps from prototyping     |

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints. Desktop shows a jump rail; the phone shell is the prototype.

## Prototype routes

| Route            | What                  |
| ---------------- | --------------------- |
| `/`              | Welcome               |
| `/orbit/setup`   | Build Orbit           |
| `/today`         | Daily loop            |
| `/orbit`         | Full Orbit            |
| `/settings`      | Capacity / offer size |
| `/design-system` | Tokens & components   |
