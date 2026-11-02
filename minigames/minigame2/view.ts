import Konva from "konva";
import type { View } from "../../src/types.ts";
import { STAGE_WIDTH } from "./constants.ts";

// Board layout
const GRID_SIZE = 4;
const TILE_SIZE = 100;
const GAP = 10;
const BOARD_SIZE = GRID_SIZE * TILE_SIZE + (GRID_SIZE + 1) * GAP;
const BOARD_X = (STAGE_WIDTH - BOARD_SIZE) / 2;
const BOARD_Y = 100;

const BOARD_COLOR = "#8d99ae";
const EMPTY_CELL_COLOR = "#cdd3db";

/**
 * Minigame2View - this draws Minigame 2 with Konva
 */
export class Minigame2View implements View {
  private group: Konva.Group;

  constructor() {
    this.group = new Konva.Group();
    this.drawEmptyGrid();
  }

  // Draws the board background and the empty cells
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