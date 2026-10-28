
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

	constructor(
		parent: Konva.Container,
		options: GridOptions = {}
	) {
		const rows = options.rows ?? 3;
		const cols = options.cols ?? 3;
		const squareSize = options.squareSize ?? 80;
		const gap = options.gap ?? 10;

		// create a dedicated group for the grid
		this.group = new Konva.Group({
			x: options.startX ?? 0,
			y: options.startY ?? 0,
		});

		parent.add(this.group);

		// create squares
		for (let row = 0; row < rows; row++) {
			this.squares[row] = [];

			for (let col = 0; col < cols; col++) {
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

	// blink squares in order, called in controller
	blink(coordinates: Coordinates[]): void {
		let index = 0;

		// recursive functions
		const blinkNext = () => {
			if (index >= coordinates.length) return;

			const { row, col } = coordinates[index++];
			const square = this.getSquare(row, col);

			if (!square) {
				blinkNext();
				return;
			}

			square.blink(blinkNext);
		};

		blinkNext();
	}

	// remove grids and squares
	destroy(): void {
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
