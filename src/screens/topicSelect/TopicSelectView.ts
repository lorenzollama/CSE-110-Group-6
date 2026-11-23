import Konva from "konva";
import type { Topic, View } from "../../types";
import type { TopicOption } from "./TopicSelectModel";
import { sounds } from "../../audio/sounds";
import { SpaceBackdrop, STAGE_WIDTH, makeTitle, useTitleFont } from "../shared/space";
import {
  darkLook,
  makeBackButton,
  makePressable,
  makeSprite,
  spriteSize,
  type Pressable,
} from "../shared/pressable";

// The topic plates: wide buttons stacked under the title.
const PLATE_WIDTH = 460;
const PLATE_HEIGHT = 88;
const PLATE_GAP = 28; // between one plate and the next
const FIRST_PLATE_Y = 200;
const PIXEL = 5; // the size of one sprite pixel
const ICON_BOX = 72; // the square on the plate's left that holds the topic's sprite
const BACK_MARGIN = 20; // gap between the back button and the window's top-left corner

/**
 * Pixel-art sprites, one string per row; "O" is the topic's color and "." is see-through.
 */
const TIMES = [
  "OO.....OO",
  "OOO...OOO",
  ".OOO.OOO.",
  "..OOOOO..",
  "...OOO...",
  "..OOOOO..",
  ".OOO.OOO.",
  "OOO...OOO",
  "OO.....OO",
];
const DIVIDE = [
  "...OOO...",
  "...OOO...",
  ".........",
  "OOOOOOOOO",
  "OOOOOOOOO",
  ".........",
  "...OOO...",
  "...OOO...",
];
const ONE_HALF = [
  "....O....",
  "...OO....",
  "....O....",
  "...OOO...",
  ".........",
  "OOOOOOOOO",
  ".........",
  "...OO....",
  ".....O...",
  "....O....",
  "...OOO...",
];
const CHEVRON = [
  "O...",
  "OO..",
  ".OO.",
  "..OO",
  ".OO.",
  "OO..",
  "O...",
];

/** Each topic's sprite and colors: its accent (outline and sprite) and its shadow color. */
const TOPIC_LOOKS: Record<Topic, { sprite: string[]; accent: string; shade: string }> = {
  multiplication: { sprite: TIMES, accent: "#38bdf8", shade: "#0c4a6e" },
  division: { sprite: DIVIDE, accent: "#a78bfa", shade: "#4c1d95" },
  simplification: { sprite: ONE_HALF, accent: "#a3e635", shade: "#365314" },
};

/**
 * A topic plate: a wide button with the topic's sprite in a box on the left, its name, and
 * an arrow on the right. On hover it lifts off its shadow and the arrow slides right.
 */
function makeTopicPlate(option: TopicOption, onClick: () => void): { plate: Pressable; label: Konva.Text } {
  const look = TOPIC_LOOKS[option.topic];
  const iconBox = new Konva.Rect({
    x: (PLATE_HEIGHT - ICON_BOX) / 2,
    y: (PLATE_HEIGHT - ICON_BOX) / 2,
    width: ICON_BOX,
    height: ICON_BOX,
    cornerRadius: 2,
    fill: "#020617",
    stroke: look.shade,
    strokeWidth: 2,
    listening: false,
  });
  const sprite = makeSprite(look.sprite, { O: look.accent }, PIXEL);
  const size = spriteSize(look.sprite, PIXEL);
  sprite.position({ x: iconBox.x() + (ICON_BOX - size.width) / 2, y: iconBox.y() + (ICON_BOX - size.height) / 2 });

  const label = new Konva.Text({
    x: PLATE_HEIGHT + 12,
    height: PLATE_HEIGHT,
    verticalAlign: "middle",
    text: option.label.toUpperCase(),
    fontSize: 22,
    fontStyle: "bold",
    fontFamily: "Arial",
    letterSpacing: 2,
    fill: "white",
    listening: false,
  });

  const arrowX = PLATE_WIDTH - 40;
  const arrow = makeSprite(CHEVRON, { O: look.accent }, 4);
  arrow.position({ x: arrowX, y: (PLATE_HEIGHT - spriteSize(CHEVRON, 4).height) / 2 });

  const plate = makePressable(
    PLATE_WIDTH, PLATE_HEIGHT, darkLook(look.accent, look.shade), onClick,
    (hovered, move) => move(arrow, { x: hovered ? arrowX + 8 : arrowX }),
  );
  plate.face.add(iconBox, sprite, label, arrow);
  return { plate, label };
}

/**
 * Topic select VIEW: draws the night sky, a title and one plate per topic with Konva, plus
 * a back button in the window's top-left corner.
 * It decides nothing. Clicks are only reported; the controller decides what happens.
 */
export class TopicSelectView implements View {
  private group = new Konva.Group({ visible: false });
  private sky: SpaceBackdrop;
  private buttons: Pressable[] = [];
  private backButton: Pressable;

  constructor(
    options: readonly TopicOption[],
    onTopicClick: (topic: Topic) => void,
    onBackClick: () => void,
  ) {
    this.sky = new SpaceBackdrop(undefined, (_width, _height, left, top) => this.placeBackButton(left, top));
    this.group.add(this.sky.group);

    const title = makeTitle("CHOOSE A TOPIC", 96, 44);
    this.group.add(title);

    const labels: Konva.Text[] = [];
    const plateX = (STAGE_WIDTH - PLATE_WIDTH) / 2;
    options.forEach((option, i) => {
      const { plate, label } = makeTopicPlate(option, () => {
        sounds.playClick(); // the same blip as every other button
        onTopicClick(option.topic);
      });
      plate.group.position({ x: plateX, y: FIRST_PLATE_Y + i * (PLATE_HEIGHT + PLATE_GAP) });
      this.buttons.push(plate);
      labels.push(label);
      this.group.add(plate.group);
    });

    const back = makeBackButton(() => {
      sounds.playClick();
      onBackClick();
    });
    this.backButton = back.button;
    this.buttons.push(back.button);
    this.group.add(back.button.group);
    this.placeBackButton(0, 0); // until it's on screen and knows the window size

    useTitleFont([title, ...labels, back.label], () => this.group.getLayer()?.batchDraw());
  }

  show(): void {
    this.group.visible(true);
    this.sky.start();
    this.group.getLayer()?.batchDraw();
  }

  hide(): void {
    this.sky.stop();
    // A clicked button is hidden while the mouse is still on it, so its "mouse left" never
    // comes: put every button and the cursor back to normal for next time.
    document.body.style.cursor = "default";
    for (const button of this.buttons) button.reset();
    this.group.visible(false);
    this.group.getLayer()?.batchDraw();
  }

  getGroup(): Konva.Group {
    return this.group;
  }

  /** Puts the back button in the window's top-left corner (`left`, `top` is that corner). */
  private placeBackButton(left: number, top: number): void {
    this.backButton.group.position({ x: left + BACK_MARGIN, y: top + BACK_MARGIN });
  }
}
