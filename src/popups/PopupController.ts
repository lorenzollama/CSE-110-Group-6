import { PopupModel, toWholePercent, type LevelCompleteInfo, type WrongAnswerInfo } from "./PopupModel";
import type { LevelCompleteActions, PopupView } from "./PopupView";

/**
 * Popup CONTROLLER: what the game calls to open a popup.
 * It updates the PopupModel, tells the PopupView what to draw, and decides what each
 * button does: close the popup, then hand control back to the game.
 *
 * Usage, with the App's popup layer:
 *   const popups = new PopupController(new PopupView(popupLayer));
 *   popups.showWrongAnswer(info, () => { ...continue the game... });
 */
export class PopupController {
  private model = new PopupModel();
  private view: PopupView;

  constructor(view: PopupView) {
    this.view = view;
  }

  /** True while a popup is open, so the game can pause typing. */
  isOpen(): boolean {
    return this.model.isOpen();
  }

  showWrongAnswer(info: WrongAnswerInfo, onContinue: () => void): void {
    this.close(); // only one popup at a time
    this.model.open("wrongAnswer");
    this.view.showWrongAnswer(info, this.closeThen(onContinue));
  }

  showLevelComplete(info: LevelCompleteInfo, actions: LevelCompleteActions): void {
    this.close(); // only one popup at a time
    this.model.open("levelComplete");
    this.view.showLevelComplete(
      { ...info, accuracy: toWholePercent(info.accuracy) },
      {
        onNextLevel: this.closeThen(actions.onNextLevel),
        onMenu: this.closeThen(actions.onMenu),
      },
    );
  }

  /** Closes the open popup, if there is one. */
  close(): void {
    if (!this.model.isOpen()) return;
    this.model.close();
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
