import Konva from "konva";
import type { View } from "../../types.ts";
import { GRID_SIZE, STAGE_HEIGHT, STAGE_WIDTH } from "./constants.ts";
import type { Board, GameState } from "./types.ts";

// Board layout, in pixels. The tile size is worked out from GRID_SIZE so the
// whole board fits between the score and the bottom of the stage.
const BOARD_Y = 100; // leaves room for the score above the board
const BOTTOM_MARGIN = 20;
const GAP_RATIO = 0.1; // each gap is this fraction of a tile's width

// space the board may take up: GRID_SIZE tiles plus GRID_SIZE + 1 gaps
const MAX_BOARD_SIZE = STAGE_HEIGHT - BOARD_Y - BOTTOM_MARGIN;
const TILE_SIZE = Math.floor(MAX_BOARD_SIZE / (GRID_SIZE + (GRID_SIZE + 1) * GAP_RATIO));
const GAP = Math.floor(TILE_SIZE * GAP_RATIO);
// rounding down leaves a few spare pixels, so size the board to fit the tiles exactly
const BOARD_SIZE = GRID_SIZE * TILE_SIZE + (GRID_SIZE + 1) * GAP;
const BOARD_X = (STAGE_WIDTH - BOARD_SIZE) / 2;

const BOARD_COLOR = "#8d99ae";
const EMPTY_CELL_COLOR = "#cdd3db";
const TEXT_COLOR = "#2b2d42";

// Game over popup: "No moves left" with the New game button under it,
// centered as one block over the middle of the board
const GAME_OVER_TEXT_SIZE = 40;
const NEW_GAME_BUTTON_WIDTH = 180;
const NEW_GAME_BUTTON_HEIGHT = 56;
const GAME_OVER_SPACING = 50; // between the text and the button
const GAME_OVER_TOP =
  BOARD_Y + (BOARD_SIZE - (GAME_OVER_TEXT_SIZE + GAME_OVER_SPACING + NEW_GAME_BUTTON_HEIGHT)) / 2;

// Each tile value gets its own color
const TILE_COLORS: Record<number, string> = {
  2: "#c8e6c9",
  4: "#a5d6a7",
  8: "#b3e5fc",
  16: "#81d4fa",
  32: "#c5cae9",
  64: "#9fa8da",
  128: "#e1bee7",
  256: "#ce93d8",
  512: "#f8bbd0",
  1024: "#f48fb1",
  2048: "#ffe082",
};
const BIG_TILE_COLOR = "#ffca28"; // for any tile bigger than 2048

/**
 * Minigame2View - draws Minigame 2 with Konva
 *
 * The view only draws what it is given. The controller decides what to draw.
 */
export class Minigame2View implements View {
  private group: Konva.Group;
  private tiles: Konva.Group;
  private scoreText: Konva.Text;
  private newGameButton: Konva.Group;
  private gameOverPopup: Konva.Group;

  constructor() {
    this.group = new Konva.Group();
    this.drawEmptyGrid();

    // tiles get their own group so they can be cleared and redrawn after every move
    this.tiles = new Konva.Group();
    this.group.add(this.tiles);

    this.scoreText = new Konva.Text({
      x: BOARD_X,
      y: 40,
      text: "Score: 0",
      fontSize: 32,
      fontFamily: "Arial",
      fill: TEXT_COLOR,
    });
    this.group.add(this.scoreText);

    this.newGameButton = createNewGameButton();
    this.gameOverPopup = createGameOverPopup(this.newGameButton);
    this.group.add(this.gameOverPopup);
  }

  /**
   * Draws a game state on the screen
   */
  draw(state: GameState): void {
    this.drawTiles(state.board);
    this.scoreText.text(`Score: ${state.score}`);
    this.gameOverPopup.visible(state.status === "over");
    this.group.getLayer()?.batchDraw();
  }

  /**
   * Runs the handler when the player clicks the New game button
   */
  onNewGameClick(handler: () => void): void {
    this.newGameButton.on("click tap", handler);
  }

  // Draws the board background and the 16 empty cells (done once)
  private drawEmptyGrid(): void {
    this.group.add(new Konva.Rect({
      x: BOARD_X,
      y: BOARD_Y,
      width: BOARD_SIZE,
      height: BOARD_SIZE,
      fill: BOARD_COLOR,
      cornerRadius: 8,
    }));

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

  // Removes the old tiles, then draws each non-empty cell as a colored tile with its number
  private drawTiles(board: Board): void {
    this.tiles.destroyChildren();

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const value = board[row][col];
        if (value === 0) {
          continue; // 0 means empty, so there is no tile to draw
        }

        const { x, y } = cellPosition(row, col);
        this.tiles.add(new Konva.Rect({
          x,
          y,
          width: TILE_SIZE,
          height: TILE_SIZE,
          fill: TILE_COLORS[value] ?? BIG_TILE_COLOR,
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
          fill: TEXT_COLOR,
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

// A dark rounded button that says "New game"
function createNewGameButton(): Konva.Group {
  const width = NEW_GAME_BUTTON_WIDTH;
  const height = NEW_GAME_BUTTON_HEIGHT;
  const button = new Konva.Group({
    x: BOARD_X + (BOARD_SIZE - width) / 2,
    y: GAME_OVER_TOP + GAME_OVER_TEXT_SIZE + GAME_OVER_SPACING,
  });
  button.add(new Konva.Rect({ width, height, fill: TEXT_COLOR, cornerRadius: 8 }));
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

// Covers the board with "No moves left" and the New game button. It starts hidden.
function createGameOverPopup(newGameButton: Konva.Group): Konva.Group {
  const popup = new Konva.Group({ visible: false });
  popup.add(new Konva.Rect({
    x: BOARD_X,
    y: BOARD_Y,
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    fill: "white",
    opacity: 0.8,
    cornerRadius: 8,
  }));
  popup.add(new Konva.Text({
    x: BOARD_X,
    y: GAME_OVER_TOP,
    width: BOARD_SIZE,
    text: "No moves left",
    fontSize: GAME_OVER_TEXT_SIZE,
    fontStyle: "bold",
    fontFamily: "Arial",
    fill: TEXT_COLOR,
    align: "center",
  }));
  popup.add(newGameButton);
  return popup;
}

