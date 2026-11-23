import { PopupModel, toWholePercent, type LevelCompleteInfo, type WrongAnswerInfo, type GameOverInfo } from "./PopupModel";
import type { LevelCompleteActions, PopupView, GameOverActions } from "./PopupView";
import { sounds } from "../audio/sounds";

/**
 * Popup CONTROLLER: what the game calls to open a popup.
 * It updates the PopupModel, tells the PopupView what to draw, and decides what each
 * button does: close the popup, then hand control back to the game.
 * Pressing Enter does the same as the popup's main button ("Got it", "Next level" or
 * "Try again"), so the player doesn't have to reach for the mouse.
 *
 * Usage, with the App's popup layer:
 *   const popups = new PopupController(new PopupView(popupLayer));
 *   popups.showWrongAnswer(info, () => { ...continue the game... });
 */
export class PopupController {
  private model = new PopupModel();
  private view: PopupView;
  private mainAction: (() => void) | null = null; // what Enter does while a popup is open

  /**
   * @param view draws the popups
   * @param playClick the button blip, played when Enter presses the main button (tests pass a fake)
   */
  constructor(view: PopupView, private playClick: () => void = () => sounds.playClick()) {
    this.view = view;
    // One listener for the whole game; it only acts while a popup is open. It's added when the
    // game starts, before the game's own key listener, so it sees Enter first (see onKeyDown).
    if (typeof window !== "undefined") window.addEventListener("keydown", this.onKeyDown);
  }

  /**
   * Presses the open popup's main button, as if it were clicked. Returns false (and does
   * nothing) when no popup is open.
   */
  pressEnter(): boolean {
    const action = this.mainAction;
    if (!action) return false;
    this.playClick();
    action();
    return true;
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    // A held-down Enter repeats; ignore repeats so the Enter that submitted a wrong answer
    // can't also close the popup it opened. The player has to press Enter again.
    if (e.key !== "Enter" || e.repeat || !this.isOpen()) return;
    e.preventDefault();
    // Keep the game from also seeing this Enter and submitting an answer.
    e.stopImmediatePropagation();
    this.pressEnter();
  };

  /** True while a popup is open, so the game can pause typing. */
  isOpen(): boolean {
    return this.model.isOpen();
  }

  showWrongAnswer(info: WrongAnswerInfo, onContinue: () => void): void {
    this.close(); // only one popup at a time
    this.model.open("wrongAnswer");
    const gotIt = this.closeThen(onContinue);
    this.mainAction = gotIt;
    this.view.showWrongAnswer(info, gotIt);
  }

  showLevelComplete(info: LevelCompleteInfo, actions: LevelCompleteActions): void {
    this.close(); // only one popup at a time
    this.model.open("levelComplete");
    const onNextLevel = this.closeThen(actions.onNextLevel);
    this.mainAction = onNextLevel;
    this.view.showLevelComplete(
      { ...info, accuracy: toWholePercent(info.accuracy) },
      { onNextLevel, onMenu: this.closeThen(actions.onMenu) },
    );
  }
  showGameOver(info: GameOverInfo, actions: GameOverActions): void {
      this.close(); // only one popup at a time
      this.model.open("gameOver");
      const onTryAgain = this.closeThen(actions.onTryAgain);
      this.mainAction = onTryAgain;
      this.view.showGameOver(
        { ...info, accuracy: toWholePercent(info.accuracy) },
        { onTryAgain, onMenu: this.closeThen(actions.onMenu) },
      );
    }
  /** Closes the open popup, if there is one. */
  close(): void {
    if (!this.model.isOpen()) return;
    this.model.close();
    this.mainAction = null;
    this.view.close();
  }

  /**
   * What a button does: close this popup, then run the game's action. Closing comes first
   * because the action may open the next popup, and closing after would close that one.
   */
  private closeThen(action: () => void): () => void {
    return () => {
      this.close();
      action();
    };
  }
}
