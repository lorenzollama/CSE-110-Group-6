/**
 * The pixel art for the scrap shooter: the player's ship and the falling scraps.
 * Like the menu's sprites (see StartView's ROCKET), each picture is a grid of letters. Each
 * letter is a color from the palette next to it and '.' is see-through. It's only data, so
 * it can be tested without a screen; art/draw.ts turns it into pictures.
 *
 * The ship is the same rocket as the menu card, so the game looks like the same game.
 */

export const SHIP_PIXEL = 4; // screen pixels per ship pixel (the ship is 56 wide)
export const SCRAP_PIXEL = 5; // screen pixels per scrap pixel (a scrap is 80 wide: the width of its lane)

// ------------------------------------------------------------------ ship

/** The ship, nose at the top. S is the shaded right side, G the dark engine, B the cockpit. */
export const SHIP_ROWS: string[] = [
  '......RR......',
  '.....RRRR.....',
  '.....WWWW.....',
  '....WWWWSS....',
  '....WWBBWS....',
  '...WWBBBBWS...',
  '...WWBBBBWS...',
  '...WWWBBWWS...',
  '..RWWWWWWWSR..',
  '.RRWWWWWWWSRR.',
  'RRRWWWWWWWSRRR',
  'RRR.WWWWWS.RRR',
  'RR..WWGGWS..RR',
  '....GGGGGG....',
];

/** The engine flame under the ship. The view makes it flicker. */
export const FLAME_ROWS: string[] = [
  '.....OYYO.....',
  '.....OYYO.....',
  '......OO......',
];

export const SHIP_COLORS: Record<string, string> = { W: '#e2e8f0', S: '#94a3b8', R: '#ef4444', B: '#38bdf8', G: '#475569', O: '#f97316', Y: '#facc15' };

// ---------------------------------------------------------------- scraps

/**
 * Space junk to shoot. Every scrap is 16 × 16 with a dark label band (the P rows) across the
 * middle, so the math problem written over it stays easy to read whatever the junk looks like.
 * Keep each picture 16 wide and the label band on rows 6 to 9.
 */
const ASTEROID: string[] = [
  '....oooooooo....',
  '..ooLLLLLLMMoo..',
  '.oLLLLLLLMMMMMo.',
  'oLLLCCLLLMMMMMMo',
  'oLLCCCLLLLMMMMMo',
  'oLLLCCLLLLLMMMDo',
  'oPPPPPPPPPPPPPPo',
  'oPPPPPPPPPPPPPPo',
  'oPPPPPPPPPPPPPPo',
  'oPPPPPPPPPPPPPPo',
  'oMMMMLLLCCMMMDDo',
  'oMMMMMLLCCCMMDDo',
  'oDMMMMMMMMMDDDDo',
  '.oDDMMMMMMDDDDo.',
  '..ooDDDDDDDDoo..',
  '....oooooooo....',
];

const HULL_PLATE: string[] = [
  '..oooooooooooo..',
  '.oLLLLLLLLLLLLo.',
  'oLRLLLLLLLLLLRLo',
  'oLLLLLLLLLLLLLLo',
  'oLLLLLLLLLLLLLLo',
  'oLLLLLLLLLLLLLMo',
  'oPPPPPPPPPPPPPPo',
  'oPPPPPPPPPPPPPPo',
  'oPPPPPPPPPPPPPPo',
  'oPPPPPPPPPPPPPPo',
  'oMMMMMMMMMMMMMDo',
  'oMMMMMMMMMMMMMDo',
  'oMRMMMMMMMMMMRDo',
  '.oDDDDDDDDDDDDo.',
  '..oooooooooooo..',
  '................',
];

const SATELLITE: string[] = [
  '......A....A....',
  '......o....o....',
  '...oooooooooo...',
  '..oLLLLLLLLMMo..',
  '.oLLLLLLLLLMMMo.',
  'oLLLLLLLLLLMMMDo',
  'oPPPPPPPPPPPPPPo',
  'oPPPPPPPPPPPPPPo',
  'oPPPPPPPPPPPPPPo',
  'oPPPPPPPPPPPPPPo',
  'oMMMMMMMMMMMMDDo',
  '.oMMMMMMMMMMDDo.',
  '..oDDDDDDDDDDo..',
  '...ooooAAoooo...',
  '.......AA.......',
  '......AAAA......',
];

const CANISTER: string[] = [
  '....oooooooo....',
  '...oLLLLLLLLo...',
  '..oLLLLLLLLMMo..',
  '.oLYYYYYYYYYMMo.',
  '.oLYYYYYYYYYMMo.',
  'oLLLLLLLLLLLMMDo',
  'oPPPPPPPPPPPPPPo',
  'oPPPPPPPPPPPPPPo',
  'oPPPPPPPPPPPPPPo',
  'oPPPPPPPPPPPPPPo',
  'oMMMMMMMMMMMMDDo',
  '.oMYYYYYYYYYDDo.',
  '.oMYYYYYYYYYDDo.',
  '..oMMMMMMMMDDo..',
  '...oDDDDDDDDo...',
  '....oooooooo....',
];

export const SCRAP_SPRITES: string[][] = [ASTEROID, HULL_PLATE, SATELLITE, CANISTER];

/** Metal in grays with red and blue lights; P is the dark label band. */
export const SCRAP_COLORS: Record<string, string> = { o: '#0b1020', L: '#cbd5e1', M: '#94a3b8', D: '#64748b', P: '#0f172a', C: '#475569', R: '#ef4444', Y: '#f59e0b', A: '#38bdf8' };

/**
 * Which picture a scrap gets. It depends only on the scrap's id, so a scrap keeps its look as it
 * falls. The id is scrambled first so the pictures don't come in a repeating order.
 */
export function scrapSprite(id: number): string[] {
  const scrambled = Math.imul(id, 2654435761) >>> 0; // 0 to 2^32 - 1, spread out
  return SCRAP_SPRITES[Math.floor((scrambled / 2 ** 32) * SCRAP_SPRITES.length)];
}

// ------------------------------------------------------------------ fuel

/**
 * The player's health, drawn as rocket-fuel canisters: one per health point. A full one glows
 * orange like the ship's flame; an empty one is dark. C is the cap, K the metal, F the fuel and
 * Y its shine, E the inside of an empty canister.
 */
export const FUEL_FULL_ROWS: string[] = [
  '..CCCC..',
  '.KKKKKK.',
  'KYYFFFFK',
  'KYFFFFFK',
  'KYFFFFFK',
  'KFFFFFFK',
  'KFFFFFFK',
  'KFFFFFFK',
  'KFFFFFFK',
  '.KKKKKK.',
];

export const FUEL_EMPTY_ROWS: string[] = FUEL_FULL_ROWS.map(row => row.replace(/[FY]/g, 'E'));

export const FUEL_COLORS: Record<string, string> = { C: '#94a3b8', K: '#475569', F: '#f97316', Y: '#facc15', E: '#1e293b' };
export const FUEL_PIXEL = 3; // a canister is 24 × 30
