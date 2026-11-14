import Konva from "konva";
import type { View } from "../../types.ts";
import type { Stage } from "konva/lib/Stage";

/**
 * ResultsScreenView - Renders the results screen
 */
export class ResultsScreenView implements View {
	private group: Konva.Group;
	private finalScoreText: Konva.Text;
	private background: Konva.Rect;

	constructor(stage: Stage, onPlayAgainButtonClick: () => void) {
		this.group = new Konva.Group({ visible: false });
				
		this.background = new Konva.Rect({
			x: 0,
			y: 0,
			width: stage.width(),
			height: stage.height(),
			fill: "black",
			listening: false,
		});
		this.group.add(this.background);

		// "Game Over" title
		const title = new Konva.Text({
			x: stage.width() / 2,
			y: 150,
			text: "Game Over",
			fontSize: 64,
			fontFamily: "Arial",
			stroke: "white",
			strokeWidth: 2,
			align: "center",
		});
		title.offsetX(title.width() / 2);
		this.group.add(title);

		// Final score display
		this.finalScoreText = new Konva.Text({
			x: stage.width() / 2,
			y: 250,
			text: "Final Score: 0",
			fontSize: 36,
			fontFamily: "Arial",
			stroke: "white",
			strokeWidth: 2,
			align: "center",
		});
		this.group.add(this.finalScoreText);

		// Play Again button (grouped) - moved down to make room for leaderboard
		const playAgainButtonGroup = new Konva.Group();
		const playAgainButton = new Konva.Rect({
			x: stage.width() / 2 - 100,
			y: 400,
			width: 200,
			height: 60,
			fill: "green",
			cornerRadius: 10,
			stroke: "darkgreen",
			strokeWidth: 3,
		});
		const playAgainButtonText = new Konva.Text({
			x: stage.width() / 2,
			y: 415,
			text: "START GAME",
			fontSize: 24,
			fontFamily: "Arial",
			fill: "white",
			align: "center",
		});
		playAgainButtonText.offsetX(playAgainButtonText.width() / 2);
		playAgainButtonGroup.add(playAgainButton);
		playAgainButtonGroup.add(playAgainButtonText);

		// Button interaction - on the group
		playAgainButtonGroup.on("click", onPlayAgainButtonClick);

		this.group.add(playAgainButtonGroup);
	}

	/**
	 * Update the final score display
	 */
	updateFinalScore(score: number): void {
		this.finalScoreText.text(`Final Score: ${score}`);
		// Re-center after text change
		this.finalScoreText.offsetX(this.finalScoreText.width() / 2);
		this.group.getLayer()?.draw();
	}

	/**
	 * Show the screen
	 */
	show(): void {
		this.group.visible(true);
		this.group.getLayer()?.draw();
	}

	/**
	 * Hide the screen
	 */
	hide(): void {
		this.group.visible(false);
		this.group.getLayer()?.draw();
	}

	getGroup(): Konva.Group {
		return this.group;
	}
}
