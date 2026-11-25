import Konva from 'konva';
import type { View } from '../types';
import { FRONT_LINE_Y, LANE_COUNT, type Scrap } from './ScrapShooterModel';
import { SpaceBackdrop, prefersReducedMotion, useTitleFont } from '../screens/shared/space';
import {
  BACK_BUTTON_HEIGHT,
  BACK_BUTTON_WIDTH,
  SHADOW,
  darkLook,
  makeBackButton,
  makePressable,
  type Pressable,
} from '../screens/shared/pressable';
import { ScrapEffects, spriteImage } from './art/draw';
import {
  FLAME_ROWS,
  FUEL_COLORS,
  FUEL_EMPTY_ROWS,
  FUEL_FULL_ROWS,
  FUEL_PIXEL,
  SCRAP_COLORS,
  SCRAP_PIXEL,
  SHIP_COLORS,
  SHIP_PIXEL,
  SHIP_ROWS,
  scrapSprite,
} from './art/sprites';

// The game is laid out on an 800×600 field, then scaled up to fill the window (see fit).
const WIDTH = 800;
const HEIGHT = 600;
const SCRAP_RADIUS = 40;
// The ship's top edge. Its nose, where the laser starts, is at the middle of that edge.
const SHIP_TOP = 458;
const NOSE = { x: WIDTH / 2, y: SHIP_TOP };
const SHIP_WIDTH = SHIP_ROWS[0].length * SHIP_PIXEL;
const SHIP_HEIGHT = SHIP_ROWS.length * SHIP_PIXEL;
// The glowing ring around the target scrap, just outside the scrap's picture.
const RING_RADIUS = SCRAP_RADIUS + 6;

// The game's colors: sky blue for the player's things (the ring, laser and answer box), as on
// the menus, and red for danger (the front line, a wrong answer).
const GLOW = '#38bdf8';
const DANGER = '#f87171';

// The answer box, centered under the ship.
const INPUT = { x: WIDTH / 2 - 100, y: 544, width: 200, height: 40 };
// Back and Pause sit in the window's bottom corners at the menus' size, not scaled with the
// game (see fit), so they match the Back button on the other screens.
const BUTTON_MARGIN = 20;
const FUEL_SPACING = 30; // between the fuel canisters' left edges

// The x of each lane, spread evenly across the screen, indexed by Scrap.lane.
const LANE_X = Array.from({ length: LANE_COUNT }, (_, lane) => (WIDTH / LANE_COUNT) * (lane + 0.5));
// How far a scrap can sit left or right of its lane's center (see Scrap.nudge).
// Lanes are 160px apart and scraps 80px wide, so two neighbors nudged toward each other
// still have a 20px gap, and the outer scraps stay on screen. Keep
// 2 × MAX_NUDGE + 2 × SCRAP_RADIUS below the lane spacing if you change LANE_COUNT.
const MAX_NUDGE = 30;

/** Where a scrap's center is across the screen: its lane's center plus its nudge. */
function scrapX(scrap: Scrap): number {
  return LANE_X[scrap.lane] + scrap.nudge * MAX_NUDGE;
}

/**
 * Pixel-art ship and scraps (see art/sprites.ts) over the menus' starry sky, scaled to fill
 * the window. The target scrap has a glowing ring, and shooting plays a laser, an explosion and a kick on the ship (art/draw.ts).
 * Draws what the controller tells it to; holds no game state.
 */
export class ScrapShooterView implements View {
  private group = new Konva.Group();
  private backdrop: SpaceBackdrop | null = null; // the starry sky behind the game, filling the window
  private field!: Konva.Group; // everything else, laid out at 800×600 and scaled to fit the window
  private frontLine!: Konva.Line;
  private pauseDim!: Konva.Rect;
  private scrapGroups = new Map<number, { group: Konva.Group; ring: Konva.Circle }>();
  private wrongTimer: number | undefined;
  private inputBox!: Konva.Rect;
  private inputText!: Konva.Text;
  private inputGroup!: Konva.Group; // the answer box and its text, shaken on a wrong answer
  private waveText!: Konva.Text;
  private healthBar!: Konva.Group; // the FUEL label and a fuel canister per health point
  private fuelLabel!: Konva.Text;
  private scrapLayer!: Konva.Group; // the scraps, kept under the pause overlay
  private effects!: ScrapEffects; // the laser and explosions, drawn above the scraps
  private ship!: Konva.Group;
  private flame!: Konva.Image;
  private pauseOverlay!: Konva.Group;
  private pauseLabel!: Konva.Text;
  private resumeButton!: Pressable;
  private backButton!: Konva.Group;
  private pauseButton!: Konva.Group;

  getGroup(): Konva.Group {
    return this.group;
  }

  show(): void {
    this.group.show();
  }

  hide(): void {
    this.group.hide();
  }

  /**
   * Draws the game screen.
   * @param onBack called when Back is clicked
   * @param onPause called when Pause (or Resume) is clicked
   */
  build(onBack: () => void, onPause: () => void): void {
    this.makeInput();

    this.backdrop = new SpaceBackdrop(undefined, (w, h, left, top) => this.fit(w, h, left, top));
    this.field = new Konva.Group();
    this.group.add(this.backdrop.group, this.field);

    // Glowing like the menus' titles, and switched to Orbitron with the buttons below.
    this.waveText = new Konva.Text({
      x: WIDTH / 2 - 120,
      y: 22,
      width: 240,
      align: 'center',
      text: '',
      fontSize: 20,
      fontStyle: 'bold',
      fontFamily: 'Arial',
      letterSpacing: 3,
      fill: 'white',
      shadowColor: '#818cf8',
      shadowBlur: 16,
      shadowOpacity: 0.9,
      listening: false,
    });

    this.healthBar = new Konva.Group({ x: 24, y: 14, listening: false });
    this.fuelLabel = new Konva.Text({
      y: 8,
      text: 'FUEL',
      fontSize: 14,
      fontStyle: 'bold',
      fontFamily: 'Arial',
      letterSpacing: 2,
      fill: '#fdba74',
    });

    this.scrapLayer = new Konva.Group();
    const effectsLayer = new Konva.Group({ listening: false });
    this.effects = new ScrapEffects(effectsLayer);
    this.pauseOverlay = this.makePauseOverlay(onPause);

    this.drawFrontLine();
    this.drawShip();
    this.field.add(this.scrapLayer, effectsLayer, this.inputGroup, this.waveText, this.healthBar);
    this.field.add(this.pauseOverlay); // above the game, below the buttons so they still work

    // The same buttons as the menus, outside the scaled field so they stay the menus' size.
    // Back bottom-left; Pause bottom-right (up top it would sit under the right lane's scraps).
    const back = makeBackButton(onBack);
    this.backButton = back.button.group;
    const pause = makePressable(BACK_BUTTON_WIDTH, BACK_BUTTON_HEIGHT, darkLook('#64748b', '#1e293b'), onPause);
    this.pauseButton = pause.group;
    this.pauseLabel = buttonLabel('PAUSE', BACK_BUTTON_WIDTH, BACK_BUTTON_HEIGHT, '#e2e8f0');
    pause.face.add(this.pauseLabel);
    this.group.add(this.backButton, this.pauseButton);
    useTitleFont(
      [back.label, this.pauseLabel, this.resumeLabel(), this.inputText, this.waveText, this.fuelLabel],
      () => {
        this.layOutFuel();
        this.group.getLayer()?.batchDraw();
      },
    );

    // Scaled-up pixel art should stay blocky, not blurry. (The layer is shared, so destroy() turns it back on.)
    this.group.getLayer()?.imageSmoothingEnabled(false);
    this.backdrop.start(); // also fits the field to the window, and refits when the window changes
  }

  /**
   * Scales the 800×600 field as big as fits in the window and centers it there, then stretches
   * the front line and the pause cover across the whole window. Called by the backdrop with the
   * window's size and its top-left corner relative to the layer (see SpaceBackdrop's onFit).
   */
  private fit(windowWidth: number, windowHeight: number, left: number, top: number): void {
    const scale = Math.min(windowWidth / WIDTH, windowHeight / HEIGHT);
    this.field.offset({ x: WIDTH / 2, y: HEIGHT / 2 });
    this.field.position({ x: left + windowWidth / 2, y: top + windowHeight / 2 });
    this.field.scale({ x: scale, y: scale });

    // The window's edges in the field's own 800×600 coordinates.
    const fieldLeft = WIDTH / 2 - windowWidth / scale / 2;
    const fieldTop = HEIGHT / 2 - windowHeight / scale / 2;
    const y = this.frontLine.points()[1];
    this.frontLine.points([fieldLeft, y, fieldLeft + windowWidth / scale, y]);
    this.pauseDim.position({ x: fieldLeft, y: fieldTop });
    this.pauseDim.size({ width: windowWidth / scale, height: windowHeight / scale });

    // The fuel gauge in the window's top-left corner, lined up with Back below it.
    this.healthBar.x(fieldLeft + BUTTON_MARGIN / scale);

    // Back and Pause in the window's bottom corners, at their normal size.
    const buttonY = top + windowHeight - BUTTON_MARGIN - SHADOW - BACK_BUTTON_HEIGHT;
    this.backButton.position({ x: left + BUTTON_MARGIN, y: buttonY });
    this.pauseButton.position({ x: left + windowWidth - BUTTON_MARGIN - SHADOW - BACK_BUTTON_WIDTH, y: buttonY });
  }

  /** Shows or hides the PAUSED overlay, and switches the Pause button's label to match. */
  showPaused(paused: boolean): void {
    this.pauseOverlay.visible(paused);
    this.pauseLabel.text(paused ? 'RESUME' : 'PAUSE');
    this.resumeButton.reset(); // don't stay lifted from the mouse having been on it
    this.group.getLayer()?.batchDraw();
  }

  destroy(): void {
    this.effects?.destroy();
    this.backdrop?.stop();
    this.backdrop = null;
    this.group.getLayer()?.imageSmoothingEnabled(true);

    if (this.wrongTimer !== undefined) {
      window.clearTimeout(this.wrongTimer);
    }

    this.scrapGroups.clear();
    this.group.destroyChildren();
    document.body.style.cursor = 'default';
  }

  // ------------------------------------------------------------- drawing

  /** The ship, with a flame under it that flickers while the game runs (see render). */
  private drawShip(): void {
    this.ship = new Konva.Group({ x: WIDTH / 2 - SHIP_WIDTH / 2, y: SHIP_TOP });
    this.flame = spriteImage(FLAME_ROWS, SHIP_COLORS, SHIP_PIXEL);
    this.flame.y(SHIP_HEIGHT);
    this.ship.add(this.flame, spriteImage(SHIP_ROWS, SHIP_COLORS, SHIP_PIXEL));
    this.field.add(this.ship);
  }

  /**
   * A glowing red dashed line across the window (see fit). A scrap that touches it is lost
   * and costs health. Square dashes, so it looks like the pixel art.
   */
  private drawFrontLine(): void {
    const y = FRONT_LINE_Y + SCRAP_RADIUS;
    this.frontLine = new Konva.Line({
      points: [0, y, WIDTH, y],
      stroke: DANGER,
      strokeWidth: 4,
      dash: [12, 10],
      opacity: 0.85,
      shadowColor: DANGER,
      shadowBlur: 12,
      shadowOpacity: 0.9,
      listening: false,
    });
    this.field.add(this.frontLine);
  }

  /**
   * A dark cover over the game with PAUSED and a Resume button. It catches clicks, so
   * nothing under it can be clicked while the game is paused. Hidden until showPaused(true).
   */
  private makePauseOverlay(onResume: () => void): Konva.Group {
    const overlay = new Konva.Group({ visible: false });
    // Sized to cover the whole window in fit().
    this.pauseDim = new Konva.Rect({ width: WIDTH, height: HEIGHT, fill: 'black', opacity: 0.75 });
    overlay.add(
      this.pauseDim,
      new Konva.Text({
        y: 200,
        width: WIDTH,
        align: 'center',
        text: 'PAUSED',
        fontSize: 56,
        fontStyle: 'bold',
        fill: 'white',
        listening: false,
      }),
      new Konva.Text({
        y: 272,
        width: WIDTH,
        align: 'center',
        text: 'Press Esc or P to keep playing',
        fontSize: 18,
        fill: '#d1d5db',
        listening: false,
      }),
    );
    this.resumeButton = makePressable(160, 48, darkLook(GLOW, '#0c4a6e'), onResume);
    this.resumeButton.group.position({ x: WIDTH / 2 - 80 - SHADOW / 2, y: 320 });
    this.resumeButton.face.add(buttonLabel('RESUME', 160, 48, '#e0f2fe'));
    overlay.add(this.resumeButton.group);
    return overlay;
  }

  private resumeLabel(): Konva.Text {
    return this.resumeButton.face.findOne<Konva.Text>('Text')!;
  }

  /**
   * The answer box: a dark panel with a glowing sky-blue outline and a solid shadow, like the
   * menu buttons, so it matches them and the target ring.
   */
  private makeInput(): void {
    this.inputGroup = new Konva.Group({ x: INPUT.x, y: INPUT.y, listening: false });
    this.inputBox = new Konva.Rect({
      width: INPUT.width,
      height: INPUT.height,
      cornerRadius: 4,
      fill: '#0f172a',
      stroke: GLOW,
      strokeWidth: 3,
      shadowColor: GLOW,
      shadowBlur: 14,
      shadowOpacity: 0.7,
    });
    this.inputText = new Konva.Text({
      width: INPUT.width,
      height: INPUT.height,
      align: 'center',
      verticalAlign: 'middle',
      text: '',
      fontSize: 24,
      fontStyle: 'bold',
      fontFamily: 'Arial',
      letterSpacing: 2,
      fill: 'white',
    });
    this.inputGroup.add(
      new Konva.Rect({ x: SHADOW, y: SHADOW, width: INPUT.width, height: INPUT.height, cornerRadius: 4, fill: '#0c4a6e' }),
      this.inputBox,
      this.inputText,
    );
  }

  private addScrap(scrap: Scrap): { group: Konva.Group; ring: Konva.Circle } {
    const group = new Konva.Group({ x: scrapX(scrap), y: scrap.y });

    const picture = spriteImage(scrapSprite(scrap.id), SCRAP_COLORS, SCRAP_PIXEL);
    picture.position({ x: -picture.width() / 2, y: -picture.height() / 2 });

    const ring = new Konva.Circle({
      radius: RING_RADIUS,
      stroke: '#38bdf8',
      strokeWidth: 3,
      shadowColor: '#38bdf8',
      shadowBlur: 12,
      shadowOpacity: 1,
      visible: false,
      listening: false,
    });

    const label = new Konva.Text({ text: scrap.question.prompt, fontSize: 20, fill: 'white', listening: false });
    label.offsetX(label.width() / 2);
    label.offsetY(label.height() / 2);

    group.add(picture, ring, label);
    this.scrapLayer.add(group);
    const shape = { group, ring };
    this.scrapGroups.set(scrap.id, shape);
    return shape;
  }

  /**
   * Makes the screen match the model: adds new scraps, moves the falling ones, removes the
   * ones that are gone. The target gets a glowing ring so the player knows which to answer.
   * It runs every frame, so it also makes the ring pulse and the ship's flame flicker.
   */
  render(scraps: Scrap[], target: Scrap | null): void {
    const live = new Set(scraps.map(scrap => scrap.id));
    for (const [id, shape] of this.scrapGroups) {
      if (!live.has(id)) {
        shape.group.destroy();
        this.scrapGroups.delete(id);
      }
    }

    const wobble = prefersReducedMotion() ? 0 : Math.sin(Date.now() / 150);
    for (const scrap of scraps) {
      const shape = this.scrapGroups.get(scrap.id) ?? this.addScrap(scrap);
      shape.group.y(scrap.y);
      shape.ring.visible(scrap === target);
      shape.ring.radius(RING_RADIUS + wobble * 2);
    }
    this.flame.scaleY(1 + wobble * 0.3);
    this.group.getLayer()?.batchDraw();
  }

  showTyped(typed: string): void {
    // An empty box shows a dim hint; typed digits are big and white.
    const empty = typed === '';
    this.inputText.text(empty ? 'TYPE ANSWER' : typed);
    this.inputText.fontSize(empty ? 14 : 22);
    this.inputText.fill(empty ? '#64748b' : 'white');
    this.group.getLayer()?.batchDraw();
  }

  showWave(wave: number, totalWaves: number): void {
    this.waveText.text(`WAVE ${wave} / ${totalWaves}`);
    this.group.getLayer()?.batchDraw();
  }

  /** Shows health as fuel canisters after a FUEL label: full ones glow orange, used ones are dark. */
  showHealth(health: number, maxHealth: number): void {
    this.healthBar.getChildren(node => node !== this.fuelLabel).forEach(node => node.destroy());
    this.healthBar.add(this.fuelLabel);
    for (let i = 0; i < maxHealth; i++) {
      const full = i < health;
      const canister = spriteImage(full ? FUEL_FULL_ROWS : FUEL_EMPTY_ROWS, FUEL_COLORS, FUEL_PIXEL);
      if (full) {
        canister.shadowColor('#f97316');
        canister.shadowBlur(10);
        canister.shadowOpacity(0.8);
      }
      this.healthBar.add(canister);
    }
    this.layOutFuel();
    this.group.getLayer()?.batchDraw();
  }

  /** Lines the canisters up after the FUEL label (again once the label's font changes its width). */
  private layOutFuel(): void {
    const start = this.fuelLabel.width() + 10;
    this.healthBar
      .getChildren(node => node !== this.fuelLabel)
      .forEach((canister, i) => canister.x(start + i * FUEL_SPACING));
  }

  // ------------------------------------------------------------- actions

  /** Fires the laser at a scrap: a beam from the ship's nose, an explosion on the scrap and a kick on the ship. */
  shoot(scrap: Scrap): void {
    const hit = { x: scrapX(scrap), y: scrap.y };
    this.effects.fire(NOSE, hit);
    this.effects.explode(hit);
    this.effects.recoil(this.ship, SHIP_TOP);
  }

  /** The answer box glows red and gives a little shake (no shake if the player wants less motion). */
  flashWrong(): void {
    if (this.wrongTimer !== undefined) window.clearTimeout(this.wrongTimer);
    this.inputBox.stroke(DANGER);
    this.inputBox.shadowColor(DANGER);
    if (!prefersReducedMotion()) {
      this.inputGroup.x(INPUT.x);
      new Konva.Tween({
        node: this.inputGroup,
        duration: 0.3,
        x: INPUT.x,
        easing: (t: number, b: number, c: number, d: number) => b + c * (t / d) + Math.sin((t / d) * Math.PI * 6) * 8 * (1 - t / d),
      }).play();
    }
    this.group.getLayer()?.batchDraw();
    this.wrongTimer = window.setTimeout(() => {
      this.inputBox.stroke(GLOW);
      this.inputBox.shadowColor(GLOW);
      this.group.getLayer()?.batchDraw();
      this.wrongTimer = undefined;
    }, 350);
  }
}

/** A button's bold uppercase label, centered on it. Switched to Orbitron once it loads. */
function buttonLabel(text: string, width: number, height: number, fill: string): Konva.Text {
  return new Konva.Text({
    width,
    height,
    align: 'center',
    verticalAlign: 'middle',
    text,
    fontSize: 15,
    fontStyle: 'bold',
    fontFamily: 'Arial',
    letterSpacing: 2,
    fill,
    listening: false,
  });
}
