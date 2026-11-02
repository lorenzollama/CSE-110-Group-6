/**
 * Popup MODEL: the information a popup shows, which popup is open, and the rules for its data.
 * No drawing (no Konva) and no clicks, so all of it can be unit tested.
 */

/** The data the game hands to the wrong-answer popup. */
export interface WrongAnswerInfo {
  question: string;      // e.g. "1/2 + 1/4"
  playerAnswer: string;  // what they typed, e.g. "2/6"
  correctAnswer: string; // e.g. "3/4"
  explanation: string;   // why, e.g. "Use a common denominator: 2/4 + 1/4 = 3/4"
}

/** The data the game hands to the level-complete popup. */
export interface LevelCompleteInfo {
  level: number;
  score: number;
  accuracy: number; // 0–100
}

export type PopupKind = "wrongAnswer" | "levelComplete";

/** Keeps track of which popup is open. Only one popup is open at a time. */
export class PopupModel {
  private openKind: PopupKind | null = null;

  open(kind: PopupKind): void {
    this.openKind = kind;
  }

  close(): void {
    this.openKind = null;
  }

  isOpen(): boolean {
    return this.openKind !== null;
  }

  getOpenKind(): PopupKind | null {
    return this.openKind;
  }
}

/** Accuracy as a whole percent from 0 to 100, so a popup never shows "-5%" or "83.333%". */
export function toWholePercent(accuracy: number): number {
  if (!Number.isFinite(accuracy)) return 0;
  return Math.min(100, Math.max(0, Math.round(accuracy)));
}
