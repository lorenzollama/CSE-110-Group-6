import Konva from "konva";
import type { View } from "../../types.ts";
import type { Stage } from "konva/lib/Stage";
import {
	SpaceBackdrop,
	STAGE_WIDTH,
	STAGE_HEIGHT,
	makeTitle,
	useTitleFont,
} from "../../../../screens/shared/space.ts";
import {
	darkLook,
	makePressable,
	type Pressable,
} from "../../../../screens/shared/pressable.ts";

/**
 * ResultsScreenView - Renders the results screen
 */
export class ResultsScreenView implements View {
	private group: Konva.Group;
	private content: Konva.Group;
	private stage: Stage;
	private sky: SpaceBackdrop;
	private finalScoreText: Konva.Text;
	private playAgainButton: Pressable;
	private returnToMenuButton: Pressable;

	constructor(stage: Stage, onPlayAgainButtonClick: () => void, onReturnToMenuClick: () => void) {
		this.stage = stage;
		this.group = new Konva.Group({ visible: false });
		this.content = new Konva.Group();

		//placed the shared space background behind the results
		this.sky = new SpaceBackdrop(undefined, () => this.centerLayout());
		this.group.add(this.sky.group);

		// "Game Over" title
		const title = makeTitle("GAME OVER", 110, 48);
		title.shadowColor("#2dd4bf");
		this.content.add(title);

		const subtitle = new Konva.Text({
			y: 185,
			width: STAGE_WIDTH,
			text: "ALIEN SIGNAL MEMORY",
			align: "center",
			fontSize: 20,
			fontFamily: "Arial",
			fill: "#99f6e4",
			listening: false,
		});
		this.content.add(subtitle);

		this.finalScoreText = new Konva.Text({
			y: 250,
			width: STAGE_WIDTH,
			text: "Final Score: 0",
			align: "center",
			fontSize: 32,
			fontFamily: "Arial",
			fill: "#e2e8f0",
			listening: false,
		});
		this.content.add(this.finalScoreText);

		// Play Again returns to Minigame 1's start menu
		this.playAgainButton = makePressable(
			300,
			64,
			darkLook("#2dd4bf", "#134e4a"),
			onPlayAgainButtonClick
		);
		this.playAgainButton.group.position({
			x: (STAGE_WIDTH - 300) / 2,
			y: 340,
		});

		const playAgainLabel = new Konva.Text({
			width: 300,
			height: 64,
			text: "PLAY AGAIN?",
			align: "center",
			verticalAlign: "middle",
			fontSize: 22,
			fontStyle: "bold",
			fontFamily: "Arial",
			fill: "white",
			listening: false,
		});
		this.playAgainButton.face.add(playAgainLabel);
		this.content.add(this.playAgainButton.group);

		// Return to Menu opens the shared game-selection screen
		this.returnToMenuButton = makePressable(
			300,
			64,
			darkLook("#a5b4fc", "#312e81"),
			onReturnToMenuClick
		);
		this.returnToMenuButton.group.position({
			x: (STAGE_WIDTH - 300) / 2,
			y: 430,
		});

		const returnToMenuLabel = new Konva.Text({
			width: 300,
			height: 64,
			text: "RETURN TO MENU",
			align: "center",
			verticalAlign: "middle",
			fontSize: 20,
			fontStyle: "bold",
			fontFamily: "Arial",
			fill: "white",
			listening: false,
		});
		this.returnToMenuButton.face.add(returnToMenuLabel);
		this.content.add(this.returnToMenuButton.group);

		this.group.add(this.content);

		useTitleFont(
			[title, playAgainLabel, returnToMenuLabel],
			() => this.group.getLayer()?.batchDraw()
		);
		this.centerLayout();
	}

	/**
	 * Centers the results and scales them to fit smaller windows
	 */
	private centerLayout(): void {
		const scale = Math.min(1, this.stage.width() / STAGE_WIDTH, this.stage.height() / STAGE_HEIGHT);
		this.content.scale({ x: scale, y: scale });
		this.content.position({
			x: (this.stage.width() - STAGE_WIDTH * scale) / 2,
			y: (this.stage.height() - STAGE_HEIGHT * scale) / 2,
		});
		this.group.getLayer()?.batchDraw();
	}

	/**
	 * Update the final score display
	 */
	updateFinalScore(score: number): void {
		this.finalScoreText.text(`Final Score: ${score}`);
		this.group.getLayer()?.draw();
	}

	/**
	 * Show the screen
	 */
	show(): void {
		if (!this.group.visible()) {
			this.group.visible(true);
			this.sky.start();
		}
		this.centerLayout();
	}

	/**
	 * Hide the screen
	 */
	hide(): void {
		this.sky.stop();
		this.playAgainButton.reset();
		this.returnToMenuButton.reset();
		document.body.style.cursor = "default";
		this.group.visible(false);
		this.group.getLayer()?.draw();
	}

	getGroup(): Konva.Group {
		return this.group;
	}
}
