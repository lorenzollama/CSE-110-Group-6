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
	private stage: Konva.Stage;
	private background: Konva.Rect;

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

		const cfg: GridOptions = {
			rows: ROWS,
			cols: COLS,
			squareSize: SQUARE_SIZE,
			gap: GAP,
			fill: "white",
			onSquareClick: (_square, row, col) => {
				console.log(`Clicked square (${row}, ${col})`);
			},
		};

		this.grid = new Grid(this.group, cfg);
		this.centerLayout();
	}

	private centerLayout(): void {
		const gridWidth = COLS * SQUARE_SIZE + (COLS - 1) * GAP;
		const gridHeight = ROWS * SQUARE_SIZE + (ROWS - 1) * GAP;

		// keep the background sized to the window
		this.background.size({
			width: this.stage.width(),
			height: this.stage.height(),
		});

		// center the score and grid as one vertical layout
		const totalHeight = this.scoreText.height() + SCORE_GAP + gridHeight;

		const startY = (this.stage.height() - totalHeight) / 2;

		this.scoreText.position({
			x: (this.stage.width() - this.scoreText.width()) / 2,
			y: startY,
		});

		this.grid.getGroup().position({
			x: (this.stage.width() - gridWidth) / 2,
			y: startY + this.scoreText.height() + SCORE_GAP,
		});

		this.group.getLayer()?.batchDraw();
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