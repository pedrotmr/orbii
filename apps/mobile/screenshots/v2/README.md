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

## Rewards progress

The following iPhone 17 Pro simulator captures (iOS 26.5) use the production
reward card and Rewards visibility setting with deterministic sample data and
inert callbacks. No backend writes were made.

- `reward-goals.png` — one shared point balance updates progress for multiple
  active goals, including an eligible goal.
- `rewards-tab-setting.png` — the Rewards tab visibility setting explains that
  hiding it preserves rewards and point balance.

## Reward redemption

`reward-redemption-confirmation.png` was captured on an iPhone 17 Pro simulator
running iOS 26.5 from the production reward card and native confirmation alert.
The sample balance covers the reward cost, and the confirmation callback is
inert so the screenshot does not redeem a reward or write backend data.
