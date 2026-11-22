# The Midnight Vault — a heist game

Entry for the make.fun bounty **"Make the best heist game"**
(`best-heist-game-20261122-0559`).

## The game

A top-down heist across three jobs — the Corner Bank, the Diamond
Gallery, and the Casino Vault. Case the building, dodge patrolling
guards and sweeping security cameras, crack safes and the vault, grab
the loot, and escape to the getaway car before the police arrive.

- **3 hand-designed levels**, each with its own guard patrols, cameras
  and loot layout
- **Guards** with raycast vision cones (occluded by walls), suspicion
  meters, patrol / investigate / chase / return behaviour
- **Security cameras** with rotating sweep cones that raise the alarm
- **Alarm system**: camera spots and chases raise it; at 100% the
  police are inbound on a 45-second countdown
- **Safes and a vault** per level — hold E to crack them (the vault is
  the main target and unlocks the getaway car)
- **Loot**: cash, gold bars and jewels, each worth score; a loot target
  per level must be met before the car opens
- **Stealth tools**: sneak (Shift), dash (Space, stamina), throw a coin
  (Q) to lure guards away, hide in the blue shadow tiles
- **Scoring**: loot value + time bonus + ghost bonus for finishing
  without raising a real alarm; 3 lives; ranks from ROOKIE WITH LUCK
  to LEGENDARY CREW
- Procedural canvas art and WebAudio sounds only, no network requests,
  deterministic (seeded RNG)

## Controls

WASD / arrows — move · Shift — sneak · Space — dash · E (hold) — crack
safe / vault · Q — throw coin · M — mute · P — pause · R — restart level

## Play it

```sh
node serve.ts --port 8903
# open http://localhost:8903
```

## Entry program

`main.ts` (Node 22) copies `game/` and `screenshots/` to `/output` and
writes `/output/dossier.json`. Screenshots are real renders of the
game's own code, taken in headless Chrome (`?shot=start|play|alarm|win`,
see `shots.json`).
