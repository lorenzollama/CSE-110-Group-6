import Konva from 'konva';
import { prefersReducedMotion } from '../../screens/shared/space';
import { burstParticles } from './effects';

const LASER_GLOW = '#38bdf8'; // the same sky blue as the menus' glow

export interface Point {
  x: number;
  y: number;
}

// Each picture is drawn onto a canvas once and shared, so a scrap costs one image, not 200 squares.
const canvases = new WeakMap<string[], HTMLCanvasElement>();

function spriteCanvas(rows: string[], colors: Record<string, string>, pixel: number): HTMLCanvasElement {
  const cached = canvases.get(rows);
  if (cached) return cached;

  // Draw at the screen's sharpness (2x on a Retina display) so the squares stay crisp.
  const sharpness = Math.ceil(window.devicePixelRatio || 1);
  const square = pixel * sharpness;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(...rows.map(row => row.length)) * square;
  canvas.height = rows.length * square;

  const context = canvas.getContext('2d')!;
  rows.forEach((row, y) => {
    [...row].forEach((letter, x) => {
      const fill = colors[letter];
      if (!fill) return; // "." is see-through
      context.fillStyle = fill;
      context.fillRect(x * square, y * square, square, square);
    });
  });

  canvases.set(rows, canvas);
  return canvas;
}

/** A pixel-art picture as one Konva image, its top-left corner at 0, 0 and `pixel` screen pixels per square. */
export function spriteImage(rows: string[], colors: Record<string, string>, pixel: number): Konva.Image {
  const canvas = spriteCanvas(rows, colors, pixel);
  const sharpness = Math.ceil(window.devicePixelRatio || 1);
  return new Konva.Image({
    image: canvas,
    width: canvas.width / sharpness,
    height: canvas.height / sharpness,
    listening: false,
  });
}

/**
 * The short animations that play when the player shoots: the laser, the muzzle flash, the
 * explosion and the ship's recoil. They are added to `fx`, a group the view keeps above the
 * scraps. Each cleans itself up when it ends. If the player asked their computer for less
 * motion there are no flashes or flying pieces, only a quick fading beam.
 */
export class ScrapEffects {
  private tweens = new Set<Konva.Tween>();
  private recoilTween: Konva.Tween | null = null;

  constructor(private fx: Konva.Group) {}

  /** The laser: a glowing beam from the ship to the scrap that fades out, plus a flash at the nose. */
  fire(from: Point, to: Point): void {
    const points = [from.x, from.y, to.x, to.y];
    const glow = new Konva.Line({
      points,
      stroke: LASER_GLOW,
      strokeWidth: 14,
      opacity: 0.55,
      lineCap: 'round',
      listening: false,
    });
    const core = new Konva.Line({
      points,
      stroke: 'white',
      strokeWidth: 4,
      lineCap: 'round',
      shadowColor: LASER_GLOW,
      shadowBlur: 12,
      shadowOpacity: 1,
      listening: false,
    });
    this.fx.add(glow, core);

    const fade = prefersReducedMotion() ? 0.08 : 0.2;
    this.play(glow, { opacity: 0, strokeWidth: 3 }, fade, () => glow.destroy());
    this.play(core, { opacity: 0, strokeWidth: 1 }, fade * 0.7, () => core.destroy());

    if (!prefersReducedMotion()) this.flash(from, 7, 2.2, 0.12);
  }

  /** The scrap blowing up: a bright flash and little squares flying out in every direction. */
  explode(at: Point): void {
    if (prefersReducedMotion()) return;
    this.flash(at, 14, 3, 0.22);

    for (const piece of burstParticles()) {
      const square = new Konva.Rect({
        x: at.x - piece.size / 2,
        y: at.y - piece.size / 2,
        width: piece.size,
        height: piece.size,
        fill: piece.color,
        listening: false,
      });
      this.fx.add(square);
      this.play(square, { x: square.x() + piece.dx, y: square.y() + piece.dy, opacity: 0 }, 0.35, () => square.destroy());
    }
  }

  /** The ship kicks back a few pixels, then settles at `baseY`. A new shot restarts the kick. */
  recoil(ship: Konva.Node, baseY: number): void {
    if (prefersReducedMotion()) return;
    this.recoilTween?.destroy();
    ship.y(baseY);
    this.recoilTween = this.play(ship, { y: baseY + 5 }, 0.04, () => {
      this.recoilTween = this.play(ship, { y: baseY }, 0.1);
    });
  }

  /** Stops everything that is still playing, for when the screen is torn down mid-animation. */
  destroy(): void {
    for (const tween of this.tweens) tween.destroy();
    this.tweens.clear();
    this.recoilTween = null;
  }

  /** A white circle that grows and fades out. */
  private flash(at: Point, radius: number, grow: number, seconds: number): void {
    const circle = new Konva.Circle({
      x: at.x,
      y: at.y,
      radius,
      fill: 'white',
      shadowColor: LASER_GLOW,
      shadowBlur: 14,
      listening: false,
    });
    this.fx.add(circle);
    this.play(circle, { scaleX: grow, scaleY: grow, opacity: 0 }, seconds, () => circle.destroy());
  }

  /** Moves `node` to the attributes in `to` over `seconds`, then runs `after`. */
  private play(node: Konva.Node, to: Konva.NodeConfig, seconds: number, after?: () => void): Konva.Tween {
    const tween: Konva.Tween = new Konva.Tween({
      node,
      duration: seconds,
      easing: Konva.Easings.EaseOut,
      ...to,
      onFinish: () => {
        this.tweens.delete(tween);
        tween.destroy();
        after?.();
      },
    });
    this.tweens.add(tween);
    tween.play();
    return tween;
  }
}
