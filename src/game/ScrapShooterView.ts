import Konva from 'konva';
import type { View } from '../types';
import { FRONT_LINE_Y, LANE_COUNT, type Scrap } from './ScrapShooterModel';
import { makeButton } from '../popups/PopupView';
import { prefersReducedMotion } from '../screens/shared/space';
import { ScrapEffects, spriteImage } from './art/draw';
import {
  FLAME_ROWS,
  SCRAP_COLORS,
  SCRAP_PIXEL,
  SHIP_COLORS,
  SHIP_PIXEL,
  SHIP_ROWS,
  scrapSprite,
} from './art/sprites';

const WIDTH = 800;
const HEIGHT = 600;
const SCRAP_RADIUS = 40;
// The ship's top edge. Its nose, where the laser starts, is at the middle of that edge.
const SHIP_TOP = 412;
const NOSE = { x: WIDTH / 2, y: SHIP_TOP };
const SHIP_WIDTH = SHIP_ROWS[0].length * SHIP_PIXEL;
const SHIP_HEIGHT = SHIP_ROWS.length * SHIP_PIXEL;
// The glowing ring around the target scrap, just outside the scrap's picture.
const RING_RADIUS = SCRAP_RADIUS + 6;

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
 * Pixel-art ship and scraps (see art/sprites.ts). The target scrap has a glowing ring, and
 * shooting plays a laser, an explosion and a kick on the ship (art/draw.ts).
 * Draws what the controller tells it to; holds no game state.
 */
export class ScrapShooterView implements View {
  private group = new Konva.Group();
  private scrapGroups = new Map<number, { group: Konva.Group; ring: Konva.Circle }>();
  private wrongTimer: number | undefined;
  private inputBox!: Konva.Rect;
  private inputText!: Konva.Text;
  private waveText!: Konva.Text;
  private healthBar!: Konva.Group;
  private scrapLayer!: Konva.Group; // the scraps, kept under the pause overlay
  private effects!: ScrapEffects; // the laser and explosions, drawn above the scraps
  private ship!: Konva.Group;
  private flame!: Konva.Image;
  private pauseOverlay!: Konva.Group;
  private pauseLabel!: Konva.Text;

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
    this.inputBox = new Konva.Rect({
      x: WIDTH / 2 - 120,
      y: 520,
      width: 240,
      height: 48,
      fill: 'black',
      stroke: 'white',
      strokeWidth: 2,
    });
    this.inputText = new Konva.Text({
      x: WIDTH / 2 - 120,
      y: 520,
      width: 240,
      height: 48,
      align: 'center',
      verticalAlign: 'middle',
      text: '',
      fontSize: 24,
      fill: 'white',
    });

    this.group.add(
      new Konva.Rect({
        x: 0,
        y: 0,
        width: WIDTH,
        height: HEIGHT,
        fill: 'black',
        listening: false,
      }),
    );

    this.waveText = new Konva.Text({
      x: WIDTH / 2 - 100,
      y: 16,
      width: 200,
      align: 'center',
      text: '',
      fontSize: 20,
      fill: 'white',
    });

    this.healthBar = new Konva.Group({ x: 20, y: 16 });

    this.scrapLayer = new Konva.Group();
    const effectsLayer = new Konva.Group({ listening: false });
    this.effects = new ScrapEffects(effectsLayer);
    this.pauseOverlay = this.makePauseOverlay(onPause);

    this.drawFrontLine();
    this.drawShip();
    this.group.add(this.scrapLayer, effectsLayer, this.inputBox, this.inputText, this.waveText, this.healthBar);
    this.group.add(this.pauseOverlay); // above the game, below the buttons so they still work
    this.group.add(makeButton(20, 536, 'Back', onBack, '#6b7280', 100));

    // Bottom-right, across from Back: up top it would sit under scraps falling in the right lane.
    const pauseButton = makeButton(WIDTH - 120, 536, 'Pause', onPause, '#6b7280', 100);
    this.pauseLabel = pauseButton.findOne<Konva.Text>('Text')!;
    this.group.add(pauseButton);
  }

  /** Shows or hides the PAUSED overlay, and switches the Pause button's label to match. */
  showPaused(paused: boolean): void {
    this.pauseOverlay.visible(paused);
    this.pauseLabel.text(paused ? 'Resume' : 'Pause');
    this.group.getLayer()?.batchDraw();
  }

  destroy(): void {
    this.effects?.destroy();

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
    this.group.add(this.ship);
  }

  /** A dashed line across the screen. A scrap that touches it is lost and costs health. */
  private drawFrontLine(): void {
    const y = FRONT_LINE_Y + SCRAP_RADIUS;
    this.group.add(
      new Konva.Line({
        points: [0, y, WIDTH, y],
        stroke: 'white',
        strokeWidth: 2,
        dash: [12, 8],
        listening: false,
      }),
    );
  }

  /**
   * A dark cover over the game with PAUSED and a Resume button. It catches clicks, so
   * nothing under it can be clicked while the game is paused. Hidden until showPaused(true).
   */
  private makePauseOverlay(onResume: () => void): Konva.Group {
    const overlay = new Konva.Group({ visible: false });
    overlay.add(
      new Konva.Rect({ width: WIDTH, height: HEIGHT, fill: 'black', opacity: 0.75 }),
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
      makeButton(WIDTH / 2 - 75, 320, 'Resume', onResume, '#4f46e5', 150),
    );
    return overlay;
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
    this.inputText.text(typed === '' ? 'type answer' : typed);
    this.group.getLayer()?.batchDraw();
  }

  showWave(wave: number, totalWaves: number): void {
    this.waveText.text(`Wave ${wave} / ${totalWaves}`);
    this.group.getLayer()?.batchDraw();
  }

  showHealth(health: number, maxHealth: number): void {
    this.healthBar.destroyChildren();
    for (let i = 0; i < maxHealth; i++) {
      this.healthBar.add(
        new Konva.Rect({
          x: i * 30,
          y: 0,
          width: 22,
          height: 22,
          stroke: 'white',
          strokeWidth: 2,
          fill: i < health ? 'white' : 'black',
        }),
      );
    }
    this.group.getLayer()?.batchDraw();
  }

  // ------------------------------------------------------------- actions

  /** Fires the laser at a scrap: a beam from the ship's nose, an explosion on the scrap and a kick on the ship. */
  shoot(scrap: Scrap): void {
    const hit = { x: scrapX(scrap), y: scrap.y };
    this.effects.fire(NOSE, hit);
    this.effects.explode(hit);
    this.effects.recoil(this.ship, SHIP_TOP);
  }

  flashWrong(): void {
    this.inputBox.strokeWidth(8);
    this.group.getLayer()?.batchDraw();
    this.wrongTimer = window.setTimeout(() => {
      this.inputBox.strokeWidth(2);
      this.group.getLayer()?.batchDraw();
      this.wrongTimer = undefined;
    }, 250);
  }
}
