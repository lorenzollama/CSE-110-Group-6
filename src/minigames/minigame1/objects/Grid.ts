
import Konva from "konva";
import { Square } from "./Square";

export interface GridOptions {
	rows?: number;
	cols?: number;
	squareSize?: number;
	gap?: number;
	startX?: number;
	startY?: number;
	fill?: string;
	onSquareClick?: (
		square: Square,
		row: number,
		col: number
	) => void;
}

export interface Coordinates {
	row: number;
	col: number;
}

export class Grid {
	private squares: Square[][] = [];
	private group: Konva.Group;
	private rows: number;
	private cols: number;
	private gapTimer?: ReturnType<typeof setTimeout>;

	constructor(
		parent: Konva.Container,
		options: GridOptions = {}
	) {
		this.rows = options.rows ?? 3;
		this.cols = options.cols ?? 3;
		const squareSize = options.squareSize ?? 80;
		const gap = options.gap ?? 10;

		// create a dedicated group for the grid
		this.group = new Konva.Group({
			x: options.startX ?? 0,
			y: options.startY ?? 0,
		});

		parent.add(this.group);

		// create squares
		for (let row = 0; row < this.rows; row++) {
			this.squares[row] = [];

			for (let col = 0; col < this.cols; col++) {
				const square = new Square(this.group, {
					x: col * (squareSize + gap),
					y: row * (squareSize + gap),
					size: squareSize,
					fill: options.fill,
					onClick: (clickedSquare) => {
						options.onSquareClick?.(clickedSquare, row, col);
					},
				});

				this.squares[row][col] = square;
			}
		}

		this.group.getLayer()?.batchDraw();
	}

	// get group for styling purposes
	getGroup(): Konva.Group {
		return this.group;
	}

	// get square by row and col
	getSquare(row: number, col: number): Square | undefined {
		return this.squares[row]?.[col];
	}

	// get squares (2d array)
	getSquares(): Square[][] {
		return this.squares;
	}

	getRowCount(): number {
		return this.rows;
	}

	getColCount(): number {
		return this.cols;
	}

	/**
	 * Plays the signals in order and notifies the caller when playback ends
	 * Repeated signals briefly return to their idle appearance
	 * @param coordinates the ordered light sequence to display
	 * @param onComplete the optional callback invoked after playback finishes
	 */
	blink(coordinates: Coordinates[], playAudio: boolean = true, onComplete?: () => void): void {
		let index = 0;
		let blinkDuration = 1;
		const flashGap = 200;

		if (coordinates.length == 1 && playAudio == false) {
			blinkDuration = 2
		}

		// recursive functions
		const blinkNext = () => {
			if (index >= coordinates.length) {
				onComplete?.();
				return;
			}

			const { row, col } = coordinates[index++];
			const square = this.getSquare(row, col);

			if (!square) {
				blinkNext();
				return;
			}

			square.blink(() => {
				if (index >= coordinates.length) {
					onComplete?.();
					return;
				}

				//leave the light idle before starting the next signal
				this.gapTimer = setTimeout(() => {
					this.gapTimer = undefined;
					blinkNext();
				}, flashGap);
			}, playAudio, blinkDuration);
		};

		blinkNext();
	}

	/** Stops a sequence that is playing, e.g. when the player leaves mid-game. Its onComplete never runs. */
	stopBlinking(): void {
		if (this.gapTimer !== undefined) {
			clearTimeout(this.gapTimer);
			this.gapTimer = undefined;
		}
		for (const row of this.squares) {
			for (const square of row) {
				square.stopBlink();
			}
		}
	}

	// remove grids and squares
	destroy(): void {
		if (this.gapTimer !== undefined) {
			clearTimeout(this.gapTimer);
			this.gapTimer = undefined;
		}
		for (const row of this.squares) {
			for (const square of row) {
				square.destroy();
			}
		}

		this.squares = [];
		this.group.destroy();
		this.group.getLayer()?.batchDraw();
	}
}
