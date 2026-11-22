// Entry program for make.fun — "Make the best heist game"
// (competition best-heist-game-20261122-0559).
// Node 22, standard library only.
//
// The game lives in game/ beside this file: static files that open in a
// desktop browser and play offline. The screenshots in screenshots/ are
// real renders of the game's own code, taken in headless Chrome with
// ?shot= states (see shots.json).
//
// This program hands the entry in: it copies game/ and screenshots/ into
// /output and writes /output/dossier.json, the summary the judge reads,
// using the vendored make.fun library (vendor/makefun-game.ts, copied
// unchanged from the kit). Outside the grader's container,
// MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const here = fileURLToPath(new URL(".", import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

mkdirSync(out, { recursive: true });
cpSync(join(here, "game"), join(out, "game"), { recursive: true });
if (existsSync(join(here, "screenshots"))) {
  mkdirSync(join(out, "screenshots"), { recursive: true });
  cpSync(join(here, "screenshots"), join(out, "screenshots"), { recursive: true });
}

// The scorer's caps for this bounty (from the kit's gate): at most 4
// screenshots of 256 KiB each, at most 993 files / 48 MiB under game/,
// paths at most 1000 bytes, dossier text at most 160 KiB.
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, "dossier.json"), dossier);
console.log("wrote dossier.json for The Midnight Vault heist entry");
