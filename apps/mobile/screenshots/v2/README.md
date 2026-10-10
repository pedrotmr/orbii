# Orbii V2 implementation review captures

## Daily capacity

`daily-capacity-reveal-light.png` was captured on an iPhone 17 Pro simulator
running iOS 26.5 from the production `TodayRevealPhase` component. The screen
uses five deterministic sample habits and inert callbacks: the saved usual
count is 2 while 4 of the 5 offered habits are selected. No backend writes were
made for this capture.

## Habit points

The following iPhone 17 Pro simulator captures (iOS 26.5) use the production
habit editor and Today phases with deterministic fixture data and inert
callbacks. They show a 10-point Walk, point values on the five-habit reveal,
and point values on the two committed habits. No backend writes were made.

- `habit-points-edit.png` — editing a starter habit with Easy (10) selected.
- `habit-points-reveal.png` — the offered habits show their saved point values.
- `habit-points-active.png` — committed Today rows show their point values.
