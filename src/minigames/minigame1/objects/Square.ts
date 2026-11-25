
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
	private blinkTimer?: ReturnType<typeof setTimeout>;
	private idleFill: string;
	private isHovered = false;
	private isBlinking = false;

	private blinkAudio: HTMLAudioElement;

	constructor(
		parent: Konva.Container,
		options: SquareOptions = {}
	) {
		this.parent = parent;
		this.idleFill = options.fill ?? "white";

		// create square
		this.rect = new Konva.Rect({
			x: options.x ?? 50,
			y: options.y ?? 50,
			width: options.size ?? 150,
			height: options.size ?? 150,
			fill: this.idleFill,
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
			this.isHovered = true;
			const stage = this.rect.getStage();
			if (stage) {
				stage.container().style.cursor = "pointer";
			}
			if (!this.isBlinking) {
				this.rect.fill("gray");
				this.parent.getLayer()?.batchDraw();
			}
		});

		this.rect.on("mouseleave", () => {
			this.isHovered = false;
			const stage = this.rect.getStage();
			if (stage) {
				stage.container().style.cursor = "default";
			}
			if (!this.isBlinking) {
				this.rect.fill(this.idleFill);
				this.parent.getLayer()?.batchDraw();
			}
		});

		this.parent.add(this.rect);
		this.parent.getLayer()?.batchDraw();

		this.blinkAudio = new Audio('/minigame1/blink.mp3')
	}

	// change fill folor
	setFill(color: string): this {
		this.idleFill = color;
		if (!this.isBlinking) {
			this.rect.fill(this.isHovered ? "gray" : color);
		}
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
		if (this.blinkTimer !== undefined) {
			clearTimeout(this.blinkTimer);
			this.blinkTimer = undefined;
		}

		this.rect.destroy();
		this.parent.getLayer()?.batchDraw();
	}

	/** Ends a blink early: back to the idle color, sound stopped, and its onComplete never runs. */
	stopBlink(): void {
		if (this.blinkTimer !== undefined) {
			clearTimeout(this.blinkTimer);
			this.blinkTimer = undefined;
		}
		this.blinkAudio.pause();
		this.isBlinking = false;
		this.rect.fill(this.isHovered ? "gray" : this.idleFill);
		this.parent.getLayer()?.batchDraw();
	}

	// blink
	blink(onComplete?: () => void, playAudio: boolean = true, blinkDuration: number = 1): void {
		this.isBlinking = true;
		this.rect.fill("lightgreen");
		this.parent.getLayer()?.batchDraw();

		if (playAudio) {
			this.blinkAudio.currentTime = 0;
			this.blinkAudio.play();
		}

		this.blinkTimer = setTimeout(() => {
			this.blinkTimer = undefined;
			this.isBlinking = false;
			this.rect.fill(this.isHovered ? "gray" : this.idleFill);
			this.parent.getLayer()?.batchDraw();
			onComplete?.();
		}, blinkDuration * 1000); // 1000ms = 1s
	}
}