/**
 * The start screen's night sky as plain numbers: where the stars are, how bright each one
 * is at a given moment, and where a shooting star is as it flies across.
 * No Konva here, so it's unit tested; SpaceBackdrop (shared/space.ts) draws whatever these functions return.
 * Every random choice goes through `rng`, so tests can pass a fixed one.
 */

export interface Star {
  x: number;
  y: number;
  radius: number;     // in pixels, from 0.6 to 1.8
  brightness: number; // its brightest opacity, from 0.4 to 1
  speed: number;      // how fast it twinkles (radians per second)
  phase: number;      // where in its twinkle it starts, so the stars don't all blink together
}

/** A star never fades below this share of its brightness, so the sky is never empty. */
export const MIN_GLOW = 0.3;

/** How much sky each star gets (an 800×600 sky has 140 stars), and the most stars ever drawn. */
export const AREA_PER_STAR = (800 * 600) / 140;
export const MAX_STARS = 600;

/** How many stars a sky this size gets, so a bigger window doesn't look emptier. */
export function starCountFor(width: number, height: number): number {
  return Math.min(MAX_STARS, Math.round((width * height) / AREA_PER_STAR));
}

/** Scatters `count` stars over the sky, each with its own size, brightness and twinkle. */
export function makeStars(count: number, width: number, height: number, rng: () => number = Math.random): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: rng() * width,
      y: rng() * height,
      radius: 0.6 + rng() * 1.2,
      brightness: 0.4 + rng() * 0.6,
      speed: 0.8 + rng() * 2.2,
      phase: rng() * Math.PI * 2,
    });
  }
  return stars;
}

/** How visible a star is `seconds` into the animation: it glows between MIN_GLOW and full brightness. */
export function twinkle(star: Star, seconds: number): number {
  const wave = (Math.sin(seconds * star.speed + star.phase) + 1) / 2; // goes back and forth between 0 and 1
  return star.brightness * (MIN_GLOW + (1 - MIN_GLOW) * wave);
}

// ------------------------------------------------------------------ shooting stars

/** Seconds between one shooting star and the next: a random wait in this range. */
export const SHOOTING_STAR_MIN_WAIT = 4;
export const SHOOTING_STAR_MAX_WAIT = 9;

export function nextShootingStarWait(rng: () => number = Math.random): number {
  return SHOOTING_STAR_MIN_WAIT + rng() * (SHOOTING_STAR_MAX_WAIT - SHOOTING_STAR_MIN_WAIT);
}

export interface ShootingStar {
  startX: number;
  startY: number;
  dirX: number;     // the direction it flies in, as a unit vector (length 1)
  dirY: number;
  speed: number;    // pixels per second
  length: number;   // how long its tail gets, in pixels
  duration: number; // seconds until it's gone
}

/** A new shooting star near the top of the sky, flying down to the left or the right. */
export function makeShootingStar(width: number, height: number, rng: () => number = Math.random): ShootingStar {
  const goingRight = rng() < 0.5;
  const angle = ((20 + rng() * 15) * Math.PI) / 180; // 20 to 35 degrees below flat
  return {
    // start on the side it flies away from, so it crosses the sky instead of leaving right away
    startX: width * (goingRight ? 0.05 + rng() * 0.45 : 0.5 + rng() * 0.45),
    startY: height * (0.03 + rng() * 0.3),
    dirX: Math.cos(angle) * (goingRight ? 1 : -1),
    dirY: Math.sin(angle),
    speed: 650 + rng() * 250,
    length: 90 + rng() * 50,
    duration: 0.9 + rng() * 0.4,
  };
}

export interface ShootingStarFrame {
  headX: number;
  headY: number;
  tailX: number;
  tailY: number;
  opacity: number;
}

// It fades in over the first 15% of its flight and out over the last 40%.
const FADE_IN = 0.15;
const FADE_OUT = 0.4;

/** Where a shooting star is `elapsed` seconds after it appeared, or null once it's gone. */
export function shootingStarAt(star: ShootingStar, elapsed: number): ShootingStarFrame | null {
  if (elapsed < 0 || elapsed >= star.duration) return null;

  const travelled = star.speed * elapsed;
  const headX = star.startX + star.dirX * travelled;
  const headY = star.startY + star.dirY * travelled;
  const tail = Math.min(star.length, travelled); // the tail grows as it gets going

  const progress = elapsed / star.duration;
  const opacity = Math.min(1, progress / FADE_IN, (1 - progress) / FADE_OUT);

  return { headX, headY, tailX: headX - star.dirX * tail, tailY: headY - star.dirY * tail, opacity };
}
