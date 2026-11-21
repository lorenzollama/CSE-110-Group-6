import Konva from "konva";
import type { View } from "../../types";
import { sounds } from "../../audio/sounds";
import { SpaceBackdrop, STAGE_WIDTH, makeTitle, useTitleFont } from "../shared/space";
import { SHADOW, darkLook, makeBackButton, makePressable, makeSprite, spriteSize, type Pressable } from "../shared/pressable";

// The level tiles: square buttons in rows of five.
const TILE_SIZE = 96;
const TILE_GAP = 32;
const TILES_PER_ROW = 5;
const FIRST_TILE_Y = 220;
const ROW_GAP = 48; // between one row of tiles and the next
const BACK_MARGIN = 20; // gap between the back button and the window's top-left corner

const DONE = { accent: "#2dd4bf", shade: "#134e4a" };
const CURRENT = { accent: "#fb923c", shade: "#7c2d12" };
const LOCKED = { fill: "#0b1120", outline: "#334155", icon: "#475569" };

/** Pixel-art sprites, one string per row; "O" is colored and "." is see-through. */
const CHECK = [
  "......O",
  ".....OO",
  "O...OO.",
  "OO.OO..",
  ".OOO...",
  "..O....",
];
const LOCK = [
  "..OOO..",
  ".O...O.",
  ".O...O.",
  "OOOOOOO",
  "OOO.OOO",
  "OOO.OOO",
  "OOOOOOO",
];
const DOWN_ARROW = [
  "OOOOOOO",
  ".OOOOO.",
  "..OOO..",
  "...O...",
];

/** The level number, centered on a tile. */
function makeNumber(level: number, color: string, y: number): Konva.Text {
  return new Konva.Text({
    y,
    width: TILE_SIZE,
    align: "center",
    text: String(level),
    fontSize: 34,
    fontStyle: "bold",
    fontFamily: "Arial",
    fill: color,
    listening: false,
  });
}

/** Puts a sprite in the middle of a tile, `y` from its top. */
function centerSprite(rows: string[], color: string, pixel: number, y: number): Konva.Group {
  const sprite = makeSprite(rows, { O: color }, pixel);
  sprite.position({ x: Math.round((TILE_SIZE - spriteSize(rows, pixel).width) / 2), y });
  return sprite;
}

/**
 * Levels VIEW: the level map for one topic. Draws the night sky, the title, the topic's
 * total score and one tile per level: done (teal, with a check), current (orange, with a
 * bobbing arrow over it) or locked (dark, with a lock, not clickable). A back button sits
 * in the window's top-left corner.
 * It decides nothing. Clicks are only reported; the controller decides what happens.
 */
export class LevelsView implements View {
  private group = new Konva.Group({ visible: false });
  private sky: SpaceBackdrop;
  private levelTiles = new Konva.Group();
  private onLevelClick: (level: number) => void;
  private title: Konva.Text;
  private totalScoreText: Konva.Text;
  private buttons: Pressable[] = []; // every clickable tile, so hide() can reset them
  private backButton: Pressable;
  private currentArrow: Konva.Group | null = null; // bobs over the current level's tile
  private currentArrowY = 0;

  constructor(onLevelClick: (level: number) => void, onBack: () => void) {
    this.onLevelClick = onLevelClick;
    this.sky = new SpaceBackdrop(
      (seconds) => this.currentArrow?.y(this.currentArrowY + Math.sin(seconds * 4) * 4),
      (_width, _height, left, top) => this.placeBackButton(left, top),
    );
    this.group.add(this.sky.group);

    this.title = makeTitle("LEVELS", 70, 36);
    this.group.add(this.title);

    // The topic's high score, under the title. Its text is set in showLevels().
    this.totalScoreText = new Konva.Text({
      y: 128,
      width: STAGE_WIDTH,
      align: "center",
      fontSize: 18,
      fontStyle: "bold",
      fontFamily: "Arial",
      letterSpacing: 2,
      fill: "#c7d2fe",
      listening: false,
    });
    this.group.add(this.totalScoreText, this.levelTiles);

    const back = makeBackButton(() => {
      sounds.playClick();
      onBack();
    });
    this.backButton = back.button;
    this.group.add(back.button.group);
    this.placeBackButton(0, 0); // until it's on screen and knows the window size

    useTitleFont([this.title, this.totalScoreText, back.label], () => {
      for (const number of this.levelTiles.find<Konva.Text>("Text")) number.fontFamily(this.title.fontFamily());
      this.group.getLayer()?.batchDraw();
    });
  }

  /** Changes the heading, e.g. "Division Levels". */
  setTitle(text: string): void {
    this.title.text(text.toUpperCase());
  }

  /** Draws every level tile as done, current, or locked, and the topic's total score. */
  showLevels(totalLevels: number, unlockedLevels: number, totalScore: number): void {
    this.totalScoreText.text(`TOTAL SCORE  ${totalScore}`);
    this.levelTiles.destroyChildren();
    this.buttons = [];
    this.currentArrow = null;

    const rowWidth = TILES_PER_ROW * TILE_SIZE + (TILES_PER_ROW - 1) * TILE_GAP;
    const rowLeft = (STAGE_WIDTH - rowWidth) / 2;
    for (let level = 1; level <= totalLevels; level++) {
      const index = level - 1;
      const x = rowLeft + (index % TILES_PER_ROW) * (TILE_SIZE + TILE_GAP);
      const y = FIRST_TILE_Y + Math.floor(index / TILES_PER_ROW) * (TILE_SIZE + ROW_GAP);

      if (level > unlockedLevels) {
        this.levelTiles.add(this.makeLockedTile(x, y));
        continue;
      }

      const isCurrent = level === unlockedLevels;
      const colors = isCurrent ? CURRENT : DONE;
      const tile = makePressable(TILE_SIZE, TILE_SIZE, darkLook(colors.accent, colors.shade), () => {
        sounds.playClick(); // the same blip as every other button
        this.onLevelClick(level);
      });
      tile.group.position({ x, y });
      if (isCurrent) {
        tile.face.add(makeNumber(level, "white", 30));
        // The arrow is outside the tile (above it), so it doesn't move when the tile is pressed.
        this.currentArrowY = y - 22;
        this.currentArrow = centerSprite(DOWN_ARROW, CURRENT.accent, 4, 0);
        this.currentArrow.position({ x: x + this.currentArrow.x(), y: this.currentArrowY });
        this.levelTiles.add(this.currentArrow);
      } else {
        tile.face.add(makeNumber(level, DONE.accent, 20), centerSprite(CHECK, DONE.accent, 3, 64));
      }
      this.buttons.push(tile);
      this.levelTiles.add(tile.group);
    }

    if (this.title.fontFamily() !== "Arial") {
      for (const number of this.levelTiles.find<Konva.Text>("Text")) number.fontFamily(this.title.fontFamily());
    }
    this.group.getLayer()?.batchDraw();
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
    for (const button of [...this.buttons, this.backButton]) button.reset();
    this.group.visible(false);
    this.group.getLayer()?.batchDraw();
  }

  getGroup(): Konva.Group {
    return this.group;
  }

  /** A locked level: a dark, flat tile with a lock, sunk onto its shadow. Not clickable. */
  private makeLockedTile(x: number, y: number): Konva.Group {
    const tile = new Konva.Group({ x: x + SHADOW / 2, y: y + SHADOW / 2, listening: false });
    tile.add(
      new Konva.Rect({
        width: TILE_SIZE,
        height: TILE_SIZE,
        cornerRadius: 4,
        fill: LOCKED.fill,
        stroke: LOCKED.outline,
        strokeWidth: 2,
        dash: [6, 4],
      }),
      centerSprite(LOCK, LOCKED.icon, 4, (TILE_SIZE - spriteSize(LOCK, 4).height) / 2),
    );
    return tile;
  }

  /** Puts the back button in the window's top-left corner (`left`, `top` is that corner). */
  private placeBackButton(left: number, top: number): void {
    this.backButton.group.position({ x: left + BACK_MARGIN, y: top + BACK_MARGIN });
  }
}
