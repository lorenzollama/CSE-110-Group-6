import Konva from 'konva';
import type { View } from '../types';
import { FRONT_LINE_Y, LANE_COUNT, type Scrap } from './ScrapShooterModel';
import { makeButton } from '../popups/PopupView';

const WIDTH = 800;
const HEIGHT = 600;
const SHIP = { x: WIDTH / 2, y: 440 };
const SCRAP_RADIUS = 40;

// The x of each lane, spread evenly across the screen, indexed by Scrap.lane.
const LANE_X = Array.from({ length: LANE_COUNT }, (_, lane) => (WIDTH / LANE_COUNT) * (lane + 0.5));

/**
 * Black and white, plain shapes only. The target scrap has a thick outline.
 * Draws what the controller tells it to; holds no game state.
 */
export class ScrapShooterView implements View {
  private group = new Konva.Group();
  private scrapGroups = new Map<number, { group: Konva.Group; body: Konva.Circle }>();
  private shotTimer: number | undefined;
  private wrongTimer: number | undefined;
  private inputBox!: Konva.Rect;
  private inputText!: Konva.Text;
  private waveText!: Konva.Text;
  private healthBar!: Konva.Group;

  getGroup(): Konva.Group {
    return this.group;
  }

  show(): void {
    this.group.show();
  }

  hide(): void {
    this.group.hide();
  }

  build(onBack: () => void): void {
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

    this.drawFrontLine();
    this.drawShip();
    this.group.add(this.inputBox, this.inputText, this.waveText, this.healthBar);
    this.group.add(makeButton(20, 536, 'Back', onBack, '#6b7280', 100));
  }

  destroy(): void {
    if (this.shotTimer !== undefined) {
      window.clearTimeout(this.shotTimer);
    }

    if (this.wrongTimer !== undefined) {
      window.clearTimeout(this.wrongTimer);
    }

    this.scrapGroups.clear();
    this.group.destroyChildren();
    document.body.style.cursor = 'default';
  }

  // ------------------------------------------------------------- drawing

  private drawShip(): void {
    this.group.add(
      new Konva.Line({
        points: [SHIP.x, SHIP.y - 30, SHIP.x - 24, SHIP.y + 18, SHIP.x + 24, SHIP.y + 18],
        closed: true,
        fill: 'white',
      }),
    );
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

  private addScrap(scrap: Scrap): { group: Konva.Group; body: Konva.Circle } {
    const group = new Konva.Group({ x: LANE_X[scrap.lane], y: scrap.y });
    const body = new Konva.Circle({ radius: SCRAP_RADIUS, fill: 'black', stroke: 'white', strokeWidth: 2 });
    const label = new Konva.Text({ text: scrap.question.prompt, fontSize: 20, fill: 'white' });
    label.offsetX(label.width() / 2);
    label.offsetY(label.height() / 2);

    group.add(body, label);
    this.group.add(group);
    const shape = { group, body };
    this.scrapGroups.set(scrap.id, shape);
    return shape;
  }

  /**
   * Makes the screen match the model: adds new scraps, moves the falling ones, removes the
   * ones that are gone. The target gets a thick outline so the player knows which to answer.
   */
  render(scraps: Scrap[], target: Scrap | null): void {
    const live = new Set(scraps.map(scrap => scrap.id));
    for (const [id, shape] of this.scrapGroups) {
      if (!live.has(id)) {
        shape.group.destroy();
        this.scrapGroups.delete(id);
      }
    }

    for (const scrap of scraps) {
      const shape = this.scrapGroups.get(scrap.id) ?? this.addScrap(scrap);
      shape.group.y(scrap.y);
      shape.body.strokeWidth(scrap === target ? 8 : 2);
    }
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

  /** Draws a quick line from the ship to the scrap that was hit. */
  shoot(scrap: Scrap): void {
    const shot = new Konva.Line({
      points: [SHIP.x, SHIP.y - 30, LANE_X[scrap.lane], scrap.y],
      stroke: 'white',
      strokeWidth: 3,
    });
    this.group.add(shot);
    this.shotTimer = window.setTimeout(() => {
      shot.destroy();
      this.group.getLayer()?.batchDraw();
      this.shotTimer = undefined;
    }, 100);
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
