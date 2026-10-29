import Konva from 'konva';
import type { View } from '../types';
import type { Scrap } from './ScrapShooterModel';

const WIDTH = 800;
const HEIGHT = 600;
const SHIP = { x: WIDTH / 2, y: 440 };
const SCRAP_RADIUS = 40;

// Fixed spots where scraps sit, indexed by Scrap.slot.
const SLOTS = [
  { x: 120, y: 110 },
  { x: 320, y: 190 },
  { x: 480, y: 110 },
  { x: 680, y: 190 },
];

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

  getGroup(): Konva.Group {
    return this.group;
  }

  show(): void {
    this.group.show();
  }

  hide(): void {
    this.group.hide();
  }

  build(): void {
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

    this.drawShip();
    this.group.add(this.inputBox, this.inputText);
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

  addScrap(scrap: Scrap): void {
    const { x, y } = SLOTS[scrap.slot];

    const group = new Konva.Group({ x, y });
    const body = new Konva.Circle({ radius: SCRAP_RADIUS, fill: 'black', stroke: 'white', strokeWidth: 2 });
    const label = new Konva.Text({ text: scrap.question.prompt, fontSize: 20, fill: 'white' });
    label.offsetX(label.width() / 2);
    label.offsetY(label.height() / 2);

    group.add(body, label);
    this.group.add(group);
    this.scrapGroups.set(scrap.slot, { group, body });
  }

  removeScrap(slot: number): void {
    this.scrapGroups.get(slot)?.group.destroy();
    this.scrapGroups.delete(slot);
  }

  /** The first scrap in the list is the target. A thick outline shows which problem to answer. */
  highlightTarget(scraps: Scrap[]): void {
    scraps.forEach((scrap, i) => {
      this.scrapGroups.get(scrap.slot)?.body.strokeWidth(i === 0 ? 8 : 2);
    });
    this.group.getLayer()?.batchDraw();
  }

  showTyped(typed: string): void {
    this.inputText.text(typed === '' ? 'type answer' : typed);
    this.group.getLayer()?.batchDraw();
  }

  // ------------------------------------------------------------- actions

  shoot(slot: number): void {
    const { x, y } = SLOTS[slot];
    const shot = new Konva.Line({ points: [SHIP.x, SHIP.y - 30, x, y], stroke: 'white', strokeWidth: 3 });
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
