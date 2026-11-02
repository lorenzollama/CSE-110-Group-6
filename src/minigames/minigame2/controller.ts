import { ScreenController } from "../../types.ts";
import type { GameLogic } from "./types.ts";
import type { Minigame2View } from "./view.ts";

/**
 * Minigame2Controller - connects the game logic to the view
 *
 * Starts new games
 */
export class Minigame2Controller extends ScreenController {
  private game: GameLogic;
  private view: Minigame2View;

  constructor(game: GameLogic, view: Minigame2View) {
    super();
    this.game = game;
    this.view = view;
  }

  /**
   * Starts a new game and draws its first board
   */
  startNewGame(): void {
    this.view.draw(this.game.newGame());
  }

  getView(): Minigame2View {
    return this.view;
  }
}