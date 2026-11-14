import Konva from "konva";
import type { View } from "../../types.ts";
import { STAGE_WIDTH } from "./constants.ts";
import type { Board, GameState } from "./types.ts";

// Board layout, in pixels
const GRID_SIZE = 4;
const TILE_SIZE = 100;
const GAP = 10;
const BOARD_SIZE = GRID_SIZE * TILE_SIZE + (GRID_SIZE + 1) * GAP;
const BOARD_X = (STAGE_WIDTH - BOARD_SIZE) / 2;
const BOARD_Y = 100;

const BOARD_COLOR = "#8d99ae";
const EMPTY_CELL_COLOR = "#cdd3db";
const TEXT_COLOR = "#2b2d42";

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
  private questionPopup: Konva.Group;
  private questionText: Konva.Text;
  private answerText: Konva.Text;

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

    this.questionText = createPopupText(BOARD_Y + 110, 48, "bold");
    this.answerText = createPopupText(BOARD_Y + 200, 40, "normal");
    this.questionPopup = createQuestionPopup(this.questionText, this.answerText);
    this.group.add(this.questionPopup);
  }

  /**
   * Draws a game state on the screen
   */
  draw(state: GameState): void {
    this.drawTiles(state.board);
    this.scoreText.text(`Score: ${state.score}`);
    this.questionText.text(state.question ?? "");
    this.questionPopup.visible(state.question !== null);
    // the board can be full while a question is up, so the question goes first
    this.gameOverPopup.visible(state.status === "over" && state.question === null);
    this.group.getLayer()?.batchDraw();
  }

  /**
   * Shows what the player has typed so far in the question popup
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

// Top-left corner of the cell at (row, col)
function cellPosition(row: number, col: number): { x: number; y: number } {
  return {
    x: BOARD_X + GAP + col * (TILE_SIZE + GAP),
    y: BOARD_Y + GAP + row * (TILE_SIZE + GAP),
  };
}

// A dark rounded button that says "New game"
function createNewGameButton(): Konva.Group {
  const width = 180;
  const height = 56;
  const button = new Konva.Group({
    x: BOARD_X + (BOARD_SIZE - width) / 2,
    y: BOARD_Y + 240,
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
    y: BOARD_Y + 150,
    width: BOARD_SIZE,
    text: "No moves left",
    fontSize: 40,
    fontStyle: "bold",
    fontFamily: "Arial",
    fill: TEXT_COLOR,
    align: "center",
  }));
  popup.add(newGameButton);
  return popup;
}

// A line of centered text across the board, used in the question popup
function createPopupText(y: number, fontSize: number, fontStyle: string): Konva.Text {
  return new Konva.Text({
    x: BOARD_X,
    y,
    width: BOARD_SIZE,
    text: "",
    fontSize,
    fontStyle,
    fontFamily: "Arial",
    fill: TEXT_COLOR,
    align: "center",
  });
}

// Covers the board with the question, the typed answer and how to send it. It starts hidden.
function createQuestionPopup(questionText: Konva.Text, answerText: Konva.Text): Konva.Group {
  const popup = new Konva.Group({ visible: false });
  popup.add(new Konva.Rect({
    x: BOARD_X,
    y: BOARD_Y,
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    fill: "white",
    opacity: 0.9,
    cornerRadius: 8,
  }));
  const hint = createPopupText(BOARD_Y + 280, 20, "normal");
  hint.text("Type the answer, then press Enter");
  popup.add(questionText, answerText, hint);
  return popup;
}
