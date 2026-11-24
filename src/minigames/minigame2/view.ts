import Konva from "konva";
import type { View } from "../../types.ts";
import { GRID_SIZE, STAGE_HEIGHT, STAGE_WIDTH } from "./constants.ts";
import type { GameState } from "./types.ts";

// Board layout, in pixels. The board is on the left and the display is on the right.
// The tile size is worked out from GRID_SIZE so the whole board fits.
const BOARD_Y = 70; // leaves a little room above the board
const BOTTOM_MARGIN = 120; // keeps the board small enough to fit next to the display
const GAP_RATIO = 0.1; // each gap is this fraction of a tile's width
const BOARD_SIDE_WIDTH = STAGE_WIDTH - 330; // the part of the stage left of the display

// space the board may take up: GRID_SIZE tiles plus GRID_SIZE + 1 gaps
const MAX_BOARD_SIZE = STAGE_HEIGHT - BOARD_Y - BOTTOM_MARGIN;
const TILE_SIZE = Math.floor(MAX_BOARD_SIZE / (GRID_SIZE + (GRID_SIZE + 1) * GAP_RATIO));
const GAP = Math.floor(TILE_SIZE * GAP_RATIO);
// rounding down leaves a few spare pixels, so size the board to fit the tiles exactly
const BOARD_SIZE = GRID_SIZE * TILE_SIZE + (GRID_SIZE + 1) * GAP;
const BOARD_X = (BOARD_SIDE_WIDTH - BOARD_SIZE) / 2; // centered on the left side

// Both screens are dark with a light frame, so they look built into the wall
const SCREEN_COLOR = "#0f172a";
const EMPTY_CELL_COLOR = "#1e293b";
const FRAME_COLOR = "#cbd5e1";
const FRAME = 8; // how thick the frame is
const TEXT_COLOR = "#2b2d42";
const SCREEN_TEXT_COLOR = "#e2e8f0"; // light text on the screens
const WALL_COLOR = "#f1f5f9"; // off-white, like the inside of a modern spaceship

// The display, right of the board and as tall as it. The power level and base are
// always at the top, and the page under them shows one thing at a time.
const DISPLAY_X = BOARD_SIDE_WIDTH;
const DISPLAY_Y = BOARD_Y;
const DISPLAY_WIDTH = 300;
const DISPLAY_HEIGHT = BOARD_SIZE;
const DISPLAY_PADDING = 16; // space between the edge of the screen and its text
const PAGE_Y = DISPLAY_Y + 100; // where the page starts, under the power level and base

// The New game button, on the display when the game is over
const NEW_GAME_BUTTON_WIDTH = 180;
const NEW_GAME_BUTTON_HEIGHT = 56;
const BUTTON_COLOR = "#2563eb"; // blue, so it stands out on the dark screen

// Each base gets its own hue (degrees on the color wheel)
const BASE_HUES: Record<number, number> = {
  2: 0, // red
  3: 30, // orange
  4: 55, // yellow
  5: 120, // green
  6: 175, // teal
  7: 220, // blue
  8: 275, // purple
  9: 330, // pink
};
const TILE_SATURATION = 70;
// The power sets the shade: power 1 is very light and each power is a bit darker
const FIRST_POWER_LIGHTNESS = 90;
const LIGHTNESS_STEP = 7;
const MIN_LIGHTNESS = 20; // so very big tiles don't turn black
// tiles darker than this get a white number so it stays readable
const DARK_TILE_LIGHTNESS = 55;
const BLOCKED_TILE_COLOR = "#9e9e9e"; // grey, so blocked tiles stand out as unmergeable

/**
 * Minigame2View - draws Minigame 2 with Konva
 *
 * The view only draws what it is given. The controller decides what to draw.
 */
export class Minigame2View implements View {
  private group: Konva.Group;
  private tiles: Konva.Group;
  private scoreText: Konva.Text;
  private baseText: Konva.Text;
  private newGameButton: Konva.Group;
  private gameOverPage: Konva.Group;
  private questionPage: Konva.Group;
  private questionText: Konva.Text;
  private answerText: Konva.Text;

  constructor() {
    this.group = new Konva.Group();
    // the wall goes first, so it is behind everything
    this.group.add(new Konva.Rect({ width: STAGE_WIDTH, height: STAGE_HEIGHT, fill: WALL_COLOR }));
    this.drawEmptyGrid();

    // tiles get their own group so they can be cleared and redrawn after every move
    this.tiles = new Konva.Group();
    this.group.add(this.tiles);

    this.group.add(createScreen(DISPLAY_X, DISPLAY_Y, DISPLAY_WIDTH, DISPLAY_HEIGHT));
    this.scoreText = createDisplayText(DISPLAY_Y + 20, 26, "bold");
    this.baseText = createDisplayText(DISPLAY_Y + 56, 20, "normal");
    this.group.add(this.scoreText, this.baseText);
    // a line between them and the page
    const lineY = PAGE_Y - 14;
    this.group.add(new Konva.Line({
      points: [DISPLAY_X + DISPLAY_PADDING, lineY, DISPLAY_X + DISPLAY_WIDTH - DISPLAY_PADDING, lineY],
      stroke: "#334155",
      strokeWidth: 2,
    }));

    this.newGameButton = createNewGameButton();
    this.gameOverPage = createGameOverPage(this.newGameButton);
    this.group.add(this.gameOverPage);

    this.questionText = createDisplayText(PAGE_Y + 20, 48, "bold");
    this.answerText = createDisplayText(PAGE_Y + 90, 40, "normal");
    this.questionPage = createQuestionPage(this.questionText, this.answerText);
    this.group.add(this.questionPage);
  }

  /**
   * Draws a game state on the screen
   */
  draw(state: GameState): void {
    const page = displayPage(state);
    this.drawTiles(state, page === "gameOver");
    this.scoreText.text(`Power level: ${state.score}`);
    this.baseText.text(`Base: ${state.base}`);
    this.questionText.text(state.question ?? "");
    this.questionPage.visible(page === "question");
    this.gameOverPage.visible(page === "gameOver");
    this.group.getLayer()?.batchDraw();
  }

  /**
   * Shows what the player has typed so far on the display
   */
  drawAnswer(typed: string): void {
    this.answerText.text(`${typed}_`);
    this.group.getLayer()?.batchDraw();
  }

  /**
   * Runs the handler when the player clicks the New game button
   */
  onNewGameClick(handler: () => void): void {
    this.newGameButton.on("click tap", handler);
  }

  // Draws the board's screen and the empty cells (done once)
  private drawEmptyGrid(): void {
    this.group.add(createScreen(BOARD_X, BOARD_Y, BOARD_SIZE, BOARD_SIZE));

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const { x, y } = cellPosition(row, col);
        this.group.add(new Konva.Rect({
          x,
          y,
          width: TILE_SIZE,
          height: TILE_SIZE,
          fill: EMPTY_CELL_COLOR,
          cornerRadius: 6,
        }));
      }
    }
  }

  // Removes the old tiles, then draws each non-empty cell as a colored tile with its number.
  // When the game is over every tile is grey.
  private drawTiles(state: GameState, gameOver: boolean): void {
    const { board, base, blocked } = state;
    this.tiles.destroyChildren();

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const value = board[row][col];
        if (value === 0) {
          continue; // 0 means empty, so there is no tile to draw
        }

        const { x, y } = cellPosition(row, col);
        const colors = tileColors(value, base, blocked, gameOver);
        this.tiles.add(new Konva.Rect({
          x,
          y,
          width: TILE_SIZE,
          height: TILE_SIZE,
          fill: colors.fill,
          cornerRadius: 6,
        }));
        this.tiles.add(new Konva.Text({
          x,
          y,
          width: TILE_SIZE,
          height: TILE_SIZE,
          text: String(value),
          fontSize: tileFontSize(value),
          fontStyle: "bold",
          fontFamily: "Arial",
          fill: colors.text,
          align: "center",
          verticalAlign: "middle",
        }));
      }
    }
  }

  getGroup(): Konva.Group {
    return this.group;
  }

  show(): void {
    this.group.visible(true);
    this.group.getLayer()?.batchDraw();
  }

  hide(): void {
    this.group.visible(false);
    this.group.getLayer()?.batchDraw();
  }
}

// Picks what the display shows under the power level and base: the question while one
// is up, then "No moves left" when the game is over, and otherwise the instructions
function displayPage(state: GameState): "question" | "gameOver" | "instructions" {
  // the board can be full while a question is up, so the question goes first
  if (state.question !== null) {
    return "question";
  }
  if (state.status === "over") {
    return "gameOver";
  }
  return "instructions";
}

// Blocked tiles are grey, and so is every tile when the game is over. Otherwise the tile's
// color comes from the base, its shade from its power, and the number is white on dark tiles
export function tileColors(
  value: number,
  base: number,
  blocked: number[] = [],
  gameOver: boolean = false,
): { fill: string; text: string } {
  if (gameOver || blocked.includes(value)) {
    return { fill: BLOCKED_TILE_COLOR, text: TEXT_COLOR };
  }
  // round it because the log can come out a tiny bit off, like 4.999999999999999 for 9^5
  const power = Math.round(Math.log(value) / Math.log(base));
  const lightness = Math.max(MIN_LIGHTNESS, FIRST_POWER_LIGHTNESS - (power - 1) * LIGHTNESS_STEP);
  return {
    fill: `hsl(${BASE_HUES[base]}, ${TILE_SATURATION}%, ${lightness}%)`,
    text: lightness < DARK_TILE_LIGHTNESS ? "white" : TEXT_COLOR,
  };
}

// Top-left corner of the cell at (row, col)
function cellPosition(row: number, col: number): { x: number; y: number } {
  return {
    x: BOARD_X + GAP + col * (TILE_SIZE + GAP),
    y: BOARD_Y + GAP + row * (TILE_SIZE + GAP),
  };
}

// Tile number sizing, as fractions of the tile's width
const MAX_TEXT_HEIGHT = 0.5; // a number is never taller than half the tile
const MAX_TEXT_WIDTH = 0.85; // leaves a little padding on the left and right
const DIGIT_WIDTH = 0.6; // a bold Arial digit is about 0.6 times as wide as the font size

/**
 * The font size that fits a tile's number inside the tile.
 *
 * Short numbers are capped by the tile's height, so 2 and 64 look the same size.
 * Longer numbers shrink so all their digits fit across the tile.
 */
export function tileFontSize(value: number, tileSize: number = TILE_SIZE): number {
  const digits = String(value).length;
  const heightLimit = tileSize * MAX_TEXT_HEIGHT;
  const widthLimit = (tileSize * MAX_TEXT_WIDTH) / (digits * DIGIT_WIDTH);
  return Math.floor(Math.min(heightLimit, widthLimit));
}

// A blue rounded button that says "New game", on the display
function createNewGameButton(): Konva.Group {
  const width = NEW_GAME_BUTTON_WIDTH;
  const height = NEW_GAME_BUTTON_HEIGHT;
  const button = new Konva.Group({
    x: DISPLAY_X + (DISPLAY_WIDTH - width) / 2,
    y: PAGE_Y + 110,
  });
  button.add(new Konva.Rect({ width, height, fill: BUTTON_COLOR, cornerRadius: 8 }));
  button.add(new Konva.Text({
    width,
    height,
    text: "New game",
    fontSize: 24,
    fontFamily: "Arial",
    fill: "white",
    align: "center",
    verticalAlign: "middle",
  }));
  return button;
}

// "No moves left" and the New game button, on the display. It starts hidden.
function createGameOverPage(newGameButton: Konva.Group): Konva.Group {
  const page = new Konva.Group({ visible: false });
  const text = createDisplayText(PAGE_Y + 40, 32, "bold");
  text.text("No moves left");
  page.add(text, newGameButton);
  return page;
}

// A dark screen with a light frame around it, so it looks built into the wall
function createScreen(x: number, y: number, width: number, height: number): Konva.Group {
  const screen = new Konva.Group();
  screen.add(new Konva.Rect({
    x: x - FRAME,
    y: y - FRAME,
    width: width + 2 * FRAME,
    height: height + 2 * FRAME,
    fill: FRAME_COLOR,
    cornerRadius: 12,
  }));
  screen.add(new Konva.Rect({ x, y, width, height, fill: SCREEN_COLOR, cornerRadius: 8 }));
  return screen;
}

// Centered text on the display. Text that is too long wraps onto the next line.
function createDisplayText(y: number, fontSize: number, fontStyle: string): Konva.Text {
  return new Konva.Text({
    x: DISPLAY_X + DISPLAY_PADDING,
    y,
    width: DISPLAY_WIDTH - 2 * DISPLAY_PADDING,
    text: "",
    fontSize,
    fontStyle,
    fontFamily: "Arial",
    lineHeight: 1.25,
    fill: SCREEN_TEXT_COLOR,
    align: "center",
  });
}

// The question, the typed answer and how to send it, on the display. It starts hidden.
function createQuestionPage(questionText: Konva.Text, answerText: Konva.Text): Konva.Group {
  const page = new Konva.Group({ visible: false });
  const hint = createDisplayText(PAGE_Y + 160, 18, "normal");
  hint.text("Type the answer, then press Enter");
  page.add(questionText, answerText, hint);
  return page;
}
