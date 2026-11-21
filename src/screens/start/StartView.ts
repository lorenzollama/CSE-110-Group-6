import Konva from "konva";
import type { Screen, View } from "../../types.ts";
import {
  makeShootingStar,
  makeStars,
  nextShootingStarWait,
  shootingStarAt,
  starCountFor,
  twinkle,
  type ShootingStar,
  type Star,
} from "./starfield.ts";

export const STAGE_WIDTH = 800;
export const STAGE_HEIGHT = 600;

const TITLE_SIZE = 72;
const TITLE_FONT = "Orbitron"; // loaded in index.html; Arial until it arrives
const BUTTON_WIDTH = 340;
const BUTTON_HEIGHT = 54;
const BUTTON_GAP = 72; // from the top of one button to the top of the next
const SOUND_BUTTON_SIZE = 48;
const SOUND_BUTTON_MARGIN = 20; // gap between the sound button and the window's top-right corner

/**
 * The menu's buttons, top to bottom: the icon and label, whether it's the main (glowing)
 * button, and the screen it opens.
 */
const MENU_BUTTONS: { icon: string; label: string; main: boolean; screen: Screen }[] = [
  { icon: "🚀", label: "SPACESHIP SHOOTER", main: true, screen: { type: "topic select" } },
  { icon: "🧠", label: "MEMORY", main: false, screen: { type: "minigame1" } },
  { icon: "❔", label: "UNKNOWN", main: false, screen: { type: "minigame2" } }, // name to be decided
];

/** How the two kinds of menu button look: the main one glows purple, the others are dark glass. */
const BUTTON_LOOKS = {
  main: { colors: ["#6366f1", "#a855f7"], outline: "#c4b5fd", glow: "#a78bfa", restingGlow: 18 },
  other: { colors: ["rgba(15,23,42,0.75)", "rgba(30,41,59,0.75)"], outline: "#64748b", glow: "#38bdf8", restingGlow: 0 },
};

interface MenuButton {
  group: Konva.Group;
  body: Konva.Rect;
  label: Konva.Text;
  restingGlow: number;
}

/**
 * A pill-shaped menu button with an icon. It grows a little and lights up while the mouse is
 * over it, and dips slightly when pressed. Clicking it only calls `onClick`.
 */
function makeMenuButton(centerX: number, y: number, text: string, main: boolean, onClick: () => void): MenuButton {
  const look = main ? BUTTON_LOOKS.main : BUTTON_LOOKS.other;
  // The group's origin is the button's center, so it grows from the middle when scaled.
  const group = new Konva.Group({
    x: centerX,
    y: y + BUTTON_HEIGHT / 2,
    offsetX: BUTTON_WIDTH / 2,
    offsetY: BUTTON_HEIGHT / 2,
  });
  const body = new Konva.Rect({
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    cornerRadius: BUTTON_HEIGHT / 2,
    fillLinearGradientStartPoint: { x: 0, y: 0 },
    fillLinearGradientEndPoint: { x: BUTTON_WIDTH, y: 0 },
    fillLinearGradientColorStops: [0, look.colors[0], 1, look.colors[1]],
    stroke: look.outline,
    strokeWidth: 1.5,
    shadowColor: look.glow,
    shadowBlur: look.restingGlow,
    shadowOpacity: 0.9,
  });
  const label = new Konva.Text({
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    align: "center",
    verticalAlign: "middle",
    wrap: "none",
    text,
    fontSize: 17,
    fontStyle: "bold",
    fontFamily: "Arial",
    letterSpacing: 2,
    fill: "white",
    listening: false,
  });
  group.add(body, label);
  addButtonEffects(group, body, look.restingGlow, 1.06, onClick);
  return { group, body, label, restingGlow: look.restingGlow };
}

/**
 * The round sound button for the top-right corner: a speaker icon (🔊 or 🔇, see
 * StartView.showSoundOn) in a dark glass circle. Clicking it only calls `onClick`.
 */
function makeSoundButton(onClick: () => void): MenuButton {
  const look = BUTTON_LOOKS.other;
  const group = new Konva.Group(); // its origin is the circle's center
  const body = new Konva.Rect({
    x: -SOUND_BUTTON_SIZE / 2,
    y: -SOUND_BUTTON_SIZE / 2,
    width: SOUND_BUTTON_SIZE,
    height: SOUND_BUTTON_SIZE,
    cornerRadius: SOUND_BUTTON_SIZE / 2, // fully rounded: a circle
    fill: look.colors[0],
    stroke: look.outline,
    strokeWidth: 1.5,
    shadowColor: look.glow,
    shadowBlur: look.restingGlow,
    shadowOpacity: 0.9,
  });
  const icon = new Konva.Text({
    x: -SOUND_BUTTON_SIZE / 2,
    y: -SOUND_BUTTON_SIZE / 2,
    width: SOUND_BUTTON_SIZE,
    height: SOUND_BUTTON_SIZE,
    align: "center",
    verticalAlign: "middle",
    text: "🔊",
    fontSize: 22,
    listening: false,
  });
  group.add(body, icon);
  addButtonEffects(group, body, look.restingGlow, 1.12, onClick);
  return { group, body, label: icon, restingGlow: look.restingGlow };
}

/**
 * Makes a button feel clickable: a hand cursor and a grow-and-glow while the mouse is over
 * it, a small dip while pressed, and `onClick` on click or tap.
 */
function addButtonEffects(
  group: Konva.Group, body: Konva.Shape, restingGlow: number, hoverScale: number, onClick: () => void,
): void {
  const animateTo = (scale: number, glow: number) => {
    new Konva.Tween({ node: group, duration: 0.15, scaleX: scale, scaleY: scale, easing: Konva.Easings.EaseOut }).play();
    body.shadowBlur(glow);
  };
  group.on("mouseenter", () => {
    document.body.style.cursor = "pointer";
    animateTo(hoverScale, 28);
  });
  group.on("mouseleave", () => {
    document.body.style.cursor = "default";
    animateTo(1, restingGlow);
  });
  group.on("mousedown touchstart", () => animateTo(0.95, 28));
  group.on("mouseup touchend", () => animateTo(hoverScale, 28));
  group.on("click tap", onClick);
}

/** True if the player asked their computer for less motion; then the sky stays still. */
function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/**
 * Start screen VIEW: draws the start screen with Konva: a night sky with twinkling stars
 * and an occasional shooting star, the SPACEBLAST title, and one button per game.
 * The sky fills the whole window; the title and buttons stay in the centered 800×600 area
 * like every other screen.
 * It shows what it's told and decides nothing. When a button is clicked, it only reports
 * the click; the controller decides what happens. The sky's math is in starfield.ts.
 */
export class StartView implements View {
  private group = new Konva.Group();

  // The sky: background, stars and shooting star, sized to the whole window (see fitSkyToWindow).
  private sky = new Konva.Group({ listening: false });
  private background: Konva.Rect;
  private starGroup = new Konva.Group();
  private stars: Star[] = [];
  private starDots: Konva.Circle[] = [];
  private trail: Konva.Line;  // the shooting star's tail
  private spark: Konva.Circle; // the shooting star's bright head
  private skyWidth = 0;
  private skyHeight = 0;

  private title: Konva.Text;
  private buttons: MenuButton[] = [];
  private soundButton: MenuButton; // in the window's top-right corner (see fitSkyToWindow)

  // The click-to-start screen. Browsers only allow sound after the player clicks or presses a
  // key, so the game opens on "CLICK ANYWHERE TO START" and that first click starts the music.
  // The game buttons appear after it, once per visit.
  private prompt: Konva.Text;
  private waitingForStart = true;
  private onPressStart: () => void;

  // The animation only runs while the menu is showing (see show() and hide()).
  private animation: Konva.Animation | null = null;
  private seconds = 0; // how long the sky has been animating
  private shootingStar: ShootingStar | null = null;
  private shootingStarAge = 0; // seconds since the current shooting star appeared
  private untilShootingStar = nextShootingStarWait();

  /**
   * @param onStartClick called with the screen a game button opens
   * @param onSoundClick called when the sound (mute) button is clicked
   * @param onPressStart called once, on the player's first click or key press on the start screen
   */
  constructor(onStartClick: (screen: Screen) => void, onSoundClick: () => void, onPressStart: () => void) {
    this.onPressStart = onPressStart;
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

    this.sky.add(this.background, this.starGroup, this.trail, this.spark);
    this.group.add(this.sky);
    this.sizeSky(STAGE_WIDTH, STAGE_HEIGHT); // until it's on screen and knows the window size

    // The title, centered by giving it the full width (so it stays centered when the font changes).
    this.title = new Konva.Text({
      y: 120,
      width: STAGE_WIDTH,
      align: "center",
      text: "SPACEBLAST",
      fontSize: TITLE_SIZE,
      fontStyle: "bold",
      fontFamily: "Arial",
      letterSpacing: 4,
      fill: "white",
      shadowColor: "#818cf8",
      shadowBlur: 24,
      shadowOpacity: 0.9,
      listening: false,
    });
    this.group.add(this.title);
    this.useTitleFontWhenLoaded();

    // One button per game, stacked in the middle. Hidden until the player clicks to start.
    MENU_BUTTONS.forEach(({ icon, label, main, screen }, i) => {
      const button = makeMenuButton(STAGE_WIDTH / 2, 270 + i * BUTTON_GAP, `${icon}  ${label}`, main, () => onStartClick(screen));
      button.group.visible(false);
      this.buttons.push(button);
      this.group.add(button.group);
    });

    // Where the buttons will be: the click-to-start prompt. It pulses (see startAnimation).
    this.prompt = new Konva.Text({
      y: 330,
      width: STAGE_WIDTH,
      align: "center",
      text: "CLICK ANYWHERE TO START",
      fontSize: 22,
      fontStyle: "bold",
      fontFamily: "Arial",
      letterSpacing: 3,
      fill: "#c7d2fe",
      shadowColor: "#818cf8",
      shadowBlur: 12,
      listening: false,
    });
    this.group.add(this.prompt);

    this.soundButton = makeSoundButton(onSoundClick);
    this.group.add(this.soundButton.group);
    this.placeSoundButton(STAGE_WIDTH); // until it's on screen and knows the window size
  }

  /** Shows the speaker icon for sound on (🔊) or muted (🔇). The controller decides which. */
  showSoundOn(on: boolean): void {
    this.soundButton.label.text(on ? "🔊" : "🔇");
    this.group.getLayer()?.batchDraw();
  }

  /** Ends the click-to-start screen: the prompt fades out and the game buttons fade in. */
  revealMenu(): void {
    if (!this.waitingForStart) return;
    this.waitingForStart = false;
    this.stopWaitingForStart();
    new Konva.Tween({ node: this.prompt, opacity: 0, duration: 0.25, onFinish: () => this.prompt.visible(false) }).play();
    // The buttons fade in one after another, 80 ms apart.
    this.buttons.forEach((button, i) => {
      button.group.opacity(0);
      button.group.visible(true);
      setTimeout(() => {
        new Konva.Tween({ node: button.group, opacity: 1, duration: 0.35, easing: Konva.Easings.EaseOut }).play();
      }, 80 * i);
    });
    this.group.getLayer()?.batchDraw();
  }

  show(): void {
    this.group.visible(true);
    this.fitSkyToWindow();
    this.refitSkyWhenWindowChanges();
    if (this.waitingForStart) this.waitForStart();
    this.startAnimation();
    this.group.getLayer()?.batchDraw();
  }

  hide(): void {
    this.animation?.stop(); // no need to animate a sky nobody can see
    this.stopRefittingSky();
    this.stopWaitingForStart();
    // A clicked button is hidden while the mouse is still on it, so its "mouse left" never comes:
    // put every button and the cursor back to normal for next time.
    document.body.style.cursor = "default";
    for (const button of [...this.buttons, this.soundButton]) {
      button.group.scale({ x: 1, y: 1 });
      button.body.shadowBlur(button.restingGlow);
    }
    this.group.visible(false);
    this.group.getLayer()?.batchDraw();
  }

  getGroup(): Konva.Group {
    return this.group;
  }

  // -------------------------------------------------------------- the click-to-start screen

  // "click" (not "pointerdown") on purpose: the buttons appear only after the click is over,
  // so the click that starts the game can't also press a button that appears under the mouse.
  private waitForStart(): void {
    window.addEventListener("click", this.pressStart);
    window.addEventListener("keydown", this.pressStart);
  }

  private stopWaitingForStart(): void {
    window.removeEventListener("click", this.pressStart);
    window.removeEventListener("keydown", this.pressStart);
  }

  /** The player clicked or pressed a key: report it; the controller decides what happens. */
  private pressStart = (): void => {
    this.stopWaitingForStart();
    this.onPressStart();
  };

  // -------------------------------------------------------------- filling the window

  /**
   * When the window changes size, main.ts resizes the stage and then moves the layer to
   * re-center the screens. Listening for exactly those changes refits the sky right after
   * they happen, whatever order things run in. (".startSky" names these listeners, so
   * stopRefittingSky() removes only them.)
   */
  private refitSkyWhenWindowChanges(): void {
    const layer = this.group.getLayer();
    const refit = () => {
      this.fitSkyToWindow();
      layer?.batchDraw();
    };
    layer?.on("xChange.startSky yChange.startSky", refit);
    layer?.getStage()?.on("widthChange.startSky heightChange.startSky", refit);
  }

  private stopRefittingSky(): void {
    const layer = this.group.getLayer();
    layer?.off(".startSky");
    layer?.getStage()?.off(".startSky");
  }

  /**
   * Stretches the sky over the whole window. main.ts shifts every screen to center its
   * 800×600 area, so the sky is shifted back by the same amount to start at the window's corner.
   */
  private fitSkyToWindow(): void {
    const layer = this.group.getLayer();
    const stage = layer?.getStage();
    if (!layer || !stage) return;
    this.sky.position({ x: -layer.x(), y: -layer.y() });
    this.sizeSky(Math.max(stage.width(), STAGE_WIDTH), Math.max(stage.height(), STAGE_HEIGHT));
    this.placeSoundButton(stage.width(), -layer.x(), -layer.y());
  }

  /**
   * Puts the sound button in the window's top-right corner. Like the sky, it's shifted back by
   * the layer's centering offset (`left`, `top`) so it sits at the window's edge, not the 800×600 area's.
   */
  private placeSoundButton(windowWidth: number, left = 0, top = 0): void {
    const fromEdge = SOUND_BUTTON_MARGIN + SOUND_BUTTON_SIZE / 2;
    this.soundButton.group.position({ x: left + windowWidth - fromEdge, y: top + fromEdge });
  }

  /** Sizes the background and scatters a fitting number of stars, if the size changed. */
  private sizeSky(width: number, height: number): void {
    if (width === this.skyWidth && height === this.skyHeight) return;
    this.skyWidth = width;
    this.skyHeight = height;

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

  // -------------------------------------------------------------- the sky's animation

  private startAnimation(): void {
    const layer = this.group.getLayer();
    if (!layer || prefersReducedMotion()) return;
    this.animation ??= new Konva.Animation((frame) => {
      // Cap each step, so coming back to a tab that was in the background doesn't jump.
      const step = Math.min((frame?.timeDiff ?? 0) / 1000, 0.1);
      this.seconds += step;
      this.stars.forEach((star, i) => this.starDots[i].opacity(twinkle(star, this.seconds)));
      this.moveShootingStar(step);
      // The click-to-start prompt gently pulses between dim and bright.
      if (this.waitingForStart) this.prompt.opacity(0.45 + 0.55 * (Math.sin(this.seconds * 3) + 1) / 2);
    }, layer);
    this.animation.start();
  }

  /** Counts down to the next shooting star, then moves it across the sky until it's gone. */
  private moveShootingStar(step: number): void {
    if (!this.shootingStar) {
      this.untilShootingStar -= step;
      if (this.untilShootingStar > 0) return;
      this.shootingStar = makeShootingStar(this.skyWidth, this.skyHeight);
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

  /**
   * The title font, Orbitron, comes from Google Fonts (see index.html). The title and button
   * labels start in Arial and switch once Orbitron has loaded; if it can't load (e.g. offline),
   * they stay Arial.
   */
  private useTitleFontWhenLoaded(): void {
    document.fonts
      ?.load(`bold ${TITLE_SIZE}px "${TITLE_FONT}"`)
      .then((fonts) => {
        if (fonts.length === 0) return;
        this.title.fontFamily(TITLE_FONT);
        for (const button of this.buttons) button.label.fontFamily(TITLE_FONT);
        this.prompt.fontFamily(TITLE_FONT);
        this.group.getLayer()?.batchDraw();
      })
      .catch(() => {}); // no Orbitron: Arial is fine
  }
}
