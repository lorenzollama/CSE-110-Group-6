/**
 * The look the menu screens share: the animated night sky behind them and the Orbitron
 * title font. The start, topic select and levels screens all use these, so they match.
 */
import Konva from "konva";
import {
  makeShootingStar,
  makeStars,
  nextShootingStarWait,
  shootingStarAt,
  starCountFor,
  twinkle,
  type ShootingStar,
  type Star,
} from "../start/starfield.ts";

export const STAGE_WIDTH = 800;
export const STAGE_HEIGHT = 600;

export const TITLE_FONT = "Orbitron"; // loaded in index.html; Arial until it arrives
/** Orbitron with Arial as a fallback, for text drawn while (or in case) Orbitron hasn't loaded. */
export const GAME_FONT = `${TITLE_FONT}, Arial, sans-serif`;

/** True if the player asked their computer for less motion; then the sky stays still. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/**
 * A glowing title like the start screen's SPACEBLAST, centered across the 800-wide area
 * (it's given the full width, so it stays centered when the font changes).
 */
export function makeTitle(text: string, y: number, fontSize: number): Konva.Text {
  return new Konva.Text({
    y,
    width: STAGE_WIDTH,
    align: "center",
    text,
    fontSize,
    fontStyle: "bold",
    fontFamily: "Arial",
    letterSpacing: 3,
    fill: "white",
    shadowColor: "#818cf8",
    shadowBlur: 20,
    shadowOpacity: 0.9,
    listening: false,
  });
}

/**
 * Switches the given texts to Orbitron once it has loaded (see index.html). If it can't
 * load (e.g. offline) they stay Arial. `redraw` is called after the switch.
 */
export function useTitleFont(texts: Konva.Text[], redraw: () => void): void {
  document.fonts
    ?.load(`bold 32px "${TITLE_FONT}"`)
    .then((fonts) => {
      if (fonts.length === 0) return;
      for (const text of texts) text.fontFamily(TITLE_FONT);
      redraw();
    })
    .catch(() => {}); // no Orbitron: Arial is fine
}

let nextBackdropId = 0;

/**
 * The night sky: a deep-space background with twinkling stars and an occasional shooting
 * star. It fills the whole window, not just the centered 800×600 area, and only animates
 * between start() and stop(). The sky's math is in starfield.ts.
 *
 * Add `group` first in a screen's group (so it's at the back), then call start() when the
 * screen shows and stop() when it hides.
 */
export class SpaceBackdrop {
  readonly group = new Konva.Group({ listening: false });

  private background: Konva.Rect;
  private starGroup = new Konva.Group();
  private stars: Star[] = [];
  private starDots: Konva.Circle[] = [];
  private trail: Konva.Line;  // the shooting star's tail
  private spark: Konva.Circle; // the shooting star's bright head
  private width = 0;
  private height = 0;

  private animation: Konva.Animation | null = null;
  private seconds = 0; // how long the sky has been animating
  private shootingStar: ShootingStar | null = null;
  private shootingStarAge = 0; // seconds since the current shooting star appeared
  private untilShootingStar = nextShootingStarWait();

  // Names this sky's window listeners, so stop() removes only them, not another screen's.
  private listenerName = `.sky${nextBackdropId++}`;

  /**
   * @param onFrame called every animation frame with the seconds since the sky started,
   *   for a screen's own small animations (like a pulsing prompt)
   * @param onFit called when the sky is fitted to the window, with the window's width and
   *   height and where its top-left corner is relative to the 800×600 area, so a screen
   *   can pin things (like a sound or back button) to the window's corners
   */
  constructor(
    private onFrame?: (seconds: number) => void,
    private onFit?: (windowWidth: number, windowHeight: number, left: number, top: number) => void,
  ) {
    // Deep-space background, from almost black at the top to dark indigo at the bottom.
    this.background = new Konva.Rect({
      fillLinearGradientStartPoint: { x: 0, y: 0 },
      fillLinearGradientColorStops: [0, "#020617", 1, "#1e1b4b"],
    });

    // The shooting star: a line that fades from see-through at the tail to white at the head.
    this.trail = new Konva.Line({
      points: [0, 0, 0, 0],
      strokeWidth: 2.5,
      lineCap: "round",
      strokeLinearGradientColorStops: [0, "rgba(255,255,255,0)", 1, "rgba(255,255,255,0.95)"],
      visible: false,
    });
    this.spark = new Konva.Circle({ radius: 2, fill: "white", shadowColor: "white", shadowBlur: 10, visible: false });

    this.group.add(this.background, this.starGroup, this.trail, this.spark);
    this.size(STAGE_WIDTH, STAGE_HEIGHT); // until it's on screen and knows the window size
  }

  /** Fits the sky to the window, keeps it fitted as the window changes, and starts animating. */
  start(): void {
    this.fitToWindow();
    const layer = this.group.getLayer();
    const refit = () => {
      this.fitToWindow();
      layer?.batchDraw();
    };
    // When the window changes size, main.ts resizes the stage and then moves the layer to
    // re-center the screens. Listening for exactly those changes refits the sky right after.
    layer?.on(`xChange${this.listenerName} yChange${this.listenerName}`, refit);
    layer?.getStage()?.on(`widthChange${this.listenerName} heightChange${this.listenerName}`, refit);
    this.startAnimation();
  }

  /** Stops animating (no need to animate a sky nobody can see) and stops refitting. */
  stop(): void {
    this.animation?.stop();
    const layer = this.group.getLayer();
    layer?.off(this.listenerName);
    layer?.getStage()?.off(this.listenerName);
  }

  /**
   * Stretches the sky over the whole window. main.ts shifts every screen to center its
   * 800×600 area, so the sky is shifted back by the same amount to start at the window's corner.
   */
  private fitToWindow(): void {
    const layer = this.group.getLayer();
    const stage = layer?.getStage();
    if (!layer || !stage) return;
    this.group.position({ x: -layer.x(), y: -layer.y() });
    this.size(Math.max(stage.width(), STAGE_WIDTH), Math.max(stage.height(), STAGE_HEIGHT));
    this.onFit?.(stage.width(), stage.height(), -layer.x(), -layer.y());
  }

  /** Sizes the background and scatters a fitting number of stars, if the size changed. */
  private size(width: number, height: number): void {
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;

    this.background.size({ width, height });
    this.background.fillLinearGradientEndPoint({ x: 0, y: height });

    this.starGroup.destroyChildren();
    this.stars = makeStars(starCountFor(width, height), width, height);
    this.starDots = this.stars.map((star) => new Konva.Circle({
      x: star.x,
      y: star.y,
      radius: star.radius,
      fill: "white",
      opacity: twinkle(star, this.seconds),
      perfectDrawEnabled: false, // faster to draw, and looks the same for tiny circles
    }));
    this.starGroup.add(...this.starDots);
  }

  private startAnimation(): void {
    const layer = this.group.getLayer();
    if (!layer || prefersReducedMotion()) return;
    this.animation ??= new Konva.Animation((frame) => {
      // Cap each step, so coming back to a tab that was in the background doesn't jump.
      const step = Math.min((frame?.timeDiff ?? 0) / 1000, 0.1);
      this.seconds += step;
      this.stars.forEach((star, i) => this.starDots[i].opacity(twinkle(star, this.seconds)));
      this.moveShootingStar(step);
      this.onFrame?.(this.seconds);
    }, layer);
    this.animation.start();
  }

  /** Counts down to the next shooting star, then moves it across the sky until it's gone. */
  private moveShootingStar(step: number): void {
    if (!this.shootingStar) {
      this.untilShootingStar -= step;
      if (this.untilShootingStar > 0) return;
      this.shootingStar = makeShootingStar(this.width, this.height);
      this.shootingStarAge = 0;
    }

    this.shootingStarAge += step;
    const frame = shootingStarAt(this.shootingStar, this.shootingStarAge);
    if (!frame) {
      this.shootingStar = null; // it's gone: wait for the next one
      this.untilShootingStar = nextShootingStarWait();
      this.trail.visible(false);
      this.spark.visible(false);
      return;
    }

    this.trail.points([frame.tailX, frame.tailY, frame.headX, frame.headY]);
    this.trail.strokeLinearGradientStartPoint({ x: frame.tailX, y: frame.tailY });
    this.trail.strokeLinearGradientEndPoint({ x: frame.headX, y: frame.headY });
    this.trail.opacity(frame.opacity);
    this.spark.position({ x: frame.headX, y: frame.headY });
    this.spark.opacity(frame.opacity);
    this.trail.visible(true);
    this.spark.visible(true);
  }
}
