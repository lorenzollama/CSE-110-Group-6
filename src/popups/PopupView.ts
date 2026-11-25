import Konva from "konva";
import type { LevelCompleteInfo, WrongAnswerInfo , GameOverInfo} from "./PopupModel";
import { sounds } from "../audio/sounds";
import { GAME_FONT, useTitleFont } from "../screens/shared/space";
import { SHADOW, darkLook, makePressable, type PressableLook } from "../screens/shared/pressable";

/** What the level-complete popup's two buttons do. */
export interface LevelCompleteActions {
  onNextLevel: () => void;
  onMenu: () => void;
}

export interface GameOverActions {
  onTryAgain: () => void;
  onMenu: () => void;
}

// Each popup's color, like the menu buttons: an outline and title color, and a darker shadow.
const RED = { accent: "#f87171", shade: "#7f1d1d" };
const GREEN = { accent: "#4ade80", shade: "#14532d" };
const BLUE = { accent: "#38bdf8", shade: "#0c4a6e" };
const SLATE = { accent: "#64748b", shade: "#1e293b" };

const BUTTON_WIDTH = 150;
const BUTTON_HEIGHT = 44;

/**
 * Popup VIEW: draws the popups with Konva on the popup layer, in the game's look: a dark
 * panel with a glowing colored outline, an Orbitron title, and the menus' pressable buttons.
 * It decides nothing. A button click is only reported by calling the function the view
 * was given; the controller decides what happens (like closing the popup).
 */
export class PopupView {
  private layer: Konva.Layer;
  private openPopup: Konva.Group | null = null;

  constructor(layer: Konva.Layer) {
    this.layer = layer;
  }

  // Shows: "Not quite!", the question, what they typed, the right answer, and WHY.
  showWrongAnswer(info: WrongAnswerInfo, onGotIt: () => void): void {
    const W = 420, H = 320;
    const box = this.openFrame(W, H, RED.accent);

    const title = popupTitle("NOT QUITE!", 24, W, 26, RED.accent);
    box.add(title);
    box.add(new Konva.Text({
      x: 30, y: 72, width: W - 60, fontSize: 15, lineHeight: 1.6, fill: "#e2e8f0", fontFamily: GAME_FONT,
      text: `Question: ${info.question}\nYou answered: ${info.playerAnswer}\nCorrect answer: ${info.correctAnswer}`,
    }));
    box.add(new Konva.Text({
      x: 30, y: 158, width: W - 60, fontSize: 13, lineHeight: 1.5, fill: "#94a3b8", fontFamily: GAME_FONT,
      text: `Why: ${info.explanation}`,   // wraps automatically because width is set
    }));

    const gotIt = popupButton((W - BUTTON_WIDTH) / 2, H - 82, "GOT IT", onGotIt, darkLook(BLUE.accent, BLUE.shade));
    box.add(gotIt.group);
    box.add(enterHint((W - BUTTON_WIDTH) / 2, H - 24));
    this.useFont([title, gotIt.label]);
  }

  showLevelComplete(info: LevelCompleteInfo, actions: LevelCompleteActions): void {
    const W = 420, H = 300;
    const box = this.openFrame(W, H, GREEN.accent);

    const title = popupTitle("CONGRATS!", 28, W, 32, GREEN.accent);
    box.add(title);
    box.add(new Konva.Text({
      y: 82, width: W, fontSize: 17, align: "center", fill: "#e2e8f0", fontFamily: GAME_FONT,
      text: `You passed Level ${info.level}`,
    }));
    box.add(scoreText(info.score, info.accuracy, W));
    const labels = this.addTwoButtons(box, H, "NEXT LEVEL", actions.onNextLevel, actions.onMenu);
    this.useFont([title, ...labels]);
    pop(title);
  }

  showGameOver(info: GameOverInfo, actions: GameOverActions): void {
    const W = 420, H = 300;
    const box = this.openFrame(W, H, RED.accent);

    const title = popupTitle("GAME OVER!", 28, W, 32, RED.accent);
    box.add(title);
    box.add(new Konva.Text({
      y: 82, width: W, fontSize: 17, align: "center", fill: "#e2e8f0", fontFamily: GAME_FONT,
      text: `You ran out of fuel!`,
    }));
    box.add(scoreText(info.score, info.accuracy, W));
    const labels = this.addTwoButtons(box, H, "TRY AGAIN", actions.onTryAgain, actions.onMenu);
    this.useFont([title, ...labels]);
    pop(title);
  }

  close(): void {
    // reset cursor too: mouseleave never fires when a button is destroyed under the mouse
    document.body.style.cursor = "default";
    this.openPopup?.destroy();
    this.openPopup = null;
    this.layer.batchDraw();
  }

  /**
   * The main button (green, the one Enter presses) on the left with its hint, and MENU on the
   * right. Returns their labels, to switch to Orbitron.
   */
  private addTwoButtons(
    box: Konva.Group, H: number, mainText: string, onMain: () => void, onMenu: () => void,
  ): Konva.Text[] {
    const main = popupButton(40, H - 82, mainText, onMain, darkLook(GREEN.accent, GREEN.shade));
    const menu = popupButton(230, H - 82, "MENU", onMenu, darkLook(SLATE.accent, SLATE.shade));
    box.add(main.group, menu.group, enterHint(40, H - 24));
    return [main.label, menu.label];
  }

  /** Draws the popup, then switches the given texts to Orbitron (see useTitleFont). */
  private useFont(texts: Konva.Text[]): void {
    this.layer.batchDraw();
    useTitleFont(texts, () => this.layer.batchDraw());
  }

  // Dark background + centered dark panel with a glowing outline. Every popup uses this so
  // they all look the same. Returns the panel, for the popup to add its text and buttons to.
  private openFrame(boxW: number, boxH: number, accent: string): Konva.Group {
    const { width, height } = this.layer.getStage().size();
    const root = new Konva.Group();
    root.add(new Konva.Rect({ width, height, fill: "black", opacity: 0.6 })); // blocks clicks to the game

    const box = new Konva.Group({ x: (width - boxW) / 2, y: (height - boxH) / 2 });
    box.add(new Konva.Rect({
      x: SHADOW, y: SHADOW, width: boxW, height: boxH, cornerRadius: 6, fill: "#020617",
    }));
    box.add(new Konva.Rect({
      width: boxW, height: boxH, cornerRadius: 6, fill: "#0f172a",
      stroke: accent, strokeWidth: 3,
      shadowColor: accent, shadowBlur: 24, shadowOpacity: 0.6,
    }));
    root.add(box);

    // little fade-in
    root.opacity(0);
    this.layer.add(root);
    new Konva.Tween({ node: root, opacity: 1, duration: 0.2 }).play();

    this.openPopup = root;
    return box;
  }
}

/** A popup's glowing title, centered across the panel. */
function popupTitle(text: string, y: number, width: number, fontSize: number, color: string): Konva.Text {
  return new Konva.Text({
    y, width, text, fontSize, fontStyle: "bold", fontFamily: GAME_FONT, letterSpacing: 2,
    fill: color, align: "center", shadowColor: color, shadowBlur: 14, shadowOpacity: 0.8,
    listening: false,
  });
}

/** The "Score" and "Accuracy" lines on the level-complete and game-over popups. */
function scoreText(score: number, accuracy: number, width: number): Konva.Text {
  return new Konva.Text({
    y: 124, width, fontSize: 15, align: "center", fill: "#94a3b8", lineHeight: 1.6, fontFamily: GAME_FONT,
    text: `Score: ${score}\nAccuracy: ${accuracy}%`,
  });
}

/** A small "pop" on a title as the popup opens, growing from its middle. */
function pop(title: Konva.Text): void {
  title.offsetY(title.height() / 2);
  title.y(title.y() + title.height() / 2);
  title.offsetX(title.width() / 2);
  title.x(title.width() / 2);
  title.scale({ x: 0.6, y: 0.6 });
  new Konva.Tween({ node: title, scaleX: 1, scaleY: 1, duration: 0.3, easing: Konva.Easings.BackEaseOut }).play();
}

/** A small "or press Enter" under a popup's main button (the one Enter presses). */
function enterHint(x: number, y: number, width = BUTTON_WIDTH): Konva.Text {
  return new Konva.Text({
    x, y, width, text: "or press Enter", fontSize: 11, fill: "#64748b", align: "center", fontFamily: GAME_FONT,
    listening: false,
  });
}

/** One of the menus' pressable buttons with a centered label. Every click blips (unless muted). */
function popupButton(
  x: number, y: number, text: string, onClick: () => void, look: PressableLook,
): { group: Konva.Group; label: Konva.Text } {
  const button = makePressable(BUTTON_WIDTH, BUTTON_HEIGHT, look, () => {
    sounds.playClick();
    onClick();
  });
  button.group.position({ x, y });
  const label = new Konva.Text({
    width: BUTTON_WIDTH, height: BUTTON_HEIGHT, align: "center", verticalAlign: "middle",
    text, fontSize: 15, fontStyle: "bold", fontFamily: GAME_FONT, letterSpacing: 2,
    fill: "#f1f5f9", listening: false,
  });
  button.face.add(label);
  return { group: button.group, label };
}
