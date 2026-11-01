
import Konva from "konva";

export interface SquareOptions {
	x?: number;
	y?: number;
	size?: number;
	fill?: string;
	onClick?: (square: Square) => void;
}

export class Square {
	private rect: Konva.Rect;
	private parent: Konva.Container;
	private selectionFeedbackTimer?: ReturnType<typeof setTimeout>;

	constructor(
		parent: Konva.Container,
		options: SquareOptions = {}
	) {
		this.parent = parent;

		// create square
		this.rect = new Konva.Rect({
			x: options.x ?? 50,
			y: options.y ?? 50,
			width: options.size ?? 150,
			height: options.size ?? 150,
			fill: options.fill ?? 'white',
			strokeWidth: 2,
			cornerRadius: 4,
		});

		// handle mouse clicks and touch taps
		// TODO -- user input
		this.rect.on("click tap", () => {
			options.onClick?.(this);
		});

		// hover events
		this.rect.on("mouseenter", () => {
		const stage = this.rect.getStage();
			if (stage) {
				stage.container().style.cursor = "pointer";
			}
			this.rect.fill('gray');
		});

		this.rect.on("mouseleave", () => {
		const stage = this.rect.getStage();
			if (stage) {
				stage.container().style.cursor = "default";
			}
			this.rect.fill(options.fill);
		});

		this.parent.add(this.rect);
		this.parent.getLayer()?.batchDraw();
	}

	// change fill folor
	setFill(color: string): this {
		this.rect.fill(color);
		this.parent.getLayer()?.batchDraw();
		return this;
	}

	// get current fill color
	getFill(): string | CanvasGradient {
		return this.rect.fill();
	}

	/**
	 * Briefly highlights the selected square with a yellow outline
	 * Restarts the feedback timer when the square is selected again
	 */
	showSelectionFeedback(): void {
		if (this.selectionFeedbackTimer !== undefined) {
			clearTimeout(this.selectionFeedbackTimer);
		}

		this.rect.stroke("#ffd54f");
        this.rect.strokeWidth(4);
        this.parent.getLayer()?.batchDraw();

        this.selectionFeedbackTimer = setTimeout(() => {
			this.rect.stroke("");
            this.rect.strokeWidth(2);
            this.selectionFeedbackTimer = undefined;
            this.parent.getLayer()?.batchDraw();
		}, 200);
	}

	/**
	 * Removes the square and cancels any pending selection feedback
	 */
	destroy(): void {
		if (this.selectionFeedbackTimer !== undefined) {
			clearTimeout(this.selectionFeedbackTimer);
            this.selectionFeedbackTimer = undefined;
		}

		this.rect.destroy();
		this.parent.getLayer()?.batchDraw();
	}

	// blink
	blink(onComplete?: () => void): void {
		const originalFill = this.rect.fill();

		this.setFill("lightgreen");

		setTimeout(() => {
		this.setFill(originalFill as string);
		onComplete?.();
		}, 1000); // 1000ms = 1s
	}
}