import Konva from "konva";
import type { LevelCompleteInfo, WrongAnswerInfo } from "./PopupModel";

/** What the level-complete popup's two buttons do. */
export interface LevelCompleteActions {
  onNextLevel: () => void;
  onMenu: () => void;
}

/**
 * Popup VIEW: draws the popups with Konva on the popup layer.
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
    const box = this.openFrame(W, H);

    box.add(new Konva.Text({
      y: 22, width: W, text: "Not quite!", fontSize: 28, fontStyle: "bold",
      fill: "#dc2626", align: "center",
    }));
    box.add(new Konva.Text({
      x: 30, y: 70, width: W - 60, fontSize: 18, lineHeight: 1.5,
      text: `Question: ${info.question}\nYou answered: ${info.playerAnswer}\nCorrect answer: ${info.correctAnswer}`,
    }));
    box.add(new Konva.Text({
      x: 30, y: 160, width: W - 60, fontSize: 16, lineHeight: 1.4, fill: "#374151",
      text: `Why: ${info.explanation}`,   // wraps automatically because width is set
    }));

    box.add(makeButton((W - 150) / 2, H - 66, "Got it", onGotIt));
    this.layer.batchDraw();
  }

  showLevelComplete(info: LevelCompleteInfo, actions: LevelCompleteActions): void {
    const W = 420, H = 300;
    const box = this.openFrame(W, H);

    const title = new Konva.Text({
      y: 28, width: W, text: "🎉 Congrats!", fontSize: 34, fontStyle: "bold",
      fill: "#16a34a", align: "center",
    });
    box.add(title);
    box.add(new Konva.Text({
      y: 80, width: W, fontSize: 20, align: "center",
      text: `You passed Level ${info.level}`,
    }));
    box.add(new Konva.Text({
      y: 125, width: W, fontSize: 18, align: "center", fill: "#374151", lineHeight: 1.5,
      text: `Score: ${info.score}\nAccuracy: ${info.accuracy}%`,
    }));

    box.add(makeButton(40, H - 70, "Next level", actions.onNextLevel, "#16a34a"));
    box.add(makeButton(230, H - 70, "Menu", actions.onMenu, "#6b7280"));

    // small "pop" on the title
    title.scale({ x: 0.6, y: 0.6 });
    new Konva.Tween({ node: title, scaleX: 1, scaleY: 1, duration: 0.3, easing: Konva.Easings.BackEaseOut }).play();

    this.layer.batchDraw();
  }

  close(): void {
    // reset cursor too: mouseleave never fires when a button is destroyed under the mouse
    document.body.style.cursor = "default";
    this.openPopup?.destroy();
    this.openPopup = null;
    this.layer.batchDraw();
  }

  // Dark background + centered white box. Every popup uses this so they all look the same.
  // Returns the box, for the popup to add its text and buttons to.
  private openFrame(boxW: number, boxH: number): Konva.Group {
    const { width, height } = this.layer.getStage().size();
    const root = new Konva.Group();
    root.add(new Konva.Rect({ width, height, fill: "black", opacity: 0.55 })); // blocks clicks to the game

    const box = new Konva.Group({ x: (width - boxW) / 2, y: (height - boxH) / 2 });
    box.add(new Konva.Rect({
      width: boxW, height: boxH, fill: "white", cornerRadius: 16,
      shadowColor: "black", shadowBlur: 20, shadowOpacity: 0.3,
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

/** A rounded button. Exported so other views (like the start screen) can use the same button. */
export function makeButton(
  x: number, y: number, label: string, onClick: () => void,
  color = "#4f46e5", width = 150
): Konva.Group {
  const group = new Konva.Group({ x, y });
  group.add(new Konva.Rect({ width, height: 44, fill: color, cornerRadius: 10 }));
  group.add(new Konva.Text({
    width, y: 13, text: label, fontSize: 18, fill: "white", align: "center",
  }));
  group.on("click tap", onClick);
  group.on("mouseenter", () => { document.body.style.cursor = "pointer"; });
  group.on("mouseleave", () => { document.body.style.cursor = "default"; });
  return group;
}
