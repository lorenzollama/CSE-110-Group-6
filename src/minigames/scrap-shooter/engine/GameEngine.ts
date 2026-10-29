import Konva from 'konva';
import { isCorrect, makeQuestion, type Question } from '../logic/questions';

const WIDTH = 800;
const HEIGHT = 600;
const SHIP = { x: WIDTH / 2, y: 440 };
const SCRAP_RADIUS = 40;
const MAX_DIGITS = 3;

// Fixed spots where scraps sit. The scrap list order decides which one is the target.
const SLOTS = [
  { x: 120, y: 110 },
  { x: 320, y: 190 },
  { x: 480, y: 110 },
  { x: 680, y: 190 },
];

interface Scrap {
  question: Question;
  slot: number;
  group: Konva.Group;
  body: Konva.Circle;
}

/**
 * Black and white, plain shapes only. Scraps sit on screen and the first one in the list
 * (thick outline) is the target. Type its answer and press Enter. Right: the ship shoots
 * it and a new scrap takes its place. Wrong: the input box border thickens briefly.
 */
export class GameEngine {
  private layer: Konva.Layer;
  private scraps: Scrap[] = [];
  private typed = '';
  private shotTimer: number | undefined;
  private wrongTimer: number | undefined;

  private inputBox = new Konva.Rect({
    x: WIDTH / 2 - 120,
    y: 520,
    width: 240,
    height: 48,
    fill: 'black',
    stroke: 'white',
    strokeWidth: 2,
  });
  private inputText = new Konva.Text({
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

  constructor(layer: Konva.Layer) {
  this.layer = layer;

  this.layer.add(
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
  this.layer.add(this.inputBox, this.inputText);

  SLOTS.forEach((_, slot) => this.spawnScrap(slot));
  this.highlightTarget();
  this.showTyped();

  window.addEventListener('keydown', this.onKeyDown);
}

destroy(): void {
  window.removeEventListener('keydown', this.onKeyDown);

  if (this.shotTimer !== undefined) {
    window.clearTimeout(this.shotTimer);
  }

  if (this.wrongTimer !== undefined) {
    window.clearTimeout(this.wrongTimer);
  }

  this.layer.destroyChildren();
}

  // ------------------------------------------------------------- drawing

  private drawShip(): void {
    this.layer.add(
      new Konva.Line({
        points: [SHIP.x, SHIP.y - 30, SHIP.x - 24, SHIP.y + 18, SHIP.x + 24, SHIP.y + 18],
        closed: true,
        fill: 'white',
      }),
    );
  }

  private spawnScrap(slot: number): void {
    const question = makeQuestion();
    const { x, y } = SLOTS[slot];

    const group = new Konva.Group({ x, y });
    const body = new Konva.Circle({ radius: SCRAP_RADIUS, fill: 'black', stroke: 'white', strokeWidth: 2 });
    const label = new Konva.Text({ text: question.prompt, fontSize: 20, fill: 'white' });
    label.offsetX(label.width() / 2);
    label.offsetY(label.height() / 2);

    group.add(body, label);
    this.layer.add(group);
    this.scraps.push({ question, slot, group, body });
  }

  /** The first scrap in the list is the target. A thick outline shows which problem to answer. */
  private highlightTarget(): void {
    this.scraps.forEach((scrap, i) => {
      scrap.body.strokeWidth(i === 0 ? 8 : 2);
    });
    this.layer.batchDraw();
  }

  private showTyped(): void {
    this.inputText.text(this.typed === '' ? 'type answer' : this.typed);
    this.layer.batchDraw();
  }

  // --------------------------------------------------------------- input

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      if (this.typed.length < MAX_DIGITS) this.typed += e.key;
      this.showTyped();
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      this.typed = this.typed.slice(0, -1);
      this.showTyped();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (!e.repeat) this.submit();
    }
  };

  private submit(): void {
    if (this.typed === '') return;
    const value = parseInt(this.typed, 10);
    this.typed = '';
    this.showTyped();

    const target = this.scraps[0];
    if (isCorrect(target.question, value)) {
      this.shoot(target);
    } else {
      this.flashWrong();
    }
  }

  // ------------------------------------------------------------- actions

  private shoot(target: Scrap): void {
    const { x, y } = SLOTS[target.slot];
    const shot = new Konva.Line({ points: [SHIP.x, SHIP.y - 30, x, y], stroke: 'white', strokeWidth: 3 });
    this.layer.add(shot);
    this.shotTimer = window.setTimeout(() => {
  shot.destroy();
  this.layer.batchDraw();
  this.shotTimer = undefined;
}, 100);

    target.group.destroy();
    this.scraps.shift();
    this.spawnScrap(target.slot); // the new scrap goes to the back of the line
    this.highlightTarget();
  }

  private flashWrong(): void {
    this.inputBox.strokeWidth(8);
    this.layer.batchDraw();
    this.wrongTimer = window.setTimeout(() => {
  this.inputBox.strokeWidth(2);
  this.layer.batchDraw();
  this.wrongTimer = undefined;
}, 250);
  }
}
