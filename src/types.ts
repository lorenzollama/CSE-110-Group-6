import type { Group } from "konva/lib/Group";

export interface View {
	getGroup(): Group;
	show(): void;
	hide(): void;
}

/**
 * Screen types for navigation
 *
 * - "menu": Main menu screen
 * - "topic select": pick a math topic before the main game
 * - "main game": the main game (Scrap Shooter)
 *   - topic: which kind of math questions it asks
 * - "minigame1", "minigame2": the two minigames (src/minigames/)
 * - "result": Results screen with final score
 *   - score: Final score to display on results screen
 */
export type Screen =
	| { type: "menu" }
	| { type: "topic select" }
	| { type: "main game"; topic: Topic }
	| { type: "minigame1" }
	| { type: "minigame2" }
	| { type: "result"; score: number };

/** The math topics the player can choose on the topic select screen. */
export type Topic = "multiplication" | "division" | "simplification";

export abstract class ScreenController {
	abstract getView(): View;

	show(): void {
		this.getView().show();
	}

	hide(): void {
		this.getView().hide();
	}
}

export interface ScreenSwitcher {
	switchToScreen(screen: Screen): void;
}
