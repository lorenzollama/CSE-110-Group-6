import Konva from "konva";
import type { View } from "../../types.ts";
import { Grid, type GridOptions } from "../../objects/Grid.ts";

const ROWS = 3;
const COLS = 3;
const SQUARE_SIZE = 100;
const GAP = 12;
const SCORE_GAP = 24;

export class GameScreenView implements View {
	private group: Konva.Group;
	private grid: Grid;
	private scoreText: Konva.Text;
	private statusText: Konva.Text;
	private stage: Konva.Stage;
	private background: Konva.Rect;
	private selectionHandler?: (row: number, col: number) => void;

	constructor(stage: Konva.Stage) {
		this.stage = stage;
		this.group = new Konva.Group({ visible: false });

		this.background = new Konva.Rect({
			x: 0,
			y: 0,
			width: stage.width(),
			height: stage.height(),
			fill: "#white",
			listening: false,
		});
		this.group.add(this.background);

		this.scoreText = new Konva.Text({
			text: "Score: 0",
			fontSize: 32,
			fontFamily: "Arial",
			fill: "white",
			});
		this.group.add(this.scoreText);

		this.statusText = new Konva.Text({
			text: "",
			fontSize: 20,
			fontFamily: "Arial",
			fill: "white",
			listening: false,
		});
		this.group.add(this.statusText);

		const cfg: GridOptions = {
			rows: ROWS,
			cols: COLS,
			squareSize: SQUARE_SIZE,
			gap: GAP,
			fill: "white",
			onSquareClick: (_square, row, col) => {
				this.selectionHandler?.(row, col);
			},
		};

		this.grid = new Grid(this.group, cfg);
		this.centerLayout();
	}

	/**
	 * Centers the score, status message, and game board vertically
	 * Updates the background size to match the stage
	 */
	private centerLayout(): void {
		const gridWidth = COLS * SQUARE_SIZE + (COLS - 1) * GAP;
		const gridHeight = ROWS * SQUARE_SIZE + (ROWS - 1) * GAP;

		// keep the background sized to the window
		this.background.size({
			width: this.stage.width(),
			height: this.stage.height(),
		});

		// center the score, status message, and grid as one vertical layout
		const totalHeight =
			this.scoreText.height() + SCORE_GAP +
			this.statusText.height() + SCORE_GAP + gridHeight;

		const startY = (this.stage.height() - totalHeight) / 2;

		this.scoreText.position({
			x: (this.stage.width() - this.scoreText.width()) / 2,
			y: startY,
		});

		// Position the status message between the score and grid
		this.statusText.position({
			x: (this.stage.width() - this.statusText.width()) / 2,
			y: startY + this.scoreText.height() + SCORE_GAP,
		});

		// Position the grid below the status message
		this.grid.getGroup().position({
			x: (this.stage.width() - gridWidth) / 2,
			y: this.statusText.y() + this.statusText.height() + SCORE_GAP,
		});

		this.group.getLayer()?.batchDraw();
	}

	/**
	 * Registers the handler called when a player selects a light
	 *
	 * @param handler the function receiving the selected row and column
	 */
	setSelectionHandler(handler: (row: number, col: number) => void): void {
		this.selectionHandler = handler;
	}

	/**
	 * Briefly highlights the light selected by the player
	 *
	 * @param row the selected light's row
	 * @param col the selected light's column
	 */
	showSelectionFeedback(row: number, col: number): void {
		this.grid.getSquare(row, col)?.showSelectionFeedback();
	}

	/**
	 * Displays instructions or feedback above the game board
	 * Repositions the layout to keep the message centered
	 *
	 * @param message the message shown to players
	 */
	updateStatus(message: string): void {
		this.statusText.text(message);
		this.centerLayout();
	}

	updateScore(score: number): void {
		this.scoreText.text(`Score: ${score}`);
		this.centerLayout();
	}

	show(): void {
		this.group.visible(true);
		this.centerLayout();
	}

	hide(): void {
		this.group.visible(false);
		this.group.getLayer()?.batchDraw();
	}

	getGroup(): Konva.Group {
		return this.group;
	}

	getGrid(): Grid {
		return this.grid;
	}

	resize(): void {
		this.centerLayout();
	}
}