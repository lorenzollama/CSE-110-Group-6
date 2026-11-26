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
	makeBackButton,
	makePressable,
	type Pressable,
} from "../../../../screens/shared/pressable.ts";

/**
 * MenuScreenView - Renders the menu screen
 */
export class MenuScreenView implements View {
	private group: Konva.Group;
	private content: Konva.Group;
	private stage: Stage;
	private sky: SpaceBackdrop;
	private personalBestText: Konva.Text;
	private startButton: Pressable;
	private backButton: Pressable;

	constructor(stage: Stage, onStartClick: () => void, onBackClick: () => void) {
		this.stage = stage;
		this.group = new Konva.Group({ visible: false });
		this.content = new Konva.Group();

		//placed the shared background behind the menu content
		this.sky = new SpaceBackdrop(undefined, () => this.centerLayout());
		this.group.add(this.sky.group);

		const title = makeTitle("ALIEN SIGNAL\nMEMORY", 110, 44);
		title.lineHeight(1.25);
		title.shadowColor("#2dd4bf");
		this.content.add(title);

		this.personalBestText = new Konva.Text({
			y: 235,
			width: STAGE_WIDTH,
			text: "No personal best yet",
			align: "center",
			fontSize: 20,
			fontFamily: "Arial",
			fill: "#99f6e4",
			listening: false,
		});
		this.content.add(this.personalBestText);

		const instructions = new Konva.Text({
			x: 80,
			y: 300,
			width: STAGE_WIDTH - 160,
			text: "Watch the lights, then repeat their order.\nEach completed round adds one signal.",
			align: "center",
			fontSize: 17,
			lineHeight: 1.5,
			fontFamily: "Arial",
			fill: "#e2e8f0",
			listening: false,
		});
		this.content.add(instructions);

		this.startButton = makePressable(
			260,
			64,
			darkLook("#2dd4bf", "#134e4e"),
			onStartClick
		);
		this.startButton.group.position({
			x: (STAGE_WIDTH - 260) / 2,
			y: 400,
		});

		const startLabel = new Konva.Text({
			width: 260,
			height: 64,
			text: "START GAME",
			align: "center",
			verticalAlign: "middle",
			fontSize: 22,
			fontStyle: "bold",
			fontFamily: "Arial",
			letterSpacing: 2,
			fill: "white",
			listening: false,
		});
		this.startButton.face.add(startLabel);
		this.content.add(this.startButton.group);
		this.group.add(this.content);

		//keep Back in the upper-left corner, outside the centered content
		const back = makeBackButton(onBackClick);
		this.backButton = back.button;
		this.backButton.group.position({ x: 20, y: 20});
		this.group.add(this.backButton.group);

		useTitleFont(
			[title, startLabel, back.label, this.personalBestText, instructions],
			() => this.group.getLayer()?.batchDraw()
		);
		this.centerLayout();
	}

	/**
	 * Centers the menu and scales it to fit smaller windows
	 */
	private centerLayout(): void {
		const scale = Math.min(
			1,
			this.stage.width() / STAGE_WIDTH,
			this.stage.height() / STAGE_HEIGHT
		);
		this.content.scale({ x: scale, y: scale });
		this.content.position({
			x: (this.stage.width() - STAGE_WIDTH * scale) / 2,
			y: (this.stage.height() - STAGE_HEIGHT * scale) / 2,
		});
		this.group.getLayer()?.batchDraw();
	}

	/**
	 * Show the screen and starts its background animation
	 */
	show(): void {
		if (!this.group.visible()) {
			this.group.visible(true);
			this.sky.start();
		}
		this.centerLayout();
	}

	/**
	 * Hide the menu and resets its background and button effects
	 */
	hide(): void {
		this.sky.stop();
		this.startButton.reset();
		this.backButton.reset();
		document.body.style.cursor = "default";
		this.group.visible(false);
		this.group.getLayer()?.batchDraw();
	}

	getGroup(): Konva.Group {
		return this.group;
	}

	/**
	 * Updates and centers the personal best label on the start screen
	 */
	updatePersonalBest(rounds: number | null): void {
		if (rounds === null) {
			this.personalBestText.text("No personal best yet");
		}
		else {
			const unit = rounds === 1 ? "round" : "rounds";
			this.personalBestText.text(`Personal best: ${rounds} ${unit}`);
		}
		this.group.getLayer()?.batchDraw();
	}
}
