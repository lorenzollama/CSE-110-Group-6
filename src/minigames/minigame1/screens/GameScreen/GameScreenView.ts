import Konva from "konva";
import type { View } from "../../types.ts";
import { Grid, type GridOptions } from "../../objects/Grid.ts";
import {
	SpaceBackdrop,
	STAGE_WIDTH,
	STAGE_HEIGHT,
	makeTitle,
	useTitleFont,
} from "../../../../screens/shared/space.ts";

const ROWS = 3;
const COLS = 3;
const SQUARE_SIZE = 100;
const GAP = 12;

export class GameScreenView implements View {
	private group: Konva.Group;
	private content: Konva.Group;
	private grid: Grid;
	private scoreText: Konva.Text;
	private statusText: Konva.Text;
	private livesText: Konva.Text;
	private roundText: Konva.Text;
	private stage: Konva.Stage;
	private sky: SpaceBackdrop;
	private selectionHandler?: (row: number, col: number) => void;

	constructor(stage: Konva.Stage) {
		this.stage = stage;
		this.group = new Konva.Group({ visible: false });
		this.content = new Konva.Group();

		//placed the shared space background behind the gameplay
		this.sky = new SpaceBackdrop(undefined, () => this.centerLayout());
		this.group.add(this.sky.group);

		const title = makeTitle("ALIEN SIGNAL MEMORY", 32, 28);
		title.shadowColor("#2dd4bf");
		this.content.add(title);

		//Give each counter its own area above the instructions
		this.livesText = new Konva.Text({
			x: 60,
			y: 96,
			width: 200,
			text: "Lives: 0",
			align: "center",
			fontSize: 24,
			fontFamily: "Arial",
			fill: "#e2e8f0",
			listening: false,
		});

		this.roundText = new Konva.Text({
			x: 300,
			y: 96,
			width: 200,
			text: "Round 1",
			align: "center",
			fontSize: 24,
			fontFamily: "Arial",
			fill: "#99f6e4",
			listening: false,
		});

		this.scoreText = new Konva.Text({
			x: 540,
			y: 96,
			width: 200,
			text: "Score: 0",
			align: "center",
			fontSize: 24,
			fontFamily: "Arial",
			fill: "#e2e8f0",
			listening: false,
		});

		this.content.add(
			this.livesText,
			this.roundText,
			this.scoreText
		);

		this.statusText = new Konva.Text({
			x: 40,
			y: 144,
			width: STAGE_WIDTH - 80,
			text: "",
			align: "center",
			fontSize: 20,
			lineHeight: 1.2,
			fontFamily: "Arial",
			fill: "#e2e8f0",
			listening: false,
		});
		this.content.add(this.statusText);

		const gridWidth = COLS * SQUARE_SIZE + (COLS - 1) * GAP;
		const gridHeight = ROWS * SQUARE_SIZE + (ROWS - 1) * GAP;
		const gridX = (STAGE_WIDTH - gridWidth) / 2;
		const gridY = 216;
		const boardPadding = 16;

		//Frame the lights against the star background
		const boardPanel = new Konva.Rect({
			x: gridX - boardPadding,
			y: gridY - boardPadding,
			width: gridWidth + boardPadding * 2,
			height: gridHeight + boardPadding * 2,
			fill: "#0f172a",
			stroke: "#2dd4bf",
			strokeWidth: 2,
			cornerRadius: 12,
			listening: false,
		});
		this.content.add(boardPanel);

		const cfg: GridOptions = {
			rows: ROWS,
			cols: COLS,
			squareSize: SQUARE_SIZE,
			gap: GAP,
			startX: gridX,
			startY: gridY,
			fill: "#334155",
			onSquareClick: (_square, row, col) => {
				this.selectionHandler?.(row, col);
			},
		};

		this.grid = new Grid(this.content, cfg);
		this.group.add(this.content);

		useTitleFont(
			[title],
			() => this.group.getLayer()?.batchDraw()
		);
		this.centerLayout();
	}

	// centers all ui elements
	private centerLayout(): void {
		const scale = Math.min(1, this.stage.width() / STAGE_WIDTH, this.stage.height() / STAGE_HEIGHT);
		this.content.scale({ x: scale, y: scale });
		this.content.position({
			x: (this.stage.width() - STAGE_WIDTH * scale) / 2,
			y: (this.stage.height() - STAGE_HEIGHT * scale) / 2,
		});
		this.group.getLayer()?.batchDraw();
	}

	setSelectionHandler(handler: (row: number, col: number) => void): void {
		this.selectionHandler = handler;
	}

	showSelectionFeedback(row: number, col: number): void {
		this.grid.getSquare(row, col)?.showSelectionFeedback();
	}

	updateStatus(message: string): void {
		this.statusText.text(message);
		this.group.getLayer()?.batchDraw();
	}

	updateScore(score: number): void {
		this.scoreText.text(`Score: ${score}`);
		this.group.getLayer()?.batchDraw();
	}

	updateRound(round: number): void {
		this.roundText.text(`Round: ${round}`);
		this.group.getLayer()?.batchDraw();
	}

	updateLives(lives: number): void {
		this.livesText.text(`Lives: ${lives}`);
		this.group.getLayer()?.batchDraw();
	}

	show(): void {
		if (!this.group.visible()) {
			this.group.visible(true);
			this.sky.start();
		}
		this.centerLayout();
	}

	hide(): void {
		this.sky.stop();
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