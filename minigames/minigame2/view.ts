import Konva from "konva";
import type { View } from "../../src/types.ts";
import { STAGE_WIDTH } from "./constants.ts";
import type { Board, GameState } from "./types.ts";

// Board layout
const GRID_SIZE = 4;
const TILE_SIZE = 100;
const GAP = 10;
const BOARD_SIZE = GRID_SIZE * TILE_SIZE + (GRID_SIZE + 1) * GAP;
const BOARD_X = (STAGE_WIDTH - BOARD_SIZE) / 2;
const BOARD_Y = 100;

const BOARD_COLOR = "#8d99ae";
const EMPTY_CELL_COLOR = "#cdd3db";
const TEXT_COLOR = "#2b2d42";

// Tile value color
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
 * The view draws what it is given from the controller.
 */
export class Minigame2View implements View {
  private group: Konva.Group;
  private tiles: Konva.Group;

  constructor() {
    this.group = new Konva.Group();
    this.drawEmptyGrid();

    // tiles get their own group so they can be cleared and redrawn after every move
    this.tiles = new Konva.Group();
    this.group.add(this.tiles);
  }

  /**
   * Draws a game state on the screen
   */
  draw(state: GameState): void {
    this.drawTiles(state.board);
    this.group.getLayer()?.batchDraw();
  }

  // Draws the board background and the 16 empty cells 
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

  // Removes the old tiles, then draws each non empty cell as a colored tile with its number
  private drawTiles(board: Board): void {
    this.tiles.destroyChildren();

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const value = board[row][col];
        if (value === 0) {
          continue; // 0 means empty so there is no tile to draw
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
          fontSize: 36,
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

// Top left corner of the cell at (row, col)
function cellPosition(row: number, col: number): { x: number; y: number } {
  return {
    x: BOARD_X + GAP + col * (TILE_SIZE + GAP),
    y: BOARD_Y + GAP + row * (TILE_SIZE + GAP),
  };
}