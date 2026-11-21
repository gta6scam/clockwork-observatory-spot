// The Clockwork Observatory — hand-in program (Node 22, standard library only).
//
// The game itself is the static site under game/: two panels of a steampunk
// observatory, twelve hidden differences per round, three rounds under three
// lights. This program copies game/ and screenshots/ into the output folder
// and writes dossier.json there with the vendored make.fun library, exactly
// as the kit's driver pattern prescribes. The grader runs it twice and both
// runs must write the same bytes, so nothing here depends on time or chance.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Refresh only the subfolders this program owns. The output directory itself
// is never removed: other tenants of /output are not ours to delete.
function refreshSubfolder(name) {
  const target = join(outputDir, name);
  if (existsSync(target)) rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  const source = join(repoRoot, name);
  if (existsSync(source)) cpSync(source, target, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
refreshSubfolder('game');
refreshSubfolder('screenshots');

// The caps mirror the sealed scorer's gate: at most 4 screenshots of at most
// 256 KiB each, at most 993 files and 48 MiB under game/, no game path over
// 1,000 bytes, and the dossier's source text capped at 160 KiB.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
